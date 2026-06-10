import type {
  Assignment,
  AssignmentReview,
  DemoState,
  Notification,
  Payment,
  PaymentMethod,
  ReadinessRequirement,
  ReadinessReview,
  RequirementProgress,
  Submission,
  ServiceEnrolmentStatus
} from "./model";
import {
  approvedServiceIdsFor,
  assignmentReviewDestination,
  latestSubmissionFor
} from "./selectors";

const now = "2026-06-10T09:00:00.000Z";

function requirements(
  items: Array<[string, string, string, boolean]>
): ReadinessRequirement[] {
  return items.map(([id, title, description, requiresEvidence], index) => ({
    id,
    title,
    description,
    requiresEvidence,
    order: index + 1
  }));
}

export function createDemoState(): DemoState {
  const socialRequirements = requirements([
    [
      "social-orientation",
      "Strategy basics",
      "Explain campaign goals and audience segmentation.",
      false
    ],
    [
      "social-sample",
      "Portfolio sample",
      "Upload a sample social calendar or campaign plan.",
      true
    ],
    [
      "social-feedback",
      "Tool readiness",
      "Confirm access to scheduling and reporting tools.",
      true
    ]
  ]);
  const contentRequirements = requirements([
    [
      "content-sample",
      "Writing sample",
      "Submit a short-form and long-form writing sample.",
      true
    ],
    [
      "content-editing",
      "Editing checklist",
      "Confirm use of the house editing checklist.",
      false
    ]
  ]);
  const virtualAssistanceRequirements = requirements([
    [
      "va-calendar",
      "Calendar coordination",
      "Complete the calendar coordination exercise.",
      false
    ],
    ["va-comms", "Client comms sample", "Upload a client update sample.", true]
  ]);
  const dataEntryRequirements = requirements([
    [
      "data-spreadsheet",
      "Spreadsheet accuracy",
      "Complete the spreadsheet accuracy exercise.",
      true
    ],
    ["data-confidentiality", "Confidentiality", "Accept the data handling guidelines.", false]
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

function makeId(prefix: string, count: number) {
  return `${prefix}-${count + 1}`;
}

function currentTimestamp() {
  return new Date().toISOString();
}

function adminUserId(state: DemoState) {
  return (
    state.users.find((user) => user.accountRole === "admin")?.id ??
    "user-admin"
  );
}

function professionalUserId(state: DemoState, professionalId?: string) {
  if (!professionalId) return undefined;
  return state.professionals.find((item) => item.id === professionalId)?.userId;
}

function notification(
  recipientUserId: string | undefined,
  title: string,
  message: string
): Notification[] {
  if (!recipientUserId) return [];
  return [
    {
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recipientUserId,
      title,
      message,
      createdAt: currentTimestamp(),
      read: false
    }
  ];
}

function updateEnrolmentStatus(
  state: DemoState,
  enrolmentId: string,
  status: ServiceEnrolmentStatus,
  extra: Partial<
    Pick<ServiceEnrolmentStatusFields, "leadCertifiedAt" | "adminApprovedAt">
  > = {}
): DemoState {
  const at = currentTimestamp();
  return {
    ...state,
    serviceEnrolments: state.serviceEnrolments.map((item) =>
      item.id === enrolmentId
        ? {
            ...item,
            ...extra,
            status,
            updatedAt: at
          }
        : item
    )
  };
}

interface ServiceEnrolmentStatusFields {
  leadCertifiedAt?: string;
  adminApprovedAt?: string;
}

export function setRequirementProgress(
  state: DemoState,
  enrolmentId: string,
  requirementId: string,
  input: Pick<
    RequirementProgress,
    "completed" | "evidenceLink" | "evidenceFileName"
  >
): DemoState {
  const enrolment = state.serviceEnrolments.find(
    (item) => item.id === enrolmentId
  );
  const service = state.services.find(
    (item) => item.id === enrolment?.serviceId
  );
  const requirement = service?.requirements.find(
    (item) => item.id === requirementId
  );

  if (!enrolment || !requirement) return state;
  if (
    input.completed &&
    requirement.requiresEvidence &&
    !input.evidenceLink?.trim() &&
    !input.evidenceFileName?.trim()
  ) {
    return state;
  }

  const at = currentTimestamp();
  return {
    ...state,
    serviceEnrolments: state.serviceEnrolments.map((item) =>
      item.id === enrolmentId
        ? {
            ...item,
            status: "in_progress",
            updatedAt: at,
            requirements: item.requirements.map((progress) =>
              progress.requirementId === requirementId
                ? {
                    ...progress,
                    ...input,
                    completedAt: input.completed ? at : undefined
                  }
                : progress
            )
          }
        : item
    )
  };
}

export function submitServiceEnrolment(
  state: DemoState,
  enrolmentId: string
): DemoState {
  const enrolment = state.serviceEnrolments.find(
    (item) => item.id === enrolmentId
  );
  const service = state.services.find(
    (item) => item.id === enrolment?.serviceId
  );
  if (!enrolment || !service) return state;

  const complete = service.requirements.every((requirement) => {
    const progress = enrolment.requirements.find(
      (item) => item.requirementId === requirement.id
    );
    return (
      progress?.completed &&
      (!requirement.requiresEvidence ||
        progress.evidenceLink ||
        progress.evidenceFileName)
    );
  });
  if (!complete) return state;

  const returnsToAdmin =
    enrolment.status === "changes_requested_by_admin" ||
    !enrolment.leadId ||
    enrolment.leadId === enrolment.professionalId;
  const next = updateEnrolmentStatus(
    state,
    enrolmentId,
    returnsToAdmin ? "waiting_for_admin" : "waiting_for_lead"
  );

  const reviewerUserId = returnsToAdmin
    ? adminUserId(state)
    : professionalUserId(state, enrolment.leadId);

  return {
    ...next,
    notifications: [
      ...notification(
        reviewerUserId,
        "Readiness review needed",
        `${service.name} readiness is ready for review.`
      ),
      ...next.notifications
    ]
  };
}

export interface ServiceEnrolmentReviewCommand {
  enrolmentId: string;
  reviewerUserId: string;
  reviewerType: "lead" | "admin";
  decision: "changes_requested" | "certified" | "approved";
  comment: string;
}

export function reviewServiceEnrolment(
  state: DemoState,
  command: ServiceEnrolmentReviewCommand
): DemoState {
  if (!command.comment.trim()) return state;
  const enrolment = state.serviceEnrolments.find(
    (item) => item.id === command.enrolmentId
  );
  if (!enrolment) return state;

  const reviewerProfessional = state.professionals.find(
    (item) => item.userId === command.reviewerUserId
  );
  if (reviewerProfessional?.id === enrolment.professionalId) return state;

  const at = currentTimestamp();
  let nextStatus: ServiceEnrolmentStatus | undefined;
  const extra: ServiceEnrolmentStatusFields = {};

  if (command.reviewerType === "lead") {
    if (
      enrolment.status !== "waiting_for_lead" ||
      reviewerProfessional?.id !== enrolment.leadId
    ) {
      return state;
    }
    if (command.decision === "changes_requested") {
      nextStatus = "changes_requested_by_lead";
    } else if (command.decision === "certified") {
      nextStatus = "waiting_for_admin";
      extra.leadCertifiedAt = at;
    } else {
      return state;
    }
  } else {
    const reviewer = state.users.find(
      (item) => item.id === command.reviewerUserId
    );
    if (
      reviewer?.accountRole !== "admin" ||
      enrolment.status !== "waiting_for_admin"
    ) {
      return state;
    }
    if (command.decision === "changes_requested") {
      nextStatus = "changes_requested_by_admin";
    } else if (command.decision === "approved") {
      nextStatus = "approved";
      extra.adminApprovedAt = at;
    } else {
      return state;
    }
  }

  const review: ReadinessReview = {
    id: makeId("readiness-review", state.readinessReviews.length),
    enrolmentId: enrolment.id,
    reviewerUserId: command.reviewerUserId,
    reviewerType: command.reviewerType,
    decision: command.decision,
    comment: command.comment.trim(),
    createdAt: at
  };

  const next = updateEnrolmentStatus(state, enrolment.id, nextStatus, extra);
  const professionalRecipient = professionalUserId(
    state,
    enrolment.professionalId
  );
  const adminRecipient = adminUserId(state);
  const notifications =
    command.reviewerType === "lead" && command.decision === "certified"
      ? notification(
          adminRecipient,
          "Readiness certified",
          "A Lead certified readiness for final Admin approval."
        )
      : notification(
          professionalRecipient,
          command.decision === "approved"
            ? "Readiness approved"
            : "Readiness changes requested",
          command.comment.trim()
        );

  return {
    ...next,
    readinessReviews: [review, ...next.readinessReviews],
    notifications: [...notifications, ...next.notifications],
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor:
          state.users.find((item) => item.id === command.reviewerUserId)
            ?.name ?? "Reviewer",
        action:
          command.decision === "changes_requested"
            ? "requested readiness changes"
            : command.decision === "certified"
              ? "certified readiness"
              : "approved readiness",
        subject: enrolment.id,
        createdAt: at
      },
      ...next.activity
    ]
  };
}

export function removeServiceEnrolment(
  state: DemoState,
  enrolmentId: string
): DemoState {
  const enrolment = state.serviceEnrolments.find(
    (item) => item.id === enrolmentId
  );
  if (!enrolment || enrolment.status === "approved") return state;

  const hasRelatedWork = state.assignments.some((assignment) => {
    if (assignment.professionalId !== enrolment.professionalId) return false;
    const job = state.jobs.find((item) => item.id === assignment.jobId);
    return job?.serviceId === enrolment.serviceId;
  });
  if (hasRelatedWork) return state;

  return {
    ...state,
    serviceEnrolments: state.serviceEnrolments.filter(
      (item) => item.id !== enrolmentId
    ),
    readinessReviews: state.readinessReviews.filter(
      (item) => item.enrolmentId !== enrolmentId
    )
  };
}

export function setServiceActive(
  state: DemoState,
  serviceId: string,
  active: boolean
): DemoState {
  const service = state.services.find((item) => item.id === serviceId);
  if (!service || service.active === active) return state;

  if (!active) {
    const hasBlockingJob = state.jobs.some(
      (job) =>
        job.serviceId === serviceId &&
        ["draft", "open"].includes(job.publicationState)
    );
    const hasBlockingEnrolment = state.serviceEnrolments.some(
      (enrolment) =>
        enrolment.serviceId === serviceId && enrolment.status !== "approved"
    );
    if (hasBlockingJob || hasBlockingEnrolment) return state;
  }

  return {
    ...state,
    services: state.services.map((item) =>
      item.id === serviceId
        ? { ...item, active, updatedAt: currentTimestamp() }
        : item
    )
  };
}

export interface NewAssignmentInput {
  professionalId: string;
  agreedPay: number;
  deadline: string;
  leadReviewerId?: string;
}

export function addAssignments(
  state: DemoState,
  jobId: string,
  inputs: NewAssignmentInput[]
): DemoState {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job || job.publicationState !== "open") return state;

  const createdAt = currentTimestamp();
  const existingProfessionalIds = new Set(
    state.assignments
      .filter((assignment) => assignment.jobId === jobId)
      .map((assignment) => assignment.professionalId)
  );

  const newAssignments = inputs.reduce<Assignment[]>((items, input) => {
    const professional = state.professionals.find(
      (item) => item.id === input.professionalId
    );
    if (
      !professional ||
      professional.accountStatus !== "active" ||
      existingProfessionalIds.has(professional.id) ||
      !approvedServiceIdsFor(state, professional.id).includes(job.serviceId) ||
      !Number.isFinite(input.agreedPay) ||
      input.agreedPay <= 0 ||
      !input.deadline.trim()
    ) {
      return items;
    }

    const leadReviewer = state.professionals.find(
      (item) => item.id === input.leadReviewerId
    );
    const leadReviewerId =
      leadReviewer?.isLead && leadReviewer.id !== professional.id
        ? leadReviewer.id
        : undefined;

    existingProfessionalIds.add(professional.id);
    items.push({
      id: `assignment-${jobId}-${professional.id}`,
      jobId,
      professionalId: professional.id,
      leadReviewerId,
      agreedPay: input.agreedPay,
      deadline: input.deadline || job.deadline,
      status: "assigned",
      createdAt
    });
    return items;
  }, []);

  if (newAssignments.length === 0) return state;

  return {
    ...state,
    assignments: [...state.assignments, ...newAssignments],
    notifications: [
      ...newAssignments.flatMap((assignment) =>
        notification(
          professionalUserId(state, assignment.professionalId),
          "New assignment",
          `${job.title} is ready to start.`
        )
      ),
      ...state.notifications
    ],
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor: "Admin",
        action: "assigned professionals to",
        subject: job.title,
        createdAt
      },
      ...state.activity
    ]
  };
}

