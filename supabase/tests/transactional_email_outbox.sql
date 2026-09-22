-- Regression checks for the current transactional email boundary.
-- These assertions run against the linked/local database, never from the browser.

do $$
declare
  definition text;
begin
  if to_regprocedure('public.queue_transactional_email(uuid,text,text,uuid,jsonb)') is null then
    raise exception 'Transactional email queue function is missing';
  end if;

  select pg_get_functiondef('public.queue_transactional_email(uuid,text,text,uuid,jsonb)'::regprocedure)
    into definition;

  if definition not like '%[.]%' then
    raise exception 'Transactional email queue must accept ordinary dotted email addresses';
  end if;
  if definition like '%cover_note%' or definition like '%document%' then
    raise exception 'Transactional email queue function must not include private application content';
  end if;
end;
$$;
