import { describe, expect, it } from "vitest";
import { createDemoState } from "./professionalWorkflow";
import {
  approvedServiceIdsFor,
  assignmentReviewDestination,
  jobOperationalStatus,
  rankEligibleProfessionals
} from "./selectors";

describe("domain selectors", () => {
  it("derives service approval from approved enrolments", () => {
    const state = createDemoState();
    expect(approvedServiceIdsFor(state, "professional-amara")).toContain(
      "service-social"
    );
  });

  it("keeps Lead capability inside the Professional model", () => {
    const state = createDemoState();
    const nneka = state.professionals.find(
      (item) => item.id === "professional-nneka"
    );
    expect(nneka).toMatchObject({ isLead: true, accountStatus: "active" });
    expect(state.users.find((item) => item.id === nneka?.userId)?.accountRole)
      .toBe("professional");
  });

  it("derives active Job progress from independent Assignments", () => {
    const state = createDemoState();
    expect(jobOperationalStatus(state, "job-campaign")).toBe("active");
  });

  it("routes a Lead's own work directly to Admin", () => {
    const state = createDemoState();
    expect(
      assignmentReviewDestination(state, "assignment-nneka-newsletter")
    ).toBe("admin");
  });

  it("matches approved Professionals and includes eligible Leads", () => {
    const state = createDemoState();
    const ids = rankEligibleProfessionals(state, "job-open-social").map(
      (match) => match.professional.id
    );
    expect(ids).toEqual([
      "professional-nneka",
      "professional-amara",
      "professional-david"
    ]);
  });
});
