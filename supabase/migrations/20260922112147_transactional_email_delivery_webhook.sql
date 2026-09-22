create extension if not exists pg_net;
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.transactional_email_outbox_dispatch()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault, net
as $$
declare
  v_webhook_secret text;
begin
  select decrypted_secret into v_webhook_secret
  from vault.decrypted_secrets
  where name = 'transactional_email_webhook_secret'
  limit 1;

  if v_webhook_secret is null then
    raise exception 'Transactional email webhook secret is not configured';
  end if;

  perform net.http_post(
    url := 'https://cyrgywfdmfnqnontjnxv.supabase.co/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'transactional_email_outbox',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', null
    )
  );
  return new;
end;
$$;

revoke all on function private.transactional_email_outbox_dispatch() from public;

create trigger transactional_email_outbox_dispatch
after insert on public.transactional_email_outbox
for each row execute function private.transactional_email_outbox_dispatch();
