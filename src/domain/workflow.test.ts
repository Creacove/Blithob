import { describe, expect, it } from "vitest";
import {
  approveTraining,
  completeOpportunity,
  createDemoState,
  rankEligibleWorkers,
  reviewSubmission,
  submitOpportunity
} from "./workflow";

describe("Blithob workflow", () => {
  it("ranks only service-ready workers by workload then completion history", () => {
    const state = createDemoState();

    const matches = rankEligibleWorkers(state, "opp-open-1");

    expect(matches.map((match) => match.worker.id)).toEqual([
      "worker-nneka",
      "worker-amara",
      "worker-david"
    ]);
    expect(matches[0]?.reasons).toContain("Approved for Social media management");
  });

  it("approves a worker for a service when all training tasks are complete", () => {
    const state = createDemoState();

    const next = approveTraining(state, "worker-zainab", "track-social");

    expect(next.workers.find((worker) => worker.id === "worker-zainab")?.approvedServiceIds)
      .toContain("service-social");
    expect(next.notifications.at(0)?.recipientRole).toBe("worker");
  });

  it("moves submitted work through revision and resubmission", () => {
    const state = createDemoState();
    const submitted = submitOpportunity(state, "opp-active-1", {
      workerId: "worker-amara",
      notes: "Campaign calendar and copy are ready.",
      link: "https://example.com/calendar",
      fileName: "campaign-calendar.pdf"
    });

    const revision = reviewSubmission(
      submitted,
      "opp-active-1",
      "needs_revision",
      "Add publishing dates to every post."
    );

    expect(revision.opportunities.find((job) => job.id === "opp-active-1")?.status)
      .toBe("needs_revision");
    expect(revision.reviews.at(0)?.decision).toBe("needs_revision");
  });

  it("creates one pending payout when accepted work is completed", () => {
    const state = createDemoState();
    const next = completeOpportunity(state, "opp-accepted-1");
    const repeated = completeOpportunity(next, "opp-accepted-1");

    expect(next.opportunities.find((job) => job.id === "opp-accepted-1")?.status)
      .toBe("completed");
    expect(next.payouts.filter((payout) => payout.opportunityId === "opp-accepted-1"))
      .toHaveLength(1);
    expect(repeated.payouts.filter((payout) => payout.opportunityId === "opp-accepted-1"))
      .toHaveLength(1);
  });
});
