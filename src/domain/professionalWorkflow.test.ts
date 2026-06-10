import { describe, expect, it } from "vitest";
import {
  addAssignments,
  cancelAssignment,
  completeAssignment,
  correctPayment,
  createDemoState,
  recordPayment,
  removeServiceEnrolment,
  reviewAssignment,
  reviewServiceEnrolment,
  setRequirementProgress,
  setServiceActive,
  submitAssignment,
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

  it("creates independent Assignments with different pay and reviewers", () => {
    const state = createDemoState();
    const next = addAssignments(state, "job-open-social", [
      {
        professionalId: "professional-amara",
        agreedPay: 145000,
        deadline: "2026-06-24",
        leadReviewerId: "professional-nneka"
      },
      {
        professionalId: "professional-david",
        agreedPay: 120000,
        deadline: "2026-06-25"
      }
    ]);
    const created = next.assignments.filter(
      (item) => item.jobId === "job-open-social"
    );

    expect(created).toHaveLength(2);
    expect(created.map((item) => item.agreedPay)).toEqual([145000, 120000]);
  });

  it("submits one Assignment without changing its sibling", () => {
    const state = createDemoState();
    const next = submitAssignment(state, "assignment-amara-campaign", {
      notes: "Calendar and captions are ready.",
      link: "https://example.com/amara-campaign"
    });

    expect(
      next.assignments.find(
        (item) => item.id === "assignment-amara-campaign"
      )?.status
    ).toBe("waiting_for_lead");
    expect(
      next.assignments.find(
        (item) => item.id === "assignment-david-campaign"
      )?.status
    ).toBe("in_progress");
  });

  it("preserves submission versions after revision", () => {
    const state = createDemoState();
    const once = submitAssignment(state, "assignment-amara-revision", {
      notes: "First version",
      link: "https://example.com/v1"
    });
    const revised = reviewAssignment(once, {
      assignmentId: "assignment-amara-revision",
      reviewerUserId: "user-nneka",
      reviewerType: "lead",
      decision: "changes_requested",
      comment: "Add publishing dates."
    });
    const twice = submitAssignment(revised, "assignment-amara-revision", {
      notes: "Dates added",
      link: "https://example.com/v2"
    });

    expect(
      twice.submissions
        .filter((item) => item.assignmentId === "assignment-amara-revision")
        .map((item) => item.version)
    ).toEqual([1, 2]);
  });

  it("routes Lead certification to Admin and Admin approval to approved", () => {
    const state = createDemoState();
    const certified = reviewAssignment(state, {
      assignmentId: "assignment-waiting-lead",
      reviewerUserId: "user-nneka",
      reviewerType: "lead",
      decision: "certified",
      comment: "Meets the brief."
    });
    const approved = reviewAssignment(certified, {
      assignmentId: "assignment-waiting-lead",
      reviewerUserId: "user-admin",
      reviewerType: "admin",
      decision: "approved",
      comment: "Final approval."
    });

    expect(
      approved.assignments.find(
        (item) => item.id === "assignment-waiting-lead"
      )?.status
    ).toBe("approved");
  });

  it("completes one Assignment and creates exactly one Payment", () => {
    const state = createDemoState();
    const next = completeAssignment(state, "assignment-approved");
    const repeated = completeAssignment(next, "assignment-approved");

    expect(
      next.payments.filter(
        (item) => item.assignmentId === "assignment-approved"
      )
    ).toHaveLength(1);
    expect(
      repeated.payments.filter(
        (item) => item.assignmentId === "assignment-approved"
      )
    ).toHaveLength(1);
  });

  it("allows Cash without a reference and requires it for transfer", () => {
    const state = createDemoState();
    const cash = recordPayment(state, "payment-due-cash", {
      status: "paid",
      paymentDate: "2026-06-10",
      method: "cash",
      reference: "",
      internalNote: "Paid from petty cash."
    });

    expect(
      cash.payments.find((item) => item.id === "payment-due-cash")?.status
    ).toBe("paid");

    const transfer = recordPayment(state, "payment-due-transfer", {
      status: "paid",
      paymentDate: "2026-06-10",
      method: "bank_transfer",
      reference: ""
    });

    expect(transfer).toBe(state);
  });

  it("requires an explicit reason to correct a paid Payment", () => {
    const state = createDemoState();

    expect(
      correctPayment(state, "payment-paid-amara", {
        paymentDate: "2026-06-10",
        method: "bank_transfer",
        reference: "TRF-CORRECTED",
        internalNote: "Corrected bank reference.",
        correctionNote: ""
      })
    ).toBe(state);
  });

  it("cancels only the selected Assignment", () => {
    const state = createDemoState();
    const next = cancelAssignment(
      state,
      "assignment-amara-campaign",
      "Client reduced the delivery scope."
    );

    const cancelled = next.assignments.find(
      (item) => item.id === "assignment-amara-campaign"
    );

    expect(cancelled?.status).toBe("cancelled");
    expect(cancelled?.cancellationReason).toBe(
      "Client reduced the delivery scope."
    );
    expect(
      next.assignments.find(
        (item) => item.id === "assignment-david-campaign"
      )?.status
    ).toBe("in_progress");
  });
});
