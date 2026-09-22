-- Keep every existing review caller on the same readiness-aware shortlist path.
create or replace function public.review_job_application(
  p_application_id uuid,
  p_status public.job_application_status,
  p_admin_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_note text := trim(coalesce(p_admin_note, ''));
  v_previous public.job_application_status;
  v_profile_id uuid;
  v_job_title text;
begin
  if not public.is_admin() then
    raise exception 'Only Admin can review applications';
  end if;
  if p_status not in ('under_review', 'shortlisted', 'rejected') then
    raise exception 'Invalid review status';
  end if;

  if p_status = 'shortlisted' then
    perform public.shortlist_job_application(p_application_id, p_admin_note);
    return p_application_id;
  end if;

  select a.status, p.profile_id, j.title
    into v_previous, v_profile_id, v_job_title
  from public.job_applications a
  join public.professionals p on p.id = a.professional_id
  join public.jobs j on j.id = a.job_id
  where a.id = p_application_id
  for update;
  if not found then
    raise exception 'Application not found';
  end if;
  if v_previous in ('withdrawn', 'converted') then
    raise exception 'This application is closed';
  end if;

  update public.job_applications
  set status = p_status,
      admin_note = v_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  if p_status = 'rejected' and p_status <> v_previous then
    perform public.queue_transactional_email(
      v_profile_id,
      'application_rejected',
      'job_application',
      p_application_id,
      jsonb_build_object('job_title', v_job_title)
    );
  end if;
  perform public.log_activity(
    'reviewed job application',
    'job_application',
    p_application_id,
    jsonb_build_object('status', p_status::text)
  );
  return p_application_id;
end;
$$;

revoke all on function public.review_job_application(uuid, public.job_application_status, text) from public, anon;
grant execute on function public.review_job_application(uuid, public.job_application_status, text) to authenticated;
