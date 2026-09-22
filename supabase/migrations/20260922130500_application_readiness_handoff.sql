-- Make shortlisting the single Admin decision that starts Service readiness.
-- The existing conversion RPC remains the final authoritative Assignment gate.
drop function if exists public.list_admin_applications(uuid, text, text, integer, integer);

create or replace function public.shortlist_job_application(
  p_application_id uuid,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_application public.job_applications%rowtype;
  v_job public.jobs%rowtype;
  v_service public.services%rowtype;
  v_enrolment public.service_enrolments%rowtype;
  v_note text := trim(coalesce(p_admin_note, ''));
  v_profile_id uuid;
  v_ready boolean;
begin
  if not public.is_admin() then
    raise exception 'Only Admin can shortlist applications';
  end if;

  select a.* into v_application
  from public.job_applications a
  where a.id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;
  if v_application.status in ('withdrawn', 'converted') then
    raise exception 'This application is closed';
  end if;

  select j.* into v_job
  from public.jobs j
  where j.id = v_application.job_id;
  if not found then
    raise exception 'Job not found';
  end if;

  select s.* into v_service
  from public.services s
  where s.id = v_job.service_id;
  if not found then
    raise exception 'Job Service not found';
  end if;

  select e.* into v_enrolment
  from public.service_enrolments e
  where e.professional_id = v_application.professional_id
    and e.service_id = v_job.service_id
    and e.status <> 'paused'
  order by e.updated_at desc
  limit 1
  for update;

  if not found then
    insert into public.service_enrolments (professional_id, service_id)
    values (v_application.professional_id, v_job.service_id)
    returning * into v_enrolment;
  end if;

  update public.job_applications
  set status = 'shortlisted',
      admin_note = v_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  v_ready := v_enrolment.status = 'approved';
  select p.profile_id into v_profile_id
  from public.professionals p
  where p.id = v_application.professional_id;

  perform public.queue_transactional_email(
    v_profile_id,
    'application_shortlisted',
    'job_application',
    p_application_id,
    jsonb_build_object(
      'job_title', v_job.title,
      'service_name', v_service.name,
      'readiness_required', not v_ready,
      'admin_note', nullif(v_note, '')
    )
  );
  perform public.log_activity(
    'shortlisted job application',
    'job_application',
    p_application_id,
    jsonb_build_object(
      'readiness_enrolment_id', v_enrolment.id,
      'readiness_status', v_enrolment.status::text,
      'ready_for_assignment', v_ready
    )
  );

  return jsonb_build_object(
    'application_id', p_application_id,
    'readiness_enrolment_id', v_enrolment.id,
    'readiness_status', v_enrolment.status::text,
    'ready_for_assignment', v_ready
  );
end;
$$;

revoke all on function public.shortlist_job_application(uuid, text) from public, anon;
grant execute on function public.shortlist_job_application(uuid, text) to authenticated;

create or replace function public.list_admin_applications(
  p_job_id uuid default null,
  p_status text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid, job_id uuid, job_slug text, job_title text, company_name text,
  service_id uuid, service_name text,
  professional_id uuid, applicant_profile_id uuid, applicant_name text, applicant_email text,
  status public.job_application_status, cover_note text, portfolio_url text, admin_note text,
  reviewed_by uuid, reviewed_at timestamptz, assignment_id uuid, created_at timestamptz,
  updated_at timestamptz, cv_document_id uuid, cv_display_name text,
  supporting_document_count bigint,
  readiness_enrolment_id uuid, readiness_status public.service_enrolment_status,
  readiness_completed_count bigint, readiness_requirement_count bigint,
  ready_for_assignment boolean,
  total_count bigint
)
language sql stable security definer
set search_path = public, extensions
as $$
  select
    a.id,
    a.job_id,
    j.slug,
    j.title,
    j.public_company_name,
    s.id,
    s.name,
    a.professional_id,
    p.profile_id,
    pr.display_name,
    pr.email,
    a.status,
    a.cover_note,
    a.portfolio_url,
    a.admin_note,
    a.reviewed_by,
    a.reviewed_at,
    a.assignment_id,
    a.created_at,
    a.updated_at,
    d.id,
    d.display_name,
    (
      select count(*)
      from public.candidate_documents sd
      where sd.professional_id = a.professional_id
        and sd.document_type = 'supporting'
        and sd.is_active
        and sd.upload_complete
    ),
    readiness.readiness_enrolment_id,
    readiness.readiness_status,
    progress.completed_count,
    progress.requirement_count,
    (
      p.account_status = 'active'
      and j.publication_state = 'open'
      and readiness.readiness_status = 'approved'
    ),
    count(*) over ()
  from public.job_applications a
  join public.jobs j on j.id = a.job_id
  join public.services s on s.id = j.service_id
  join public.professionals p on p.id = a.professional_id
  join public.profiles pr on pr.id = p.profile_id
  left join public.candidate_documents d on d.id = a.cv_document_id
  left join lateral (
    select
      e.id as readiness_enrolment_id,
      e.status as readiness_status
    from public.service_enrolments e
    where e.professional_id = a.professional_id
      and e.service_id = j.service_id
      and e.status <> 'paused'
    order by e.updated_at desc
    limit 1
  ) readiness on true
  left join lateral (
    select
      count(*)::bigint as requirement_count,
      count(*) filter (where coalesce(p.completed, false))::bigint as completed_count
    from public.service_requirements r
    left join public.service_requirement_progress p
      on p.requirement_id = r.id
     and p.enrolment_id = readiness.readiness_enrolment_id
    where r.service_id = j.service_id
  ) progress on true
  where public.is_admin()
    and (p_job_id is null or a.job_id = p_job_id)
    and (nullif(trim(p_status), '') is null or a.status::text = trim(p_status))
    and (
      nullif(trim(p_search), '') is null
      or concat_ws(' ', pr.display_name, pr.email, j.title, s.name)
        ilike '%' || trim(p_search) || '%'
    )
  order by a.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.list_admin_applications(uuid, text, text, integer, integer) from public, anon;
grant execute on function public.list_admin_applications(uuid, text, text, integer, integer) to authenticated;
