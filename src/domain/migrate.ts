import type {
  Assignment,
  AssignmentReview,
  AssignmentStatus,
  DemoState,
  Job,
  Notification,
  Payment,
  PaymentMethod,
  Professional,
  ReadinessReview,
  Service,
  ServiceEnrolment,
  ServiceEnrolmentStatus,
  Submission,
  User
} from "./model";
import { createDemoState } from "./professionalWorkflow";

interface LegacyUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "trainer" | "worker";
  workerId?: string;
}

interface LegacyWorker {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "training" | "ready" | "active";
  approvedServiceIds: string[];
  training: Array<{
    trackId: string;
    completedTaskIds: string[];
    status: "in_progress" | "awaiting_review" | "lead_approved" | "approved";
    evidenceNote?: string;
  }>;
  completedCount: number;
  notes: string;
  joinedAt: string;
  isLead: boolean;
  trainingLeadId?: string;
}

interface LegacyService {
  id: string;
  name: string;
  shortName: string;
  description: string;
  active: boolean;
}

interface LegacyTrainingTrack {
  id: string;
  serviceId: string;
  title: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    requiresEvidence: boolean;
  }>;
}

interface LegacyOpportunity {
  id: string;
  title: string;
  serviceId: string;
  description: string;
  steps: string;
  acceptanceCriteria: string[];
  expectedOutput: string;
  deadline: string;
  payAmount: number;
  status:
    | "draft"
    | "open"
    | "assigned"
    | "in_progress"
    | "submitted"
    | "needs_revision"
    | "accepted"
    | "completed";
  assignedWorkerIds?: string[];
  assignedWorkerId?: string;
  leadId?: string;
  createdAt: string;
}

interface LegacySubmission {
  id: string;
  opportunityId: string;
  workerId: string;
  notes: string;
  link?: string;
  fileName?: string;
  submittedAt: string;
}

interface LegacyReview {
  id: string;
  opportunityId: string;
  reviewerId: string;
  decision: "needs_revision" | "accepted" | "forwarded";
  comment: string;
  createdAt: string;
}

interface LegacyPayout {
  id: string;
  opportunityId: string;
  workerId: string;
  amount: number;
  dueDate: string;
  status: "pending" | "scheduled" | "paid";
  paidAt?: string;
  reference?: string;
  paymentMethod?: string;
  receiptFileName?: string;
}

interface LegacyNotification {
  id: string;
  recipientRole: "admin" | "trainer" | "worker";
  recipientId?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface LegacyActivity {
  id: string;
  actor: string;
  action: string;
  subject: string;
  createdAt: string;
}

interface LegacySnapshot {
  users: LegacyUser[];
  workers: LegacyWorker[];
  services?: LegacyService[];
  trainingTracks?: LegacyTrainingTrack[];
  opportunities?: LegacyOpportunity[];
  submissions?: LegacySubmission[];
  reviews?: LegacyReview[];
  payouts?: LegacyPayout[];
  notifications?: LegacyNotification[];
  activity?: LegacyActivity[];
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function isoDate(value: string | undefined) {
  if (!value) return new Date().toISOString();
  return value.includes("T") ? value : `${value}T09:00:00.000Z`;
}

function legacyEnrolmentStatus(
  status: LegacyWorker["training"][number]["status"]
): ServiceEnrolmentStatus {
  return {
    in_progress: "in_progress",
    awaiting_review: "waiting_for_lead",
    lead_approved: "waiting_for_admin",
    approved: "approved"
  }[status] as ServiceEnrolmentStatus;
}

function legacyAssignmentStatus(
  status: LegacyOpportunity["status"],
  hasLead: boolean
): AssignmentStatus {
  if (status === "in_progress") return "in_progress";
  if (status === "submitted") {
    return hasLead ? "waiting_for_lead" : "waiting_for_admin";
  }
  if (status === "needs_revision") {
    return hasLead
      ? "changes_requested_by_lead"
      : "changes_requested_by_admin";
  }
  if (status === "accepted") return "approved";
  if (status === "completed") return "completed";
  return "assigned";
}

function paymentMethod(value?: string): PaymentMethod | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized.includes("bank") || normalized.includes("transfer")) {
    return "bank_transfer";
  }
  if (normalized.includes("mobile")) return "mobile_money";
  if (normalized.includes("cash")) return "cash";
  if (normalized.includes("cheque") || normalized.includes("check")) {
    return "cheque";
  }
  return "other";
}

