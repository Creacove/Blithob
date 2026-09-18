import { Archive, CheckCircle2, Download, FileText, RotateCcw, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import {
  MAX_CANDIDATE_DOCUMENT_BYTES,
  type CandidateDocument,
  type CandidateDocumentType,
  validateCandidateDocumentFile
} from "../../lib/candidateDocuments";
import { Button } from "../ui";

export const CANDIDATE_DOCUMENT_ACCEPT =
  "application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";

interface CandidateDocumentManagerProps {
  documents: CandidateDocument[];
  onUpload: (input: {
    type: CandidateDocumentType;
    file: File;
  }) => Promise<CandidateDocument>;
  onArchive?: (documentId: string) => Promise<void>;
  onDownload?: (document: CandidateDocument) => Promise<string>;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "The document could not be uploaded.";
}

export function CandidateDocumentManager({
  documents,
  onUpload,
  onArchive,
  onDownload
}: CandidateDocumentManagerProps) {
  const cvInput = useRef<HTMLInputElement>(null);
  const supportingInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<CandidateDocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<{ type: CandidateDocumentType; file: File } | null>(null);
  const [workingDocumentId, setWorkingDocumentId] = useState<string | null>(null);
  const activeDocuments = documents.filter(
    (document) => document.isActive && document.uploadComplete
  );
  const cv = activeDocuments.find((document) => document.documentType === "cv");
  const supporting = activeDocuments.filter(
    (document) => document.documentType === "supporting"
  );

  const upload = async (type: CandidateDocumentType, file: File) => {
    setError(null);
    try {
      validateCandidateDocumentFile(file);
      setUploading(type);
      setRetry({ type, file });
      await onUpload({ type, file });
      setRetry(null);
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setUploading(null);
    }
  };

  const selectFile = (type: CandidateDocumentType, file: File | undefined) => {
    if (file) void upload(type, file);
  };

  const archive = async (document: CandidateDocument) => {
    if (!onArchive) return;
    setError(null);
    setWorkingDocumentId(document.id);
    try {
      await onArchive(document.id);
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setWorkingDocumentId(null);
    }
  };

  const download = async (document: CandidateDocument) => {
    if (!onDownload) return;
    setError(null);
    setWorkingDocumentId(document.id);
    try {
      const url = await onDownload(document);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setWorkingDocumentId(null);
    }
  };

  const documentRow = (document: CandidateDocument) => (
    <li
      key={document.id}
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <FileText className="mt-0.5 shrink-0 text-[var(--blue)]" size={18} aria-hidden />
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--ink)]">{document.displayName}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatSize(document.sizeBytes)} · {document.uploadComplete ? "Uploaded" : "Uploading"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
        {onDownload && (
          <Button
            type="button"
            variant="secondary"
            disabled={workingDocumentId === document.id}
            onClick={() => void download(document)}
          >
            <Download size={15} aria-hidden />
            Download
          </Button>
        )}
        {onArchive && (
          <Button
            type="button"
            variant="quiet"
            disabled={workingDocumentId === document.id}
            onClick={() => void archive(document)}
          >
            <Archive size={15} aria-hidden />
            Archive
          </Button>
        )}
      </div>
    </li>
  );

  return (
    <section
      role="region"
      aria-label="Candidate documents"
      className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:grid-cols-2 sm:p-5"
    >
      <div className="min-w-0 sm:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.13em] text-[var(--blue)]">Candidate documents</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Keep your application ready</h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-6 text-[var(--muted)]">
              Upload a primary CV and any useful supporting documents. Files stay private to your account and the Blithob review team.
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--muted)]">PDF or DOCX · up to 10 MiB</p>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-[var(--border)] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.13em] text-[var(--blue)]">Primary CV</p>
            <h3 className="mt-1 font-semibold text-[var(--ink)]">The version used when you apply</h3>
          </div>
          <Button
            type="button"
            variant={cv ? "secondary" : "primary"}
            disabled={uploading === "cv"}
            onClick={() => cvInput.current?.click()}
          >
            <UploadCloud size={15} aria-hidden />
            {uploading === "cv" ? "Uploading…" : cv ? "Replace CV" : "Upload primary CV"}
          </Button>
        </div>
        <input
          ref={cvInput}
          className="sr-only"
          type="file"
          accept={CANDIDATE_DOCUMENT_ACCEPT}
          aria-label="Upload primary CV"
          onChange={(event) => selectFile("cv", event.target.files?.[0])}
        />
        {cv ? (
          <ul className="mt-4">{documentRow(cv)}</ul>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-sm leading-6 text-[var(--muted)]">
            A primary CV is required before you can apply.
          </p>
        )}
      </div>

      <div className="min-w-0 rounded-xl border border-[var(--border)] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.13em] text-[var(--blue)]">Supporting documents</p>
            <h3 className="mt-1 font-semibold text-[var(--ink)]">Add up to five useful extras</h3>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={uploading === "supporting" || supporting.length >= 5}
            onClick={() => supportingInput.current?.click()}
          >
            <UploadCloud size={15} aria-hidden />
            {uploading === "supporting" ? "Uploading…" : "Add document"}
          </Button>
        </div>
        <input
          ref={supportingInput}
          className="sr-only"
          type="file"
          accept={CANDIDATE_DOCUMENT_ACCEPT}
          aria-label="Upload supporting document"
          onChange={(event) => selectFile("supporting", event.target.files?.[0])}
        />
        {supporting.length > 0 ? (
          <ul className="mt-4 grid gap-2">{supporting.map(documentRow)}</ul>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-sm leading-6 text-[var(--muted)]">
            Optional. Add certificates or other evidence relevant to your application.
          </p>
        )}
        <p className="mt-3 text-xs text-[var(--muted)]">{supporting.length}/5 uploaded</p>
      </div>

      <div className="sm:col-span-2">
        <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
          {uploading ? <UploadCloud size={15} aria-hidden /> : <CheckCircle2 size={15} aria-hidden />}
          {uploading ? `Uploading ${uploading === "cv" ? "your CV" : "supporting document"}…` : cv ? "Primary CV ready to use." : "Add a primary CV to unlock applications."}
        </p>
        {error && <p role="alert" className="mt-2 text-sm font-medium text-[var(--critical)]">{error}</p>}
        {retry && error && (
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            disabled={uploading !== null}
            onClick={() => void upload(retry.type, retry.file)}
          >
            <RotateCcw size={15} aria-hidden />
            Retry upload
          </Button>
        )}
      </div>
      <p className="sr-only">Maximum file size is {MAX_CANDIDATE_DOCUMENT_BYTES / (1024 * 1024)} MiB.</p>
    </section>
  );
}
