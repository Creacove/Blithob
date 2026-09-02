import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { PublicJobsPage } from "./PublicJobsPage";
import type { PublicListingsRepository } from "../../lib/publicListings";

const repository: PublicListingsRepository = {
  async listServices() { return [{ id: "s1", slug: "web", name: "Web", shortName: "Web", label: "Web", description: "", displayOrder: 1 }]; },
  async listCategories() { return [{ id: "c1", slug: "tech", name: "Tech", description: "", displayOrder: 1 }]; },
  async listJobs() {
    return {
      total: 1,
      jobs: [{
        id: "j1", slug: "product-designer", title: "Product Designer", summary: "Make a useful product feel clear.", companyName: "A client team",
        serviceSlug: "web", serviceName: "Web", categorySlug: "tech", categoryName: "Tech", employmentType: "Contract", workMode: "Remote", locationLabel: "Lagos",
        rateMinMinor: 40000000, rateMaxMinor: 60000000, currency: "NGN", ratePeriod: "month", createdAt: "2026-09-02T00:00:00.000Z"
      }]
    };
  },
  async getJob() { return null; },
  async listMyApplications() { return []; },
  async listAdminApplications() { return []; },
  async completeProfessionalProfile() { return "p1"; },
  async submitApplication() { return "a1"; },
  async withdrawApplication(id) { return id; },
  async reviewApplication(input) { return input.applicationId; },
  async convertApplication() { return "assignment-1"; }
};

describe("PublicJobsPage", () => {
  afterEach(() => cleanup());

  it("renders database-backed jobs and carries filters into the detail link", async () => {
    render(<MemoryRouter initialEntries={["/jobs?query=designer"]}><PublicJobsPage repository={repository} /></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole("heading", { name: /Find work that fits/ })).toBeInTheDocument());
    expect(screen.getByText("Product Designer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Product Designer/ })).toHaveAttribute("href", "/jobs/product-designer");
    expect(screen.getByDisplayValue("designer")).toBeInTheDocument();
  });
});
