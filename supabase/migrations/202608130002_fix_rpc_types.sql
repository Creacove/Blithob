create or replace function public.submit_service_enrolment(p_enrolment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_enrolment public.service_enrolments%rowtype;
  v_missing boolean;
  v_reviewer uuid;
  v_next public.service_enrolment_status;
begin
  select * into v_enrolment from public.service_enrolments where id = p_enrolment_id;
  if not found then raise exception 'Readiness enrolment not found'; end if;
  if not public.is_admin() and v_enrolment.professional_id <> public.current_professional_id() then raise exception 'You cannot submit this readiness enrolment'; end if;

  select exists (
    select 1 from public.service_requirements r
    left join public.service_requirement_progress p on p.requirement_id = r.id and p.enrolment_id = p_enrolment_id
    where r.service_id = v_enrolment.service_id
      and (p.completed is distinct from true or (r.requires_evidence and length(trim(coalesce(p.evidence_link, ''))) = 0 and length(trim(coalesce(p.evidence_file_path, ''))) = 0))
  ) into v_missing;
  if v_missing then raise exception 'Complete every readiness requirement before submitting'; end if;

  v_next := (case when v_enrolment.status = 'changes_requested_by_admin' or v_enrolment.lead_id is null or v_enrolment.lead_id = v_enrolment.professional_id then 'waiting_for_admin' else 'waiting_for_lead' end)::public.service_enrolment_status;
  v_reviewer := case when v_next = 'waiting_for_admin' then (select id from public.profiles where account_role = 'admin' order by created_at limit 1) else (select profile_id from public.professionals where id = v_enrolment.lead_id) end;
  update public.service_enrolments set status = v_next, updated_at = now() where id = p_enrolment_id;
  if v_reviewer is not null then perform public.notify_user(v_reviewer, 'Readiness review needed', 'A readiness enrolment is ready for review.'); end if;
  perform public.log_activity('submitted readiness', 'service_enrolment', p_enrolment_id);
  return p_enrolment_id;
end;
$$;

create or replace function public.review_service_enrolment(p_enrolment_id uuid, p_decision public.review_decision, p_comment text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_enrolment public.service_enrolments%rowtype;
  v_reviewer_type public.reviewer_type;
  v_next public.service_enrolment_status;
  v_professional_user uuid;
begin
  if length(trim(coalesce(p_comment, ''))) = 0 then raise exception 'Review comment is required'; end if;
  select * into v_enrolment from public.service_enrolments where id = p_enrolment_id;
  if not found then raise exception 'Readiness enrolment not found'; end if;
  select p.profile_id into v_professional_user from public.professionals p where p.id = v_enrolment.professional_id;

  if public.is_admin() then
    if v_enrolment.status <> 'waiting_for_admin' then raise exception 'Readiness is not waiting for Admin review'; end if;
    if p_decision not in ('changes_requested', 'approved') then raise exception 'Admin can request changes or approve readiness'; end if;
    v_reviewer_type := 'admin';
    v_next := (case when p_decision = 'approved' then 'approved' else 'changes_requested_by_admin' end)::public.service_enrolment_status;
  else
    if public.current_professional_id() <> v_enrolment.lead_id or v_enrolment.status <> 'waiting_for_lead' then raise exception 'You are not the Lead reviewer for this readiness'; end if;
    if p_decision not in ('changes_requested', 'certified') then raise exception 'Lead can request changes or certify readiness'; end if;
    v_reviewer_type := 'lead';
    v_next := (case when p_decision = 'certified' then 'waiting_for_admin' else 'changes_requested_by_lead' end)::public.service_enrolment_status;
  end if;

  insert into public.readiness_reviews (enrolment_id, reviewer_user_id, reviewer_type, decision, comment)
  values (p_enrolment_id, auth.uid(), v_reviewer_type, p_decision, trim(p_comment));
  update public.service_enrolments
  set status = v_next,
      lead_certified_at = case when p_decision = 'certified' then now() else lead_certified_at end,
      admin_approved_at = case when p_decision = 'approved' then now() else admin_approved_at end,
      updated_at = now()
  where id = p_enrolment_id;

  if p_decision = 'certified' then
    perform public.notify_user((select id from public.profiles where account_role = 'admin' order by created_at limit 1), 'Readiness certified', 'A Lead certified readiness for final approval.');
  else
    perform public.notify_user(v_professional_user, case when p_decision = 'approved' then 'Readiness approved' else 'Readiness changes requested' end, trim(p_comment));
  end if;
  perform public.log_activity(case when p_decision = 'changes_requested' then 'requested readiness changes' when p_decision = 'certified' then 'certified readiness' else 'approved readiness' end, 'service_enrolment', p_enrolment_id, jsonb_build_object('decision', p_decision, 'comment', trim(p_comment)));
  return p_enrolment_id;
end;
$$;

create or replace function public.add_job_assignments(p_job_id uuid, p_assignments jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_job public.jobs%rowtype;
  v_input jsonb;
  v_professional uuid;
  v_lead uuid;
  v_pay bigint;
  v_deadline timestamptz;
  v_id uuid;
  v_ids uuid[] := array[]::uuid[];
begin
  if not public.is_admin() then raise exception 'Only Admin can assign professionals'; end if;
  select * into v_job from public.jobs where id = p_job_id;
  if not found or v_job.publication_state <> 'open' then raise exception 'Only open jobs can receive assignments'; end if;
  for v_input in select * from jsonb_array_elements(coalesce(p_assignments, '[]'::jsonb)) loop
    v_professional := (v_input ->> 'professionalId')::uuid;
    v_lead := nullif(v_input ->> 'leadReviewerId', '')::uuid;
    v_pay := (v_input ->> 'agreedPay')::bigint;
    v_deadline := coalesce(nullif(v_input ->> 'deadline', '')::timestamptz, v_job.deadline);
    if not exists (select 1 from public.professionals p where p.id = v_professional and p.account_status = 'active') then raise exception 'Professional is not active'; end if;
    if not exists (select 1 from public.service_enrolments e where e.professional_id = v_professional and e.service_id = v_job.service_id and e.status = 'approved') then raise exception 'Professional is not approved for this service'; end if;
    if v_pay is null or v_pay <= 0 then raise exception 'Agreed pay must be positive'; end if;
    if v_lead is not null and not exists (select 1 from public.professionals p where p.id = v_lead and p.is_lead and p.account_status = 'active' and p.id <> v_professional) then raise exception 'Lead reviewer is invalid'; end if;
    insert into public.assignments (job_id, professional_id, lead_reviewer_id, agreed_pay, deadline)
    values (p_job_id, v_professional, v_lead, v_pay, v_deadline)
    on conflict (job_id, professional_id) do nothing
    returning id into v_id;
    if v_id is not null then
      v_ids := array_append(v_ids, v_id);
      perform public.notify_user((select profile_id from public.professionals where id = v_professional), 'New assignment', v_job.title || ' is ready to start.');
    end if;
  end loop;
  if coalesce(array_length(v_ids, 1), 0) > 0 then perform public.log_activity('assigned professionals', 'job', p_job_id, jsonb_build_object('assignment_ids', v_ids)); end if;
  return to_jsonb(v_ids);
end;
$$;

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
  update public.assignments set status = (case when v_destination = 'lead' then 'waiting_for_lead' else 'waiting_for_admin' end)::public.assignment_status, submitted_at = now() where id = p_assignment_id;
  if v_reviewer is not null then perform public.notify_user(v_reviewer, 'Assignment submitted', v_job.title || ' is ready for review.'); end if;
  perform public.log_activity('submitted assignment', 'assignment', p_assignment_id, jsonb_build_object('submission_id', v_submission));
  return v_submission;
end;
$$;

create or replace function public.review_assignment(p_assignment_id uuid, p_decision public.review_decision, p_comment text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_assignment public.assignments%rowtype;
  v_submission uuid;
  v_reviewer_type public.reviewer_type;
  v_next public.assignment_status;
  v_assignee_user uuid;
begin
  if length(trim(coalesce(p_comment, ''))) = 0 then raise exception 'Review comment is required'; end if;
  select * into v_assignment from public.assignments where id = p_assignment_id;
  if not found then raise exception 'Assignment not found'; end if;
  select id into v_submission from public.submissions where assignment_id = p_assignment_id order by version desc limit 1;
  if v_submission is null then raise exception 'No submission exists for this assignment'; end if;
  if v_assignment.professional_id = public.current_professional_id() then raise exception 'You cannot review your own assignment'; end if;

  if public.is_admin() then
    if v_assignment.status <> 'waiting_for_admin' then raise exception 'Assignment is not waiting for Admin review'; end if;
    if p_decision not in ('changes_requested', 'approved') then raise exception 'Admin can request changes or approve work'; end if;
    v_reviewer_type := 'admin';
    v_next := (case when p_decision = 'approved' then 'approved' else 'changes_requested_by_admin' end)::public.assignment_status;
  else
    if public.current_professional_id() <> v_assignment.lead_reviewer_id or v_assignment.status <> 'waiting_for_lead' then raise exception 'You are not the Lead reviewer for this assignment'; end if;
    if p_decision not in ('changes_requested', 'certified') then raise exception 'Lead can request changes or certify work'; end if;
    v_reviewer_type := 'lead';
    v_next := (case when p_decision = 'certified' then 'waiting_for_admin' else 'changes_requested_by_lead' end)::public.assignment_status;
  end if;

  insert into public.assignment_reviews (assignment_id, submission_id, reviewer_user_id, reviewer_type, decision, comment)
  values (p_assignment_id, v_submission, auth.uid(), v_reviewer_type, p_decision, trim(p_comment));
  update public.assignments set status = v_next, approved_at = case when p_decision = 'approved' then now() else approved_at end where id = p_assignment_id;
  select profile_id into v_assignee_user from public.professionals where id = v_assignment.professional_id;
  if p_decision = 'certified' then
    perform public.notify_user((select id from public.profiles where account_role = 'admin' order by created_at limit 1), 'Assignment certified', 'An assignment is waiting for final approval.');
  else
    perform public.notify_user(v_assignee_user, case when p_decision = 'approved' then 'Assignment approved' else 'Assignment changes requested' end, trim(p_comment));
  end if;
  perform public.log_activity(case when p_decision = 'changes_requested' then 'requested assignment changes' when p_decision = 'certified' then 'certified assignment' else 'approved assignment' end, 'assignment', p_assignment_id, jsonb_build_object('decision', p_decision, 'comment', trim(p_comment)));
  return p_assignment_id;
end;
$$;
