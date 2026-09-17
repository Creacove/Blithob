import { describe, expect, it, vi } from "vitest";
import { CandidateDocumentsRepository } from "./candidateDocuments";

const pdfFile = new File(["pdf"], "resume.pdf", { type: "application/pdf" });
const documentFixture = {
  id: "11111111-1111-4111-8111-111111111111",
  professional_id: "professional-1",
  document_type: "cv",
  display_name: "resume.pdf",
  storage_path: "professional-1/11111111-1111-4111-8111-111111111111.pdf",
  mime_type: "application/pdf",
  size_bytes: pdfFile.size,
  is_active: true,
  upload_complete: true,
  uploaded_at: "2026-09-17T00:00:00.000Z",
  created_at: "2026-09-17T00:00:00.000Z",
  updated_at: "2026-09-17T00:00:00.000Z"
};

function makeClient(overrides: Record<string, unknown> = {}) {
  const rpc = vi.fn(async (name: string) => {
    if (name === "create_candidate_document") {
      return { data: documentFixture, error: null };
    }
    if (name === "list_my_candidate_documents") {
      return { data: [documentFixture], error: null };
    }
    if (name === "complete_candidate_document") {
      return { data: documentFixture, error: null };
    }
    return { data: null, error: null };
  });
  const upload = vi.fn(async () => ({ data: { path: documentFixture.storage_path }, error: null }));
  const createSignedUrl = vi.fn(async () => ({ data: { signedUrl: "https://signed.example" }, error: null }));
  return {
    rpc,
    storage: { from: vi.fn(() => ({ upload, createSignedUrl })) },
    _rpc: rpc,
    _upload: upload,
    _createSignedUrl: createSignedUrl,
    ...overrides
  };
}

describe("CandidateDocumentsRepository", () => {
  it("registers metadata, uploads, completes, then reloads the server path", async () => {
    const fake = makeClient();
    const repository = new CandidateDocumentsRepository(fake as never);

    await repository.upload({ type: "cv", file: pdfFile });

    expect(fake._rpc).toHaveBeenNthCalledWith(1, "create_candidate_document", expect.objectContaining({
      p_document_type: "cv",
      p_mime_type: "application/pdf",
      p_size_bytes: pdfFile.size
    }));
    expect(fake._upload).toHaveBeenCalledWith(
      expect.stringMatching(/^professional-1\/[0-9a-f-]+\.pdf$/),
      pdfFile,
      expect.objectContaining({ upsert: false })
    );
    expect(fake._rpc).toHaveBeenCalledWith("complete_candidate_document", expect.anything());
    expect(fake._rpc).toHaveBeenLastCalledWith("list_my_candidate_documents");
  });

  it("archives a failed registration after storage upload failure", async () => {
    const upload = vi.fn(async () => ({ data: null, error: { message: "upload failed" } }));
    const fake = makeClient({ storage: { from: vi.fn(() => ({ upload, createSignedUrl: vi.fn() })) } });
    const repository = new CandidateDocumentsRepository(fake as never);

    await expect(repository.upload({ type: "cv", file: pdfFile })).rejects.toThrow(/upload/i);
    expect(fake._rpc).toHaveBeenCalledWith("archive_my_candidate_document", expect.anything());
  });

  it("creates a short-lived signed URL only after authorized metadata is listed", async () => {
    const fake = makeClient();
    const repository = new CandidateDocumentsRepository(fake as never);

    await repository.getDownloadUrl({
      id: documentFixture.id,
      professionalId: "professional-1",
      documentType: "cv",
      displayName: "resume.pdf",
      storagePath: documentFixture.storage_path,
      mimeType: "application/pdf",
      sizeBytes: pdfFile.size,
      isActive: true,
      uploadComplete: true,
      createdAt: documentFixture.created_at,
      updatedAt: documentFixture.updated_at
    });

    expect(fake._createSignedUrl).toHaveBeenCalledWith(documentFixture.storage_path, 300);
  });

  it("rejects unsupported, mismatched, and oversized files before invoking RPC", async () => {
    const fake = makeClient();
    const repository = new CandidateDocumentsRepository(fake as never);

    await expect(repository.upload({ type: "cv", file: new File(["x"], "resume.exe.pdf", { type: "application/pdf" }) })).rejects.toThrow(/filename|extension/i);
    await expect(repository.upload({ type: "cv", file: new File(["x"], "resume.pdf", { type: "text/plain" }) })).rejects.toThrow(/MIME|match/i);
    const oversized = { name: "resume.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 } as File;
    await expect(repository.upload({ type: "cv", file: oversized })).rejects.toThrow(/10 MiB/i);
    expect(fake._rpc).not.toHaveBeenCalled();
  });
});
