import { beforeEach, describe, expect, it } from "vitest";
import { useProfessionalStore } from "./professionalStore";

describe("professional store", () => {
  beforeEach(() => {
    localStorage.clear();
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signOut();
  });

  it("signs the Lead persona into the Professional workspace", () => {
    useProfessionalStore.getState().signIn("lead");

    expect(useProfessionalStore.getState().currentUser()).toMatchObject({
      id: "user-nneka",
      accountRole: "professional"
    });
    expect(
      useProfessionalStore.getState().currentProfessional()?.isLead
    ).toBe(true);
  });

  it("promotes a Professional without changing account role", () => {
    useProfessionalStore
      .getState()
      .setLeadCapability("professional-amara", true);

    expect(
      useProfessionalStore
        .getState()
        .professionals.find((item) => item.id === "professional-amara")?.isLead
    ).toBe(true);
    expect(
      useProfessionalStore
        .getState()
        .users.find((item) => item.id === "user-amara")?.accountRole
    ).toBe("professional");
  });

  it("creates two independent Assignments from one Admin action", () => {
    useProfessionalStore.getState().addAssignments("job-open-social", [
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

    expect(
      useProfessionalStore
        .getState()
        .assignments.filter((item) => item.jobId === "job-open-social")
    ).toHaveLength(2);
  });

  it("routes pending Lead work to Admin when Lead capability is removed", () => {
    useProfessionalStore
      .getState()
      .setLeadCapability("professional-nneka", false);

    expect(
      useProfessionalStore
        .getState()
        .assignments.find((item) => item.id === "assignment-waiting-lead")
    ).toMatchObject({
      leadReviewerId: undefined,
      status: "waiting_for_admin"
    });
    expect(
      useProfessionalStore
        .getState()
        .serviceEnrolments.find(
          (item) => item.id === "enrolment-nneka-data"
        )
    ).toMatchObject({
      leadId: undefined,
      status: "waiting_for_admin"
    });
  });
});
