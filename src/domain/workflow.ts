import type {
  ActivityEvent,
  DemoState,
  Notification,
  Opportunity,
  OpportunityStatus,
  Payout,
  Review,
  Submission,
  WorkerMatch
} from "./types";

const timestamp = "2026-06-09T16:00:00.000Z";

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const activity = (
  actor: string,
  action: string,
  subject: string
): ActivityEvent => ({
  id: makeId("activity"),
  actor,
  action,
  subject,
  createdAt: new Date().toISOString()
});

const notification = (
  recipientRole: Notification["recipientRole"],
  title: string,
  message: string,
  recipientId?: string
): Notification => ({
  id: makeId("notification"),
  recipientRole,
  recipientId,
  title,
  message,
  createdAt: new Date().toISOString(),
  read: false,
  channel: "email_simulation"
});

export function createDemoState(): DemoState {
  return {
    users: [
      {
        id: "user-admin",
        name: "Ayo Blithob",
        email: "admin@blithobprofessionals.com",
        role: "admin"
      },
      {
        id: "user-trainer",
        name: "Nneka Okafor",
        email: "nneka@blithobprofessionals.com",
        role: "trainer",
        workerId: "worker-nneka"
      },
      {
        id: "user-amara",
        name: "Amara Okoye",
        email: "amara@example.com",
        role: "worker",
        workerId: "worker-amara"
      },
      {
        id: "user-zainab",
        name: "Zainab Bello",
        email: "zainab@example.com",
        role: "worker",
        workerId: "worker-zainab"
      }
    ],
    services: [
      {
        id: "service-social",
        name: "Social media management",
        shortName: "Social media",
        description: "Planning, publishing, community support, and reporting.",
        active: true
      },
      {
        id: "service-content",
        name: "Content creation",
        shortName: "Content",
        description: "Clear, audience-ready written and visual content.",
        active: true
      },
      {
        id: "service-va",
        name: "Virtual assistance",
        shortName: "Virtual assistance",
        description: "Reliable operational and administrative support.",
        active: true
      },
      {
        id: "service-data",
        name: "Data entry",
        shortName: "Data entry",
        description: "Accurate structured data processing and cleanup.",
        active: true
      }
    ],
    trainingTracks: [
      {
        id: "track-social",
        serviceId: "service-social",
        title: "Social media readiness",
        tasks: [
          {
            id: "social-orientation",
            title: "Complete service orientation",
            description: "Review the delivery standards and communication rhythm.",
            requiresEvidence: false
          },
          {
            id: "social-sample",
            title: "Build a sample content week",
            description: "Prepare seven posts for a fictional UK business.",
            requiresEvidence: true
          },
          {
            id: "social-feedback",
            title: "Apply trainer feedback",
            description: "Revise the sample and submit the final version.",
            requiresEvidence: true
          }
        ]
      },
      {
        id: "track-va",
        serviceId: "service-va",
        title: "Virtual assistance readiness",
        tasks: [
          {
            id: "va-orientation",
            title: "Complete client support orientation",
            description: "Review privacy, tone, and escalation expectations.",
            requiresEvidence: false
          },
          {
            id: "va-sample",
            title: "Organise a sample inbox",
            description: "Categorise and respond to a simulated client inbox.",
            requiresEvidence: true
          }
        ]
      }
    ],
    workers: [
      {
        id: "worker-amara",
        userId: "user-amara",
        name: "Amara Okoye",
        email: "amara@example.com",
        phone: "+234 806 145 2281",
        location: "Lagos, Nigeria",
        status: "active",
        approvedServiceIds: ["service-social", "service-content"],
        training: [
          {
            trackId: "track-social",
            completedTaskIds: [
              "social-orientation",
              "social-sample",
              "social-feedback"
            ],
            status: "approved"
          },
          {
            trackId: "track-va",
            completedTaskIds: ["va-orientation"],
            status: "in_progress"
          }
        ],
        completedCount: 8,
        notes: "Strong editorial judgment. Best suited to consumer brands.",
        joinedAt: "2026-02-12",
        isLead: false,
        trainingLeadId: "worker-nneka"
      },
      {
        id: "worker-david",
        userId: "user-david",
        name: "David Mensah",
        email: "david@example.com",
        phone: "+233 24 555 0188",
        location: "Accra, Ghana",
        status: "ready",
        approvedServiceIds: ["service-social", "service-va"],
        training: [
          {
            trackId: "track-social",
            completedTaskIds: [
              "social-orientation",
              "social-sample",
              "social-feedback"
            ],
            status: "approved"
          }
        ],
        completedCount: 5,
        notes: "Reliable and highly responsive during UK business hours.",
        joinedAt: "2026-03-04",
        isLead: false
      },
      {
        id: "worker-zainab",
        userId: "user-zainab",
        name: "Zainab Bello",
        email: "zainab@example.com",
        phone: "+234 803 912 4410",
        location: "Abuja, Nigeria",
        status: "training",
        approvedServiceIds: [],
        training: [
          {
            trackId: "track-social",
            completedTaskIds: [
              "social-orientation",
              "social-sample",
              "social-feedback"
            ],
            status: "awaiting_review",
            evidenceNote: "Final sample calendar submitted for trainer review."
          }
        ],
        completedCount: 0,
        notes: "Promising copywriter; awaiting final readiness review.",
        joinedAt: "2026-05-18",
        isLead: false,
        trainingLeadId: "worker-nneka"
      },
      {
        id: "worker-nneka",
        userId: "user-trainer",
        name: "Nneka Okafor",
        email: "nneka@blithobprofessionals.com",
        phone: "+234 802 100 1180",
        location: "Port Harcourt, Nigeria",
        status: "active",
        approvedServiceIds: ["service-content", "service-va", "service-social"],
        training: [],
        completedCount: 19,
        notes: "Lead professional and quality reviewer.",
        joinedAt: "2025-11-02",
        isLead: true
      }
    ],
    opportunities: [
      {
        id: "opp-open-1",
        title: "June social content support",
        serviceId: "service-social",
        description:
          "Support a London wellness brand with its June content plan. The client publishes across Instagram and LinkedIn and needs consistent, on-brand copy and scheduling.",
        steps:
          "1. Review the brand guide and existing content archive shared in the brief folder\n2. Draft the four-week content calendar with post types and themes\n3. Write captions for all planned posts (aim for 200–250 characters)\n4. Add weekly performance notes template to the handover doc",
        acceptanceCriteria: [
          "Four-week calendar covers all 28 days",
          "Each post has a draft caption ready",
          "Captions match the brand voice guidelines",
          "Weekly performance notes template is included",
          "All files are named using the agreed convention"
        ],
        expectedOutput:
          "A four-week calendar, captions, and weekly performance notes.",
        deadline: "2026-06-24",
        payAmount: 185000,
        readinessLevel: "approved",
        status: "open",
        assignedWorkerIds: [],
        leadId: "worker-nneka",
        createdAt: "2026-06-08"
      },
      {
        id: "opp-active-1",
        title: "Founder launch campaign",
        serviceId: "service-social",
        description:
          "Prepare a launch campaign for a UK leadership coach who is going public with their brand. This is a high-visibility piece of work.",
        steps:
          "1. Read the client questionnaire and positioning document\n2. Develop the channel plan (which platforms, what frequency)\n3. Write all ten posts with headline + body copy\n4. Build the publishing calendar in the provided spreadsheet",
        acceptanceCriteria: [
          "Ten posts written with headline and body copy",
          "Channel plan covers at least two platforms",
          "Publishing calendar is filled in with dates and times",
          "Tone is consistent with the client's voice samples"
        ],
        expectedOutput: "Ten posts, channel plan, and publishing calendar.",
        deadline: "2026-06-14",
        payAmount: 145000,
        readinessLevel: "approved",
        status: "in_progress",
        assignedWorkerIds: ["worker-amara"],
        assignedWorkerId: "worker-amara",
        leadId: "worker-nneka",
        createdAt: "2026-06-01"
      },
      {
        id: "opp-review-1",
        title: "Quarterly newsletter pack",
        serviceId: "service-content",
        description:
          "Write and structure a three-email client newsletter sequence for a B2B consultancy. The emails should feel warm and authoritative.",
        steps:
          "1. Review the client's previous newsletters to match the tone\n2. Draft email one: company update and thought leadership\n3. Draft email two: case study spotlight\n4. Draft email three: upcoming event or offer\n5. For each email, write three subject-line options",
        acceptanceCriteria: [
          "Three complete email drafts delivered",
          "Each email has three subject-line options",
          "Word count is between 300 and 500 words per email",
          "Tone matches the existing newsletter samples"
        ],
        expectedOutput: "Three edited emails with subject-line options.",
        deadline: "2026-06-11",
        payAmount: 120000,
        readinessLevel: "approved",
        status: "submitted",
        assignedWorkerIds: ["worker-nneka"],
        assignedWorkerId: "worker-nneka",
        createdAt: "2026-05-28"
      },
      {
        id: "opp-accepted-1",
        title: "Customer inbox reset",
        serviceId: "service-va",
        description:
          "Clean and categorise a client support inbox that has become unmanageable over four months of backlog.",
        steps:
          "1. Apply the agreed email labels and filters\n2. Archive emails older than 90 days using the provided criteria\n3. Draft response templates for the top five query types\n4. Write a short handover note explaining the new system",
        acceptanceCriteria: [
          "All emails labelled and categorised",
          "Backlog emails archived",
          "At least five response templates written",
          "Handover note included in the submission"
        ],
        expectedOutput: "Inbox rules, tagged backlog, and response templates.",
        deadline: "2026-06-10",
        payAmount: 98000,
        readinessLevel: "approved",
        status: "accepted",
        assignedWorkerIds: ["worker-david"],
        assignedWorkerId: "worker-david",
        createdAt: "2026-05-25"
      },
      {
        id: "opp-completed-1",
        title: "April content audit",
        serviceId: "service-content",
        description:
          "Review and improve a consultancy content library that has grown without a clear strategy.",
        steps:
          "1. Audit all existing articles and categorise by topic and quality\n2. Flag any outdated or duplicate pieces\n3. Write a priority list for content updates\n4. Provide a brief recommendation for the content strategy going forward",
        acceptanceCriteria: [
          "All content pieces reviewed and tagged",
          "Outdated pieces flagged with reason",
          "Priority list ordered by impact",
          "Strategy recommendation is one page or less"
        ],
        expectedOutput: "Audit report and updated content priorities.",
        deadline: "2026-05-12",
        payAmount: 130000,
        readinessLevel: "approved",
        status: "completed",
        assignedWorkerIds: ["worker-amara"],
        assignedWorkerId: "worker-amara",
        createdAt: "2026-04-20"
      }
    ],
    assignments: [
      {
        id: "assignment-active",
        opportunityId: "opp-active-1",
        workerId: "worker-amara",
        assignedAt: "2026-06-02"
      },
      {
        id: "assignment-review",
        opportunityId: "opp-review-1",
        workerId: "worker-nneka",
        assignedAt: "2026-05-29"
      },
      {
        id: "assignment-accepted",
        opportunityId: "opp-accepted-1",
        workerId: "worker-david",
        assignedAt: "2026-05-26"
      }
    ],
    submissions: [
      {
        id: "submission-review-1",
        opportunityId: "opp-review-1",
        workerId: "worker-nneka",
        notes: "All three emails are ready with alternative subject lines.",
        link: "https://example.com/newsletter-pack",
        fileName: "newsletter-pack.docx",
        submittedAt: "2026-06-09T09:45:00.000Z"
      }
    ],
    reviews: [],
    payouts: [
      {
        id: "payout-completed-1",
        opportunityId: "opp-completed-1",
        workerId: "worker-amara",
        amount: 130000,
        dueDate: "2026-05-19",
        status: "paid",
        paidAt: "2026-05-17",
        reference: "TRF-0526-1048",
        paymentMethod: "Bank transfer"
      }
    ],
    notifications: [
      {
        id: "notification-review",
        recipientRole: "trainer",
        recipientId: "worker-nneka",
        title: "Submission ready for review",
        message: "Quarterly newsletter pack was submitted by Nneka Okafor.",
        createdAt: "2026-06-09T09:45:00.000Z",
        read: false,
        channel: "email_simulation"
      },
      {
        id: "notification-training",
        recipientRole: "trainer",
        recipientId: "worker-nneka",
        title: "Training review needed",
        message: "Zainab Bello has completed all tasks for Social media readiness.",
        createdAt: "2026-06-08T14:20:00.000Z",
        read: false,
        channel: "in_app"
      },
      {
        id: "notification-deadline",
        recipientRole: "worker",
        recipientId: "worker-amara",
        title: "Deadline in five days",
        message: "Founder launch campaign is due on 14 June.",
        createdAt: "2026-06-09T08:00:00.000Z",
        read: false,
        channel: "in_app"
      }
    ],
    activity: [
      {
        id: "activity-submission",
        actor: "Nneka Okafor",
        action: "submitted work for",
        subject: "Quarterly newsletter pack",
        createdAt: "2026-06-09T09:45:00.000Z"
      },
      {
        id: "activity-training",
        actor: "Zainab Bello",
        action: "completed training for",
        subject: "Social media readiness",
        createdAt: "2026-06-08T14:20:00.000Z"
      },
      {
        id: "activity-job",
        actor: "Ayo Blithob",
        action: "created",
        subject: "June social content support",
        createdAt: timestamp
      }
    ]
  };
}

