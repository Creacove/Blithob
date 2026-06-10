import type { DemoState, ReadinessRequirement } from "./model";

const now = "2026-06-10T09:00:00.000Z";

function requirements(
  serviceId: string,
  items: Array<[string, string, boolean]>
): ReadinessRequirement[] {
  return items.map(([title, description, requiresEvidence], index) => ({
    id: `${serviceId}-requirement-${index + 1}`,
    title,
    description,
    requiresEvidence,
    order: index + 1
  }));
}

export function createDemoState(): DemoState {
  const socialRequirements = requirements("service-social", [
    ["Strategy basics", "Explain campaign goals and audience segmentation.", false],
    ["Portfolio sample", "Upload a sample social calendar or campaign plan.", true],
    ["Tool readiness", "Confirm access to scheduling and reporting tools.", true]
  ]);
  const contentRequirements = requirements("service-content", [
    ["Writing sample", "Submit a short-form and long-form writing sample.", true],
    ["Editing checklist", "Confirm use of the house editing checklist.", false]
  ]);
  const virtualAssistanceRequirements = requirements("service-va", [
    ["Calendar coordination", "Complete the calendar coordination exercise.", false],
    ["Client comms sample", "Upload a client update sample.", true]
  ]);
  const dataEntryRequirements = requirements("service-data", [
    ["Spreadsheet accuracy", "Complete the spreadsheet accuracy exercise.", true],
    ["Confidentiality", "Accept the data handling guidelines.", false]
  ]);

  return {
    users: [
      {
        id: "user-admin",
        name: "Ayo Admin",
        email: "ayo@example.com",
        accountRole: "admin"
      },
      {
        id: "user-amara",
        name: "Amara Okafor",
        email: "amara@example.com",
        accountRole: "professional",
        professionalId: "professional-amara"
      },
      {
        id: "user-nneka",
        name: "Nneka Eze",
        email: "nneka@example.com",
        accountRole: "professional",
        professionalId: "professional-nneka"
      },
      {
        id: "user-david",
        name: "David Mensah",
        email: "david@example.com",
        accountRole: "professional",
        professionalId: "professional-david"
      },
      {
        id: "user-zainab",
        name: "Zainab Bello",
        email: "zainab@example.com",
        accountRole: "professional",
        professionalId: "professional-zainab"
      }
    ],
    professionals: [
      {
        id: "professional-amara",
        userId: "user-amara",
        name: "Amara Okafor",
        email: "amara@example.com",
        phone: "+234 800 000 1001",
        location: "Lagos",
        accountStatus: "active",
        isLead: false,
        joinedAt: "2026-01-08T10:00:00.000Z",
        adminNotes: "Strong social campaign delivery.",
        completedAssignmentCount: 7
      },
      {
        id: "professional-nneka",
        userId: "user-nneka",
        name: "Nneka Eze",
        email: "nneka@example.com",
        phone: "+234 800 000 1002",
        location: "Abuja",
        accountStatus: "active",
        isLead: true,
        joinedAt: "2025-11-14T10:00:00.000Z",
        adminNotes: "Lead reviewer for social media readiness.",
        completedAssignmentCount: 12
      },
      {
        id: "professional-david",
        userId: "user-david",
        name: "David Mensah",
        email: "david@example.com",
        phone: "+233 240 000 1003",
        location: "Accra",
        accountStatus: "active",
        isLead: false,
        joinedAt: "2026-02-01T10:00:00.000Z",
        adminNotes: "Reliable delivery on structured campaigns.",
        completedAssignmentCount: 4
      },
      {
        id: "professional-zainab",
        userId: "user-zainab",
        name: "Zainab Bello",
        email: "zainab@example.com",
        phone: "+234 800 000 1004",
        location: "Kano",
        accountStatus: "active",
        isLead: false,
        joinedAt: "2026-04-12T10:00:00.000Z",
        adminNotes: "Completing readiness for social media work.",
        completedAssignmentCount: 0
      }
    ],
    services: [
      {
        id: "service-social",
        name: "Social Media Management",
        shortName: "Social",
        description: "Plan, publish, and report on social media campaigns.",
        active: true,
        requirements: socialRequirements,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "service-content",
        name: "Content Writing",
        shortName: "Content",
        description: "Write and edit marketing content for client campaigns.",
        active: true,
        requirements: contentRequirements,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "service-va",
        name: "Virtual Assistance",
        shortName: "VA",
        description: "Provide remote administrative support.",
        active: true,
        requirements: virtualAssistanceRequirements,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "service-data",
        name: "Data Entry",
        shortName: "Data",
        description: "Clean and enter structured client data.",
        active: true,
        requirements: dataEntryRequirements,
        createdAt: now,
        updatedAt: now
      }
    ],
    serviceEnrolments: [
      {
        id: "enrolment-amara-social-approved",
        professionalId: "professional-amara",
        serviceId: "service-social",
        leadId: "professional-nneka",
        status: "approved",
        requirements: socialRequirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: true,
          evidenceLink: requirement.requiresEvidence
            ? "https://example.com/amara/social-evidence"
            : undefined,
          evidenceFileName: requirement.requiresEvidence
            ? `${requirement.id}.pdf`
            : undefined,
          completedAt: "2026-02-20T12:00:00.000Z"
        })),
        leadCertifiedAt: "2026-02-21T12:00:00.000Z",
        adminApprovedAt: "2026-02-22T12:00:00.000Z",
        createdAt: "2026-02-01T12:00:00.000Z",
        updatedAt: "2026-02-22T12:00:00.000Z"
      },
      {
        id: "enrolment-nneka-social-approved",
        professionalId: "professional-nneka",
        serviceId: "service-social",
        status: "approved",
        requirements: socialRequirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: true,
          evidenceLink: requirement.requiresEvidence
            ? "https://example.com/nneka/social-evidence"
            : undefined,
          evidenceFileName: requirement.requiresEvidence
            ? `${requirement.id}.pdf`
            : undefined,
          completedAt: "2026-01-15T12:00:00.000Z"
        })),
        leadCertifiedAt: "2026-01-16T12:00:00.000Z",
        adminApprovedAt: "2026-01-17T12:00:00.000Z",
        createdAt: "2026-01-05T12:00:00.000Z",
        updatedAt: "2026-01-17T12:00:00.000Z"
      },
      {
        id: "enrolment-david-social-approved",
        professionalId: "professional-david",
        serviceId: "service-social",
        leadId: "professional-nneka",
        status: "approved",
        requirements: socialRequirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: true,
          evidenceLink: requirement.requiresEvidence
            ? "https://example.com/david/social-evidence"
            : undefined,
          evidenceFileName: requirement.requiresEvidence
            ? `${requirement.id}.pdf`
            : undefined,
          completedAt: "2026-03-10T12:00:00.000Z"
        })),
        leadCertifiedAt: "2026-03-11T12:00:00.000Z",
        adminApprovedAt: "2026-03-12T12:00:00.000Z",
        createdAt: "2026-03-01T12:00:00.000Z",
        updatedAt: "2026-03-12T12:00:00.000Z"
      },
      {
        id: "enrolment-zainab-social",
        professionalId: "professional-zainab",
        serviceId: "service-social",
        leadId: "professional-nneka",
        status: "in_progress",
        requirements: socialRequirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: true,
          evidenceLink: requirement.requiresEvidence
            ? "https://example.com/zainab/social-evidence"
            : undefined,
          evidenceFileName: requirement.requiresEvidence
            ? `${requirement.id}.pdf`
            : undefined,
          completedAt: "2026-06-08T12:00:00.000Z"
        })),
        createdAt: "2026-05-30T12:00:00.000Z",
        updatedAt: "2026-06-08T12:00:00.000Z"
      },
      {
        id: "enrolment-zainab-waiting-admin",
        professionalId: "professional-zainab",
        serviceId: "service-content",
        leadId: "professional-nneka",
        status: "waiting_for_admin",
        requirements: contentRequirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: true,
          evidenceLink: requirement.requiresEvidence
            ? "https://example.com/zainab/content-evidence"
            : undefined,
          evidenceFileName: requirement.requiresEvidence
            ? `${requirement.id}.pdf`
            : undefined,
          completedAt: "2026-06-07T12:00:00.000Z"
        })),
        leadCertifiedAt: "2026-06-08T12:00:00.000Z",
        createdAt: "2026-05-28T12:00:00.000Z",
        updatedAt: "2026-06-08T12:00:00.000Z"
      },
      {
        id: "enrolment-nneka-data",
        professionalId: "professional-nneka",
        serviceId: "service-data",
        leadId: "professional-nneka",
        status: "waiting_for_lead",
        requirements: dataEntryRequirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: true,
          evidenceLink: requirement.requiresEvidence
            ? "https://example.com/nneka/data-evidence"
            : undefined,
          evidenceFileName: requirement.requiresEvidence
            ? `${requirement.id}.pdf`
            : undefined,
          completedAt: "2026-06-06T12:00:00.000Z"
        })),
        createdAt: "2026-05-25T12:00:00.000Z",
        updatedAt: "2026-06-06T12:00:00.000Z"
      }
    ],
    readinessReviews: [
      {
        id: "review-amara-social-lead",
        enrolmentId: "enrolment-amara-social-approved",
        reviewerUserId: "user-nneka",
        reviewerType: "lead",
        decision: "certified",
        comment: "Ready for client work.",
        createdAt: "2026-02-21T12:00:00.000Z"
      },
      {
        id: "review-amara-social-admin",
        enrolmentId: "enrolment-amara-social-approved",
        reviewerUserId: "user-admin",
        reviewerType: "admin",
        decision: "approved",
        comment: "Approved for social media jobs.",
        createdAt: "2026-02-22T12:00:00.000Z"
      }
    ],
    jobs: [
      {
        id: "job-open-social",
        title: "Launch Social Media Calendar",
        serviceId: "service-social",
        clientContext: "A retail brand needs a 30-day launch calendar.",
        objective: "Produce a ready-to-schedule campaign plan.",
        description: "Create campaign copy and publishing guidance.",
        steps: [
          "Review client brief and audience notes.",
          "Draft campaign pillars.",
          "Prepare post calendar and captions."
        ],
        deliverables: ["Campaign calendar", "Caption bank", "Hashtag notes"],
        acceptanceCriteria: [
          "Calendar covers 30 days.",
          "Every post includes a channel and publishing goal.",
          "Evidence is submitted with the final work."
        ],
        references: [
          {
            id: "job-open-social-reference-brief",
            label: "Client brief",
            kind: "link",
            url: "https://example.com/brief"
          }
        ],
        submissionEvidenceRequired: true,
        deadline: "2026-06-30T17:00:00.000Z",
        publicationState: "open",
        createdAt: "2026-06-01T09:00:00.000Z",
        updatedAt: "2026-06-01T09:00:00.000Z"
      },
      {
        id: "job-campaign",
        title: "Campaign Refresh",
        serviceId: "service-social",
        clientContext: "A client needs current campaigns refreshed.",
        objective: "Update campaign assets for the next cycle.",
        description: "Refresh copy, publishing notes, and performance summaries.",
        steps: [
          "Audit existing campaign assets.",
          "Revise weak captions.",
          "Prepare update notes for the client."
        ],
        deliverables: ["Updated captions", "Publishing notes"],
        acceptanceCriteria: [
          "All revised captions are linked to campaign goals.",
          "Updates are ready for admin review."
        ],
        references: [],
        submissionEvidenceRequired: true,
        deadline: "2026-06-24T17:00:00.000Z",
        publicationState: "open",
        createdAt: "2026-06-02T09:00:00.000Z",
        updatedAt: "2026-06-02T09:00:00.000Z"
      },
      {
        id: "job-newsletter",
        title: "Lead Newsletter Draft",
        serviceId: "service-content",
        clientContext: "Internal newsletter support.",
        objective: "Draft a newsletter issue.",
        description: "Prepare a concise newsletter for review.",
        steps: ["Outline sections.", "Draft copy.", "Submit for admin review."],
        deliverables: ["Newsletter draft"],
        acceptanceCriteria: ["Draft is clear and ready for review."],
        references: [],
        submissionEvidenceRequired: false,
        deadline: "2026-06-28T17:00:00.000Z",
        publicationState: "open",
        createdAt: "2026-06-03T09:00:00.000Z",
        updatedAt: "2026-06-03T09:00:00.000Z"
      }
    ],
    assignments: [
      {
        id: "assignment-amara-campaign",
        jobId: "job-campaign",
        professionalId: "professional-amara",
        leadReviewerId: "professional-nneka",
        agreedPay: 120000,
        deadline: "2026-06-24T17:00:00.000Z",
        status: "in_progress",
        startedAt: "2026-06-04T09:00:00.000Z",
        createdAt: "2026-06-04T09:00:00.000Z"
      },
      {
        id: "assignment-david-campaign",
        jobId: "job-campaign",
        professionalId: "professional-david",
        agreedPay: 95000,
        deadline: "2026-06-24T17:00:00.000Z",
        status: "in_progress",
        startedAt: "2026-06-04T10:00:00.000Z",
        createdAt: "2026-06-04T10:00:00.000Z"
      },
      {
        id: "assignment-amara-revision",
        jobId: "job-campaign",
        professionalId: "professional-amara",
        leadReviewerId: "professional-nneka",
        agreedPay: 45000,
        deadline: "2026-06-20T17:00:00.000Z",
        status: "in_progress",
        startedAt: "2026-06-05T09:00:00.000Z",
        createdAt: "2026-06-05T09:00:00.000Z"
      },
      {
        id: "assignment-waiting-lead",
        jobId: "job-campaign",
        professionalId: "professional-david",
        leadReviewerId: "professional-nneka",
        agreedPay: 60000,
        deadline: "2026-06-21T17:00:00.000Z",
        status: "waiting_for_lead",
        startedAt: "2026-06-06T09:00:00.000Z",
        submittedAt: "2026-06-09T09:00:00.000Z",
        createdAt: "2026-06-06T09:00:00.000Z"
      },
      {
        id: "assignment-approved",
        jobId: "job-campaign",
        professionalId: "professional-david",
        leadReviewerId: "professional-nneka",
        agreedPay: 70000,
        deadline: "2026-06-18T17:00:00.000Z",
        status: "approved",
        startedAt: "2026-06-05T11:00:00.000Z",
        submittedAt: "2026-06-07T11:00:00.000Z",
        approvedAt: "2026-06-08T11:00:00.000Z",
        createdAt: "2026-06-05T11:00:00.000Z"
      },
      {
        id: "assignment-nneka-newsletter",
        jobId: "job-newsletter",
        professionalId: "professional-nneka",
        agreedPay: 80000,
        deadline: "2026-06-28T17:00:00.000Z",
        status: "in_progress",
        startedAt: "2026-06-07T09:00:00.000Z",
        createdAt: "2026-06-07T09:00:00.000Z"
      },
      {
        id: "assignment-payment-cash",
        jobId: "job-campaign",
        professionalId: "professional-david",
        agreedPay: 70000,
        deadline: "2026-06-15T17:00:00.000Z",
        status: "completed",
        startedAt: "2026-06-06T09:00:00.000Z",
        submittedAt: "2026-06-09T09:00:00.000Z",
        approvedAt: "2026-06-10T09:00:00.000Z",
        completedAt: "2026-06-10T10:00:00.000Z",
        createdAt: "2026-06-06T09:00:00.000Z"
      },
      {
        id: "assignment-payment-transfer",
        jobId: "job-campaign",
        professionalId: "professional-david",
        agreedPay: 60000,
        deadline: "2026-06-20T17:00:00.000Z",
        status: "completed",
        startedAt: "2026-06-06T09:30:00.000Z",
        submittedAt: "2026-06-09T09:30:00.000Z",
        approvedAt: "2026-06-10T09:30:00.000Z",
        completedAt: "2026-06-10T10:30:00.000Z",
        createdAt: "2026-06-06T09:30:00.000Z"
      },
      {
        id: "assignment-paid-amara",
        jobId: "job-campaign",
        professionalId: "professional-amara",
        leadReviewerId: "professional-nneka",
        agreedPay: 120000,
        deadline: "2026-06-12T17:00:00.000Z",
        status: "completed",
        startedAt: "2026-06-04T09:00:00.000Z",
        submittedAt: "2026-06-10T10:00:00.000Z",
        approvedAt: "2026-06-11T10:00:00.000Z",
        completedAt: "2026-06-12T10:00:00.000Z",
        createdAt: "2026-06-04T09:00:00.000Z"
      }
    ],
    submissions: [
      {
        id: "submission-waiting-lead-current",
        assignmentId: "assignment-waiting-lead",
        version: 1,
        notes: "Draft campaign refresh is ready for lead review.",
        link: "https://example.com/submissions/waiting-lead",
        fileName: "campaign-refresh-v1.pdf",
        submittedAt: "2026-06-09T09:00:00.000Z"
      },
      {
        id: "submission-approved-current",
        assignmentId: "assignment-approved",
        version: 1,
        notes: "Approved campaign assets.",
        fileName: "approved-assets.pdf",
        submittedAt: "2026-06-07T11:00:00.000Z"
      }
    ],
    assignmentReviews: [
      {
        id: "assignment-review-approved",
        assignmentId: "assignment-approved",
        submissionId: "submission-approved-current",
        reviewerUserId: "user-ayo",
        reviewerType: "admin",
        decision: "approved",
        comment: "Ready for payment.",
        createdAt: "2026-06-08T11:00:00.000Z"
      }
    ],
    payments: [
      {
        id: "payment-due-cash",
        assignmentId: "assignment-payment-cash",
        professionalId: "professional-david",
        amount: 70000,
        dueDate: "2026-06-15T17:00:00.000Z",
        status: "due",
        method: "cash"
      },
      {
        id: "payment-due-transfer",
        assignmentId: "assignment-payment-transfer",
        professionalId: "professional-david",
        amount: 60000,
        dueDate: "2026-06-20T17:00:00.000Z",
        status: "due",
        method: "bank_transfer"
      },
      {
        id: "payment-paid-amara",
        assignmentId: "assignment-paid-amara",
        professionalId: "professional-amara",
        amount: 120000,
        dueDate: "2026-06-12T17:00:00.000Z",
        status: "paid",
        paymentDate: "2026-06-12T15:00:00.000Z",
        method: "bank_transfer",
        reference: "BNK-2026-0001",
        receiptFileName: "amara-payment-receipt.pdf"
      }
    ],
    notifications: [
      {
        id: "notification-zainab-waiting-admin",
        recipientUserId: "user-admin",
        title: "Readiness waiting for admin",
        message: "Zainab's content readiness is certified by lead review.",
        createdAt: "2026-06-08T12:10:00.000Z",
        read: false
      }
    ],
    activity: [
      {
        id: "activity-amara-approved",
        actor: "Ayo Admin",
        action: "approved",
        subject: "Amara's social media readiness",
        createdAt: "2026-02-22T12:00:00.000Z"
      }
    ]
  };
}
