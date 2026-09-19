-- Admin-only bounded queue with candidate document metadata; documents remain private.
create or replace function public.list_admin_applications(
  p_job_id uuid default null,
  p_status text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid, job_id uuid, job_slug text, job_title text, company_name text,
  professional_id uuid, applicant_profile_id uuid, applicant_name text, applicant_email text,
  status public.job_application_status, cover_note text, portfolio_url text, admin_note text,
  reviewed_by uuid, reviewed_at timestamptz, assignment_id uuid, created_at timestamptz,
  updated_at timestamptz, cv_document_id uuid, cv_display_name text, supporting_document_count bigint
)
language sql stable security definer set search_path = public, extensions as $$
  select a.id, a.job_id, j.slug, j.title, j.public_company_name, a.professional_id,
    p.profile_id, pr.display_name, pr.email, a.status, a.cover_note, a.portfolio_url,
    a.admin_note, a.reviewed_by, a.reviewed_at, a.assignment_id, a.created_at, a.updated_at,
    d.id, d.display_name,
    (select count(*) from public.candidate_documents sd where sd.professional_id = a.professional_id
      and sd.document_type = 'supporting' and sd.is_active and sd.upload_complete)
  from public.job_applications a
  join public.jobs j on j.id = a.job_id
  join public.professionals p on p.id = a.professional_id
  join public.profiles pr on pr.id = p.profile_id
  left join public.candidate_documents d on d.id = a.cv_document_id
  where public.is_admin()
    and (p_job_id is null or a.job_id = p_job_id)
    and (nullif(trim(p_status), '') is null or a.status::text = trim(p_status))
    and (nullif(trim(p_search), '') is null or concat_ws(' ', pr.display_name, pr.email, j.title)
      ilike '%' || trim(p_search) || '%')
  order by a.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.list_admin_applications(uuid,text) from authenticated;
grant execute on function public.list_admin_applications(uuid,text,text,integer,integer) to authenticated;

create or replace function public.get_admin_application_metrics()
returns table (
  open_public_jobs bigint,
  total_applications bigint,
  awaiting_review bigint,
  submitted bigint,
  under_review bigint,
  shortlisted bigint,
  rejected bigint,
  withdrawn bigint,
  converted bigint
)
language sql stable security definer set search_path = public, extensions as $$
  select
    (select count(*) from public.jobs j
      where j.public_visible and j.publication_state = 'open'
        and j.slug is not null),
    count(*)::bigint,
    count(*) filter (where a.status = 'submitted')::bigint,
    count(*) filter (where a.status = 'submitted')::bigint,
    count(*) filter (where a.status = 'under_review')::bigint,
    count(*) filter (where a.status = 'shortlisted')::bigint,
    count(*) filter (where a.status = 'rejected')::bigint,
    count(*) filter (where a.status = 'withdrawn')::bigint,
    count(*) filter (where a.status = 'converted')::bigint
  from public.job_applications a
  where public.is_admin();
$$;
revoke all on function public.get_admin_application_metrics() from public, anon;
grant execute on function public.get_admin_application_metrics() to authenticated;
