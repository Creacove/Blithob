import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "./appStore";

describe("application store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetDemo();
    useAppStore.getState().signOut();
  });

  it("starts a role session and restores the selected demo persona", () => {
    useAppStore.getState().signIn("trainer");

    expect(useAppStore.getState().session?.role).toBe("trainer");
    expect(useAppStore.getState().currentUser()?.name).toBe("Nneka Okafor");
  });

  it("creates a worker already enrolled in a selected training track", () => {
    useAppStore.getState().addWorker({
      name: "Kemi Adeyemi",
      email: "kemi@example.com",
      phone: "+234 800 000 0000",
      location: "Ibadan, Nigeria",
      trackId: "track-social"
    });

    const worker = useAppStore
      .getState()
      .workers.find((item) => item.email === "kemi@example.com");

    expect(worker?.status).toBe("training");
    expect(worker?.training[0]?.trackId).toBe("track-social");
  });

  it("assigns an eligible worker and creates an assignment record", () => {
    useAppStore.getState().assignWorkerToOpportunity("opp-open-1", "worker-amara");

    expect(
      useAppStore
        .getState()
        .opportunities.find((item) => item.id === "opp-open-1")?.status
    ).toBe("assigned");
    expect(
      useAppStore
        .getState()
        .assignments.some(
          (item) =>
            item.opportunityId === "opp-open-1" &&
            item.workerId === "worker-amara"
        )
    ).toBe(true);
  });

  it("marks a pending payout paid with its reference", () => {
    useAppStore.getState().completeOpportunity("opp-accepted-1");
    const payout = useAppStore
      .getState()
      .payouts.find((item) => item.opportunityId === "opp-accepted-1");

    useAppStore.getState().markPayoutPaid(payout!.id, "TRF-DEMO-001", "Bank transfer");

    expect(
      useAppStore.getState().payouts.find((item) => item.id === payout!.id)
    ).toMatchObject({ status: "paid", reference: "TRF-DEMO-001" });
  });

  it("lets admin deactivate a service and create a reusable training track", () => {
    useAppStore.getState().toggleService("service-data");
    useAppStore.getState().addTrainingTrack({
      serviceId: "service-data",
      title: "Data accuracy readiness",
      tasks: [
        {
          title: "Review data handling standards",
          description: "Learn the required accuracy and privacy rules."
        },
        {
          title: "Complete a sample cleanup",
          description: "Correct and structure a sample spreadsheet."
        }
      ]
    });

    expect(
      useAppStore
        .getState()
        .services.find((item) => item.id === "service-data")?.active
    ).toBe(false);
    expect(
      useAppStore
        .getState()
        .trainingTracks.some(
          (item) =>
            item.serviceId === "service-data" &&
            item.title === "Data accuracy readiness" &&
            item.tasks.length === 2
        )
    ).toBe(true);
  });
});
