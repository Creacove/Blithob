import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CandidateDocument } from "../../lib/candidateDocuments";
import { useProfessionalStore } from "../../store/professionalStore";
import { PublicApplyPage } from "./PublicApplyPage";
import type { PublicListingsRepository } from "../../lib/publicListings";

vi.setConfig({ testTimeout: 15000 });

const submitApplication = vi.fn(async () => "a1");
const repository: PublicListingsRepository = {
  async listServices() { return []; }, async listCategories() { return []; }, async listJobs() { return { jobs: [], total: 0 }; },
  async getJob() { return { id: "job-1", slug: "product-designer", title: "Product Designer", summary: "Make a useful product feel clear.", companyName: "A client team", serviceSlug: "web", serviceName: "Web", categorySlug: "tech", categoryName: "Tech", employmentType: "Contract", workMode: "Remote", locationLabel: "Lagos", currency: "NGN", ratePeriod: "month", createdAt: "2026-09-02", description: "A calm brief.", deliverables: [], references: [] }; },
  async listMyApplications() { return []; }, async listAdminApplications() { return []; }, async completeProfessionalProfile() { return "p1"; }, submitApplication, async withdrawApplication(id) { return id; }, async reviewApplication(input) { return input.applicationId; }, async shortlistApplication(input) { return input.applicationId; }, async convertApplication() { return "assignment-1"; }
};

const cvFixture: CandidateDocument = {
  id: "cv-1", professionalId: "professional-amara", documentType: "cv", displayName: "resume.pdf",
  storagePath: "professional-amara/cv-1.pdf", mimeType: "application/pdf", sizeBytes: 1024,
  isActive: true, uploadComplete: true, createdAt: "2026-09-17", updatedAt: "2026-09-17"
};

describe("PublicApplyPage", () => {
  afterEach(() => { cleanup(); useProfessionalStore.getState().resetDemo(); useProfessionalStore.getState().signOut(); submitApplication.mockClear(); });

  it("keeps job discovery public and sends signed-out applicants to login with their return path", async () => {
    useProfessionalStore.getState().signOut();
    render(<MemoryRouter initialEntries={["/jobs/product-designer/apply"]}><Routes><Route path="/jobs/:slug/apply" element={<PublicApplyPage repository={repository} />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Apply for Product Designer/ })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Sign in to apply/i })).toHaveAttribute("href", "/login?next=%2Fjobs%2Fproduct-designer%2Fapply");
  });

  it("submits the selected CV document ID with the application", async () => {
    useProfessionalStore.getState().signIn("professional");
    useProfessionalStore.setState({ candidateDocuments: [cvFixture] });
    render(<MemoryRouter initialEntries={["/jobs/product-designer/apply"]}><Routes><Route path="/jobs/:slug/apply" element={<PublicApplyPage repository={repository} />} /></Routes></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole("heading", { name: /Apply for Product Designer/ })).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("I’m a strong fit because…"), { target: { value: "I have shipped similar products and can start next month." } });
    await userEvent.setup().click(screen.getByRole("button", { name: /submit application/i }));

    await waitFor(() => expect(submitApplication).toHaveBeenCalledWith(expect.objectContaining({ cvDocumentId: "cv-1" })));
  });

  it("keeps submission unavailable until a completed CV exists", async () => {
    useProfessionalStore.getState().signIn("professional");
    useProfessionalStore.setState({ candidateDocuments: [] });
    render(<MemoryRouter initialEntries={["/jobs/product-designer/apply"]}><Routes><Route path="/jobs/:slug/apply" element={<PublicApplyPage repository={repository} />} /></Routes></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole("heading", { name: /Apply for Product Designer/ })).toBeInTheDocument());
    expect(screen.getByText("Upload a completed CV to apply")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload a completed CV to apply/i })).toBeDisabled();
  });

  it("surfaces duplicate application errors without exposing backend details", async () => {
    useProfessionalStore.getState().signIn("professional");
    useProfessionalStore.setState({ candidateDocuments: [cvFixture] });
    submitApplication.mockRejectedValueOnce(new Error("You have already applied to this job"));
    render(<MemoryRouter initialEntries={["/jobs/product-designer/apply"]}><Routes><Route path="/jobs/:slug/apply" element={<PublicApplyPage repository={repository} />} /></Routes></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole("heading", { name: /Apply for Product Designer/ })).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("I’m a strong fit because…"), { target: { value: "I have shipped similar products and can start next month." } });
    await userEvent.setup().click(screen.getByRole("button", { name: /submit application/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("You have already applied to this job"));
  });
});
