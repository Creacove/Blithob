import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByText("Submitted")).toBeInTheDocument();
  });
});
