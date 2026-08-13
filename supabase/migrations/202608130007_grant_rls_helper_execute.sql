-- RLS policies call these SECURITY DEFINER helpers. Keep them unavailable to
-- anonymous callers while allowing the authenticated API role to evaluate the
-- policies that protect the application tables and private storage.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.current_professional_id() from public;
grant execute on function public.current_professional_id() to authenticated;

revoke all on function public.is_lead() from public;
grant execute on function public.is_lead() to authenticated;

revoke all on function public.can_read_assignment(uuid) from public;
grant execute on function public.can_read_assignment(uuid) to authenticated;

revoke all on function public.can_read_enrolment(uuid) from public;
grant execute on function public.can_read_enrolment(uuid) to authenticated;

revoke all on function public.can_read_professional(uuid) from public;
grant execute on function public.can_read_professional(uuid) to authenticated;

revoke all on function public.can_read_professional_path(text) from public;
grant execute on function public.can_read_professional_path(text) to authenticated;