export function startAssignment(
  state: DemoState,
  assignmentId: string
): DemoState {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment || assignment.status !== "assigned") return state;

  const at = currentTimestamp();
  return {
    ...state,
    assignments: state.assignments.map((item) =>
      item.id === assignmentId
        ? { ...item, status: "in_progress", startedAt: at }
        : item
    )
  };
}

export function submitAssignment(
  state: DemoState,
  assignmentId: string,
  input: Pick<Submission, "notes" | "link" | "fileName">
): DemoState {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  const job = state.jobs.find((item) => item.id === assignment?.jobId);
  if (!assignment || !job) return state;
  if (
    !["in_progress", "changes_requested_by_lead", "changes_requested_by_admin"].includes(
      assignment.status
    )
  ) {
    return state;
  }
  if (!input.notes.trim()) return state;
  if (
    job.submissionEvidenceRequired &&
    !input.link?.trim() &&
    !input.fileName?.trim()
  ) {
    return state;
  }

  const version =
    Math.max(
      0,
      ...state.submissions
        .filter((item) => item.assignmentId === assignmentId)
        .map((item) => item.version)
    ) + 1;
  const at = currentTimestamp();
  const submission: Submission = {
    id: `submission-${assignmentId}-${version}`,
    assignmentId,
    version,
    notes: input.notes.trim(),
    link: input.link?.trim() || undefined,
    fileName: input.fileName?.trim() || undefined,
    submittedAt: at
  };
  const destination = assignmentReviewDestination(state, assignmentId);
  const reviewerUserId =
    destination === "lead"
      ? professionalUserId(state, assignment.leadReviewerId)
      : adminUserId(state);

  return {
    ...state,
    assignments: state.assignments.map((item) =>
      item.id === assignmentId
        ? {
            ...item,
            status:
              destination === "lead" ? "waiting_for_lead" : "waiting_for_admin",
            submittedAt: at
          }
        : item
    ),
    submissions: [...state.submissions, submission],
    notifications: [
      ...notification(
        reviewerUserId,
        "Assignment submitted",
        `${job.title} is ready for review.`
      ),
      ...state.notifications
    ],
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor:
          state.professionals.find(
            (item) => item.id === assignment.professionalId
          )?.name ?? "Professional",
        action: "submitted",
        subject: job.title,
        createdAt: at
      },
      ...state.activity
    ]
  };
}

