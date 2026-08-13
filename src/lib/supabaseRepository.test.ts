import { describe, expect, it } from "vitest";
import { mapRemoteState, toJobInsert, toServiceInsert } from "./supabaseRepository";

describe("Supabase state mapping", () => {
  it("normalizes relational rows into the frontend state contract", () => {
    const state = mapRemoteState({
      profiles: [
        {
          id: "profile-admin",
          display_name: "Ayo Admin",
          email: "ayo@example.com",
          account_role: "admin",
          created_at: "2026-08-13T09:00:00.000Z"
        },
        {
          id: "profile-pro",
          display_name: "Amara Okafor",
          email: "amara@example.com",
          account_role: "professional",
          created_at: "2026-08-13T09:00:00.000Z"
        }
      ],
      professionals: [
        {
          id: "professional-1",
          profile_id: "profile-pro",
          phone: "+234 800 000 1001",
          location: "Lagos",
          account_status: "active",
          is_lead: true,
          joined_at: "2026-08-13T09:00:00.000Z",
          admin_notes: "Strong operator."
        }
      ],
      services: [
        {
          id: "service-1",
          name: "Social Media",
          short_name: "Social",
          description: "Campaign delivery",
          active: true,
          created_at: "2026-08-13T09:00:00.000Z",
          updated_at: "2026-08-13T09:00:00.000Z"
        }
      ],
      requirements: [
        {
          id: "requirement-1",
          service_id: "service-1",
          title: "Portfolio sample",
          description: "Upload one sample.",
          requires_evidence: true,
          display_order: 1
        }
      ],
      enrolments: [
        {
          id: "enrolment-1",
          professional_id: "professional-1",
          service_id: "service-1",
          lead_id: null,
          status: "in_progress",
          created_at: "2026-08-13T09:00:00.000Z",
          updated_at: "2026-08-13T09:00:00.000Z"
        }
      ],
      progress: [
        {
          enrolment_id: "enrolment-1",
          requirement_id: "requirement-1",
          completed: true,
          evidence_link: "https://example.com/sample",
          evidence_file_path: null,
          evidence_file_name: null,
          completed_at: "2026-08-13T10:00:00.000Z"
        }
      ],
      readinessReviews: [],
      jobs: [],
      jobReferences: [],
      assignments: [],
      submissions: [],
      assignmentReviews: [],
      payments: [],
      notifications: [],
      activity: []
    });

    expect(state.users).toEqual([
      {
        id: "profile-admin",
        name: "Ayo Admin",
        email: "ayo@example.com",
        accountRole: "admin"
      },
      {
        id: "profile-pro",
        name: "Amara Okafor",
        email: "amara@example.com",
        accountRole: "professional",
        professionalId: "professional-1"
      }
    ]);
    expect(state.services[0].requirements[0]).toMatchObject({
      id: "requirement-1",
      order: 1,
      requiresEvidence: true
    });
    expect(state.serviceEnrolments[0].requirements).toEqual([
      {
        requirementId: "requirement-1",
        completed: true,
        evidenceLink: "https://example.com/sample",
        completedAt: "2026-08-13T10:00:00.000Z"
      }
    ]);
  });

  it("orders activity newest-first and gives assignment events a readable subject", () => {
    const state = mapRemoteState({
      profiles: [
        {
          id: "profile-admin",
          display_name: "Ayo Admin",
          email: "ayo@example.com",
          account_role: "admin"
        },
        {
          id: "profile-pro",
          display_name: "Amara Okafor",
          email: "amara@example.com",
          account_role: "professional"
        }
      ],
      professionals: [
        {
          id: "professional-1",
          profile_id: "profile-pro",
          phone: "+234 800 000 1001",
          location: "Lagos",
          account_status: "active",
          is_lead: false,
          joined_at: "2026-08-13T09:00:00.000Z"
        }
      ],
      services: [],
      requirements: [],
      enrolments: [],
      progress: [],
      readinessReviews: [],
      jobs: [
        {
          id: "job-1",
          title: "Campaign refresh",
          service_id: "service-1",
          deadline: "2026-09-01T12:00:00.000Z",
          publication_state: "open",
          created_at: "2026-08-13T09:00:00.000Z",
          updated_at: "2026-08-13T09:00:00.000Z"
        }
      ],
      jobReferences: [],
      assignments: [
        {
          id: "assignment-1",
          job_id: "job-1",
          professional_id: "professional-1",
          agreed_pay: 50000,
          deadline: "2026-09-01T12:00:00.000Z",
          status: "in_progress",
          created_at: "2026-08-13T09:00:00.000Z"
        }
      ],
      submissions: [],
      assignmentReviews: [],
      payments: [],
      notifications: [],
      activity: [
        {
          id: "activity-old",
          actor_user_id: "profile-admin",
          action: "assigned professionals",
          subject_type: "job",
          subject_id: "job-1",
          created_at: "2026-08-13T09:00:00.000Z"
        },
        {
          id: "activity-new",
          actor_user_id: "profile-admin",
          action: "submitted assignment",
          subject_type: "assignment",
          subject_id: "assignment-1",
          created_at: "2026-08-13T10:00:00.000Z"
        }
      ]
    });

    expect(state.activity.map((item) => item.id)).toEqual([
      "activity-new",
      "activity-old"
    ]);
    expect(state.activity[0].subject).toBe(
      "Campaign refresh — Amara Okafor"
    );
  });
});

describe("Supabase write mapping", () => {
  it("keeps frontend job and service fields aligned with the SQL schema", () => {
    expect(
      toServiceInsert(
        {
          name: "Social Media",
          shortName: "Social",
          description: "Campaign delivery",
          requirements: []
        },
        "service-1"
      )
    ).toEqual({
      id: "service-1",
      name: "Social Media",
      short_name: "Social",
      description: "Campaign delivery"
    });

    expect(
      toJobInsert(
        {
          title: "Campaign refresh",
          serviceId: "service-1",
          clientContext: "A client",
          objective: "Improve reach",
          description: "Deliver the refresh.",
          steps: ["Plan"],
          deliverables: ["Calendar"],
          acceptanceCriteria: ["On brief"],
          references: [],
          submissionEvidenceRequired: true,
          deadline: "2026-09-01T12:00:00.000Z"
        },
        "job-1",
        "profile-admin"
      )
    ).toMatchObject({
      id: "job-1",
      service_id: "service-1",
      acceptance_criteria: ["On brief"],
      submission_evidence_required: true,
      created_by: "profile-admin"
    });
  });
});
