create or replace function public.update_my_profile(p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text := nullif(trim(p_display_name), '');
begin
  if auth.uid() is null then
    raise exception 'No active account session';
  end if;

  if v_display_name is null then
    raise exception 'Display name is required';
  end if;

  if char_length(v_display_name) > 120 then
    raise exception 'Display name must be 120 characters or fewer';
  end if;

  update public.profiles
  set display_name = v_display_name
  where id = auth.uid();

  if not found then
    raise exception 'Account profile not found';
  end if;

  return auth.uid();
end;
$$;

revoke all on function public.update_my_profile(text) from public;
grant execute on function public.update_my_profile(text) to authenticated;