export interface AssignmentReviewCommand {
  assignmentId: string;
  reviewerUserId: string;
  reviewerType: "lead" | "admin";
  decision: "changes_requested" | "certified" | "approved";
  comment: string;
}

export function reviewAssignment(
  state: DemoState,
  command: AssignmentReviewCommand
): DemoState {
  if (!command.comment.trim()) return state;
  const assignment = state.assignments.find(
    (item) => item.id === command.assignmentId
  );
  const submission = latestSubmissionFor(state, command.assignmentId);
  if (!assignment || !submission) return state;

  const reviewerProfessional = state.professionals.find(
    (item) => item.userId === command.reviewerUserId
  );
  if (reviewerProfessional?.id === assignment.professionalId) return state;

  const at = currentTimestamp();
  let nextStatus: Assignment["status"] | undefined;
  const assignmentTimestamps: Partial<
    Pick<Assignment, "approvedAt">
  > = {};

  if (command.reviewerType === "lead") {
    if (
      assignment.status !== "waiting_for_lead" ||
      reviewerProfessional?.id !== assignment.leadReviewerId
    ) {
      return state;
    }
    if (command.decision === "changes_requested") {
      nextStatus = "changes_requested_by_lead";
    } else if (command.decision === "certified") {
      nextStatus = "waiting_for_admin";
    } else {
      return state;
    }
  } else {
    const reviewer = state.users.find(
      (item) => item.id === command.reviewerUserId
    );
    if (
      reviewer?.accountRole !== "admin" ||
      assignment.status !== "waiting_for_admin"
    ) {
      return state;
    }
    if (command.decision === "changes_requested") {
      nextStatus = "changes_requested_by_admin";
    } else if (command.decision === "approved") {
      nextStatus = "approved";
      assignmentTimestamps.approvedAt = at;
    } else {
      return state;
    }
  }

  const review: AssignmentReview = {
    id: makeId("assignment-review", state.assignmentReviews.length),
    assignmentId: assignment.id,
    submissionId: submission.id,
    reviewerUserId: command.reviewerUserId,
    reviewerType: command.reviewerType,
    decision: command.decision,
    comment: command.comment.trim(),
    createdAt: at
  };
  const job = state.jobs.find((item) => item.id === assignment.jobId);
  const assigneeRecipient = professionalUserId(
    state,
    assignment.professionalId
  );
  const adminRecipient = adminUserId(state);
  const notifications =
    command.reviewerType === "lead" && command.decision === "certified"
      ? notification(
          adminRecipient,
          "Assignment certified",
          `${job?.title ?? "An assignment"} is waiting for final approval.`
        )
      : notification(
          assigneeRecipient,
          command.decision === "changes_requested"
            ? "Assignment changes requested"
            : "Assignment approved",
          command.comment.trim()
        );

  return {
    ...state,
    assignments: state.assignments.map((item) =>
      item.id === assignment.id
        ? { ...item, ...assignmentTimestamps, status: nextStatus }
        : item
    ),
    assignmentReviews: [...state.assignmentReviews, review],
    notifications: [...notifications, ...state.notifications],
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor:
          state.users.find((item) => item.id === command.reviewerUserId)
            ?.name ?? "Reviewer",
        action:
          command.decision === "changes_requested"
            ? "requested assignment changes"
            : command.decision === "certified"
              ? "certified assignment"
              : "approved assignment",
        subject: job?.title ?? assignment.id,
        createdAt: at
      },
      ...state.activity
    ]
  };
}

