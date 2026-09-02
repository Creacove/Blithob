-- Contract checks for the public discovery and application surface.
-- Run against a linked or local Supabase database with `psql`/the Supabase test runner.

do $$
begin
  if to_regclass('public.job_categories') is null then
    raise exception 'public.job_categories table is missing';
  end if;
  if to_regclass('public.job_applications') is null then
    raise exception 'public.job_applications table is missing';
  end if;
  if to_regclass('public.jobs') is null or to_regclass('public.services') is null then
    raise exception 'canonical jobs/services tables are missing';
  end if;
end;
$$;

do $$
declare
  required_columns text[][] := array[
    array['services', 'slug'],
    array['services', 'public_visible'],
    array['services', 'display_order'],
    array['jobs', 'slug'],
    array['jobs', 'category_id'],
    array['jobs', 'public_visible'],
    array['jobs', 'public_summary'],
    array['jobs', 'public_company_name'],
    array['jobs', 'employment_type'],
    array['jobs', 'work_mode'],
    array['jobs', 'location_label'],
    array['jobs', 'rate_min_minor'],
    array['jobs', 'rate_max_minor'],
    array['jobs', 'rate_currency'],
    array['jobs', 'rate_period'],
    array['jobs', 'application_deadline'],
    array['jobs', 'featured_order'],
    array['job_applications', 'job_id'],
    array['job_applications', 'professional_id'],
    array['job_applications', 'status'],
    array['job_applications', 'cover_note'],
    array['job_applications', 'assignment_id']
  ];
  item text[];
begin
  foreach item slice 1 in array required_columns loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = item[1]
        and column_name = item[2]
    ) then
      raise exception 'Missing column %.%', item[1], item[2];
    end if;
  end loop;
end;
$$;

do $$
declare
  function_signature text;
begin
  foreach function_signature in array array[
    'public.list_public_services()',
    'public.list_public_categories()',
    'public.list_public_jobs(text,text,text,text,text,boolean,integer,integer)',
    'public.get_public_job(text)',
    'public.list_my_applications(text)',
    'public.list_admin_applications(uuid,text)',
    'public.complete_my_professional_profile(text,text,text)',
    'public.submit_job_application(uuid,text,text)',
    'public.withdraw_job_application(uuid)',
    'public.review_job_application(uuid,public.job_application_status,text)',
    'public.convert_job_application_to_assignment(uuid,bigint,timestamptz,uuid)'
  ] loop
    if to_regprocedure(function_signature) is null then
      raise exception 'Missing function %', function_signature;
    end if;
  end loop;
end;
$$;

do $$
declare
  function_signature text;
begin
  foreach function_signature in array array[
    'public.list_public_services()',
    'public.list_public_categories()',
    'public.list_public_jobs(text,text,text,text,text,boolean,integer,integer)',
    'public.get_public_job(text)'
  ] loop
    if not has_function_privilege('anon', function_signature, 'execute') then
      raise exception 'Anonymous execute privilege missing for %', function_signature;
    end if;
    if not has_function_privilege('authenticated', function_signature, 'execute') then
      raise exception 'Authenticated execute privilege missing for %', function_signature;
    end if;
  end loop;

  foreach function_signature in array array[
    'public.list_my_applications(text)',
    'public.list_admin_applications(uuid,text)',
    'public.complete_my_professional_profile(text,text,text)',
    'public.submit_job_application(uuid,text,text)',
    'public.withdraw_job_application(uuid)',
    'public.review_job_application(uuid,public.job_application_status,text)',
    'public.convert_job_application_to_assignment(uuid,bigint,timestamptz,uuid)'
  ] loop
    if not has_function_privilege('authenticated', function_signature, 'execute') then
      raise exception 'Authenticated execute privilege missing for %', function_signature;
    end if;
    if has_function_privilege('anon', function_signature, 'execute') then
      raise exception 'Anonymous execute privilege must be denied for %', function_signature;
    end if;
  end loop;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.job_categories'::regclass
      and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.job_categories';
  end if;
  if not exists (
    select 1 from pg_class
    where oid = 'public.job_applications'::regclass
      and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.job_applications';
  end if;
end;
$$;
