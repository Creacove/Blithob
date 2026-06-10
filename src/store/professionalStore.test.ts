import { beforeEach, describe, expect, it } from "vitest";
import { migrateLegacyState } from "../domain/migrate";
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

  it("resolves demo personas from migrated legacy user IDs", () => {
    const migrated = migrateLegacyState({
      users: [
        {
          id: "user-trainer",
          name: "Legacy Lead",
          email: "lead@example.com",
          role: "trainer",
          workerId: "worker-lead"
        }
      ],
      workers: [
        {
          id: "worker-lead",
          userId: "user-trainer",
          name: "Legacy Lead",
          email: "lead@example.com",
          phone: "0800",
          location: "Lagos",
          status: "active",
          approvedServiceIds: [],
          training: [],
          completedCount: 1,
          notes: "",
          joinedAt: "2025-01-01",
          isLead: true
        }
      ]
    });
    useProfessionalStore.setState({ ...migrated, session: null });

    useProfessionalStore.getState().signIn("lead");

    expect(useProfessionalStore.getState().currentUser()?.id).toBe(
      "user-trainer"
    );
    expect(
      useProfessionalStore.getState().currentProfessional()?.isLead
    ).toBe(true);
  });

  it("creates a Professional account without forcing an enrolment", () => {
    const professionalId = useProfessionalStore
      .getState()
      .createProfessional({
        name: "Kemi Adeyemi",
        email: "kemi@example.com",
        phone: "+234 800 000 0000",
        location: "Ibadan"
      });

    expect(
      useProfessionalStore
        .getState()
        .professionals.find((item) => item.id === professionalId)
    ).toMatchObject({ name: "Kemi Adeyemi", isLead: false });
    expect(
      useProfessionalStore
        .getState()
        .serviceEnrolments.some(
          (item) => item.professionalId === professionalId
        )
    ).toBe(false);
  });

  it("creates one Service enrolment with an optional Lead", () => {
    const enrolmentId = useProfessionalStore
      .getState()
      .createServiceEnrolment(
        "professional-zainab",
        "service-va",
        "professional-nneka"
      );

    expect(
      useProfessionalStore
        .getState()
        .serviceEnrolments.find((item) => item.id === enrolmentId)
    ).toMatchObject({
      professionalId: "professional-zainab",
      serviceId: "service-va",
      leadId: "professional-nneka",
      status: "not_started"
    });
  });

  it("rejects a duplicate active Service enrolment", () => {
    expect(
      useProfessionalStore
        .getState()
        .createServiceEnrolment(
          "professional-amara",
          "service-social",
          "professional-nneka"
        )
    ).toBeUndefined();
  });
});
