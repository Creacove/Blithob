-- Apply only after the CV-aware frontend has been deployed and smoke-tested.
-- Existing rows and the legacy function definition remain for compatibility;
-- new candidate calls must use submit_job_application_with_cv.
revoke all on function public.submit_job_application(uuid, text, text) from public, anon, authenticated;
revoke all on function public.list_my_applications(text) from public, anon;
revoke all on function public.list_admin_applications(uuid, text) from public, anon;
revoke all on function public.list_admin_applications(uuid, text, text, integer, integer) from public, anon;
revoke all on function public.complete_my_professional_profile(text, text, text) from public, anon;
revoke all on function public.withdraw_job_application(uuid) from public, anon;
revoke all on function public.review_job_application(uuid, public.job_application_status, text) from public, anon;
revoke all on function public.convert_job_application_to_assignment(uuid, bigint, timestamptz, uuid) from public, anon;
grant execute on function public.list_my_applications(text) to authenticated;
grant execute on function public.list_admin_applications(uuid, text, text, integer, integer) to authenticated;
grant execute on function public.complete_my_professional_profile(text, text, text) to authenticated;
grant execute on function public.withdraw_job_application(uuid) to authenticated;
grant execute on function public.review_job_application(uuid, public.job_application_status, text) to authenticated;
grant execute on function public.convert_job_application_to_assignment(uuid, bigint, timestamptz, uuid) to authenticated;
