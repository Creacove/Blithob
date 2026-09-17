-- Contract checks for the private candidate-document boundary.
-- Fixtures are intentionally asserted structurally; authorization behavior is
-- exercised through the authenticated API tests after local reset.

select throws_ok(
  $$select public.create_candidate_document('cv', 'resume.pdf', 'application/pdf', 0)$$,
  'unauthenticated or invalid document creation is rejected'
);

select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select * from public.list_my_candidate_documents()$$, 'anonymous document listing is rejected');
select throws_ok($$select * from public.list_application_documents('00000000-0000-4000-8000-000000000001')$$, 'anonymous application document listing is rejected');

do $$
begin
  if not exists (select 1 from pg_catalog.pg_tables where schemaname = 'public' and tablename = 'candidate_documents') then
    raise exception 'public.candidate_documents table is missing';
  end if;
  if not has_column('public', 'job_applications', 'cv_document_id') then
    raise exception 'job_applications.cv_document_id is missing';
  end if;
  if not has_column('public', 'candidate_documents', 'upload_complete')
     or not has_column('public', 'candidate_documents', 'uploaded_at') then
    raise exception 'candidate document upload completion columns are missing';
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
    'public.complete_candidate_document(uuid)',
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
  if has_table_privilege('anon', 'public.candidate_documents', 'select') then
    raise exception 'Anonymous direct table select must be denied';
  end if;
  if has_function_privilege('anon', 'public.complete_candidate_document(uuid)', 'execute') then
    raise exception 'Anonymous document completion must be denied';
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
  cv_failed public.candidate_documents%rowtype;
  cv_two public.candidate_documents%rowtype;
  other_cv public.candidate_documents%rowtype;
  storage_cv public.candidate_documents%rowtype;
  supporting_doc public.candidate_documents%rowtype;
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
  begin
    perform public.create_candidate_document('cv', 'resume.exe.pdf', 'application/pdf', 100);
    raise exception 'double extension was accepted';
  exception when others then
    if sqlerrm not like '%single PDF or DOCX filename%' then raise; end if;
  end;
  begin
    perform public.create_candidate_document('cv', 'resume.doc', 'application/pdf', 100);
    raise exception 'unsupported extension was accepted';
  exception when others then
    if sqlerrm not like '%single PDF or DOCX filename%' then raise; end if;
  end;
  begin
    perform public.create_candidate_document('cv', 'resume.pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 100);
    raise exception 'MIME mismatch was accepted';
  exception when others then
    if sqlerrm not like '%extension and MIME%' then raise; end if;
  end;
  begin
    perform public.create_candidate_document('cv', 'resume.pdf', 'application/pdf', 10485761);
    raise exception 'oversized document was accepted';
  exception when others then
    if sqlerrm not like '%10 MiB%' then raise; end if;
  end;
  select * into cv_one from public.create_candidate_document('cv', 'one.pdf', 'application/pdf', 100);
  begin
    perform public.submit_job_application_with_cv(v_job_id, cv_one.id, repeat('incomplete CV should fail ', 2), null);
    raise exception 'incomplete CV was accepted';
  exception when others then
    if sqlerrm not like '%active primary CV%' then raise; end if;
  end;
  begin
    perform public.complete_candidate_document(cv_one.id);
    raise exception 'CV without a matching Storage object was completed';
  exception when others then
    if sqlerrm not like '%Storage object%' then raise; end if;
  end;
  insert into storage.objects (bucket_id, name, metadata)
  values ('candidate-documents', cv_one.storage_path, jsonb_build_object('mimetype', cv_one.mime_type, 'size', cv_one.size_bytes));
  select * into cv_one from public.complete_candidate_document(cv_one.id);
  perform public.submit_job_application_with_cv(v_job_id, cv_one.id, repeat('historical CV application note ', 2), null);

  select * into cv_failed from public.create_candidate_document('cv', 'failed-replacement.pdf', 'application/pdf', 150);
  begin
    perform public.complete_candidate_document(cv_failed.id);
    raise exception 'replacement without a matching Storage object was completed';
  exception when others then
    if sqlerrm not like '%Storage object%' then raise; end if;
  end;
  if exists (select 1 from public.candidate_documents where id = cv_one.id and is_active and upload_complete) is not true then
    raise exception 'failed replacement did not preserve the previous active CV';
  end if;
  perform public.archive_my_candidate_document(cv_failed.id);

  select * into cv_two from public.create_candidate_document('cv', 'replacement.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 200);
  begin
    perform public.submit_job_application_with_cv(legacy_job_id, cv_two.id, repeat('incomplete replacement should fail ', 2), null);
    raise exception 'incomplete replacement CV was accepted';
  exception when others then
    if sqlerrm not like '%active primary CV%' then raise; end if;
  end;
  insert into storage.objects (bucket_id, name, metadata)
  values ('candidate-documents', cv_two.storage_path, jsonb_build_object('mimetype', cv_two.mime_type, 'size', cv_two.size_bytes));
  select * into cv_two from public.complete_candidate_document(cv_two.id);
  if exists (select 1 from public.candidate_documents where id = cv_two.id and is_active and upload_complete) is not true
     or exists (select 1 from public.candidate_documents where id = cv_one.id and is_active) then
    raise exception 'successful CV replacement did not archive the previous CV';
  end if;
  if not exists (select 1 from public.job_applications where job_id = v_job_id and cv_document_id = cv_one.id) then
    raise exception 'historical application did not retain the previous CV link';
  end if;
  perform public.submit_job_application(legacy_job_id, repeat('legacy application cover note ', 2), null);

  for i in 1..5 loop
    select * into supporting_doc from public.create_candidate_document('supporting', 'supporting-' || i || '.pdf', 'application/pdf', 100 + i);
    insert into storage.objects (bucket_id, name, metadata)
    values ('candidate-documents', supporting_doc.storage_path, jsonb_build_object('mimetype', supporting_doc.mime_type, 'size', supporting_doc.size_bytes));
    perform public.complete_candidate_document(supporting_doc.id);
    supporting_id := supporting_doc.id;
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
  perform public.submit_job_application(legacy_job_id, repeat('legacy application cover note ', 2), null);

  for v_status in select unnest(enum_range(null::public.job_application_status)) loop
    update public.job_applications set status = v_status where cv_document_id = cv_one.id;
    begin
      perform public.archive_my_candidate_document(cv_one.id);
      raise exception 'application-referenced CV was archived';
    exception when others then
      if sqlerrm not like '%referenced by an application%' then raise; end if;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub', admin_user::text, true);
  if not exists (select 1 from public.list_application_documents((select a.id from public.job_applications a where a.job_id = v_job_id))) then
    raise exception 'Admin cannot read application document metadata';
  end if;
  perform set_config('request.jwt.claim.sub', candidate_one::text, true);
  select * into storage_cv from public.create_candidate_document('cv', 'storage-test.pdf', 'application/pdf', 300);
  if exists (select 1 from public.list_my_candidate_documents() where id = storage_cv.id) then
    raise exception 'pending document leaked into candidate document listing';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true);
select throws_ok($$
  select public.submit_job_application_with_cv(
    '93000000-0000-4000-8000-000000000001'::uuid,
    null,
    repeat('valid application cover note ', 2),
    null
  )
$$, 'otherwise valid candidate cannot submit without a CV document');

-- Execute Storage RLS as authenticated users, rather than inspecting policy
-- text only. All objects are rolled back with the fixture transaction.
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true);
select throws_ok($$
  insert into storage.objects (bucket_id, name, metadata)
  select 'candidate-documents', d.storage_path,
    jsonb_build_object('mimetype', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'size', d.size_bytes)
  from public.candidate_documents d
  where d.display_name = 'storage-test.pdf'
$$, 'registered path with mismatched MIME is denied');
select throws_ok($$
  insert into storage.objects (bucket_id, name, metadata)
  select 'candidate-documents', d.storage_path,
    jsonb_build_object('mimetype', d.mime_type, 'size', 10485761)
  from public.candidate_documents d
  where d.display_name = 'storage-test.pdf'
$$, 'registered path with mismatched size is denied');
select lives_ok($$
  insert into storage.objects (bucket_id, name, metadata)
  select 'candidate-documents', d.storage_path,
    jsonb_build_object('mimetype', d.mime_type, 'size', d.size_bytes)
  from public.candidate_documents d
  where d.display_name = 'storage-test.pdf'
$$, 'candidate can insert a registered owned document path');
select is((select count(*)::integer from storage.objects where bucket_id = 'candidate-documents' and name = (select storage_path from public.candidate_documents where display_name = 'storage-test.pdf')), 1, 'candidate can select the owned object');
select throws_ok($$
  insert into storage.objects (bucket_id, name, metadata)
  select 'candidate-documents', d.storage_path,
    jsonb_build_object('mimetype', d.mime_type, 'size', d.size_bytes)
  from public.candidate_documents d
  where d.professional_id = '91000000-0000-4000-8000-000000000002'
    and d.document_type = 'cv' and d.is_active
  limit 1
$$, 'foreign candidate storage path is denied');
select throws_ok($$
  insert into storage.objects (bucket_id, name, metadata)
  values ('candidate-documents', '91000000-0000-4000-8000-000000000001/unregistered.pdf', jsonb_build_object('mimetype', 'application/pdf', 'size', 100))
$$, 'unregistered storage path is denied');
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'candidate-documents'), 1, 'Admin can read candidate objects');
reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$
  select count(*) from storage.objects where bucket_id = 'candidate-documents'
