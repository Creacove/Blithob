-- Harden role boundaries, preserve readiness progress, and make workflow writes RPC-only.

create or replace function public.can_read_professional(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.professionals p
      where p.id = p_professional_id
        and p.profile_id = auth.uid()
    )
    or exists (
      select 1
      from public.service_enrolments e
      where e.professional_id = p_professional_id
        and e.lead_id = public.current_professional_id()
    )
    or exists (
      select 1
      from public.assignments a
      where a.professional_id = p_professional_id
        and a.lead_reviewer_id = public.current_professional_id()
    );
$$;

create or replace function public.can_read_professional_path(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_path is null or p_path !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_read_professional(p_path::uuid);
end;
$$;

create or replace function public.update_professional_profile(
  p_professional_id uuid,
  p_display_name text default null,
  p_phone text default null,
  p_location text default null,
  p_admin_notes text default null,
  p_account_status public.professional_account_status default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile_id uuid;
  v_is_admin boolean := public.is_admin();
begin
  select profile_id into v_profile_id
  from public.professionals
  where id = p_professional_id;
  if v_profile_id is null then raise exception 'Professional not found'; end if;
  if not v_is_admin and v_profile_id <> auth.uid() then
    raise exception 'You can only edit your own profile';
  end if;
  if not v_is_admin and (p_admin_notes is not null or p_account_status is not null) then
    raise exception 'Only Admin can edit operational fields';
  end if;
  if p_display_name is not null and length(trim(p_display_name)) = 0 then
    raise exception 'Name is required';
  end if;

  if p_display_name is not null then
    update public.profiles
    set display_name = trim(p_display_name), updated_at = now()
    where id = v_profile_id;
  end if;

  update public.professionals
  set phone = coalesce(trim(p_phone), phone),
      location = coalesce(trim(p_location), location),
      admin_notes = case when v_is_admin and p_admin_notes is not null then trim(p_admin_notes) else admin_notes end,
      account_status = case when v_is_admin and p_account_status is not null then p_account_status else account_status end,
      updated_at = now()
  where id = p_professional_id;

  return p_professional_id;
end;
$$;

create or replace function public.set_lead_capability(
  p_professional_id uuid,
  p_enabled boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_admin() then raise exception 'Only Admin can change Lead capability'; end if;
  if not exists (select 1 from public.professionals where id = p_professional_id) then
    raise exception 'Professional not found';
  end if;

  update public.professionals
  set is_lead = p_enabled, updated_at = now()
  where id = p_professional_id;

  if not p_enabled then
    update public.service_enrolments
    set lead_id = null, status = 'waiting_for_admin', updated_at = now()
    where lead_id = p_professional_id and status = 'waiting_for_lead';
    update public.assignments
    set lead_reviewer_id = null, status = 'waiting_for_admin'
    where lead_reviewer_id = p_professional_id and status = 'waiting_for_lead';
  end if;

  perform public.log_activity(
    case when p_enabled then 'granted Lead capability' else 'removed Lead capability' end,
    'professional',
    p_professional_id
  );
  return p_professional_id;
end;
$$;

create or replace function public.assign_service_lead(
  p_enrolment_id uuid,
  p_lead_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_enrolment public.service_enrolments%rowtype;
begin
  if not public.is_admin() then raise exception 'Only Admin can assign a Lead'; end if;
  select * into v_enrolment from public.service_enrolments where id = p_enrolment_id;
  if not found then raise exception 'Readiness enrolment not found'; end if;
  if p_lead_id is not null and not exists (
    select 1 from public.professionals
    where id = p_lead_id
      and id <> v_enrolment.professional_id
      and is_lead
      and account_status = 'active'
  ) then
    raise exception 'Lead reviewer is invalid';
  end if;

  update public.service_enrolments
  set lead_id = p_lead_id, updated_at = now()
  where id = p_enrolment_id;
  return p_enrolment_id;
end;
$$;

create or replace function public.replace_service_requirements(
  p_service_id uuid,
  p_requirements jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item jsonb;
  v_order integer := 0;
  v_id_text text;
  v_requirement_id uuid;
  v_keep_ids uuid[] := '{}'::uuid[];
begin
  if not public.is_admin() then raise exception 'Only Admin can edit Service requirements'; end if;
  if not exists (select 1 from public.services where id = p_service_id) then
    raise exception 'Service not found';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_requirements, '[]'::jsonb)) loop
    v_order := v_order + 1;
    v_id_text := nullif(v_item ->> 'id', '');
    if v_id_text is not null and v_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      v_requirement_id := v_id_text::uuid;
      if exists (
        select 1 from public.service_requirements
        where id = v_requirement_id and service_id <> p_service_id
      ) then
        raise exception 'Requirement belongs to another Service';
      end if;
    else
      v_requirement_id := gen_random_uuid();
    end if;

    if length(trim(coalesce(v_item ->> 'title', ''))) = 0 then
      raise exception 'Requirement title is required';
    end if;

    insert into public.service_requirements (
      id, service_id, title, description, requires_evidence, display_order
    ) values (
      v_requirement_id,
      p_service_id,
      trim(v_item ->> 'title'),
      trim(coalesce(v_item ->> 'description', '')),
      coalesce((v_item ->> 'requiresEvidence')::boolean, false),
      v_order
    )
    on conflict (id) do update set
      service_id = excluded.service_id,
      title = excluded.title,
      description = excluded.description,
      requires_evidence = excluded.requires_evidence,
      display_order = excluded.display_order,
      updated_at = now();

    v_keep_ids := array_append(v_keep_ids, v_requirement_id);
  end loop;

  delete from public.service_requirements
  where service_id = p_service_id
    and not (id = any(v_keep_ids));
  return p_service_id;
end;
$$;

create or replace function public.remove_service_enrolment(p_enrolment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_enrolment public.service_enrolments%rowtype;
begin
  if not public.is_admin() then raise exception 'Only Admin can remove readiness enrolments'; end if;
  select * into v_enrolment from public.service_enrolments where id = p_enrolment_id;
  if not found then raise exception 'Readiness enrolment not found'; end if;
  if v_enrolment.status = 'approved' then raise exception 'Approved readiness cannot be removed'; end if;
  if exists (
    select 1
    from public.assignments a
    join public.jobs j on j.id = a.job_id
    where a.professional_id = v_enrolment.professional_id
      and j.service_id = v_enrolment.service_id
  ) then
    raise exception 'Readiness with related work cannot be removed';
  end if;

  delete from public.service_enrolments where id = p_enrolment_id;
  perform public.log_activity('removed readiness enrolment', 'service_enrolment', p_enrolment_id);
  return p_enrolment_id;
end;
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.professionals p
    where p.profile_id = profiles.id and public.can_read_professional(p.id)
  )
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists professionals_select on public.professionals;
create policy professionals_select on public.professionals for select to authenticated
using (public.can_read_professional(id));

drop policy if exists professionals_update on public.professionals;
create policy professionals_admin_update on public.professionals for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists enrolments_admin_insert on public.service_enrolments;
create policy enrolments_admin_insert on public.service_enrolments for insert to authenticated
with check (
  public.is_admin()
  and status = 'not_started'
  and (
    lead_id is null
    or exists (
      select 1 from public.professionals p
      where p.id = lead_id and p.is_lead and p.account_status = 'active'
    )
  )
);
drop policy if exists enrolments_admin_update on public.service_enrolments;
drop policy if exists enrolments_admin_delete on public.service_enrolments;

drop policy if exists progress_admin_update on public.service_requirement_progress;
drop policy if exists progress_admin_insert on public.service_requirement_progress;

drop policy if exists assignments_admin_insert on public.assignments;
drop policy if exists assignments_admin_update on public.assignments;
drop policy if exists assignments_admin_delete on public.assignments;

drop policy if exists readiness_evidence_select on storage.objects;
create policy readiness_evidence_select on storage.objects for select to authenticated
using (
  bucket_id = 'readiness-evidence'
  and public.can_read_professional_path((storage.foldername(name))[1])
);
drop policy if exists assignment_submissions_select on storage.objects;
create policy assignment_submissions_select on storage.objects for select to authenticated
using (
  bucket_id = 'assignment-submissions'
  and public.can_read_professional_path((storage.foldername(name))[1])
);

revoke update (email, account_role) on table public.profiles from authenticated;
revoke update (account_status, is_lead) on table public.professionals from authenticated;
revoke update, delete on table public.service_enrolments from authenticated;
revoke insert, update, delete on table public.service_requirement_progress from authenticated;
revoke insert, update, delete on table public.assignments from authenticated;

revoke all on function public.update_professional_profile(uuid, text, text, text, text, public.professional_account_status) from public;
revoke all on function public.set_lead_capability(uuid, boolean) from public;
revoke all on function public.assign_service_lead(uuid, uuid) from public;
revoke all on function public.replace_service_requirements(uuid, jsonb) from public;
revoke all on function public.remove_service_enrolment(uuid) from public;
grant execute on function public.update_professional_profile(uuid, text, text, text, text, public.professional_account_status) to authenticated;
grant execute on function public.set_lead_capability(uuid, boolean) to authenticated;
grant execute on function public.assign_service_lead(uuid, uuid) to authenticated;
grant execute on function public.replace_service_requirements(uuid, jsonb) to authenticated;
grant execute on function public.remove_service_enrolment(uuid) to authenticated;