function convertLegacySnapshot(legacy: LegacySnapshot): DemoState {
  const legacyUsers = asArray(legacy.users);
  const legacyWorkers = asArray(legacy.workers);
  const workerById = new Map(
    legacyWorkers
      .filter((worker) => worker?.id && worker?.userId)
      .map((worker) => [worker.id, worker])
  );
  const userById = new Map(
    legacyUsers.filter((user) => user?.id).map((user) => [user.id, user])
  );

  const users: User[] = legacyUsers
    .filter(
      (user) =>
        user?.id &&
        user?.name &&
        user?.email &&
        (user.role === "admin" ||
          Boolean(user.workerId && workerById.has(user.workerId)))
    )
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      accountRole: user.role === "admin" ? "admin" : "professional",
      professionalId: user.role === "admin" ? undefined : user.workerId
    }));
  const migratedUserIds = new Set(users.map((user) => user.id));

  const professionals: Professional[] = legacyWorkers
    .filter(
      (worker) =>
        worker?.id &&
        worker?.userId &&
        migratedUserIds.has(worker.userId) &&
        userById.get(worker.userId)?.role !== "admin"
    )
    .map((worker) => ({
      id: worker.id,
      userId: worker.userId,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      location: worker.location,
      accountStatus: "active",
      isLead:
        worker.isLead || userById.get(worker.userId)?.role === "trainer",
      joinedAt: isoDate(worker.joinedAt),
      adminNotes: worker.notes ?? "",
      completedAssignmentCount: worker.completedCount ?? 0
    }));
  const professionalById = new Map(
    professionals.map((professional) => [professional.id, professional])
  );

  if (users.length === 0 || professionals.length === 0) {
    return createDemoState();
  }

  const tracks = asArray(legacy.trainingTracks);
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const services: Service[] = asArray(legacy.services)
    .filter((service) => service?.id && service?.name)
    .map((service) => {
      const track = tracks.find((item) => item.serviceId === service.id);
      return {
        id: service.id,
        name: service.name,
        shortName: service.shortName || service.name,
        description: service.description ?? "",
        active: service.active !== false,
        requirements: asArray(track?.tasks).map((task, order) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          requiresEvidence: task.requiresEvidence,
          order
        })),
        createdAt: "2026-06-10T09:00:00.000Z",
        updatedAt: "2026-06-10T09:00:00.000Z"
      };
    });
  const serviceById = new Map(services.map((service) => [service.id, service]));

  const serviceEnrolments: ServiceEnrolment[] = [];
  for (const worker of legacyWorkers) {
    if (!professionalById.has(worker.id)) continue;
    const representedServices = new Set<string>();

    for (const training of asArray(worker.training)) {
      const track = trackById.get(training.trackId);
      const service = track ? serviceById.get(track.serviceId) : undefined;
      if (!track || !service) continue;
      representedServices.add(service.id);
      const status = legacyEnrolmentStatus(training.status);
      const createdAt = isoDate(worker.joinedAt);
      serviceEnrolments.push({
        id: `enrolment-${worker.id}-${service.id}`,
        professionalId: worker.id,
        serviceId: service.id,
        leadId:
          worker.trainingLeadId !== worker.id &&
          professionalById.get(worker.trainingLeadId ?? "")?.isLead
            ? worker.trainingLeadId
            : undefined,
        status,
        requirements: service.requirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: asArray(training.completedTaskIds).includes(
            requirement.id
          ),
          evidenceLink:
            requirement.requiresEvidence && training.evidenceNote
              ? training.evidenceNote
              : undefined,
          completedAt: asArray(training.completedTaskIds).includes(
            requirement.id
          )
            ? createdAt
            : undefined
        })),
        leadCertifiedAt:
          status === "waiting_for_admin" || status === "approved"
            ? createdAt
            : undefined,
        adminApprovedAt: status === "approved" ? createdAt : undefined,
        createdAt,
        updatedAt: createdAt
      });
    }

    for (const serviceId of asArray(worker.approvedServiceIds)) {
      const service = serviceById.get(serviceId);
      if (!service || representedServices.has(serviceId)) continue;
      const createdAt = isoDate(worker.joinedAt);
      serviceEnrolments.push({
        id: `enrolment-${worker.id}-${serviceId}`,
        professionalId: worker.id,
        serviceId,
        status: "approved",
        requirements: service.requirements.map((requirement) => ({
          requirementId: requirement.id,
          completed: true,
          completedAt: createdAt
        })),
        leadCertifiedAt: createdAt,
        adminApprovedAt: createdAt,
        createdAt,
        updatedAt: createdAt
      });
    }
  }

  const jobs: Job[] = asArray(legacy.opportunities)
    .filter(
      (opportunity) =>
        opportunity?.id &&
        opportunity?.serviceId &&
        serviceById.has(opportunity.serviceId)
    )
    .map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      serviceId: opportunity.serviceId,
      clientContext: opportunity.description,
      objective: opportunity.expectedOutput || opportunity.title,
      description: opportunity.description,
      steps: (opportunity.steps ?? "")
        .split("\n")
        .map((step) => step.trim().replace(/^\d+\.\s*/, ""))
        .filter(Boolean),
      deliverables: opportunity.expectedOutput
        ? [opportunity.expectedOutput]
        : [],
      acceptanceCriteria: asArray(opportunity.acceptanceCriteria),
      references: [],
      submissionEvidenceRequired: false,
      deadline: isoDate(opportunity.deadline),
      publicationState:
        opportunity.status === "draft" ? "draft" : "open",
      createdAt: isoDate(opportunity.createdAt),
      updatedAt: isoDate(opportunity.createdAt)
    }));
  const jobById = new Map(jobs.map((job) => [job.id, job]));

  const assignments: Assignment[] = [];
  for (const opportunity of asArray(legacy.opportunities)) {
    const job = jobById.get(opportunity.id);
    if (!job) continue;
    const assigneeIds = Array.from(
      new Set([
        ...asArray(opportunity.assignedWorkerIds),
        ...(opportunity.assignedWorkerId
          ? [opportunity.assignedWorkerId]
          : [])
      ])
    );
    for (const professionalId of assigneeIds) {
      if (!professionalById.has(professionalId)) continue;
      const leadReviewerId =
        opportunity.leadId !== professionalId &&
        professionalById.get(opportunity.leadId ?? "")?.isLead
          ? opportunity.leadId
          : undefined;
      const status = legacyAssignmentStatus(
        opportunity.status,
        Boolean(leadReviewerId)
      );
      const createdAt = isoDate(opportunity.createdAt);
      assignments.push({
        id: `assignment-${opportunity.id}-${professionalId}`,
        jobId: opportunity.id,
        professionalId,
        leadReviewerId,
        agreedPay: opportunity.payAmount ?? 0,
        deadline: isoDate(opportunity.deadline),
        status,
        startedAt: status === "assigned" ? undefined : createdAt,
        submittedAt: [
          "waiting_for_lead",
          "waiting_for_admin",
          "changes_requested_by_lead",
          "changes_requested_by_admin",
          "approved",
          "completed"
        ].includes(status)
          ? createdAt
          : undefined,
        approvedAt:
          status === "approved" || status === "completed"
            ? createdAt
            : undefined,
        completedAt: status === "completed" ? createdAt : undefined,
        createdAt
      });
    }
  }
  const assignmentByOpportunityAndProfessional = new Map(
    assignments.map((assignment) => [
      `${assignment.jobId}:${assignment.professionalId}`,
      assignment
    ])
  );

  const versions = new Map<string, number>();
  const submissions: Submission[] = asArray(legacy.submissions).flatMap(
    (submission) => {
      const assignment = assignmentByOpportunityAndProfessional.get(
        `${submission.opportunityId}:${submission.workerId}`
      );
      if (!assignment) return [];
      const version = (versions.get(assignment.id) ?? 0) + 1;
      versions.set(assignment.id, version);
      return [
        {
          id: submission.id,
          assignmentId: assignment.id,
          version,
          notes: submission.notes,
          link: submission.link,
          fileName: submission.fileName,
          submittedAt: isoDate(submission.submittedAt)
        }
      ];
    }
  );
  const submissionsByOpportunity = new Map<string, Submission[]>();
  for (const submission of submissions) {
    const assignment = assignments.find(
      (item) => item.id === submission.assignmentId
    );
    if (!assignment) continue;
    const existing = submissionsByOpportunity.get(assignment.jobId) ?? [];
    existing.push(submission);
    submissionsByOpportunity.set(assignment.jobId, existing);
  }

  const assignmentReviews: AssignmentReview[] = asArray(
    legacy.reviews
  ).flatMap((review) => {
    const latest = (submissionsByOpportunity.get(review.opportunityId) ?? [])
      .slice()
      .sort((left, right) =>
        right.submittedAt.localeCompare(left.submittedAt)
      )[0];
    if (!latest) return [];
    const reviewer =
      users.find((user) => user.id === review.reviewerId) ??
      users.find((user) => user.accountRole === "admin");
    if (!reviewer) return [];
    const reviewerType =
      reviewer.accountRole === "admin" ? "admin" : "lead";
    return [
      {
        id: review.id,
        assignmentId: latest.assignmentId,
        submissionId: latest.id,
        reviewerUserId: reviewer.id,
        reviewerType,
        decision:
          review.decision === "needs_revision"
            ? "changes_requested"
            : reviewerType === "admin"
              ? "approved"
              : "certified",
        comment: review.comment,
        createdAt: isoDate(review.createdAt)
      }
    ];
  });

  const payments: Payment[] = asArray(legacy.payouts).flatMap((payout) => {
    const assignment = assignmentByOpportunityAndProfessional.get(
      `${payout.opportunityId}:${payout.workerId}`
    );
    if (!assignment) return [];
    return [
      {
        id: payout.id,
        assignmentId: assignment.id,
        professionalId: assignment.professionalId,
        amount: payout.amount,
        dueDate: isoDate(payout.dueDate),
        status: payout.status === "pending" ? "due" : payout.status,
        paymentDate: payout.paidAt ? isoDate(payout.paidAt) : undefined,
        method: paymentMethod(payout.paymentMethod),
        reference: payout.reference,
        receiptFileName: payout.receiptFileName
      }
    ];
  });

  const notifications: Notification[] = asArray(
    legacy.notifications
  ).flatMap((item) => {
    const professionalRecipient = professionalById.get(item.recipientId ?? "");
    const recipientUserId =
      professionalRecipient?.userId ??
      users.find((user) =>
        item.recipientRole === "admin"
          ? user.accountRole === "admin"
          : user.accountRole === "professional"
      )?.id;
    if (!recipientUserId) return [];
    return [
      {
        id: item.id,
        recipientUserId,
        title: item.title,
        message: item.message,
        createdAt: isoDate(item.createdAt),
        read: item.read
      }
    ];
  });

  return {
    users,
    professionals,
    services,
    serviceEnrolments,
    readinessReviews: [] as ReadinessReview[],
    jobs,
    assignments,
    submissions,
    assignmentReviews,
    payments,
    notifications,
    activity: asArray(legacy.activity).map((item) => ({
      id: item.id,
      actor: item.actor,
      action: item.action,
      subject: item.subject,
      createdAt: isoDate(item.createdAt)
    }))
  };
}

export function migrateLegacyState(input: unknown): DemoState {
  if (!input || typeof input !== "object") return createDemoState();
  const snapshot = input as Record<string, unknown>;

  if (
    Array.isArray(snapshot.professionals) &&
    Array.isArray(snapshot.jobs) &&
    Array.isArray(snapshot.assignments)
  ) {
    return snapshot as unknown as DemoState;
  }

  if (!Array.isArray(snapshot.workers) || !Array.isArray(snapshot.users)) {
    return createDemoState();
  }

  try {
    return convertLegacySnapshot(snapshot as unknown as LegacySnapshot);
  } catch {
    return createDemoState();
  }
}
