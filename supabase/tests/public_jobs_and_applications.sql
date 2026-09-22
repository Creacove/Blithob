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
    array['job_applications', 'assignment_id'],
    array['job_applications', 'cv_document_id']
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
     'public.list_public_jobs(text,text,text,text,text,text,text,bigint,bigint,boolean,integer,integer)',
    'public.get_public_job(text)',
    'public.list_my_applications(text)',
     'public.list_admin_applications(uuid,text,text,integer,integer)',
    'public.complete_my_professional_profile(text,text,text)',
    'public.submit_job_application_with_cv(uuid,uuid,text,text)',
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
  shortlist_definition text;
  review_definition text;
  application_result text;
begin
  if to_regprocedure('public.shortlist_job_application(uuid,text)') is null then
    raise exception 'Shortlist/readiness RPC is missing';
  end if;
  if not has_function_privilege('authenticated', 'public.shortlist_job_application(uuid,text)', 'execute') then
    raise exception 'Authenticated execute privilege missing for shortlist/readiness RPC';
  end if;
  if has_function_privilege('anon', 'public.shortlist_job_application(uuid,text)', 'execute') then
    raise exception 'Anonymous execute privilege must be denied for shortlist/readiness RPC';
  end if;

  select pg_get_functiondef('public.shortlist_job_application(uuid,text)'::regprocedure)
    into shortlist_definition;
  if shortlist_definition not like '%service_enrolments%' then
    raise exception 'Shortlist RPC must create or reuse Service readiness';
  end if;
  if shortlist_definition not like '%application_shortlisted%' then
    raise exception 'Shortlist RPC must queue the shortlist email';
  end if;
  if shortlist_definition not like '%status in (''withdrawn'', ''converted'')%' then
    raise exception 'Shortlist RPC must protect closed applications';
  end if;

  select pg_get_functiondef('public.review_job_application(uuid,public.job_application_status,text)'::regprocedure)
    into review_definition;
  if review_definition not like '%shortlist_job_application%' then
    raise exception 'Legacy review RPC must use readiness-aware shortlisting';
  end if;

  select pg_get_function_result('public.list_admin_applications(uuid,text,text,integer,integer)'::regprocedure)
    into application_result;
  foreach shortlist_definition in array array[
    'service_id', 'service_name', 'readiness_status',
    'readiness_completed_count', 'readiness_requirement_count',
    'ready_for_assignment'
  ] loop
    if application_result not like '%' || shortlist_definition || '%' then
      raise exception 'Admin application read model is missing %', shortlist_definition;
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
    'public.list_public_jobs(text,text,text,text,text,text,text,bigint,bigint,boolean,integer,integer)',
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
    'public.list_admin_applications(uuid,text,text,integer,integer)',
    'public.complete_my_professional_profile(text,text,text)',
    'public.submit_job_application_with_cv(uuid,uuid,text,text)',
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

  if has_function_privilege('authenticated', 'public.submit_job_application(uuid,text,text)', 'execute') then
    raise exception 'Legacy application submission must be denied for authenticated users';
  end if;
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
