import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useProfessionalStore } from "../../store/professionalStore";
import { PublicApplicationsPage } from "./PublicApplicationsPage";
import type { PublicListingsRepository } from "../../lib/publicListings";

const repository: PublicListingsRepository = {
  async listServices() { return []; }, async listCategories() { return []; }, async listJobs() { return { jobs: [], total: 0 }; }, async getJob() { return null; },
  async listMyApplications() { return [{ id: "a1", jobId: "j1", jobSlug: "role", jobTitle: "Product Designer", companyName: "A client team", status: "submitted", coverNote: "A thoughtful note.", createdAt: "2026-09-02", updatedAt: "2026-09-02" }]; },
  async listAdminApplications() { return []; }, async completeProfessionalProfile() { return "p1"; }, async submitApplication() { return "a1"; }, async withdrawApplication(id) { return id; }, async reviewApplication(input) { return input.applicationId; }, async convertApplication() { return "assignment-1"; }
};

describe("PublicApplicationsPage", () => {
  afterEach(() => { cleanup(); useProfessionalStore.getState().signOut(); });

  it("shows the signed-in professional application history", async () => {
    useProfessionalStore.getState().signIn("professional");
    render(<MemoryRouter><PublicApplicationsPage repository={repository} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { name: /My applications/ })).toBeInTheDocument());
    expect(screen.getByText("Product Designer")).toBeInTheDocument();
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("A thoughtful note.")).toBeInTheDocument();
    expect(screen.queryByText(/Interview|Offer|Hired/i)).not.toBeInTheDocument();
  });

  it("shows the reviewing and shortlisted phase labels without introducing later-stage statuses", async () => {
    const phaseRepository: PublicListingsRepository = {
      ...repository,
      async listMyApplications() {
        return [
          { id: "a2", jobId: "j2", jobSlug: "writer", jobTitle: "Content Writer", companyName: "A client team", status: "under_review", coverNote: "Review note", createdAt: "2026-09-03", updatedAt: "2026-09-04" },
          { id: "a3", jobId: "j3", jobSlug: "designer", jobTitle: "Product Designer", companyName: "Another team", status: "shortlisted", coverNote: "Shortlist note", readinessEnrolmentId: "enrolment-1", readinessStatus: "in_progress", readinessCompletedCount: 1, readinessRequirementCount: 3, createdAt: "2026-09-01", updatedAt: "2026-09-02" }
        ];
      }
    };
    useProfessionalStore.getState().signIn("professional");
    render(<MemoryRouter><PublicApplicationsPage repository={phaseRepository} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("Reviewing")).toBeInTheDocument());
    expect(screen.getByText("Shortlisted")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /complete readiness/i })).toHaveAttribute("href", "/professional/training/enrolment-1");
    expect(screen.queryByText(/Interview|Offer|Hired/i)).not.toBeInTheDocument();
  });

  it("shows the ready-for-assignment and assignment-received states without readiness jargon", async () => {
    const readyRepository: PublicListingsRepository = {
      ...repository,
      async listMyApplications() {
        return [
          { id: "a4", jobId: "j4", jobSlug: "ready", jobTitle: "Frontend Developer", companyName: "A client team", status: "shortlisted", coverNote: "Ready note", readinessStatus: "approved", readyForAssignment: true, readinessEnrolmentId: "enrolment-2", createdAt: "2026-09-01", updatedAt: "2026-09-02" },
          { id: "a5", jobId: "j5", jobSlug: "assigned", jobTitle: "Content Writer", companyName: "Another team", status: "converted", coverNote: "Assigned note", assignmentId: "assignment-1", createdAt: "2026-09-01", updatedAt: "2026-09-02" }
        ];
      }
    };
    useProfessionalStore.getState().signIn("professional");
    render(<MemoryRouter><PublicApplicationsPage repository={readyRepository} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/Ready for assignment/i)).toBeInTheDocument());
    expect(screen.getByText(/Assignment received/i)).toBeInTheDocument();
    expect(screen.queryByText(/existing assignment workflow/i)).not.toBeInTheDocument();
  });

  it("surfaces a safe withdrawal error instead of silently changing the application", async () => {
    const withdrawRepository: PublicListingsRepository = {
      ...repository,
      async withdrawApplication() { throw new Error("Application cannot be withdrawn"); }
    };
    useProfessionalStore.getState().signIn("professional");
    render(<MemoryRouter><PublicApplicationsPage repository={withdrawRepository} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("button", { name: /Withdraw/i })).toBeInTheDocument());
    await userEvent.setup().click(screen.getByRole("button", { name: /Withdraw/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Application cannot be withdrawn"));
  });
});
