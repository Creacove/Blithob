import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_CANDIDATE_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type CandidateDocumentType = "cv" | "supporting";

export type CandidateDocumentMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface CandidateDocument {
  id: string;
  professionalId: string;
  documentType: CandidateDocumentType;
  displayName: string;
  storagePath: string;
  mimeType: CandidateDocumentMimeType;
  sizeBytes: number;
  isActive: boolean;
  uploadComplete: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedAt?: string;
  archivedAt?: string;
}

const MIME_BY_EXTENSION: Record<"pdf" | "docx", CandidateDocumentMimeType> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

export function validateCandidateDocumentFile(file: File) {
  const displayName = file.name.trim();
  const extension = displayName.toLowerCase().split(".").pop();
  const containsControlCharacter = [...displayName].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (
    !/^[^.]+[.](pdf|docx)$/i.test(displayName) ||
    displayName.includes("/") ||
    displayName.includes("\\") ||
    containsControlCharacter ||
    (extension !== "pdf" && extension !== "docx")
  ) {
    throw new Error("Only a single PDF or DOCX filename is accepted");
  }
  if (file.type !== MIME_BY_EXTENSION[extension]) {
    throw new Error("File extension and MIME type do not match");
  }
  if (file.size < 1 || file.size > MAX_CANDIDATE_DOCUMENT_BYTES) {
    throw new Error("Files must be no larger than 10 MiB");
  }
}

type CandidateDocumentRow = Record<string, unknown>;

function mapDocument(row: CandidateDocumentRow): CandidateDocument {
  return {
    id: String(row.id),
    professionalId: String(row.professional_id ?? row.professionalId),
    documentType: String(row.document_type ?? row.documentType) as CandidateDocumentType,
    displayName: String(row.display_name ?? row.displayName),
    storagePath: String(row.storage_path ?? row.storagePath),
    mimeType: String(row.mime_type ?? row.mimeType) as CandidateDocumentMimeType,
    sizeBytes: Number(row.size_bytes ?? row.sizeBytes),
    isActive: Boolean(row.is_active ?? row.isActive),
    uploadComplete: Boolean(row.upload_complete ?? row.uploadComplete),
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
    ...(row.uploaded_at ?? row.uploadedAt
      ? { uploadedAt: String(row.uploaded_at ?? row.uploadedAt) }
      : {}),
    ...(row.archived_at ?? row.archivedAt
      ? { archivedAt: String(row.archived_at ?? row.archivedAt) }
      : {})
  };
}

function firstDocument(data: unknown) {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    throw new Error("Document registration returned no metadata");
  }
  return mapDocument(row as CandidateDocumentRow);
}

export class CandidateDocumentsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<CandidateDocument[]> {
    const { data, error } = await this.client.rpc("list_my_candidate_documents");
    if (error) throw new Error(error.message);
    return (Array.isArray(data) ? data : data ? [data] : []).map((row) =>
      mapDocument(row as CandidateDocumentRow)
    );
  }

  async upload(input: {
    type: CandidateDocumentType;
    file: File;
  }): Promise<CandidateDocument> {
    validateCandidateDocumentFile(input.file);
    const { data, error } = await this.client.rpc("create_candidate_document", {
      p_document_type: input.type,
      p_display_name: input.file.name.trim(),
      p_mime_type: input.file.type,
      p_size_bytes: input.file.size
    });
    if (error) throw new Error(error.message);
    const registered = firstDocument(data);

    let completionData: unknown;
    try {
      const upload = await this.client.storage
        .from("candidate-documents")
        .upload(registered.storagePath, input.file, { upsert: false });
      if (upload.error) throw new Error(upload.error.message);

      const completion = await this.client.rpc("complete_candidate_document", {
        p_document_id: registered.id
      });
      if (completion.error) throw new Error(completion.error.message);
      completionData = completion.data;
    } catch (uploadError) {
      await this.client.rpc("archive_my_candidate_document", {
        p_document_id: registered.id
      });
      throw uploadError;
    }

    const documents = await this.list();
    return documents.find((document) => document.id === registered.id) ?? firstDocument(completionData);
  }

  async archive(documentId: string): Promise<void> {
    const { error } = await this.client.rpc("archive_my_candidate_document", {
      p_document_id: documentId
    });
    if (error) throw new Error(error.message);
  }

  async getDownloadUrl(document: CandidateDocument): Promise<string> {
    const authorized = (await this.list()).find(
      (candidateDocument) =>
        candidateDocument.id === document.id &&
        candidateDocument.storagePath === document.storagePath
    );
    if (!authorized) throw new Error("Document is not available");
    const { data, error } = await this.client.storage
      .from("candidate-documents")
      .createSignedUrl(authorized.storagePath, 300);
    if (error) throw new Error(error.message);
    if (!data?.signedUrl) throw new Error("Document download link is unavailable");
    return data.signedUrl;
  }
}
