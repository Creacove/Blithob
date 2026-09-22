-- Storage creates the object row before all final object metadata is known.
-- Bind the upload to a registered candidate document, but only enforce the
-- metadata fields that Storage has already supplied. The completion RPC still
-- verifies the final MIME type and byte size before exposing the document.

drop policy if exists candidate_documents_storage_insert on storage.objects;
create policy candidate_documents_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'candidate-documents'
    and (storage.foldername(name))[1] = public.current_professional_id()::text
    and (
      metadata ->> 'mimetype' is null
      or metadata ->> 'mimetype' in (
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    )
    and exists (
      select 1
      from public.candidate_documents d
      where d.professional_id = public.current_professional_id()
        and d.storage_path = name
        and d.is_active
        and d.mime_type = coalesce(metadata ->> 'mimetype', d.mime_type)
        and (
          metadata ->> 'size' is null
          or (
            (metadata ->> 'size') ~ '^[0-9]+$'
            and (metadata ->> 'size')::bigint = d.size_bytes
          )
        )
    )
  );
