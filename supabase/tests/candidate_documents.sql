-- Contract checks for the private candidate-document boundary.
-- Fixtures are intentionally asserted structurally; authorization behavior is
-- exercised through the authenticated API tests after local reset.

select throws_ok(
  $$select public.create_candidate_document('cv', 'resume.pdf', 'application/pdf', 0)$$,
  'unauthenticated or invalid document creation is rejected'
);

do $$
begin
  if not exists (select 1 from pg_catalog.pg_tables where schemaname = 'public' and tablename = 'candidate_documents') then
    raise exception 'public.candidate_documents table is missing';
  end if;
  if not has_column('public', 'job_applications', 'cv_document_id') then
    raise exception 'job_applications.cv_document_id is missing';
  end if;
  if not has_table('storage', 'buckets') or not exists (
    select 1 from storage.buckets where id = 'candidate-documents' and not public and file_size_limit = 10485760
  ) then
    raise exception 'candidate-documents private 10 MiB bucket is missing';
  end if;
end;
$$;

do $$
declare
  function_signature text;
begin
  foreach function_signature in array array[
    'public.create_candidate_document(text,text,text,bigint)',
    'public.list_my_candidate_documents()',
    'public.archive_my_candidate_document(uuid)',
    'public.list_application_documents(uuid)',
    'public.submit_job_application_with_cv(uuid,uuid,text,text)'
  ] loop
    if to_regprocedure(function_signature) is null then
      raise exception 'Missing function %', function_signature;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.create_candidate_document(text,text,text,bigint)', 'execute') then
    raise exception 'Anonymous document creation must be denied';
  end if;
  if not has_function_privilege('authenticated', 'public.create_candidate_document(text,text,text,bigint)', 'execute') then
    raise exception 'Authenticated document creation privilege is missing';
  end if;
end;
$$;

