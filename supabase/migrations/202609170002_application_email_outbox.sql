-- Durable, non-blocking application/status notifications. Delivery is intentionally separate.
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  event_type text not null check (event_type in (
    'application_submitted', 'application_under_review', 'application_shortlisted',
    'application_rejected', 'application_withdrawn', 'application_converted'
  )),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  next_attempt_at timestamptz not null default now(),
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;

create or replace function public.enqueue_application_email()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_event text;
  v_email text;
  v_user uuid;
  v_job record;
begin
  if tg_op = 'INSERT' then v_event := 'application_submitted';
  elsif new.status = 'under_review' then v_event := 'application_under_review';
  elsif new.status = 'shortlisted' then v_event := 'application_shortlisted';
  elsif new.status = 'rejected' then v_event := 'application_rejected';
  elsif new.status = 'withdrawn' then v_event := 'application_withdrawn';
  elsif new.status = 'converted' then v_event := 'application_converted';
  else return new; end if;
  if tg_op = 'UPDATE' and old.status = new.status then return new; end if;
  select p.id, p.email into v_user, v_email from public.professionals pr
    join public.profiles p on p.id = pr.profile_id where pr.id = new.professional_id;
  select title, public_company_name, slug into v_job from public.jobs where id = new.job_id;
  insert into public.email_outbox (idempotency_key, recipient_user_id, recipient_email, event_type, payload)
  values ('application:' || new.id::text || ':' || v_event, v_user, coalesce(v_email, ''), v_event,
    jsonb_build_object('job_title', v_job.title, 'company_name', v_job.public_company_name,
      'status', new.status::text, 'job_url', '/jobs/' || v_job.slug,
      'next_step', 'You can review the latest application status in your Blithob account.'))
  on conflict (idempotency_key) do nothing;
  return new;
end; $$;
drop trigger if exists job_applications_email_outbox on public.job_applications;
create trigger job_applications_email_outbox after insert or update of status on public.job_applications
for each row execute function public.enqueue_application_email();

create or replace function public.claim_email_outbox_batch(p_limit integer default 20)
returns setof public.email_outbox language plpgsql security definer set search_path = public, extensions as $$
begin
  return query
  with claimed as (
    select e.id from public.email_outbox e
    where e.status = 'pending' and e.next_attempt_at <= now()
    order by e.created_at
    for update skip locked limit least(greatest(coalesce(p_limit, 20), 1), 50)
  )
  update public.email_outbox e set status = 'processing', attempts = e.attempts + 1
  from claimed c where e.id = c.id returning e.*;
end; $$;

create or replace function public.mark_email_outbox_sent(p_id uuid, p_provider_message_id text)
returns void language sql security definer set search_path = public, extensions as $$
  update public.email_outbox set status = 'sent', provider_message_id = p_provider_message_id, sent_at = now() where id = p_id;
$$;

create or replace function public.mark_email_outbox_retry(p_id uuid, p_error text)
returns void language sql security definer set search_path = public, extensions as $$
  update public.email_outbox set status = case when attempts >= 5 then 'failed' else 'pending' end,
    last_error = left(coalesce(p_error, 'Delivery failed'), 500), next_attempt_at = now() + make_interval(mins => least(60, greatest(1, attempts * attempts))) where id = p_id;
$$;
revoke all on function public.claim_email_outbox_batch(integer), public.mark_email_outbox_sent(uuid,text), public.mark_email_outbox_retry(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_email_outbox_batch(integer), public.mark_email_outbox_sent(uuid,text), public.mark_email_outbox_retry(uuid,text) to service_role;
