-- Existing enrolments for requirement-free Services should not strand a
-- shortlisted candidate in a readiness step that has nothing to complete.
update public.service_enrolments e
set status = 'approved',
    admin_approved_at = coalesce(e.admin_approved_at, now()),
    updated_at = now()
where e.status not in ('approved', 'paused')
  and not exists (
    select 1
    from public.service_requirements r
    where r.service_id = e.service_id
  );