export function rankEligibleWorkers(
  state: DemoState,
  opportunityId: string
): WorkerMatch[] {
  const opportunity = state.opportunities.find((job) => job.id === opportunityId);
  if (!opportunity) return [];

  return state.workers
    .filter((worker) => worker.approvedServiceIds.includes(opportunity.serviceId))
    .map((worker) => {
      const workload = state.opportunities.filter(
        (job) =>
          job.assignedWorkerIds.includes(worker.id) &&
          job.status !== "completed"
      ).length;
      const service = state.services.find(
        (item) => item.id === opportunity.serviceId
      );
      return {
        worker,
        workload,
        score: 100 - workload * 20 + worker.completedCount,
        reasons: [
          `Approved for ${service?.name ?? "this service"}`,
          `${workload} active assignment${workload === 1 ? "" : "s"}`,
          `${worker.completedCount} completed job${worker.completedCount === 1 ? "" : "s"}`
        ]
      };
    })
    .sort(
      (left, right) =>
        left.workload - right.workload ||
        right.worker.completedCount - left.worker.completedCount
    );
}

export function approveTraining(
  state: DemoState,
  workerId: string,
  trackId: string
): DemoState {
  const track = state.trainingTracks.find((item) => item.id === trackId);
  const worker = state.workers.find((item) => item.id === workerId);
  if (!track || !worker) return state;

  const progress = worker.training.find((item) => item.trackId === trackId);
  const allComplete = track.tasks.every((task) =>
    progress?.completedTaskIds.includes(task.id)
  );
  if (!allComplete) return state;

  const service = state.services.find((item) => item.id === track.serviceId);
  return {
    ...state,
    workers: state.workers.map((item) =>
      item.id === workerId
        ? {
            ...item,
            status: "ready",
            approvedServiceIds: Array.from(
              new Set([...item.approvedServiceIds, track.serviceId])
            ),
            training: item.training.map((training) =>
              training.trackId === trackId
                ? { ...training, status: "approved" }
                : training
            )
          }
        : item
    ),
    notifications: [
      notification(
        "worker",
        "You are ready for work",
        `${service?.name ?? "Service"} readiness has been approved.`,
        workerId
      ),
      ...state.notifications
    ],
    activity: [
      activity("Admin", "approved readiness for", worker.name),
      ...state.activity
    ]
  };
}

