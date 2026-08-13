create or replace function public.remove_professional(p_professional_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile_id uuid;
begin
  if not public.is_admin() then raise exception 'Only Admin can remove Professionals'; end if;
  select profile_id into v_profile_id
  from public.professionals
  where id = p_professional_id;
  if v_profile_id is null then raise exception 'Professional not found'; end if;
  if exists (select 1 from public.service_enrolments where professional_id = p_professional_id)
    or exists (select 1 from public.assignments where professional_id = p_professional_id) then
    raise exception 'Professionals with readiness or assignment history cannot be removed';
  end if;
  delete from auth.users where id = v_profile_id;
  return p_professional_id;
end;
$$;

revoke all on function public.remove_professional(uuid) from public;
grant execute on function public.remove_professional(uuid) to authenticated;
