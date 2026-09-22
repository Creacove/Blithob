import { describe, expect, it } from "vitest";
import type { PublicApplication } from "../../lib/publicListings";
import { applicationStatusLabel, primaryAction, readinessCopy } from "./applicationQueue";

const base: PublicApplication = {
  id: "application-1",
  jobId: "job-1",
  jobSlug: "role",
  jobTitle: "Role",
  companyName: "Company",
  status: "shortlisted",
  coverNote: "A candidate note.",
  createdAt: "2026-09-22",
  updatedAt: "2026-09-22"
};

describe("application queue view model", () => {
  it.each([
    ["submitted", "shortlist"],
    ["under_review", "shortlist"],
    ["shortlisted", "view_readiness"],
    ["converted", "view_application"],
    ["rejected", "view_application"],
    ["withdrawn", "view_application"]
  ] as const)("maps %s to %s", (status, action) => {
    expect(primaryAction({ ...base, status })).toBe(action);
  });

  it("exposes hiring once the qualification is approved", () => {
    expect(primaryAction({ ...base, readyForAssignment: true, readinessStatus: "approved" })).toBe("create_assignment");
    expect(primaryAction({ ...base, readyForAssignment: undefined, readinessStatus: "approved" })).toBe("create_assignment");
    expect(primaryAction({ ...base, readyForAssignment: false, readinessStatus: "in_progress" })).toBe("view_readiness");
  });

  it("describes readiness progress without exposing internal database terms", () => {
    expect(readinessCopy({
      ...base,
      readinessStatus: "in_progress",
      readinessCompletedCount: 1,
      readinessRequirementCount: 3
    })).toEqual({
      label: "Qualification in progress",
      tone: "attention",
      detail: "1 of 3 qualification steps complete."
    });
    expect(readinessCopy({ ...base, readinessStatus: "approved" }).label).toBe("Ready to hire");
  });

  it("keeps application status labels human-readable", () => {
    expect(applicationStatusLabel("converted")).toBe("Hired");
    expect(applicationStatusLabel("under_review")).toBe("Applied");
  });
});