/**
 * Lead approves a worker's training track — moves status to lead_approved
 * and notifies admin for final sign-off.
 */
export function leadApproveTraining(
  state: DemoState,
  workerId: string,
  trackId: string,
  leadName: string
): DemoState {
  const track = state.trainingTracks.find((item) => item.id === trackId);
  const worker = state.workers.find((item) => item.id === workerId);
  if (!track || !worker) return state;

  const progress = worker.training.find((item) => item.trackId === trackId);
  if (!progress || progress.status !== "awaiting_review") return state;

  const service = state.services.find((item) => item.id === track.serviceId);

  return {
    ...state,
    workers: state.workers.map((item) =>
      item.id === workerId
        ? {
            ...item,
            training: item.training.map((t) =>
              t.trackId === trackId ? { ...t, status: "lead_approved" } : t
            )
          }
        : item
    ),
    notifications: [
      notification(
        "admin",
        "Training certified — final sign-off needed",
        `${leadName} has certified ${worker.name} for ${service?.name ?? "this service"}. Please complete the final approval.`
      ),
      ...state.notifications
    ],
    activity: [
      activity(leadName, "certified training for", worker.name),
      ...state.activity
    ]
  };
}

export function submitOpportunity(
  state: DemoState,
  opportunityId: string,
  input: Omit<Submission, "id" | "opportunityId" | "submittedAt">
): DemoState {
  const opportunity = state.opportunities.find(
    (item) => item.id === opportunityId
  );
  if (
    !opportunity ||
    !opportunity.assignedWorkerIds.includes(input.workerId)
  ) {
    return state;
  }

  const worker = state.workers.find((item) => item.id === input.workerId);
  const submission: Submission = {
    ...input,
    id: makeId("submission"),
    opportunityId,
    submittedAt: new Date().toISOString()
  };

  // Route to Lead if one is attached; otherwise go to admin
  const leadWorker = opportunity.leadId
    ? state.workers.find((w) => w.id === opportunity.leadId)
    : null;

  const newNotification = leadWorker
    ? notification(
        "trainer",
        "Submission ready for your review",
        `${worker?.name ?? "A worker"} submitted ${opportunity.title}.`,
        leadWorker.id
      )
    : notification(
        "admin",
        "Submission ready for review",
        `${worker?.name ?? "A worker"} submitted ${opportunity.title}. No Lead is attached — review directly.`
      );

  return {
    ...state,
    opportunities: state.opportunities.map((item) =>
      item.id === opportunityId ? { ...item, status: "submitted" } : item
    ),
    submissions: [
      submission,
      ...state.submissions.filter(
        (item) => item.opportunityId !== opportunityId
      )
    ],
    notifications: [newNotification, ...state.notifications],
    activity: [
      activity(
        worker?.name ?? "Worker",
        "submitted work for",
        opportunity.title
      ),
      ...state.activity
    ]
  };
}

