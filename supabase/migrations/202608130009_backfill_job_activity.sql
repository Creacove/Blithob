-- Seed the activity feed for jobs that predate the lifecycle trigger. This is
-- idempotent and preserves the original job creator and timestamp.
insert into public.activity_events (
  actor_user_id,
  action,
  subject_type,
  subject_id,
  metadata,
  created_at
)
select
  j.created_by,
  'created job',
  'job',
  j.id,
  jsonb_build_object('publication_state', j.publication_state, 'backfilled', true),
  j.created_at
from public.jobs j
where not exists (
  select 1
  from public.activity_events a
  where a.action = 'created job'
    and a.subject_type = 'job'
    and a.subject_id = j.id
);
