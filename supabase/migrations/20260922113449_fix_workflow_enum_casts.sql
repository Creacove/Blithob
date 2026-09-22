create or replace function public.submit_assignment(
  p_assignment_id uuid,
  p_notes text,
  p_link text default null,
  p_file_path text default null,
  p_file_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_assignment public.assignments%rowtype;
  v_job public.jobs%rowtype;
  v_version integer;
  v_destination text;
  v_reviewer uuid;
  v_submission uuid;
begin
  select * into v_assignment from public.assignments where id = p_assignment_id;
  select * into v_job from public.jobs where id = v_assignment.job_id;
  if v_assignment.professional_id <> public.current_professional_id() then raise exception 'You cannot submit this assignment'; end if;
  if v_assignment.status not in ('in_progress', 'changes_requested_by_lead', 'changes_requested_by_admin') then raise exception 'Assignment is not ready for submission'; end if;
  if length(trim(coalesce(p_notes, ''))) = 0 then raise exception 'Submission notes are required'; end if;
  if v_job.submission_evidence_required and length(trim(coalesce(p_link, ''))) = 0 and length(trim(coalesce(p_file_path, ''))) = 0 then raise exception 'A submission link or file is required'; end if;
  select coalesce(max(version), 0) + 1 into v_version from public.submissions where assignment_id = p_assignment_id;
  insert into public.submissions (assignment_id, version, notes, link, file_path, file_name)
  values (p_assignment_id, v_version, trim(p_notes), nullif(trim(p_link), ''), nullif(trim(p_file_path), ''), nullif(trim(p_file_name), ''))
  returning id into v_submission;
  v_destination := case when v_assignment.lead_reviewer_id is not null and v_assignment.lead_reviewer_id <> v_assignment.professional_id then 'lead' else 'admin' end;
  v_reviewer := case when v_destination = 'lead' then (select profile_id from public.professionals where id = v_assignment.lead_reviewer_id) else (select id from public.profiles where account_role = 'admin' order by created_at limit 1) end;
  update public.assignments
  set status = (case when v_destination = 'lead' then 'waiting_for_lead' else 'waiting_for_admin' end)::public.assignment_status,
      submitted_at = now()
  where id = p_assignment_id;
  if v_reviewer is not null then
    perform public.notify_user(v_reviewer, 'Assignment submitted', v_job.title || ' is ready for review.');
    perform public.queue_transactional_email(v_reviewer, 'work_review_requested', 'assignment', p_assignment_id, jsonb_build_object('job_title', v_job.title));
  end if;
  perform public.log_activity('submitted assignment', 'assignment', p_assignment_id, jsonb_build_object('submission_id', v_submission));
  return v_submission;
end;
$$;