export function reviewSubmission(
  state: DemoState,
  opportunityId: string,
  decision: "needs_revision" | "accepted" | "forwarded",
  comment: string,
  reviewerName = "Reviewer"
): DemoState {
  const opportunity = state.opportunities.find(
    (item) => item.id === opportunityId
  );
  if (!opportunity || opportunity.status !== "submitted") return state;

  const status: OpportunityStatus =
    decision === "accepted" || decision === "forwarded"
      ? "accepted"
      : "needs_revision";

  const worker = state.workers.find(
    (item) =>
      item.id === opportunity.assignedWorkerId ||
      opportunity.assignedWorkerIds.includes(item.id)
  );

  const review: Review = {
    id: makeId("review"),
    opportunityId,
    reviewerId: "user-trainer",
    decision,
    comment,
    createdAt: new Date().toISOString()
  };

  const workerNotification = notification(
    "worker",
    decision === "needs_revision" ? "Changes requested" : "Work accepted",
    comment,
    worker?.id
  );

  const adminNotification =
    decision === "forwarded"
      ? notification(
          "admin",
          "Work forwarded — final completion needed",
          `${reviewerName} has approved "${opportunity.title}". Mark it complete to trigger the payout.`
        )
      : null;

  return {
    ...state,
    opportunities: state.opportunities.map((item) =>
      item.id === opportunityId ? { ...item, status } : item
    ),
    reviews: [review, ...state.reviews],
    notifications: [
      workerNotification,
      ...(adminNotification ? [adminNotification] : []),
      ...state.notifications
    ],
    activity: [
      activity(
        reviewerName,
        decision === "needs_revision"
          ? "requested changes to"
          : "approved",
        opportunity.title
      ),
      ...state.activity
    ]
  };
}