export function completeAssignment(
  state: DemoState,
  assignmentId: string
): DemoState {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment || assignment.status !== "approved") return state;

  const existingPayment = state.payments.some(
    (item) => item.assignmentId === assignmentId
  );
  const at = currentTimestamp();
  const payment: Payment | undefined = existingPayment
    ? undefined
    : {
        id: `payment-${assignmentId}`,
        assignmentId,
        professionalId: assignment.professionalId,
        amount: assignment.agreedPay,
        dueDate: at,
        status: "due"
      };
  const job = state.jobs.find((item) => item.id === assignment.jobId);

  return {
    ...state,
    assignments: state.assignments.map((item) =>
      item.id === assignmentId
        ? { ...item, status: "completed", completedAt: at }
        : item
    ),
    professionals: state.professionals.map((item) =>
      item.id === assignment.professionalId
        ? {
            ...item,
            completedAssignmentCount: item.completedAssignmentCount + 1
          }
        : item
    ),
    payments: payment ? [...state.payments, payment] : state.payments,
    notifications: [
      ...notification(
        professionalUserId(state, assignment.professionalId),
        "Assignment completed",
        `${job?.title ?? "Your assignment"} has moved to payment.`
      ),
      ...state.notifications
    ],
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor: "Admin",
        action: "completed assignment",
        subject: job?.title ?? assignment.id,
        createdAt: at
      },
      ...state.activity
    ]
  };
}

