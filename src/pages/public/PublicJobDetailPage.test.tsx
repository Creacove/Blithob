import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { PublicJobDetailPage } from "./PublicJobDetailPage";
import type { PublicListingsRepository } from "../../lib/publicListings";

const repository: PublicListingsRepository = {
  async listServices() { return []; },
  async listCategories() { return []; },
  async listJobs() { return { jobs: [], total: 0 }; },
  async getJob() {
    return {
      id: "job-1", slug: "product-designer", title: "Product Designer", summary: "Make a useful product feel clear.", companyName: "A client team",
      serviceSlug: "web", serviceName: "Web", categorySlug: "tech", categoryName: "Tech", employmentType: "Contract", workMode: "Remote", locationLabel: "Lagos",
      rateMinMinor: 40000000, rateMaxMinor: 60000000, currency: "NGN", ratePeriod: "month", createdAt: "2026-09-02T00:00:00.000Z",
      description: "You will turn a complex brief into a calm, useful interface.", deliverables: ["A shippable design direction"], references: []
    };
  },
  async listMyApplications() { return []; }, async listAdminApplications() { return []; },
  async completeProfessionalProfile() { return "p1"; }, async submitApplication() { return "a1"; }, async withdrawApplication(id) { return id; },
  async reviewApplication(input) { return input.applicationId; }, async convertApplication() { return "assignment-1"; }
};

describe("PublicJobDetailPage", () => {
  afterEach(() => cleanup());

  it("shows the public brief and routes applying through the account gate", async () => {
    render(<MemoryRouter initialEntries={["/jobs/product-designer"]}><Routes><Route path="/jobs/:slug" element={<PublicJobDetailPage repository={repository} />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Product Designer" })).toBeInTheDocument());
    expect(screen.getByText("You will turn a complex brief into a calm, useful interface.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Apply for this role/i })).toHaveAttribute("href", "/jobs/product-designer/apply");
  });
});