export function completeOpportunity(
  state: DemoState,
  opportunityId: string
): DemoState {
  const opportunity = state.opportunities.find(
    (item) => item.id === opportunityId
  );
  if (
    !opportunity ||
    opportunity.status !== "accepted" ||
    opportunity.assignedWorkerIds.length === 0
  ) {
    return state;
  }

  // Generate one payout per assigned worker (full amount each)
  const newPayouts: Payout[] = opportunity.assignedWorkerIds
    .filter(
      (workerId) =>
        !state.payouts.some(
          (p) =>
            p.opportunityId === opportunityId && p.workerId === workerId
        )
    )
    .map((workerId) => ({
      id: makeId("payout"),
      opportunityId,
      workerId,
      amount: opportunity.payAmount,
      dueDate: opportunity.deadline,
      status: "pending" as const
    }));

  const updatedWorkers = state.workers.map((worker) =>
    opportunity.assignedWorkerIds.includes(worker.id)
      ? { ...worker, completedCount: worker.completedCount + 1 }
      : worker
  );

  const workerNotifications = opportunity.assignedWorkerIds.map((workerId) =>
    notification(
      "worker",
      "Work completed",
      `A payout of ₦${opportunity.payAmount.toLocaleString()} is now pending.`,
      workerId
    )
  );

  return {
    ...state,
    opportunities: state.opportunities.map((item) =>
      item.id === opportunityId ? { ...item, status: "completed" } : item
    ),
    workers: updatedWorkers,
    payouts: [...newPayouts, ...state.payouts],
    notifications: [...workerNotifications, ...state.notifications],
    activity: [
      activity("Admin", "completed", opportunity.title),
      ...state.activity
    ]
  };
}

export function setOpportunityStatus(
  state: DemoState,
  opportunityId: string,
  status: OpportunityStatus
): DemoState {
  return {
    ...state,
    opportunities: state.opportunities.map((item) =>
      item.id === opportunityId ? { ...item, status } : item
    )
  };
}

export function updateOpportunity(
  state: DemoState,
  opportunity: Opportunity
): DemoState {
  return {
    ...state,
    opportunities: state.opportunities.map((item) =>
      item.id === opportunity.id ? opportunity : item
    )
  };
}
