import { describe, expect, it } from "vitest";
import {
  createDemoState,
  removeServiceEnrolment,
  reviewServiceEnrolment,
  setRequirementProgress,
  setServiceActive,
  submitServiceEnrolment
} from "./professionalWorkflow";

describe("normalized demo state", () => {
  it("contains no orphan Assignment relationships", () => {
    const state = createDemoState();
    for (const assignment of state.assignments) {
      expect(state.jobs.some((item) => item.id === assignment.jobId)).toBe(true);
      expect(
        state.professionals.some(
          (item) => item.id === assignment.professionalId
        )
      ).toBe(true);
    }
  });

  it("submits completed readiness to the assigned Lead", () => {
    const state = createDemoState();
    const next = submitServiceEnrolment(state, "enrolment-zainab-social");

    expect(
      next.serviceEnrolments.find(
        (item) => item.id === "enrolment-zainab-social"
      )?.status
    ).toBe("waiting_for_lead");
  });

  it("requires evidence on requirements that declare it", () => {
    const state = createDemoState();
    const next = setRequirementProgress(
      state,
      "enrolment-zainab-social",
      "social-sample",
      { completed: true }
    );

    expect(next).toBe(state);
  });

  it("routes Lead certification to Admin", () => {
    const submitted = submitServiceEnrolment(
      createDemoState(),
      "enrolment-zainab-social"
    );
    const next = reviewServiceEnrolment(submitted, {
      enrolmentId: "enrolment-zainab-social",
      reviewerUserId: "user-nneka",
      reviewerType: "lead",
      decision: "certified",
      comment: "Evidence meets the service standard."
    });

    expect(
      next.serviceEnrolments.find(
        (item) => item.id === "enrolment-zainab-social"
      )?.status
    ).toBe("waiting_for_admin");
  });

  it("returns Admin-requested changes directly to Admin", () => {
    const state = createDemoState();
    const next = reviewServiceEnrolment(state, {
      enrolmentId: "enrolment-zainab-waiting-admin",
      reviewerUserId: "user-admin",
      reviewerType: "admin",
      decision: "changes_requested",
      comment: "Replace the sample with the final client-ready format."
    });

    expect(
      next.serviceEnrolments.find(
        (item) => item.id === "enrolment-zainab-waiting-admin"
      )?.status
    ).toBe("changes_requested_by_admin");
  });

  it("prevents a Lead from certifying their own enrolment", () => {
    const state = createDemoState();

    expect(
      reviewServiceEnrolment(state, {
        enrolmentId: "enrolment-nneka-data",
        reviewerUserId: "user-nneka",
        reviewerType: "lead",
        decision: "certified",
        comment: "Self review"
      })
    ).toBe(state);
  });

  it("does not remove approved or work-linked enrolments", () => {
    const state = createDemoState();

    expect(
      removeServiceEnrolment(state, "enrolment-amara-social-approved")
    ).toBe(state);
  });

  it("does not deactivate a service with open jobs or unfinished enrolments", () => {
    const state = createDemoState();

    expect(setServiceActive(state, "service-social", false)).toBe(state);
  });
});