export function cancelAssignment(
  state: DemoState,
  assignmentId: string,
  reason: string
): DemoState {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment || assignment.status === "completed" || !reason.trim()) {
    return state;
  }
  const at = currentTimestamp();
  const job = state.jobs.find((item) => item.id === assignment.jobId);

  return {
    ...state,
    assignments: state.assignments.map((item) =>
      item.id === assignmentId
        ? {
            ...item,
            status: "cancelled",
            completedAt: undefined,
            cancelledAt: at,
            cancellationReason: reason.trim()
          }
        : item
    ),
    notifications: [
      ...notification(
        professionalUserId(state, assignment.professionalId),
        "Assignment cancelled",
        reason.trim()
      ),
      ...state.notifications
    ],
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor: "Admin",
        action: "cancelled assignment",
        subject: `${job?.title ?? assignment.id}: ${reason.trim()}`,
        createdAt: at
      },
      ...state.activity
    ]
  };
}

export interface RecordPaymentInput {
  status: "scheduled" | "paid" | "issue";
  paymentDate?: string;
  method?: PaymentMethod;
  reference?: string;
  receiptFileName?: string;
  internalNote?: string;
  issueNote?: string;
}

function isValidPaidPayment(input: RecordPaymentInput) {
  return Boolean(
    input.paymentDate?.trim() &&
      input.method &&
      (input.method === "cash" || input.reference?.trim())
  );
}

