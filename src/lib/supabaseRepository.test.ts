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
      toServiceInsert(
        {
          name: "Content Creation",
          shortName: "Content",
          description: "Editorial delivery",
          requirements: [],
          slug: "content-creation",
          publicLabel: "Content creation",
          publicVisible: true,
          displayOrder: 2
        },
        "service-public"
      )
    ).toMatchObject({
      slug: "content-creation",
      public_label: "Content creation",
      public_visible: true,
      display_order: 2
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

  it("persists the public catalog fields used by the website", () => {
    expect(
      toJobInsert(
        {
          title: "Product Designer",
          serviceId: "service-content",
          slug: "product-designer",
          categoryId: "category-design",
          publicVisible: true,
          publicSummary: "Turn complex ideas into simple experiences.",
          publicCompanyName: "Northstar Studio",
          employmentType: "Full-time",
          workMode: "Remote",
          locationLabel: "Lagos",
          rateMinMinor: 40000000,
          rateMaxMinor: 65000000,
          rateCurrency: "NGN",
          ratePeriod: "month",
          applicationDeadline: "2026-10-01T00:00:00.000Z",
          featuredOrder: 1,
          clientContext: "A client",
          objective: "Improve the product experience",
          description: "Deliver the refresh.",
          steps: ["Plan"],
          deliverables: ["Direction"],
          acceptanceCriteria: ["On brief"],
          references: [],
          submissionEvidenceRequired: true,
          deadline: "2026-10-01T00:00:00.000Z"
        },
        "job-public",
        "profile-admin"
      )
    ).toMatchObject({
      slug: "product-designer",
      category_id: "category-design",
      public_visible: true,
      public_summary: "Turn complex ideas into simple experiences.",
      public_company_name: "Northstar Studio",
      employment_type: "Full-time",
      work_mode: "Remote",
      location_label: "Lagos",
      rate_min_minor: 40000000,
      rate_max_minor: 65000000,
      rate_currency: "NGN",
      rate_period: "month",
      application_deadline: "2026-10-01T00:00:00.000Z",
      featured_order: 1
    });
  });
});
