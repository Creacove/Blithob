-- Private candidate CVs and supporting documents.
-- This migration is additive and keeps the legacy application RPC intact.

create table if not exists public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete restrict,
  document_type text not null check (document_type in ('cv', 'supporting')),
  display_name text not null check (length(trim(display_name)) between 1 and 160),
  storage_path text not null unique,
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  is_active boolean not null default true,
  upload_complete boolean not null default false,
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.candidate_documents
  add column if not exists upload_complete boolean not null default false,
  add column if not exists uploaded_at timestamptz;

drop index if exists public.candidate_documents_one_active_cv;
create unique index candidate_documents_one_active_cv
  on public.candidate_documents (professional_id)
  where document_type = 'cv' and is_active and upload_complete;

alter table public.job_applications
  add column if not exists cv_document_id uuid references public.candidate_documents(id) on delete restrict;

create index if not exists candidate_documents_professional_idx
  on public.candidate_documents (professional_id, is_active, created_at desc);
create index if not exists job_applications_cv_document_idx
  on public.job_applications (cv_document_id);

drop trigger if exists candidate_documents_updated_at on public.candidate_documents;
create trigger candidate_documents_updated_at
  before update on public.candidate_documents
  for each row execute function public.set_updated_at();

alter table public.candidate_documents enable row level security;

drop policy if exists candidate_documents_select on public.candidate_documents;
create policy candidate_documents_select on public.candidate_documents
  for select to authenticated
  using (public.is_admin() or professional_id = public.current_professional_id());

insert into storage.buckets (id, name, public, file_size_limit)
values ('candidate-documents', 'candidate-documents', false, 10485760)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists candidate_documents_storage_select on storage.objects;
create policy candidate_documents_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'candidate-documents'
    and (public.is_admin() or (storage.foldername(name))[1] = public.current_professional_id()::text)
  );

drop policy if exists candidate_documents_storage_insert on storage.objects;
create policy candidate_documents_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'candidate-documents'
    and (storage.foldername(name))[1] = public.current_professional_id()::text
    and coalesce((metadata ->> 'mimetype'), '') in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    and (metadata ->> 'size') ~ '^[0-9]+$'
    and (metadata ->> 'size')::bigint between 1 and 10485760
    and exists (
      select 1
      from public.candidate_documents d
      where d.professional_id = public.current_professional_id()
        and d.storage_path = name
        and d.is_active
        and d.mime_type = metadata ->> 'mimetype'
        and d.size_bytes = (metadata ->> 'size')::bigint
    )
  );

revoke all on table public.candidate_documents from anon, authenticated;
grant select on table public.candidate_documents to authenticated;

create or replace function public.create_candidate_document(
  p_document_type text,
  p_display_name text,
  p_mime_type text,
  p_size_bytes bigint
)
returns public.candidate_documents
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_professional_id uuid := public.current_professional_id();
  v_document public.candidate_documents;
  v_document_id uuid := gen_random_uuid();
  v_extension text;
  v_display_name text := trim(coalesce(p_display_name, ''));
