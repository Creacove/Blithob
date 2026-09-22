-- Transactional email is deliberately an outbox, rather than a browser action.
-- Business transitions commit first; a server-only function sends the matching
-- message once a provider is configured.
create table public.transactional_email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in (
    'application_received',
    'application_shortlisted',
    'application_rejected',
    'readiness_review_requested',
    'readiness_certified',
    'readiness_changes_requested',
    'readiness_approved',
    'assignment_created',
    'work_review_requested',
    'work_certified',
    'work_changes_requested',
    'work_approved',
    'assignment_completed',
    'assignment_cancelled',
    'payment_paid',
    'payment_issue'
  )),
  source_type text not null,
  source_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 25),
  provider_message_id text,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (recipient_user_id, event_type, source_type, source_id)
);

alter table public.transactional_email_outbox enable row level security;
revoke all on table public.transactional_email_outbox from anon, authenticated;
create index transactional_email_outbox_pending_idx
  on public.transactional_email_outbox (status, created_at)
  where status in ('pending', 'failed');

create or replace function public.queue_transactional_email(
  p_recipient_user_id uuid,
  p_event_type text,
  p_source_type text,
  p_source_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_email text;
begin
  select email into v_email from public.profiles where id = p_recipient_user_id;
  if v_email is null or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' then
    return null;
  end if;

  insert into public.transactional_email_outbox (
    recipient_user_id, event_type, source_type, source_id, payload
  )
  values (
    p_recipient_user_id, p_event_type, p_source_type, p_source_id, coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (recipient_user_id, event_type, source_type, source_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.transactional_email_outbox
    where recipient_user_id = p_recipient_user_id
      and event_type = p_event_type
      and source_type = p_source_type
      and source_id = p_source_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.queue_transactional_email(uuid, text, text, uuid, jsonb) from public;

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

  v_next := case when v_enrolment.status = 'changes_requested_by_admin' or v_enrolment.lead_id is null or v_enrolment.lead_id = v_enrolment.professional_id then 'waiting_for_admin' else 'waiting_for_lead' end;
  v_reviewer := case when v_next = 'waiting_for_admin' then (select id from public.profiles where account_role = 'admin' order by created_at limit 1) else (select profile_id from public.professionals where id = v_enrolment.lead_id) end;
  update public.service_enrolments set status = v_next, updated_at = now() where id = p_enrolment_id;
  if v_reviewer is not null then
    perform public.notify_user(v_reviewer, 'Readiness review needed', 'A readiness enrolment is ready for review.');
    perform public.queue_transactional_email(v_reviewer, 'readiness_review_requested', 'service_enrolment', p_enrolment_id);
  end if;
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
    v_next := case when p_decision = 'approved' then 'approved' else 'changes_requested_by_admin' end;
  else
    if public.current_professional_id() <> v_enrolment.lead_id or v_enrolment.status <> 'waiting_for_lead' then raise exception 'You are not the Lead reviewer for this readiness'; end if;
    if p_decision not in ('changes_requested', 'certified') then raise exception 'Lead can request changes or certify readiness'; end if;
    v_reviewer_type := 'lead';
    v_next := case when p_decision = 'certified' then 'waiting_for_admin' else 'changes_requested_by_lead' end;
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
    select id into v_professional_user from public.profiles where account_role = 'admin' order by created_at limit 1;
    perform public.notify_user(v_professional_user, 'Readiness certified', 'A Lead certified readiness for final approval.');
    perform public.queue_transactional_email(v_professional_user, 'readiness_certified', 'service_enrolment', p_enrolment_id);
  else
    perform public.notify_user(v_professional_user, case when p_decision = 'approved' then 'Readiness approved' else 'Readiness changes requested' end, trim(p_comment));
    perform public.queue_transactional_email(
      v_professional_user,
      case when p_decision = 'approved' then 'readiness_approved' else 'readiness_changes_requested' end,
      'service_enrolment', p_enrolment_id, jsonb_build_object('comment', trim(p_comment))
    );
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
  v_user uuid;
  v_ids uuid[] := '{}';
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
      select profile_id into v_user from public.professionals where id = v_professional;
      perform public.notify_user(v_user, 'New assignment', v_job.title || ' is ready to start.');
      perform public.queue_transactional_email(v_user, 'assignment_created', 'assignment', v_id, jsonb_build_object('job_title', v_job.title));
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
  update public.assignments set status = case when v_destination = 'lead' then 'waiting_for_lead' else 'waiting_for_admin' end, submitted_at = now() where id = p_assignment_id;
  if v_reviewer is not null then
    perform public.notify_user(v_reviewer, 'Assignment submitted', v_job.title || ' is ready for review.');
    perform public.queue_transactional_email(v_reviewer, 'work_review_requested', 'assignment', p_assignment_id, jsonb_build_object('job_title', v_job.title));
  end if;
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
    v_next := case when p_decision = 'approved' then 'approved' else 'changes_requested_by_admin' end;
  else
    if public.current_professional_id() <> v_assignment.lead_reviewer_id or v_assignment.status <> 'waiting_for_lead' then raise exception 'You are not the Lead reviewer for this assignment'; end if;
    if p_decision not in ('changes_requested', 'certified') then raise exception 'Lead can request changes or certify work'; end if;
    v_reviewer_type := 'lead';
    v_next := case when p_decision = 'certified' then 'waiting_for_admin' else 'changes_requested_by_lead' end;
  end if;

  insert into public.assignment_reviews (assignment_id, submission_id, reviewer_user_id, reviewer_type, decision, comment)
  values (p_assignment_id, v_submission, auth.uid(), v_reviewer_type, p_decision, trim(p_comment));
  update public.assignments set status = v_next, approved_at = case when p_decision = 'approved' then now() else approved_at end where id = p_assignment_id;
  select profile_id into v_assignee_user from public.professionals where id = v_assignment.professional_id;
  if p_decision = 'certified' then
    select id into v_assignee_user from public.profiles where account_role = 'admin' order by created_at limit 1;
    perform public.notify_user(v_assignee_user, 'Assignment certified', 'An assignment is waiting for final approval.');
    perform public.queue_transactional_email(v_assignee_user, 'work_certified', 'assignment', p_assignment_id);
  else
    perform public.notify_user(v_assignee_user, case when p_decision = 'approved' then 'Assignment approved' else 'Assignment changes requested' end, trim(p_comment));
    perform public.queue_transactional_email(
      v_assignee_user,
      case when p_decision = 'approved' then 'work_approved' else 'work_changes_requested' end,
      'assignment', p_assignment_id, jsonb_build_object('comment', trim(p_comment))
    );
  end if;
  perform public.log_activity(case when p_decision = 'changes_requested' then 'requested assignment changes' when p_decision = 'certified' then 'certified assignment' else 'approved assignment' end, 'assignment', p_assignment_id, jsonb_build_object('decision', p_decision, 'comment', trim(p_comment)));
  return p_assignment_id;
end;
$$;

create or replace function public.complete_assignment(p_assignment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_assignment public.assignments%rowtype;
  v_payment uuid;
  v_user uuid;
begin
  if not public.is_admin() then raise exception 'Only Admin can complete assignments'; end if;
  select * into v_assignment from public.assignments where id = p_assignment_id for update;
  if not found or v_assignment.status <> 'approved' then raise exception 'Only approved assignments can be completed'; end if;
  update public.assignments set status = 'completed', completed_at = now() where id = p_assignment_id;
  insert into public.payments (assignment_id, professional_id, amount, currency, due_date)
  values (p_assignment_id, v_assignment.professional_id, v_assignment.agreed_pay, v_assignment.currency, now())
  on conflict (assignment_id) do nothing
  returning id into v_payment;
  select profile_id into v_user from public.professionals where id = v_assignment.professional_id;
  perform public.notify_user(v_user, 'Assignment completed', 'Your assignment has moved to payment.');
  perform public.queue_transactional_email(v_user, 'assignment_completed', 'assignment', p_assignment_id);
  perform public.log_activity('completed assignment', 'assignment', p_assignment_id, jsonb_build_object('payment_id', v_payment));
  return p_assignment_id;
end;
$$;

create or replace function public.cancel_assignment(p_assignment_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_assignment public.assignments%rowtype; v_user uuid;
begin
  if not public.is_admin() then raise exception 'Only Admin can cancel assignments'; end if;
  if length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'Cancellation reason is required'; end if;
  select * into v_assignment from public.assignments where id = p_assignment_id;
  if not found or v_assignment.status in ('completed', 'cancelled') then raise exception 'Assignment cannot be cancelled'; end if;
  update public.assignments set status = 'cancelled', cancelled_at = now(), cancellation_reason = trim(p_reason) where id = p_assignment_id;
  select profile_id into v_user from public.professionals where id = v_assignment.professional_id;
  perform public.notify_user(v_user, 'Assignment cancelled', trim(p_reason));
  perform public.queue_transactional_email(v_user, 'assignment_cancelled', 'assignment', p_assignment_id, jsonb_build_object('reason', trim(p_reason)));
  perform public.log_activity('cancelled assignment', 'assignment', p_assignment_id, jsonb_build_object('reason', trim(p_reason)));
  return p_assignment_id;
end;
$$;

create or replace function public.record_payment(
  p_payment_id uuid,
  p_status public.payment_status,
  p_payment_date timestamptz default null,
  p_method public.payment_method default null,
  p_reference text default null,
  p_receipt_path text default null,
  p_receipt_file_name text default null,
  p_internal_note text default null,
  p_issue_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_payment public.payments%rowtype; v_user uuid;
begin
  if not public.is_admin() then raise exception 'Only Admin can record payments'; end if;
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found or v_payment.status = 'paid' then raise exception 'Paid payments require an explicit correction'; end if;
  if p_status = 'paid' and (p_payment_date is null or p_method is null or (p_method <> 'cash' and length(trim(coalesce(p_reference, ''))) = 0)) then raise exception 'Paid payments require a date, method, and reference unless cash'; end if;
  if p_status = 'issue' and length(trim(coalesce(p_issue_note, ''))) = 0 then raise exception 'Payment issue note is required'; end if;
  update public.payments set status = p_status, payment_date = p_payment_date, method = p_method, reference = nullif(trim(p_reference), ''), receipt_path = nullif(trim(p_receipt_path), ''), receipt_file_name = nullif(trim(p_receipt_file_name), ''), internal_note = nullif(trim(p_internal_note), ''), issue_note = nullif(trim(p_issue_note), ''), updated_at = now() where id = p_payment_id;
  select profile_id into v_user from public.professionals where id = v_payment.professional_id;
  perform public.notify_user(v_user, case when p_status = 'paid' then 'Payment recorded' else 'Payment updated' end, case when p_status = 'issue' then coalesce(p_issue_note, 'A payment issue was recorded.') else 'Payment status is now ' || p_status::text || '.' end);
  if p_status in ('paid', 'issue') then
    perform public.queue_transactional_email(v_user, case when p_status = 'paid' then 'payment_paid' else 'payment_issue' end, 'payment', p_payment_id, case when p_status = 'issue' then jsonb_build_object('issue_note', trim(p_issue_note)) else '{}'::jsonb end);
  end if;
  perform public.log_activity('recorded payment', 'payment', p_payment_id, jsonb_build_object('status', p_status));
  return p_payment_id;
end;
$$;

create or replace function public.submit_job_application(
  p_job_id uuid,
  p_cover_note text,
  p_portfolio_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_professional_id uuid := public.current_professional_id();
  v_cover_note text := trim(coalesce(p_cover_note, ''));
  v_portfolio_url text := nullif(trim(coalesce(p_portfolio_url, '')), '');
  v_application_id uuid;
  v_job_title text;
  v_profile_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to apply'; end if;
  if v_professional_id is null then raise exception 'Complete your professional profile before applying'; end if;
  if not exists (select 1 from public.professionals where id = v_professional_id and account_status = 'active') then raise exception 'Professional account is inactive'; end if;
  if char_length(v_cover_note) < 20 then raise exception 'Cover note must be at least 20 characters'; end if;
  if char_length(v_cover_note) > 4000 then raise exception 'Cover note must be 4,000 characters or fewer'; end if;
  if v_portfolio_url is not null and (char_length(v_portfolio_url) > 500 or v_portfolio_url !~* '^https?://[^[:space:]]+$') then raise exception 'Portfolio URL must be a valid http(s) URL'; end if;
  select j.title into v_job_title
  from public.jobs j join public.services s on s.id = j.service_id and s.active and s.public_visible
  where j.id = p_job_id and j.public_visible and j.publication_state = 'open' and j.slug is not null and length(trim(j.public_summary)) > 0 and length(trim(j.public_company_name)) > 0 and length(trim(j.location_label)) > 0 and (j.application_deadline is null or j.application_deadline > now());
  if v_job_title is null then raise exception 'This job is no longer accepting applications'; end if;
  begin
    insert into public.job_applications (job_id, professional_id, cover_note, portfolio_url)
    values (p_job_id, v_professional_id, v_cover_note, v_portfolio_url)
    returning id into v_application_id;
  exception when unique_violation then raise exception 'You have already applied to this job'; end;
  select profile_id into v_profile_id from public.professionals where id = v_professional_id;
  perform public.queue_transactional_email(v_profile_id, 'application_received', 'job_application', v_application_id, jsonb_build_object('job_title', v_job_title));
  perform public.log_activity('submitted job application', 'job_application', v_application_id, jsonb_build_object('job_id', p_job_id));
  return v_application_id;
end;
$$;

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
  if not public.is_admin() then raise exception 'Only Admin can review applications'; end if;
  if p_status not in ('under_review', 'shortlisted', 'rejected') then raise exception 'Invalid review status'; end if;
  select a.status, p.profile_id, j.title into v_previous, v_profile_id, v_job_title
  from public.job_applications a join public.professionals p on p.id = a.professional_id join public.jobs j on j.id = a.job_id
  where a.id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if v_previous in ('withdrawn', 'converted') then raise exception 'This application is closed'; end if;
  update public.job_applications set status = p_status, admin_note = v_note, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() where id = p_application_id;
  if p_status in ('shortlisted', 'rejected') and p_status <> v_previous then
    perform public.queue_transactional_email(v_profile_id, case when p_status = 'shortlisted' then 'application_shortlisted' else 'application_rejected' end, 'job_application', p_application_id, jsonb_build_object('job_title', v_job_title, 'admin_note', v_note));
  end if;
  perform public.log_activity('reviewed job application', 'job_application', p_application_id, jsonb_build_object('status', p_status::text));
  return p_application_id;
end;
$$;
