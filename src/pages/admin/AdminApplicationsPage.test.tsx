import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
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

const shortlistedWithoutReadiness: PublicApplication = {
  ...application,
  id: "application-shortlisted",
  status: "shortlisted",
  serviceName: "Web development",
  readinessEnrolmentId: "enrolment-1",
  readinessStatus: "in_progress",
  readinessCompletedCount: 1,
  readinessRequirementCount: 3,
  readyForAssignment: false
};

const shortlistedReady: PublicApplication = {
  ...shortlistedWithoutReadiness,
  id: "application-ready",
  readinessStatus: "approved",
  readinessCompletedCount: 3,
  readyForAssignment: true
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
    async shortlistApplication(input) { return input.applicationId; },
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

  it("lets Admin shortlist a new application directly without a Start review step", async () => {
    const user = userEvent.setup();
    const shortlistApplication = vi.fn(async (input: { applicationId: string }) => input.applicationId);
    const customRepository = { ...repository(), shortlistApplication };
    render(
      <MemoryRouter>
        <AdminApplicationsPage repository={customRepository} />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: "Shortlist" }));
    expect(shortlistApplication).toHaveBeenCalledWith({ applicationId: "application-1", adminNote: undefined });
    expect(screen.queryByRole("button", { name: /start review/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/change status/i)).not.toBeInTheDocument();
  });

  it("does not expose assignment pay before Service readiness is approved", async () => {
    render(
      <MemoryRouter>
        <AdminApplicationsPage repository={repository([shortlistedWithoutReadiness])} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Product Designer")).toBeInTheDocument());
    expect(screen.getByText("Qualification in progress")).toBeInTheDocument();
    expect(screen.queryByText(/Agreed pay/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^hire$/i })).not.toBeInTheDocument();
  });

  it("reveals the assignment action only for an approved Service-ready candidate", async () => {
    render(
      <MemoryRouter>
        <AdminApplicationsPage repository={repository([shortlistedReady])} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Product Designer")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^hire$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create assignment/i })).not.toBeInTheDocument();
  });
});
