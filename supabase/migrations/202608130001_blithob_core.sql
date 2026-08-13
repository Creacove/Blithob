create extension if not exists pgcrypto with schema extensions;

create type public.account_role as enum ('admin', 'professional');
create type public.professional_account_status as enum ('active', 'inactive');
create type public.service_enrolment_status as enum (
  'not_started',
  'in_progress',
  'waiting_for_lead',
  'changes_requested_by_lead',
  'waiting_for_admin',
  'changes_requested_by_admin',
  'approved',
  'paused'
);
create type public.job_publication_state as enum ('draft', 'open', 'archived');
create type public.assignment_status as enum (
  'assigned',
  'in_progress',
  'waiting_for_lead',
  'changes_requested_by_lead',
  'waiting_for_admin',
  'changes_requested_by_admin',
  'approved',
  'completed',
  'cancelled'
);
create type public.payment_status as enum ('due', 'scheduled', 'paid', 'issue');
create type public.payment_method as enum (
  'bank_transfer',
  'mobile_money',
  'cash',
  'cheque',
  'other'
);
create type public.reviewer_type as enum ('lead', 'admin');
create type public.review_decision as enum ('changes_requested', 'certified', 'approved');
create type public.reference_kind as enum ('link', 'file');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null unique,
  account_role public.account_role not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  phone text not null default '',
  location text not null default '',
  admin_notes text not null default '',
  account_status public.professional_account_status not null default 'active',
  is_lead boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_not_blank check (length(trim(name)) > 0),
  constraint services_short_name_not_blank check (length(trim(short_name)) > 0)
);

create table public.service_requirements (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  title text not null,
  description text not null default '',
  requires_evidence boolean not null default false,
  display_order integer not null check (display_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, display_order),
  constraint service_requirements_title_not_blank check (length(trim(title)) > 0)
);

create table public.service_enrolments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  lead_id uuid references public.professionals(id) on delete set null,
  status public.service_enrolment_status not null default 'not_started',
  lead_certified_at timestamptz,
  admin_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_enrolments_lead_not_assignee check (lead_id is null or lead_id <> professional_id)
);

create unique index service_enrolments_one_active
on public.service_enrolments (professional_id, service_id)
where status <> 'paused';

create table public.service_requirement_progress (
  enrolment_id uuid not null references public.service_enrolments(id) on delete cascade,
  requirement_id uuid not null references public.service_requirements(id) on delete cascade,
  completed boolean not null default false,
  evidence_link text,
  evidence_file_path text,
  evidence_file_name text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (enrolment_id, requirement_id)
);

create table public.readiness_reviews (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references public.service_enrolments(id) on delete cascade,
  reviewer_user_id uuid not null references public.profiles(id) on delete restrict,
  reviewer_type public.reviewer_type not null,
  decision public.review_decision not null,
  comment text not null,
  created_at timestamptz not null default now(),
  constraint readiness_reviews_comment_not_blank check (length(trim(comment)) > 0)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  service_id uuid not null references public.services(id) on delete restrict,
  client_context text not null default '',
  objective text not null default '',
  description text not null default '',
  steps text[] not null default '{}',
  deliverables text[] not null default '{}',
  acceptance_criteria text[] not null default '{}',
  submission_evidence_required boolean not null default false,
  deadline timestamptz not null,
  publication_state public.job_publication_state not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_title_not_blank check (length(trim(title)) > 0)
);

