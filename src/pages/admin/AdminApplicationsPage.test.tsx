import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { PublicApplication, PublicListingsRepository } from "../../lib/publicListings";
import { useProfessionalStore } from "../../store/professionalStore";
import { AdminApplicationsPage } from "./AdminApplicationsPage";

const application: PublicApplication = {
  id: "application-1",
  jobId: "job-1",
  jobSlug: "role",
  jobTitle: "Product Designer",
  companyName: "A client team",
  status: "submitted",
  coverNote: "A useful candidate note.",
  applicantName: "Ada Candidate",
  applicantEmail: "ada@example.com",
  cvDocumentId: "cv-1",
  cvDisplayName: "ada.pdf",
  supportingDocumentCount: 2,
  totalCount: 26,
  createdAt: "2026-09-22",
  updatedAt: "2026-09-22"
};

function repository(rows: PublicApplication[] = [application]): PublicListingsRepository {
  return {
    async listServices() { return []; },
    async listCategories() { return []; },
    async listJobs() { return { jobs: [], total: 0 }; },
    async getJob() { return null; },
    async listMyApplications() { return []; },
    async listAdminApplications() { return rows; },
    async completeProfessionalProfile() { return "professional-1"; },
    async submitApplication() { return "application-1"; },
    async withdrawApplication(id) { return id; },
    async reviewApplication(input) { return input.applicationId; },
    async convertApplication() { return "assignment-1"; },
    async getApplicationDocumentUrl() { return "https://signed.example/cv"; }
  };
}

describe("AdminApplicationsPage", () => {
  afterEach(() => {
    cleanup();
    useProfessionalStore.getState().resetDemo();
    vi.restoreAllMocks();
  });

  it("shows a load-more control when the bounded queue has more rows", async () => {
    render(
      <MemoryRouter>
        <AdminApplicationsPage repository={repository()} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Product Designer")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /load more applications/i })).toBeInTheDocument();
  });

  it("shows submitted CV metadata and provides the Admin document action", async () => {
    render(
      <MemoryRouter>
        <AdminApplicationsPage repository={repository()} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/CV: ada\.pdf/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /view CV/i })).toBeInTheDocument();
    expect(screen.getByText(/2 supporting document/)).toBeInTheDocument();
  });
});
