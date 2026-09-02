import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useProfessionalStore } from "../../store/professionalStore";
import { PublicApplyPage } from "./PublicApplyPage";
import type { PublicListingsRepository } from "../../lib/publicListings";

const repository: PublicListingsRepository = {
  async listServices() { return []; }, async listCategories() { return []; }, async listJobs() { return { jobs: [], total: 0 }; },
  async getJob() { return { id: "job-1", slug: "product-designer", title: "Product Designer", summary: "Make a useful product feel clear.", companyName: "A client team", serviceSlug: "web", serviceName: "Web", categorySlug: "tech", categoryName: "Tech", employmentType: "Contract", workMode: "Remote", locationLabel: "Lagos", currency: "NGN", ratePeriod: "month", createdAt: "2026-09-02", description: "A calm brief.", deliverables: [], references: [] }; },
  async listMyApplications() { return []; }, async listAdminApplications() { return []; }, async completeProfessionalProfile() { return "p1"; }, async submitApplication() { return "a1"; }, async withdrawApplication(id) { return id; }, async reviewApplication(input) { return input.applicationId; }, async convertApplication() { return "assignment-1"; }
};

describe("PublicApplyPage", () => {
  afterEach(() => { cleanup(); useProfessionalStore.getState().signOut(); });

  it("keeps job discovery public and sends signed-out applicants to login with their return path", async () => {
    useProfessionalStore.getState().signOut();
    render(<MemoryRouter initialEntries={["/jobs/product-designer/apply"]}><Routes><Route path="/jobs/:slug/apply" element={<PublicApplyPage repository={repository} />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Apply for Product Designer/ })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Sign in to apply/i })).toHaveAttribute("href", "/login?next=%2Fjobs%2Fproduct-designer%2Fapply");
  });
});
