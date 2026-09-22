import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useProfessionalStore } from "../../store/professionalStore";
import { createEmptyPublicListingsRepository, type PublicListingsRepository } from "../../lib/publicListings";
import { JobsPage } from "./JobsPage";

describe("Admin JobsPage", () => {
  beforeEach(() => {
    useProfessionalStore.getState().resetDemo();
  });

  afterEach(() => cleanup());

  it("shows applicant and hired counts with direct applicant navigation", async () => {
    const repository: PublicListingsRepository = {
      ...createEmptyPublicListingsRepository(),
      async listAdminJobMetrics() {
        return [{
          jobId: "job-open-social",
          applicantCount: 2,
          hiredCount: 1,
          needsActionCount: 0
        }];
      }
    };

    render(
      <MemoryRouter>
        <JobsPage repository={repository} />
      </MemoryRouter>
    );

    expect(await screen.findByText("Launch Social Media Calendar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2 applicants" })).toHaveAttribute(
      "href",
      "/admin/applications?jobId=job-open-social"
    );
    expect(screen.getAllByText("1 hired")).not.toHaveLength(0);
  });
});