create table public.job_references (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  label text not null,
  kind public.reference_kind not null,
  url text,
  storage_path text,
  file_name text,
  display_order integer not null default 1 check (display_order > 0),
  created_at timestamptz not null default now(),
  constraint job_references_label_not_blank check (length(trim(label)) > 0),
  constraint job_references_payload check (
    (kind = 'link' and length(trim(coalesce(url, ''))) > 0)
    or (kind = 'file' and length(trim(coalesce(file_name, ''))) > 0)
  )
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  lead_reviewer_id uuid references public.professionals(id) on delete set null,
  agreed_pay bigint not null check (agreed_pay > 0),
  currency text not null default 'NGN',
  deadline timestamptz not null,
  status public.assignment_status not null default 'assigned',
  started_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  unique (job_id, professional_id),
  constraint assignments_lead_not_assignee check (lead_reviewer_id is null or lead_reviewer_id <> professional_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  version integer not null check (version > 0),
  notes text not null,
  link text,
  file_path text,
  file_name text,
  submitted_at timestamptz not null default now(),
  unique (assignment_id, version),
  constraint submissions_notes_not_blank check (length(trim(notes)) > 0)
);

create table public.assignment_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  reviewer_user_id uuid not null references public.profiles(id) on delete restrict,
  reviewer_type public.reviewer_type not null,
  decision public.review_decision not null,
  comment text not null,
  created_at timestamptz not null default now(),
  constraint assignment_reviews_comment_not_blank check (length(trim(comment)) > 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  amount bigint not null check (amount > 0),
  currency text not null default 'NGN',
  due_date timestamptz not null,
  status public.payment_status not null default 'due',
  payment_date timestamptz,
  method public.payment_method,
  reference text,
  receipt_path text,
  receipt_file_name text,
  internal_note text,
  issue_note text,
  corrected_at timestamptz,
  correction_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_paid_fields check (
    status <> 'paid'
    or (payment_date is not null and method is not null and (method = 'cash' or length(trim(coalesce(reference, ''))) > 0))
  ),
  constraint payments_issue_fields check (status <> 'issue' or length(trim(coalesce(issue_note, ''))) > 0)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index service_enrolments_professional_idx on public.service_enrolments(professional_id);
create index service_enrolments_lead_idx on public.service_enrolments(lead_id);
create index assignments_professional_idx on public.assignments(professional_id);
create index assignments_lead_idx on public.assignments(lead_reviewer_id);
create index assignments_status_idx on public.assignments(status);
create index submissions_assignment_idx on public.submissions(assignment_id, version desc);
create index payments_professional_idx on public.payments(professional_id);
create index notifications_recipient_idx on public.notifications(recipient_user_id, created_at desc);
create index activity_subject_idx on public.activity_events(subject_type, subject_id, created_at desc);

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger professionals_updated_at before update on public.professionals
for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services
for each row execute function public.set_updated_at();
create trigger service_requirements_updated_at before update on public.service_requirements
for each row execute function public.set_updated_at();
create trigger service_enrolments_updated_at before update on public.service_enrolments
for each row execute function public.set_updated_at();
create trigger service_requirement_progress_updated_at before update on public.service_requirement_progress
for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs
for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'professional'), '@', 1)),
    coalesce(new.email, concat(new.id::text, '@invalid.local'))
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.profiles
  set email = coalesce(new.email, email), updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
create trigger on_auth_user_updated
after update of email on auth.users
for each row execute function public.sync_user_email();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_role = 'admin'
  );
$$;

create or replace function public.current_professional_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.professionals where profile_id = auth.uid();
$$;

create or replace function public.is_lead()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.professionals
    where profile_id = auth.uid() and is_lead and account_status = 'active'
  );
$$;

create or replace function public.can_read_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.assignments a
    where a.id = p_assignment_id
    and (
      a.professional_id = public.current_professional_id()
      or a.lead_reviewer_id = public.current_professional_id()
    )
  );
$$;

create or replace function public.can_read_enrolment(p_enrolment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.service_enrolments e
    where e.id = p_enrolment_id
    and (
      e.professional_id = public.current_professional_id()
      or e.lead_id = public.current_professional_id()
    )
  );
$$;

alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.service_requirements enable row level security;
alter table public.service_enrolments enable row level security;
alter table public.service_requirement_progress enable row level security;
alter table public.readiness_reviews enable row level security;
alter table public.jobs enable row level security;
alter table public.job_references enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.assignment_reviews enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_events enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy professionals_select on public.professionals for select to authenticated
using (public.is_admin() or profile_id = auth.uid() or public.is_lead());
create policy professionals_admin_insert on public.professionals for insert to authenticated
with check (public.is_admin());
create policy professionals_update on public.professionals for update to authenticated
using (public.is_admin() or profile_id = auth.uid())
with check (public.is_admin() or profile_id = auth.uid());
create policy professionals_admin_delete on public.professionals for delete to authenticated
using (public.is_admin());

create policy services_select on public.services for select to authenticated
using (public.is_admin() or active or exists (
  select 1 from public.service_enrolments e
  where e.service_id = services.id
  and (e.professional_id = public.current_professional_id() or e.lead_id = public.current_professional_id())
));
create policy services_admin_insert on public.services for insert to authenticated
with check (public.is_admin());
create policy services_admin_update on public.services for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy services_admin_delete on public.services for delete to authenticated
using (public.is_admin());

create policy requirements_select on public.service_requirements for select to authenticated
using (public.is_admin() or exists (select 1 from public.services s where s.id = service_id and s.active));
create policy requirements_admin_insert on public.service_requirements for insert to authenticated
with check (public.is_admin());
create policy requirements_admin_update on public.service_requirements for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy requirements_admin_delete on public.service_requirements for delete to authenticated
using (public.is_admin());

create policy enrolments_select on public.service_enrolments for select to authenticated
using (public.can_read_enrolment(id));
create policy enrolments_admin_insert on public.service_enrolments for insert to authenticated
with check (public.is_admin());
create policy enrolments_admin_update on public.service_enrolments for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy enrolments_admin_delete on public.service_enrolments for delete to authenticated
using (public.is_admin());

create policy progress_select on public.service_requirement_progress for select to authenticated
using (public.can_read_enrolment(enrolment_id));
create policy progress_admin_update on public.service_requirement_progress for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy progress_admin_insert on public.service_requirement_progress for insert to authenticated
with check (public.is_admin());

create policy readiness_reviews_select on public.readiness_reviews for select to authenticated
using (public.can_read_enrolment(enrolment_id));

create policy jobs_select on public.jobs for select to authenticated
using (
  public.is_admin()
  or publication_state = 'open'
  or exists (select 1 from public.assignments a where a.job_id = jobs.id and public.can_read_assignment(a.id))
);
create policy jobs_admin_insert on public.jobs for insert to authenticated
with check (public.is_admin() and created_by = auth.uid());
create policy jobs_admin_update on public.jobs for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy jobs_admin_delete on public.jobs for delete to authenticated
using (public.is_admin());

create policy job_references_select on public.job_references for select to authenticated
using (public.is_admin() or exists (select 1 from public.jobs j where j.id = job_id and j.publication_state = 'open'));
create policy job_references_admin_insert on public.job_references for insert to authenticated
with check (public.is_admin());
create policy job_references_admin_update on public.job_references for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy job_references_admin_delete on public.job_references for delete to authenticated
using (public.is_admin());

create policy assignments_select on public.assignments for select to authenticated
using (public.can_read_assignment(id));
create policy assignments_admin_insert on public.assignments for insert to authenticated
with check (public.is_admin());
create policy assignments_admin_update on public.assignments for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy assignments_admin_delete on public.assignments for delete to authenticated
using (public.is_admin());

create policy submissions_select on public.submissions for select to authenticated
using (public.can_read_assignment(assignment_id));

create policy assignment_reviews_select on public.assignment_reviews for select to authenticated
using (public.can_read_assignment(assignment_id));

create policy payments_select on public.payments for select to authenticated
using (public.is_admin() or professional_id = public.current_professional_id());

create policy notifications_select on public.notifications for select to authenticated
using (recipient_user_id = auth.uid() or public.is_admin());
create policy notifications_update on public.notifications for update to authenticated
using (recipient_user_id = auth.uid() or public.is_admin())
with check (recipient_user_id = auth.uid() or public.is_admin());

