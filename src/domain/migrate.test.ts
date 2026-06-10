import { describe, expect, it } from "vitest";
import { migrateLegacyState } from "./migrate";

describe("legacy state migration", () => {
  it("converts trainer accounts into Lead Professionals", () => {
    const migrated = migrateLegacyState({
      users: [
        {
          id: "user-trainer",
          name: "Nneka",
          email: "nneka@example.com",
          role: "trainer",
          workerId: "worker-nneka"
        }
      ],
      workers: [
        {
          id: "worker-nneka",
          userId: "user-trainer",
          name: "Nneka",
          email: "nneka@example.com",
          phone: "0800",
          location: "Lagos",
          status: "active",
          approvedServiceIds: [],
          training: [],
          completedCount: 2,
          notes: "Lead",
          joinedAt: "2025-01-01",
          isLead: true
        }
      ]
    });

    expect(migrated.users[0]).toMatchObject({
      accountRole: "professional",
      professionalId: "worker-nneka"
    });
    expect(migrated.professionals[0]?.isLead).toBe(true);
  });

  it("creates one Assignment per legacy assignee and attaches submissions", () => {
    const migrated = migrateLegacyState({
      users: [
        {
          id: "user-admin",
          name: "Admin",
          email: "admin@example.com",
          role: "admin"
        },
        {
          id: "user-amara",
          name: "Amara",
          email: "amara@example.com",
          role: "worker",
          workerId: "worker-amara"
        },
        {
          id: "user-david",
          name: "David",
          email: "david@example.com",
          role: "worker",
          workerId: "worker-david"
        }
      ],
      workers: [
        {
          id: "worker-amara",
          userId: "user-amara",
          name: "Amara",
          email: "amara@example.com",
          phone: "0801",
          location: "Lagos",
          status: "active",
          approvedServiceIds: ["service-social"],
          training: [],
          completedCount: 3,
          notes: "",
          joinedAt: "2026-01-01",
          isLead: false
        },
        {
          id: "worker-david",
          userId: "user-david",
          name: "David",
          email: "david@example.com",
          phone: "0802",
          location: "Accra",
          status: "ready",
          approvedServiceIds: ["service-social"],
          training: [],
          completedCount: 1,
          notes: "",
          joinedAt: "2026-02-01",
          isLead: false
        }
      ],
      services: [
        {
          id: "service-social",
          name: "Social media",
          shortName: "Social",
          description: "Campaign support",
          active: true
        }
      ],
      trainingTracks: [],
      opportunities: [
        {
          id: "opp-social",
          title: "Campaign support",
          serviceId: "service-social",
          description: "Prepare a campaign.",
          steps: "Review the brief\nDraft the calendar",
          acceptanceCriteria: ["Calendar is complete"],
          expectedOutput: "Campaign calendar",
          deadline: "2026-06-30",
          payAmount: 100000,
          readinessLevel: "approved",
          status: "submitted",
          assignedWorkerIds: ["worker-amara", "worker-david"],
          leadId: "worker-amara",
          createdAt: "2026-06-01"
        }
      ],
      submissions: [
        {
          id: "submission-david",
          opportunityId: "opp-social",
          workerId: "worker-david",
          notes: "Ready for review",
          submittedAt: "2026-06-09T10:00:00.000Z"
        }
      ],
      reviews: [],
      payouts: [],
      notifications: [],
      activity: []
    });

    const assignments = migrated.assignments.filter(
      (item) => item.jobId === "opp-social"
    );
    expect(assignments).toHaveLength(2);
    expect(
      assignments.find((item) => item.professionalId === "worker-amara")
        ?.leadReviewerId
    ).toBeUndefined();
    expect(
      migrated.submissions.find((item) => item.id === "submission-david")
        ?.assignmentId
    ).toBe("assignment-opp-social-worker-david");
  });

  it("returns the demo state for malformed persisted data", () => {
    const migrated = migrateLegacyState({ users: "not-an-array" });

    expect(migrated.users.some((item) => item.id === "user-admin")).toBe(true);
    expect(migrated.jobs.length).toBeGreaterThan(0);
  });
});