begin
  if auth.uid() is null or v_professional_id is null then
    raise exception 'Sign in with a professional account';
  end if;
  if not exists (
    select 1 from public.professionals
    where id = v_professional_id and account_status = 'active'
  ) then
    raise exception 'Professional account is inactive';
  end if;
  if p_document_type not in ('cv', 'supporting') then
    raise exception 'Document type must be cv or supporting';
  end if;
  if length(v_display_name) not between 1 and 160 then
    raise exception 'Document name must be between 1 and 160 characters';
  end if;
  if v_display_name ~ '[[:cntrl:]]'
     or position('/' in v_display_name) > 0
     or position(chr(92) in v_display_name) > 0
     or v_display_name !~* '^[^.]+[.](pdf|docx)$' then
    raise exception 'Document name must be a single PDF or DOCX filename';
  end if;
  if p_mime_type not in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) then
    raise exception 'Only PDF and DOCX files are accepted';
  end if;
  if (right(lower(v_display_name), 4) = '.pdf' and p_mime_type <> 'application/pdf')
     or (right(lower(v_display_name), 5) = '.docx' and p_mime_type <> 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') then
    raise exception 'File extension and MIME type do not match';
  end if;
  if p_size_bytes is null or p_size_bytes not between 1 and 10485760 then
    raise exception 'Document must be between 1 byte and 10 MiB';
  end if;
  if p_document_type in ('cv', 'supporting') then
    perform pg_advisory_xact_lock(hashtextextended(v_professional_id::text, 0));
  end if;
  if p_document_type = 'supporting' and (
    select count(*) from public.candidate_documents
    where professional_id = v_professional_id and document_type = 'supporting' and is_active
  ) >= 5 then
    raise exception 'You can have at most five active supporting documents';
  end if;

  if p_mime_type = 'application/pdf' then v_extension := 'pdf'; else v_extension := 'docx'; end if;

  if p_document_type = 'cv' then
    update public.candidate_documents
    set is_active = false, archived_at = now(), updated_at = now()
    where professional_id = v_professional_id
      and document_type = 'cv'
      and is_active
      and not upload_complete;
  end if;

  insert into public.candidate_documents (
    id, professional_id, document_type, display_name, storage_path, mime_type, size_bytes
  ) values (
    v_document_id, v_professional_id, p_document_type, v_display_name,
    v_professional_id::text || '/' || v_document_id::text || '.' || v_extension,
    p_mime_type, p_size_bytes
  ) returning * into v_document;
  return v_document;
end;
$$;

create or replace function public.complete_candidate_document(p_document_id uuid)
returns public.candidate_documents
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_professional_id uuid := public.current_professional_id();
  v_document public.candidate_documents;
  v_previous_cv public.candidate_documents;
begin
  if auth.uid() is null or v_professional_id is null then
    raise exception 'Sign in with a professional account';
  end if;
  if not exists (
    select 1 from public.professionals
    where id = v_professional_id and account_status = 'active'
  ) then
    raise exception 'Professional account is inactive';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_professional_id::text, 0));

  select * into v_document
  from public.candidate_documents
  where id = p_document_id
    and professional_id = v_professional_id
    and is_active
  for update;
  if not found then raise exception 'Document not found'; end if;
  if exists (select 1 from public.job_applications where cv_document_id = p_document_id) then
    raise exception 'Document is already referenced by an application';
  end if;
  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'candidate-documents'
      and o.name = v_document.storage_path
      and o.metadata ->> 'mimetype' = v_document.mime_type
      and (o.metadata ->> 'size') ~ '^[0-9]+$'
      and (o.metadata ->> 'size')::bigint = v_document.size_bytes
  ) then
    raise exception 'Matching Storage object is required before completion';
  end if;

  if v_document.document_type = 'cv' and not v_document.upload_complete then
    select * into v_previous_cv
    from public.candidate_documents
    where professional_id = v_professional_id
      and document_type = 'cv'
      and is_active
      and upload_complete
      and id <> p_document_id
    for update;
    if found then
      update public.candidate_documents
      set is_active = false, archived_at = now(), updated_at = now()
      where id = v_previous_cv.id;
    end if;
  end if;

  update public.candidate_documents
  set upload_complete = true,
      uploaded_at = coalesce(uploaded_at, now()),
      updated_at = now()
  where id = p_document_id
  returning * into v_document;
  return v_document;
end;
$$;

create or replace function public.list_my_candidate_documents()
returns setof public.candidate_documents
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in with a professional account';
  end if;
  return query
    select d.*
    from public.candidate_documents d
    where d.professional_id = public.current_professional_id()
      and d.is_active
      and d.upload_complete
    order by d.document_type, d.created_at desc;
end;
$$;

create or replace function public.archive_my_candidate_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_document public.candidate_documents;
begin
  if auth.uid() is null or public.current_professional_id() is null then
    raise exception 'Sign in with a professional account';
  end if;
  select * into v_document
  from public.candidate_documents
  where id = p_document_id
    and professional_id = public.current_professional_id()
    and is_active
  for update;
  if not found then raise exception 'Document not found'; end if;
  if exists (
    select 1 from public.job_applications
    where cv_document_id = p_document_id
  ) then
    raise exception 'Document is retained because it is referenced by an application';
  end if;
  update public.candidate_documents
  set is_active = false, archived_at = now(), updated_at = now()
  where id = p_document_id;
end;
$$;

