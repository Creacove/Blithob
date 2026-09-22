-- Keep the job centre and the Professional application inbox backed by the
-- same readiness data that the Admin application queue already exposes.

drop function if exists public.list_my_applications(text);

create or replace function public.list_my_applications(p_status text default null)
returns table (
  id uuid,
  job_id uuid,
  job_slug text,
  job_title text,
  company_name text,
  status public.job_application_status,
  cover_note text,
  portfolio_url text,
  admin_note text,
  assignment_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  professional_id uuid,
  applicant_profile_id uuid,
  applicant_name text,
  applicant_email text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  cv_document_id uuid,
  cv_display_name text,
  supporting_document_count bigint,
  service_id uuid,
  service_name text,
  readiness_enrolment_id uuid,
  readiness_status public.service_enrolment_status,
  readiness_completed_count bigint,
  readiness_requirement_count bigint,
  ready_for_assignment boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    a.id,
    a.job_id,
    j.slug,
    j.title,
    j.public_company_name,
    a.status,
    a.cover_note,
    a.portfolio_url,
    a.admin_note,
    a.assignment_id,
    a.created_at,
    a.updated_at,
    a.professional_id,
    p.profile_id,
    pr.display_name,
    pr.email,
    a.reviewed_by,
    a.reviewed_at,
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
    s.id,
    s.name,
    readiness.readiness_enrolment_id,
    readiness.readiness_status,
    progress.completed_count,
    progress.requirement_count,
    coalesce(
      p.account_status = 'active'
      and j.publication_state = 'open'
      and readiness.readiness_status = 'approved',
      false
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
      count(*) filter (where coalesce(progress.completed, false))::bigint as completed_count
    from public.service_requirements r
    left join public.service_requirement_progress progress
      on progress.requirement_id = r.id
     and progress.enrolment_id = readiness.readiness_enrolment_id
    where r.service_id = j.service_id
  ) progress on true
  where a.professional_id = public.current_professional_id()
    and (nullif(trim(p_status), '') is null or a.status::text = trim(p_status))
  order by a.created_at desc;
$$;

revoke all on function public.list_my_applications(text) from public, anon;
grant execute on function public.list_my_applications(text) to authenticated;

create or replace function public.list_admin_job_metrics()
returns table (
  job_id uuid,
  applicant_count bigint,
  hired_count bigint,
  needs_action_count bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    j.id,
    count(a.id) filter (where a.status <> 'withdrawn')::bigint,
    count(a.id) filter (where a.status = 'converted')::bigint,
    count(a.id) filter (where a.status in ('submitted', 'under_review'))::bigint
  from public.jobs j
  left join public.job_applications a on a.job_id = j.id
  where public.is_admin()
  group by j.id;
$$;

revoke all on function public.list_admin_job_metrics() from public, anon;
grant execute on function public.list_admin_job_metrics() to authenticated;

-- A Service with no reusable requirements does not need a dead-end readiness
-- record. It is immediately ready for the Admin to hire for the Job.
create or replace function public.auto_approve_empty_service_enrolment()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1
    from public.service_requirements r
    where r.service_id = new.service_id
  ) then
    new.status := 'approved';
    new.admin_approved_at := coalesce(new.admin_approved_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists service_enrolments_auto_approve_empty on public.service_enrolments;
create trigger service_enrolments_auto_approve_empty
before insert or update of status on public.service_enrolments
for each row execute function public.auto_approve_empty_service_enrolment();
