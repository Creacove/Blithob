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