create policy activity_select on public.activity_events for select to authenticated
using (public.is_admin() or actor_user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('readiness-evidence', 'readiness-evidence', false, 52428800),
  ('assignment-submissions', 'assignment-submissions', false, 52428800),
  ('payment-receipts', 'payment-receipts', false, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

create policy readiness_evidence_select on storage.objects for select to authenticated
using (bucket_id = 'readiness-evidence' and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text or public.is_lead()));
create policy readiness_evidence_insert on storage.objects for insert to authenticated
with check (bucket_id = 'readiness-evidence' and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text));
create policy readiness_evidence_delete on storage.objects for delete to authenticated
using (bucket_id = 'readiness-evidence' and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text));

create policy assignment_submissions_select on storage.objects for select to authenticated
using (bucket_id = 'assignment-submissions' and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text or public.is_lead()));
create policy assignment_submissions_insert on storage.objects for insert to authenticated
with check (bucket_id = 'assignment-submissions' and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text));
create policy assignment_submissions_delete on storage.objects for delete to authenticated
using (bucket_id = 'assignment-submissions' and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text));

create policy payment_receipts_select on storage.objects for select to authenticated
using (bucket_id = 'payment-receipts' and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text));
create policy payment_receipts_insert on storage.objects for insert to authenticated
with check (bucket_id = 'payment-receipts' and public.is_admin());
create policy payment_receipts_delete on storage.objects for delete to authenticated
using (bucket_id = 'payment-receipts' and public.is_admin());