export function recordPayment(
  state: DemoState,
  paymentId: string,
  input: RecordPaymentInput
): DemoState {
  const payment = state.payments.find((item) => item.id === paymentId);
  if (!payment || payment.status === "paid") return state;
  if (input.status === "paid" && !isValidPaidPayment(input)) return state;
  if (input.status === "issue" && !input.issueNote?.trim()) return state;

  const at = currentTimestamp();
  return {
    ...state,
    payments: state.payments.map((item) =>
      item.id === paymentId
        ? {
            ...item,
            status: input.status,
            paymentDate: input.paymentDate,
            method: input.method,
            reference: input.reference?.trim() || undefined,
            receiptFileName: input.receiptFileName?.trim() || undefined,
            internalNote: input.internalNote?.trim() || undefined,
            issueNote: input.issueNote?.trim() || undefined
          }
        : item
    ),
    notifications: [
      ...notification(
        professionalUserId(state, payment.professionalId),
        input.status === "paid" ? "Payment recorded" : "Payment updated",
        input.status === "issue"
          ? (input.issueNote?.trim() ?? "A payment issue was recorded.")
          : `Payment status is now ${input.status}.`
      ),
      ...state.notifications
    ],
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor: "Admin",
        action: "recorded payment",
        subject: payment.id,
        createdAt: at
      },
      ...state.activity
    ]
  };
}

export function correctPayment(
  state: DemoState,
  paymentId: string,
  input: Required<
    Pick<RecordPaymentInput, "paymentDate" | "method" | "internalNote">
  > &
    Pick<RecordPaymentInput, "reference" | "receiptFileName"> & {
      correctionNote: string;
    }
): DemoState {
  const payment = state.payments.find((item) => item.id === paymentId);
  if (!payment || payment.status !== "paid" || !input.correctionNote.trim()) {
    return state;
  }
  if (
    !input.paymentDate.trim() ||
    !input.method ||
    (input.method !== "cash" && !input.reference?.trim())
  ) {
    return state;
  }

  const at = currentTimestamp();
  return {
    ...state,
    payments: state.payments.map((item) =>
      item.id === paymentId
        ? {
            ...item,
            paymentDate: input.paymentDate,
            method: input.method,
            reference: input.reference?.trim() || undefined,
            receiptFileName: input.receiptFileName?.trim() || undefined,
            internalNote: input.internalNote.trim(),
            correctedAt: at,
            correctionNote: input.correctionNote.trim()
          }
        : item
    ),
    activity: [
      {
        id: makeId("activity", state.activity.length),
        actor: "Admin",
        action: "corrected payment",
        subject: payment.id,
        createdAt: at
      },
      ...state.activity
    ]
  };
}