create or replace function public.list_application_documents(p_application_id uuid)
returns table (
  id uuid,
  professional_id uuid,
  document_type text,
  display_name text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in with a professional account';
  end if;
  return query
  select d.id, d.professional_id, d.document_type, d.display_name, d.storage_path,
    d.mime_type, d.size_bytes, d.is_active, d.created_at, d.updated_at, d.archived_at
  from public.candidate_documents d
  join public.job_applications a on a.cv_document_id = d.id
  where a.id = p_application_id
    and (public.is_admin() or a.professional_id = public.current_professional_id());
end;
$$;

create or replace function public.submit_job_application_with_cv(
  p_job_id uuid,
  p_cv_document_id uuid,
  p_cover_note text,
  p_portfolio_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_professional_id uuid := public.current_professional_id();
  v_cover_note text := trim(coalesce(p_cover_note, ''));
  v_portfolio_url text := nullif(trim(coalesce(p_portfolio_url, '')), '');
  v_cv public.candidate_documents%rowtype;
  v_job public.jobs%rowtype;
  v_application_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to apply'; end if;
  if v_professional_id is null then raise exception 'Complete your professional profile before applying'; end if;
  if not exists (select 1 from public.professionals where id = v_professional_id and account_status = 'active') then
    raise exception 'Professional account is inactive';
  end if;
  select * into v_cv
  from public.candidate_documents
  where id = p_cv_document_id
  for share;
  if not found
     or v_cv.professional_id <> v_professional_id
     or v_cv.document_type <> 'cv'
     or v_cv.is_active is not true
     or v_cv.upload_complete is not true then
    raise exception 'Select an active primary CV';
  end if;
  if char_length(v_cover_note) < 20 then raise exception 'Cover note must be at least 20 characters'; end if;
  if char_length(v_cover_note) > 4000 then raise exception 'Cover note must be 4,000 characters or fewer'; end if;
  if v_portfolio_url is not null and (char_length(v_portfolio_url) > 500 or v_portfolio_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'Portfolio URL must be a valid http(s) URL';
  end if;
  select * into v_job from public.jobs where id = p_job_id;
  if not exists (
    select 1 from public.jobs j
    join public.services s on s.id = j.service_id and s.active and s.public_visible
    where j.id = p_job_id and j.public_visible and j.publication_state = 'open' and j.slug is not null
      and length(trim(j.public_summary)) > 0 and length(trim(j.public_company_name)) > 0
      and length(trim(j.location_label)) > 0 and (j.application_deadline is null or j.application_deadline > now())
  ) then raise exception 'This job is no longer accepting applications'; end if;
  begin
    insert into public.job_applications (job_id, professional_id, cv_document_id, cover_note, portfolio_url)
    values (p_job_id, v_professional_id, p_cv_document_id, v_cover_note, v_portfolio_url)
    returning id into v_application_id;
  exception when unique_violation then
    raise exception 'You have already applied to this job';
  end;
  perform public.queue_transactional_email(
    (select profile_id from public.professionals where id = v_professional_id),
    'application_received',
    'job_application',
    v_application_id,
    jsonb_build_object('job_title', v_job.title, 'company_name', v_job.public_company_name)
  );
  perform public.log_activity('submitted job application', 'job_application', v_application_id, jsonb_build_object('job_id', p_job_id, 'cv_document_id', p_cv_document_id));
  return v_application_id;
end;
$$;

revoke all on function public.create_candidate_document(text, text, text, bigint) from public;
revoke all on function public.complete_candidate_document(uuid) from public;
revoke all on function public.list_my_candidate_documents() from public;
revoke all on function public.archive_my_candidate_document(uuid) from public;
revoke all on function public.list_application_documents(uuid) from public;
revoke all on function public.submit_job_application_with_cv(uuid, uuid, text, text) from public;

grant execute on function public.create_candidate_document(text, text, text, bigint) to authenticated;
grant execute on function public.complete_candidate_document(uuid) to authenticated;
grant execute on function public.list_my_candidate_documents() to authenticated;
grant execute on function public.archive_my_candidate_document(uuid) to authenticated;
grant execute on function public.list_application_documents(uuid) to authenticated;
grant execute on function public.submit_job_application_with_cv(uuid, uuid, text, text) to authenticated;

