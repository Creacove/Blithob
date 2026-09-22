-- Keep the current transactional email outbox canonical while fixing address
-- validation for ordinary dotted domains.
create or replace function public.queue_transactional_email(
  p_recipient_user_id uuid,
  p_event_type text,
  p_source_type text,
  p_source_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_email text;
begin
  select email into v_email
  from public.profiles
  where id = p_recipient_user_id;

  if v_email is null or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    return null;
  end if;

  insert into public.transactional_email_outbox (
    recipient_user_id,
    event_type,
    source_type,
    source_id,
    payload
  )
  values (
    p_recipient_user_id,
    p_event_type,
    p_source_type,
    p_source_id,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (recipient_user_id, event_type, source_type, source_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.transactional_email_outbox
    where recipient_user_id = p_recipient_user_id
      and event_type = p_event_type
      and source_type = p_source_type
      and source_id = p_source_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.queue_transactional_email(uuid, text, text, uuid, jsonb) from public;
