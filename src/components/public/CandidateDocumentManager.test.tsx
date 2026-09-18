import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CandidateDocument } from "../../lib/candidateDocuments";
import { CandidateDocumentManager } from "./CandidateDocumentManager";

const cvFixture: CandidateDocument = {
  id: "cv-1",
  professionalId: "professional-1",
  documentType: "cv",
  displayName: "resume.pdf",
  storagePath: "professional-1/cv-1.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  isActive: true,
  uploadComplete: true,
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
  uploadedAt: "2026-09-17T00:00:00.000Z"
};

const supportingFixture: CandidateDocument = {
  ...cvFixture,
  id: "supporting-1",
  documentType: "supporting",
  displayName: "certificate.docx",
  storagePath: "professional-1/supporting-1.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

describe("CandidateDocumentManager", () => {
  afterEach(cleanup);

  it("requires a primary CV before continuing to apply", () => {
    render(<CandidateDocumentManager documents={[]} onUpload={vi.fn()} />);

    expect(screen.getByText(/primary CV is required/i)).toBeInTheDocument();
  });

  it("shows an uploaded CV and supports replacement without losing the old label", () => {
    render(<CandidateDocumentManager documents={[cvFixture]} onUpload={vi.fn()} />);

    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replace CV/i })).toBeInTheDocument();
  });

  it("rejects unsupported or oversized files and offers retry after upload failure", async () => {
    const onUpload = vi
      .fn()
      .mockRejectedValueOnce(new Error("Storage is temporarily unavailable"));
    render(<CandidateDocumentManager documents={[]} onUpload={onUpload} />);

    const input = screen.getByLabelText(/upload primary CV/i);
    fireEvent.change(input, { target: { files: [new File(["x"], "resume.exe", { type: "application/octet-stream" })] } });
    expect(onUpload).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/PDF or DOCX/i);

    const oversized = new File(["x"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(oversized, "size", { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/10 MiB/i);
    expect(onUpload).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { files: [new File(["x"], "resume.pdf", { type: "application/pdf" })] } });
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("alert")).toHaveTextContent(/temporarily unavailable/i);
    expect(screen.getByRole("button", { name: /retry upload/i })).toBeInTheDocument();
  });

  it("renders supporting files with accessible status and mobile-safe layout", () => {
    render(<CandidateDocumentManager documents={[cvFixture, supportingFixture]} onUpload={vi.fn()} />);

    expect(screen.getByText("certificate.docx")).toBeInTheDocument();
    expect(screen.getAllByText(/1 KB/)).toHaveLength(2);
    expect(screen.getByRole("region", { name: /candidate documents/i })).toHaveClass("grid");
    expect(screen.getByRole("status")).toHaveTextContent(/ready/i);
  });
});
