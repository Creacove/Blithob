grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.professionals,
  public.services,
  public.service_requirements,
  public.service_enrolments,
  public.service_requirement_progress,
  public.readiness_reviews,
  public.jobs,
  public.job_references,
  public.assignments,
  public.submissions,
  public.assignment_reviews,
  public.payments,
  public.notifications,
  public.activity_events
to authenticated;

grant all privileges on table
  public.profiles,
  public.professionals,
  public.services,
  public.service_requirements,
  public.service_enrolments,
  public.service_requirement_progress,
  public.readiness_reviews,
  public.jobs,
  public.job_references,
  public.assignments,
  public.submissions,
  public.assignment_reviews,
  public.payments,
  public.notifications,
  public.activity_events
to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;