create or replace function public.notify_user(p_user_id uuid, p_title text, p_message text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into public.notifications (recipient_user_id, title, message)
  values (p_user_id, p_title, p_message);
$$;

create or replace function public.log_activity(p_action text, p_subject_type text, p_subject_id uuid, p_metadata jsonb default '{}')
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into public.activity_events (actor_user_id, action, subject_type, subject_id, metadata)
  values (auth.uid(), p_action, p_subject_type, p_subject_id, coalesce(p_metadata, '{}'));
$$;

create or replace function public.set_requirement_progress(
  p_enrolment_id uuid,
  p_requirement_id uuid,
  p_completed boolean,
  p_evidence_link text default null,
  p_evidence_file_path text default null,
  p_evidence_file_name text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_enrolment public.service_enrolments%rowtype;
  v_requirement public.service_requirements%rowtype;
begin
  select * into v_enrolment from public.service_enrolments where id = p_enrolment_id;
  if not found then raise exception 'Readiness enrolment not found'; end if;
  if not public.is_admin() and v_enrolment.professional_id <> public.current_professional_id() then
    raise exception 'You cannot edit this readiness enrolment';
  end if;
  if v_enrolment.status = 'approved' then raise exception 'Approved readiness cannot be edited'; end if;

  select r.* into v_requirement
  from public.service_requirements r
  where r.id = p_requirement_id and r.service_id = v_enrolment.service_id;
  if not found then raise exception 'Requirement does not belong to this service'; end if;
  if p_completed and v_requirement.requires_evidence and length(trim(coalesce(p_evidence_link, ''))) = 0 and length(trim(coalesce(p_evidence_file_path, ''))) = 0 then
    raise exception 'Evidence is required for this requirement';
  end if;

  insert into public.service_requirement_progress (enrolment_id, requirement_id, completed, evidence_link, evidence_file_path, evidence_file_name, completed_at)
  values (p_enrolment_id, p_requirement_id, p_completed, nullif(trim(p_evidence_link), ''), nullif(trim(p_evidence_file_path), ''), nullif(trim(p_evidence_file_name), ''), case when p_completed then now() else null end)
  on conflict (enrolment_id, requirement_id) do update set
    completed = excluded.completed,
    evidence_link = excluded.evidence_link,
    evidence_file_path = excluded.evidence_file_path,
    evidence_file_name = excluded.evidence_file_name,
    completed_at = excluded.completed_at,
    updated_at = now();

  update public.service_enrolments
  set status = case when status in ('waiting_for_lead', 'waiting_for_admin') then status else 'in_progress' end,
      updated_at = now()
  where id = p_enrolment_id;
end;
$$;

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
      perform public.notify_user((select profile_id from public.professionals where id = v_professional), 'New assignment', v_job.title || ' is ready to start.');
    end if;
  end loop;
  if coalesce(array_length(v_ids, 1), 0) > 0 then perform public.log_activity('assigned professionals', 'job', p_job_id, jsonb_build_object('assignment_ids', v_ids)); end if;
  return to_jsonb(v_ids);
end;
$$;

create or replace function public.start_assignment(p_assignment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from public.assignments where id = p_assignment_id and professional_id = public.current_professional_id() and status = 'assigned') then raise exception 'Assignment cannot be started'; end if;
  update public.assignments set status = 'in_progress', started_at = now() where id = p_assignment_id;
  return p_assignment_id;
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
    perform public.notify_user((select id from public.profiles where account_role = 'admin' order by created_at limit 1), 'Assignment certified', 'An assignment is waiting for final approval.');
  else
    perform public.notify_user(v_assignee_user, case when p_decision = 'approved' then 'Assignment approved' else 'Assignment changes requested' end, trim(p_comment));
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
  perform public.log_activity('recorded payment', 'payment', p_payment_id, jsonb_build_object('status', p_status));
  return p_payment_id;
end;
$$;

create or replace function public.correct_paid_payment(
  p_payment_id uuid,
  p_payment_date timestamptz,
  p_method public.payment_method,
  p_reference text,
  p_receipt_path text,
  p_receipt_file_name text,
  p_internal_note text,
  p_correction_note text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_admin() then raise exception 'Only Admin can correct payments'; end if;
  if length(trim(coalesce(p_correction_note, ''))) = 0 then raise exception 'Correction note is required'; end if;
  if p_payment_date is null or p_method is null or (p_method <> 'cash' and length(trim(coalesce(p_reference, ''))) = 0) then raise exception 'Corrected paid payments require a date, method, and reference unless cash'; end if;
  update public.payments set payment_date = p_payment_date, method = p_method, reference = nullif(trim(p_reference), ''), receipt_path = nullif(trim(p_receipt_path), ''), receipt_file_name = nullif(trim(p_receipt_file_name), ''), internal_note = nullif(trim(p_internal_note), ''), corrected_at = now(), correction_note = trim(p_correction_note), updated_at = now() where id = p_payment_id and status = 'paid';
  if not found then raise exception 'Paid payment not found'; end if;
  perform public.log_activity('corrected payment', 'payment', p_payment_id, jsonb_build_object('correction_note', trim(p_correction_note)));
  return p_payment_id;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.notifications set read_at = now() where id = p_notification_id and (recipient_user_id = auth.uid() or public.is_admin());
  if not found then raise exception 'Notification not found'; end if;
  return p_notification_id;
end;
$$;

revoke all on all functions in schema public from public;
grant execute on function public.set_requirement_progress(uuid, uuid, boolean, text, text, text) to authenticated;
grant execute on function public.submit_service_enrolment(uuid) to authenticated;
grant execute on function public.review_service_enrolment(uuid, public.review_decision, text) to authenticated;
grant execute on function public.add_job_assignments(uuid, jsonb) to authenticated;
grant execute on function public.start_assignment(uuid) to authenticated;
grant execute on function public.submit_assignment(uuid, text, text, text, text) to authenticated;
grant execute on function public.review_assignment(uuid, public.review_decision, text) to authenticated;
grant execute on function public.complete_assignment(uuid) to authenticated;
grant execute on function public.cancel_assignment(uuid, text) to authenticated;
grant execute on function public.record_payment(uuid, public.payment_status, timestamptz, public.payment_method, text, text, text, text, text) to authenticated;
grant execute on function public.correct_paid_payment(uuid, timestamptz, public.payment_method, text, text, text, text, text) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