-- Fixture-based authorization and lifecycle checks. The transaction is rolled
-- back so this file never depends on or mutates seeded/production records.
begin;
do $$
declare
  admin_user uuid := '90000000-0000-4000-8000-000000000001';
  candidate_one uuid := '90000000-0000-4000-8000-000000000002';
  candidate_two uuid := '90000000-0000-4000-8000-000000000003';
  admin_profile uuid;
  professional_one uuid := '91000000-0000-4000-8000-000000000001';
  professional_two uuid := '91000000-0000-4000-8000-000000000002';
  service_id uuid := '92000000-0000-4000-8000-000000000001';
  v_job_id uuid := '93000000-0000-4000-8000-000000000001';
  legacy_job_id uuid := '93000000-0000-4000-8000-000000000002';
  cv_one public.candidate_documents%rowtype;
  cv_two public.candidate_documents%rowtype;
  other_cv public.candidate_documents%rowtype;
  supporting_id uuid;
  listed_count integer;
  i integer;
  v_status public.job_application_status;
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values
    (admin_user, 'authenticated', 'authenticated', 'candidate-doc-admin@example.test', 'x', now(), '{}', '{"display_name":"Fixture Admin"}'),
    (candidate_one, 'authenticated', 'authenticated', 'candidate-doc-one@example.test', 'x', now(), '{}', '{"display_name":"Fixture One"}'),
    (candidate_two, 'authenticated', 'authenticated', 'candidate-doc-two@example.test', 'x', now(), '{}', '{"display_name":"Fixture Two"}')
  on conflict (id) do nothing;
  update public.profiles set account_role = 'admin' where id = admin_user returning id into admin_profile;
  insert into public.professionals (id, profile_id, account_status)
  values (professional_one, candidate_one, 'active'), (professional_two, candidate_two, 'active')
  on conflict (id) do nothing;
  insert into public.services (id, name, short_name, public_visible, slug)
  values (service_id, 'Fixture Service', 'Fixture', true, 'fixture-candidate-docs')
  on conflict (id) do nothing;
  insert into public.jobs (
    id, title, service_id, objective, description, steps, deliverables, acceptance_criteria,
    deadline, publication_state, created_by, slug, public_visible, public_summary,
    public_company_name, employment_type, work_mode, location_label, application_deadline
  ) values
    (v_job_id, 'Fixture Job', service_id, 'Fixture objective', 'Fixture description', array['One step'], array['One deliverable'], array['One criterion'],
      now() + interval '30 days', 'open', admin_profile, 'fixture-candidate-docs', true, 'Fixture summary', 'Fixture company', 'Contract', 'Remote', 'Lagos', now() + interval '30 days'),
    (legacy_job_id, 'Fixture Legacy Job', service_id, 'Fixture objective', 'Fixture description', array['One step'], array['One deliverable'], array['One criterion'],
      now() + interval '30 days', 'open', admin_profile, 'fixture-candidate-docs-legacy', true, 'Fixture summary', 'Fixture company', 'Contract', 'Remote', 'Lagos', now() + interval '30 days')
  on conflict (id) do nothing;

  perform set_config('request.jwt.claim.sub', candidate_one::text, true);
  select * into cv_one from public.create_candidate_document('cv', 'one.pdf', 'application/pdf', 100);
  select * into cv_two from public.create_candidate_document('cv', 'replacement.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 200);
  if exists (select 1 from public.candidate_documents where id = cv_two.id and is_active and document_type = 'cv') is not true
     or exists (select 1 from public.candidate_documents where id = cv_one.id and is_active) then
    raise exception 'CV replacement did not archive the previous CV';
  end if;

  for i in 1..5 loop
    select id into supporting_id from public.create_candidate_document('supporting', 'supporting-' || i || '.pdf', 'application/pdf', 100 + i);
  end loop;
  begin
    perform public.create_candidate_document('supporting', 'supporting-6.pdf', 'application/pdf', 106);
    raise exception 'sixth supporting document was accepted';
  exception when others then
    if sqlerrm not like '%at most five%' then raise; end if;
  end;

  select count(*) into listed_count from public.list_my_candidate_documents();
  if listed_count <> 6 then raise exception 'candidate list did not return six active documents'; end if;

  perform set_config('request.jwt.claim.sub', candidate_two::text, true);
  select * into other_cv from public.create_candidate_document('cv', 'other.pdf', 'application/pdf', 100);
  if exists (select 1 from public.list_my_candidate_documents() where id = cv_two.id) then
    raise exception 'candidate can read another candidate document';
  end if;

  perform set_config('request.jwt.claim.sub', candidate_one::text, true);
  begin
    perform public.submit_job_application_with_cv(v_job_id, other_cv.id, repeat('foreign CV should fail ', 2), null);
    raise exception 'foreign CV was accepted';
  exception when others then
    if sqlerrm not like '%active primary CV%' then raise; end if;
  end;
  perform public.submit_job_application_with_cv(v_job_id, cv_two.id, repeat('valid application cover note ', 2), null);
  perform public.submit_job_application(legacy_job_id, repeat('legacy application cover note ', 2), null);

  for v_status in select unnest(enum_range(null::public.job_application_status)) loop
    update public.job_applications set status = v_status where cv_document_id = cv_two.id;
    begin
      perform public.archive_my_candidate_document(cv_two.id);
      raise exception 'application-referenced CV was archived';
    exception when others then
      if sqlerrm not like '%referenced by an application%' then raise; end if;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub', admin_user::text, true);
  if not exists (select 1 from public.list_application_documents((select a.id from public.job_applications a where a.job_id = v_job_id))) then
    raise exception 'Admin cannot read application document metadata';
  end if;
end;
$$;
rollback;

do $$
declare
  storage_policy text;
  archive_function text;
begin
  if not has_table_privilege('authenticated', 'public.candidate_documents', 'select') then
    raise exception 'Authenticated Admin repository cannot select candidate_documents';
  end if;
  select pg_get_expr(polwithcheck, polrelid) into storage_policy
  from pg_policy
  where polname = 'candidate_documents_storage_insert'
    and polrelid = 'storage.objects'::regclass;
  if storage_policy is null or storage_policy not like '%candidate_documents%' then
    raise exception 'Storage insert must be bound to a registered candidate document';
  end if;
  select pg_get_functiondef('public.archive_my_candidate_document(uuid)'::regprocedure)
    into archive_function;
  if archive_function like '%status in%' then
    raise exception 'Archive must reject every application reference';
  end if;
  if archive_function not like '%pg_advisory_xact_lock%' then
    raise exception 'Supporting-document count must be serialized';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_class where oid = 'public.candidate_documents'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.candidate_documents';
  end if;
  if not exists (
    select 1 from pg_indexes where schemaname = 'public'
      and indexname = 'candidate_documents_one_active_cv'
  ) then
    raise exception 'Active CV uniqueness index is missing';
  end if;
end;
$$;

do $$
declare
  check_definition text;
begin
  select pg_get_constraintdef(oid) into check_definition
  from pg_constraint
  where conrelid = 'public.candidate_documents'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%document_type%';
  if check_definition is null then
    raise exception 'Document type constraint is missing';
  end if;
  select pg_get_constraintdef(oid) into check_definition
  from pg_constraint
  where conrelid = 'public.candidate_documents'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%size_bytes%';
  if check_definition is null then
    raise exception 'Document size constraint is missing';
  end if;
end;
$$;