$$, 'anonymous cannot read candidate objects');
select throws_ok($$
  insert into storage.objects (bucket_id, name, metadata)
  values ('candidate-documents', '91000000-0000-4000-8000-000000000001/anonymous.pdf', jsonb_build_object('mimetype', 'application/pdf', 'size', 100))
$$, 'anonymous cannot insert candidate objects');
reset role;
rollback;

do $$
declare
  storage_policy text;
  archive_function text;
  create_function text;
  list_function text;
  index_definition text;
begin
  if not has_table_privilege('authenticated', 'public.candidate_documents', 'select') then
    raise exception 'Authenticated Admin repository cannot select candidate_documents';
  end if;
  if has_table_privilege('anon', 'storage.objects', 'select')
     or has_table_privilege('anon', 'storage.objects', 'insert') then
    raise exception 'Anonymous Storage table access must be denied';
  end if;
  if exists (
    select 1
    from pg_policy p
    join pg_roles r on r.rolname = 'anon' and r.oid = any(p.polroles)
    where p.polrelid = 'storage.objects'::regclass
      and p.polname in ('candidate_documents_storage_select', 'candidate_documents_storage_insert')
  ) then
    raise exception 'Candidate Storage policies must not target anon';
  end if;
  select pg_get_expr(polwithcheck, polrelid) into storage_policy
  from pg_policy
  where polname = 'candidate_documents_storage_insert'
    and polrelid = 'storage.objects'::regclass;
  if storage_policy is null
     or storage_policy not like '%candidate_documents%'
     or storage_policy not like '%mimetype%'
     or storage_policy not like '%size%'
     or storage_policy not like '%storage_path%'
     or storage_policy not like '%is_active%' then
    raise exception 'Storage insert must be bound to a registered candidate document';
  end if;
  select pg_get_functiondef('public.archive_my_candidate_document(uuid)'::regprocedure)
    into archive_function;
  if archive_function like '%status in%' then
    raise exception 'Archive must reject every application reference';
  end if;
  select pg_get_functiondef('public.create_candidate_document(text,text,text,bigint)'::regprocedure)
    into create_function;
  if create_function not like '%[:cntrl:]%' or create_function not like '%application/pdf%' then
    raise exception 'Create RPC must validate safe names and MIME values';
  end if;
  if create_function not like '%pg_advisory_xact_lock%'
     or create_function not like '%p_document_type in (''cv'', ''supporting'')%' then
    raise exception 'CV and supporting registration must be serialized';
  end if;
  select pg_get_functiondef('public.list_my_candidate_documents()'::regprocedure)
    into list_function;
  if list_function not like '%auth.uid() is null%' then
    raise exception 'Candidate listing RPC must explicitly guard anonymous callers';
  end if;
  select pg_get_functiondef('public.list_application_documents(uuid)'::regprocedure)
    into list_function;
  if list_function not like '%auth.uid() is null%' then
    raise exception 'Application listing RPC must explicitly guard anonymous callers';
  end if;
  select pg_get_functiondef('public.complete_candidate_document(uuid)'::regprocedure)
    into list_function;
  if list_function not like '%pg_advisory_xact_lock%' or list_function not like '%storage.objects%' then
    raise exception 'Document completion must lock the Professional and verify Storage';
  end if;
  select pg_get_functiondef('public.submit_job_application_with_cv(uuid,uuid,text,text)'::regprocedure)
    into list_function;
  if list_function not like '%for share%' and list_function not like '%for update%' then
    raise exception 'CV-aware submission must lock the selected CV row';
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
  select indexdef into index_definition
  from pg_indexes
  where schemaname = 'public' and indexname = 'candidate_documents_one_active_cv';
  if index_definition not like '%upload_complete%' then
    raise exception 'Active CV uniqueness index must require completed uploads';
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
