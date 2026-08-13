-- Keep the Admin activity feed durable for lifecycle changes that happen
-- outside the workflow RPCs.
create or replace function public.log_job_activity()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(
      'created job',
      'job',
      new.id,
      jsonb_build_object('publication_state', new.publication_state)
    );
  elsif new.publication_state is distinct from old.publication_state then
    perform public.log_activity(
      case new.publication_state
        when 'open' then 'published job'
        when 'archived' then 'archived job'
        else 'returned job to draft'
      end,
      'job',
      new.id,
      jsonb_build_object('publication_state', new.publication_state)
    );
  else
    perform public.log_activity('updated job', 'job', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_activity on public.jobs;
create trigger jobs_activity
after insert or update of title, service_id, client_context, objective,
  description, steps, deliverables, acceptance_criteria,
  submission_evidence_required, deadline, publication_state
on public.jobs
for each row execute function public.log_job_activity();

create or replace function public.log_assignment_started()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if old.status is distinct from new.status and new.status = 'in_progress' then
    perform public.log_activity('started assignment', 'assignment', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists assignments_started_activity on public.assignments;
create trigger assignments_started_activity
after update of status on public.assignments
for each row execute function public.log_assignment_started();
