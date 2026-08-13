import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AccountRole,
  ActivityEvent,
  Assignment,
  AssignmentReview,
  AssignmentStatus,
  DemoState,
  Job,
  JobPublicationState,
  Notification,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Professional,
  ReadinessReview,
  RequirementProgress,
  Service,
  ServiceEnrolment,
  ServiceEnrolmentStatus,
  Submission,
  User
} from "../domain/model";
import type {
  AssignmentReviewCommand,
  NewAssignmentInput,
  RecordPaymentInput,
  ServiceEnrolmentReviewCommand
} from "../domain/professionalWorkflow";
import type {
  CreateProfessionalInput,
  CreateServiceInput,
  JobDraftInput,
  ServiceRequirementInput
} from "../store/professionalStore";

export type DbRow = Record<string, unknown>;

export interface RemoteRows {
  profiles: DbRow[];
  professionals: DbRow[];
  services: DbRow[];
  requirements: DbRow[];
  enrolments: DbRow[];
  progress: DbRow[];
  readinessReviews: DbRow[];
  jobs: DbRow[];
  jobReferences: DbRow[];
  assignments: DbRow[];
  submissions: DbRow[];
  assignmentReviews: DbRow[];
  payments: DbRow[];
  notifications: DbRow[];
  activity: DbRow[];
}

function value<T>(row: DbRow, key: string): T | undefined {
  return row[key] as T | undefined;
}

function textValue(row: DbRow, key: string, fallback = "") {
  const item = value<unknown>(row, key);
  return typeof item === "string" ? item : fallback;
}

function nullableText(row: DbRow, key: string) {
  const item = value<unknown>(row, key);
  return typeof item === "string" && item.length > 0 ? item : undefined;
}

function boolValue(row: DbRow, key: string, fallback = false) {
  const item = value<unknown>(row, key);
  return typeof item === "boolean" ? item : fallback;
}

function numberValue(row: DbRow, key: string, fallback = 0) {
  const item = value<unknown>(row, key);
  return typeof item === "number" ? item : fallback;
}

function stringArray(row: DbRow, key: string) {
  const item = value<unknown>(row, key);
  return Array.isArray(item)
    ? item.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function idValue(row: DbRow, key: string) {
  return textValue(row, key);
}

function isUuid(valueToCheck: string | undefined) {
  return Boolean(
    valueToCheck &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        valueToCheck
      )
  );
}

function mapUser(row: DbRow, professionalId?: string): User {
  return {
    id: idValue(row, "id"),
    name: textValue(row, "display_name", "Blithob user"),
    email: textValue(row, "email"),
    accountRole: textValue(row, "account_role", "professional") as AccountRole,
    ...(professionalId ? { professionalId } : {})
  };
}

function mapProfessional(row: DbRow, completedAssignmentCount: number): Professional {
  return {
    id: idValue(row, "id"),
    userId: idValue(row, "profile_id"),
    name: textValue(row, "name"),
    email: textValue(row, "email"),
    phone: textValue(row, "phone"),
    location: textValue(row, "location"),
    accountStatus: textValue(row, "account_status", "active") as Professional["accountStatus"],
    isLead: boolValue(row, "is_lead"),
    joinedAt: textValue(row, "joined_at", textValue(row, "created_at")),
    adminNotes: textValue(row, "admin_notes"),
    completedAssignmentCount
  };
}

function mapService(row: DbRow, requirements: Service["requirements"]): Service {
  return {
    id: idValue(row, "id"),
    name: textValue(row, "name"),
    shortName: textValue(row, "short_name"),
    description: textValue(row, "description"),
    active: boolValue(row, "active", true),
    requirements,
    createdAt: textValue(row, "created_at"),
    updatedAt: textValue(row, "updated_at", textValue(row, "created_at"))
  };
}

function mapRequirementProgress(row: DbRow): RequirementProgress {
  return {
    requirementId: idValue(row, "requirement_id"),
    completed: boolValue(row, "completed"),
    ...(nullableText(row, "evidence_link")
      ? { evidenceLink: nullableText(row, "evidence_link") }
      : {}),
    ...(nullableText(row, "evidence_file_path")
      ? { evidenceFilePath: nullableText(row, "evidence_file_path") }
      : {}),
    ...(nullableText(row, "evidence_file_name")
      ? { evidenceFileName: nullableText(row, "evidence_file_name") }
      : {}),
    ...(nullableText(row, "completed_at")
      ? { completedAt: nullableText(row, "completed_at") }
      : {})
  };
}

function mapEnrolment(
  row: DbRow,
  requirementsByService: Map<string, Service["requirements"]>,
  progressByEnrolment: Map<string, DbRow[]>
): ServiceEnrolment {
  const enrolmentId = idValue(row, "id");
  const serviceRequirements = requirementsByService.get(idValue(row, "service_id")) ?? [];
  const progress = new Map(
    (progressByEnrolment.get(enrolmentId) ?? []).map((item) => [
      idValue(item, "requirement_id"),
      mapRequirementProgress(item)
    ])
  );

  return {
    id: enrolmentId,
    professionalId: idValue(row, "professional_id"),
    serviceId: idValue(row, "service_id"),
    ...(nullableText(row, "lead_id") ? { leadId: nullableText(row, "lead_id") } : {}),
    status: textValue(row, "status", "not_started") as ServiceEnrolmentStatus,
    requirements: serviceRequirements.map((requirement) =>
      progress.get(requirement.id) ?? {
        requirementId: requirement.id,
        completed: false
      }
    ),
    ...(nullableText(row, "lead_certified_at")
      ? { leadCertifiedAt: nullableText(row, "lead_certified_at") }
      : {}),
    ...(nullableText(row, "admin_approved_at")
      ? { adminApprovedAt: nullableText(row, "admin_approved_at") }
      : {}),
    createdAt: textValue(row, "created_at"),
    updatedAt: textValue(row, "updated_at", textValue(row, "created_at"))
  };
}

function mapJob(row: DbRow, references: Job["references"]): Job {
  return {
    id: idValue(row, "id"),
    title: textValue(row, "title"),
    serviceId: idValue(row, "service_id"),
    clientContext: textValue(row, "client_context"),
    objective: textValue(row, "objective"),
    description: textValue(row, "description"),
    steps: stringArray(row, "steps"),
    deliverables: stringArray(row, "deliverables"),
    acceptanceCriteria: stringArray(row, "acceptance_criteria"),
    references,
    submissionEvidenceRequired: boolValue(row, "submission_evidence_required"),
    deadline: textValue(row, "deadline"),
    publicationState: textValue(row, "publication_state", "draft") as JobPublicationState,
    createdAt: textValue(row, "created_at"),
    updatedAt: textValue(row, "updated_at", textValue(row, "created_at"))
  };
}

function mapAssignment(row: DbRow): Assignment {
  return {
    id: idValue(row, "id"),
    jobId: idValue(row, "job_id"),
    professionalId: idValue(row, "professional_id"),
    ...(nullableText(row, "lead_reviewer_id")
      ? { leadReviewerId: nullableText(row, "lead_reviewer_id") }
      : {}),
    agreedPay: numberValue(row, "agreed_pay"),
    deadline: textValue(row, "deadline"),
    status: textValue(row, "status", "assigned") as AssignmentStatus,
    ...(nullableText(row, "started_at") ? { startedAt: nullableText(row, "started_at") } : {}),
    ...(nullableText(row, "submitted_at")
      ? { submittedAt: nullableText(row, "submitted_at") }
      : {}),
    ...(nullableText(row, "approved_at")
      ? { approvedAt: nullableText(row, "approved_at") }
      : {}),
    ...(nullableText(row, "completed_at")
      ? { completedAt: nullableText(row, "completed_at") }
      : {}),
    ...(nullableText(row, "cancelled_at")
      ? { cancelledAt: nullableText(row, "cancelled_at") }
      : {}),
    ...(nullableText(row, "cancellation_reason")
      ? { cancellationReason: nullableText(row, "cancellation_reason") }
      : {}),
    createdAt: textValue(row, "created_at")
  };
}

function mapSubmission(row: DbRow): Submission {
  return {
    id: idValue(row, "id"),
    assignmentId: idValue(row, "assignment_id"),
    version: numberValue(row, "version", 1),
    notes: textValue(row, "notes"),
    ...(nullableText(row, "link") ? { link: nullableText(row, "link") } : {}),
    ...(nullableText(row, "file_path") ? { filePath: nullableText(row, "file_path") } : {}),
    ...(nullableText(row, "file_name") ? { fileName: nullableText(row, "file_name") } : {}),
    submittedAt: textValue(row, "submitted_at")
  };
}

function mapReadinessReview(row: DbRow): ReadinessReview {
  return {
    id: idValue(row, "id"),
    enrolmentId: idValue(row, "enrolment_id"),
    reviewerUserId: idValue(row, "reviewer_user_id"),
    reviewerType: textValue(row, "reviewer_type", "admin") as ReadinessReview["reviewerType"],
    decision: textValue(row, "decision", "changes_requested") as ReadinessReview["decision"],
    comment: textValue(row, "comment"),
    createdAt: textValue(row, "created_at")
  };
}

function mapAssignmentReview(row: DbRow): AssignmentReview {
  return {
    id: idValue(row, "id"),
    assignmentId: idValue(row, "assignment_id"),
    submissionId: idValue(row, "submission_id"),
    reviewerUserId: idValue(row, "reviewer_user_id"),
    reviewerType: textValue(row, "reviewer_type", "admin") as AssignmentReview["reviewerType"],
    decision: textValue(row, "decision", "changes_requested") as AssignmentReview["decision"],
    comment: textValue(row, "comment"),
    createdAt: textValue(row, "created_at")
  };
}

function mapPayment(row: DbRow): Payment {
  return {
    id: idValue(row, "id"),
    assignmentId: idValue(row, "assignment_id"),
    professionalId: idValue(row, "professional_id"),
    amount: numberValue(row, "amount"),
    dueDate: textValue(row, "due_date"),
    status: textValue(row, "status", "due") as PaymentStatus,
    ...(nullableText(row, "payment_date") ? { paymentDate: nullableText(row, "payment_date") } : {}),
    ...(nullableText(row, "method") ? { method: nullableText(row, "method") as PaymentMethod } : {}),
    ...(nullableText(row, "reference") ? { reference: nullableText(row, "reference") } : {}),
    ...(nullableText(row, "receipt_path")
      ? { receiptFilePath: nullableText(row, "receipt_path") }
      : {}),
    ...(nullableText(row, "receipt_file_name")
      ? { receiptFileName: nullableText(row, "receipt_file_name") }
      : {}),
    ...(nullableText(row, "internal_note")
      ? { internalNote: nullableText(row, "internal_note") }
      : {}),
    ...(nullableText(row, "issue_note") ? { issueNote: nullableText(row, "issue_note") } : {}),
    ...(nullableText(row, "corrected_at") ? { correctedAt: nullableText(row, "corrected_at") } : {}),
    ...(nullableText(row, "correction_note")
      ? { correctionNote: nullableText(row, "correction_note") }
      : {})
  };
}

function mapNotification(row: DbRow): Notification {
  return {
    id: idValue(row, "id"),
    recipientUserId: idValue(row, "recipient_user_id"),
    title: textValue(row, "title"),
    message: textValue(row, "message"),
    createdAt: textValue(row, "created_at"),
    read: Boolean(nullableText(row, "read_at"))
  };
}

interface ActivitySubjectContext {
  jobsById: Map<string, Job>;
  assignmentsById: Map<string, Assignment>;
  professionalsById: Map<string, Professional>;
  serviceEnrolmentsById: Map<string, ServiceEnrolment>;
  servicesById: Map<string, Service>;
  paymentsById: Map<string, Payment>;
}

function subjectForActivity(row: DbRow, context: ActivitySubjectContext) {
  const subjectId = nullableText(row, "subject_id");
  if (!subjectId) return textValue(row, "subject_type", "activity");
  const subjectType = textValue(row, "subject_type");
  if (subjectType === "job") {
    return context.jobsById.get(subjectId)?.title ?? subjectId;
  }
  if (subjectType === "professional") {
    return context.professionalsById.get(subjectId)?.name ?? subjectId;
  }
  if (subjectType === "assignment") {
    const assignment = context.assignmentsById.get(subjectId);
    if (!assignment) return subjectId;
    const job = context.jobsById.get(assignment.jobId);
    const professional = context.professionalsById.get(assignment.professionalId);
    if (job && professional) return `${job.title} — ${professional.name}`;
    return job?.title ?? professional?.name ?? subjectId;
  }
  if (subjectType === "service_enrolment") {
    const enrolment = context.serviceEnrolmentsById.get(subjectId);
    const service = enrolment
      ? context.servicesById.get(enrolment.serviceId)
      : undefined;
    const professional = enrolment
      ? context.professionalsById.get(enrolment.professionalId)
      : undefined;
    if (service && professional) return `${service.name} — ${professional.name}`;
    return service?.name ?? professional?.name ?? subjectId;
  }
  if (subjectType === "payment") {
    const payment = context.paymentsById.get(subjectId);
    const assignment = payment
      ? context.assignmentsById.get(payment.assignmentId)
      : undefined;
    const job = assignment ? context.jobsById.get(assignment.jobId) : undefined;
    const professional = payment
      ? context.professionalsById.get(payment.professionalId)
      : undefined;
    if (job && professional) return `${job.title} — ${professional.name}`;
    return job?.title ?? professional?.name ?? subjectId;
  }
  return subjectId;
}

function mapActivity(
  row: DbRow,
  usersById: Map<string, User>,
  context: ActivitySubjectContext
): ActivityEvent {
  const actorId = nullableText(row, "actor_user_id");
  const subjectId = nullableText(row, "subject_id");
  const subjectType = nullableText(row, "subject_type");
  return {
    id: idValue(row, "id"),
    actor: actorId ? usersById.get(actorId)?.name ?? "Blithob user" : "System",
    action: textValue(row, "action"),
    subject: subjectForActivity(row, context),
    ...(subjectType ? { subjectType } : {}),
    ...(subjectId ? { subjectId } : {}),
    createdAt: textValue(row, "created_at")
  };
}

export function mapRemoteState(input: RemoteRows): DemoState {
  const requirementsByService = new Map<string, Service["requirements"]>();
  for (const row of [...input.requirements].sort(
    (left, right) => numberValue(left, "display_order") - numberValue(right, "display_order")
  )) {
    const serviceId = idValue(row, "service_id");
    const requirements = requirementsByService.get(serviceId) ?? [];
    requirements.push({
      id: idValue(row, "id"),
      title: textValue(row, "title"),
      description: textValue(row, "description"),
      requiresEvidence: boolValue(row, "requires_evidence"),
      order: numberValue(row, "display_order", requirements.length + 1)
    });
    requirementsByService.set(serviceId, requirements);
  }

  const services = input.services.map((row) =>
    mapService(row, requirementsByService.get(idValue(row, "id")) ?? [])
  );
  const servicesById = new Map(services.map((item) => [item.id, item]));
  const assignmentRows = input.assignments.map(mapAssignment);
  const assignmentsById = new Map(assignmentRows.map((item) => [item.id, item]));
  const completedCounts = new Map<string, number>();
  for (const assignment of assignmentRows) {
    if (assignment.status === "completed") {
      completedCounts.set(
        assignment.professionalId,
        (completedCounts.get(assignment.professionalId) ?? 0) + 1
      );
    }
  }

  const profilesById = new Map(
    input.profiles.map((row) => [idValue(row, "id"), row])
  );
  const professionals = input.professionals.map((row) => {
    const profile = profilesById.get(idValue(row, "profile_id"));
    return mapProfessional(
      {
        ...row,
        name: textValue(profile ?? {}, "display_name"),
        email: textValue(profile ?? {}, "email")
      },
      completedCounts.get(idValue(row, "id")) ?? 0
    );
  });
  const professionalsById = new Map(
    professionals.map((item) => [item.id, item])
  );
  const professionalByProfileId = new Map(
    professionals.map((item) => [item.userId, item.id])
  );
  const users = input.profiles.map((row) =>
    mapUser(row, professionalByProfileId.get(idValue(row, "id")))
  );
  const usersById = new Map(users.map((item) => [item.id, item]));
  for (const professional of professionals) {
    if (!usersById.has(professional.userId)) {
      const user: User = {
        id: professional.userId,
        name: professional.name,
        email: professional.email,
        accountRole: "professional",
        professionalId: professional.id
      };
      users.push(user);
      usersById.set(user.id, user);
    }
  }

  const progressByEnrolment = new Map<string, DbRow[]>();
  for (const row of input.progress) {
    const enrolmentId = idValue(row, "enrolment_id");
    progressByEnrolment.set(enrolmentId, [
      ...(progressByEnrolment.get(enrolmentId) ?? []),
      row
    ]);
  }
  const serviceEnrolments = input.enrolments.map((row) =>
    mapEnrolment(row, requirementsByService, progressByEnrolment)
  );
  const serviceEnrolmentsById = new Map(
    serviceEnrolments.map((item) => [item.id, item])
  );

  const referencesByJob = new Map<string, Job["references"]>();
  for (const row of [...input.jobReferences].sort(
    (left, right) => numberValue(left, "display_order") - numberValue(right, "display_order")
  )) {
    const jobId = idValue(row, "job_id");
    const references = referencesByJob.get(jobId) ?? [];
    references.push({
      id: idValue(row, "id"),
      label: textValue(row, "label"),
      kind: textValue(row, "kind", "link") as "link" | "file",
      ...(nullableText(row, "url") ? { url: nullableText(row, "url") } : {}),
      ...(nullableText(row, "storage_path")
        ? { filePath: nullableText(row, "storage_path") }
        : {}),
      ...(nullableText(row, "file_name") ? { fileName: nullableText(row, "file_name") } : {})
    });
    referencesByJob.set(jobId, references);
  }
  const jobs = input.jobs.map((row) =>
    mapJob(row, referencesByJob.get(idValue(row, "id")) ?? [])
  );
  const jobsById = new Map(jobs.map((item) => [item.id, item]));
  const payments = input.payments.map(mapPayment);
  const paymentsById = new Map(payments.map((item) => [item.id, item]));
  const activity = [...input.activity]
    .sort((left, right) =>
      textValue(right, "created_at").localeCompare(textValue(left, "created_at"))
    )
    .map((row) =>
      mapActivity(row, usersById, {
        jobsById,
        assignmentsById,
        professionalsById,
        serviceEnrolmentsById,
        servicesById,
        paymentsById
      })
    );

  return {
    users,
    professionals,
    services,
    serviceEnrolments,
    readinessReviews: input.readinessReviews.map(mapReadinessReview),
    jobs,
    assignments: assignmentRows,
    submissions: input.submissions.map(mapSubmission),
    assignmentReviews: input.assignmentReviews.map(mapAssignmentReview),
    payments,
    notifications: input.notifications.map(mapNotification),
    activity
  };
}

export function toServiceInsert(input: CreateServiceInput, id?: string) {
  return {
    ...(id ? { id } : {}),
    name: input.name.trim(),
    short_name: input.shortName.trim(),
    description: input.description.trim()
  };
}

export function toServiceRequirementInsert(
  serviceId: string,
  input: ServiceRequirementInput,
  order: number
) {
  return {
    ...(input.id && isUuid(input.id) ? { id: input.id } : {}),
    service_id: serviceId,
    title: input.title.trim(),
    description: input.description.trim(),
    requires_evidence: input.requiresEvidence,
    display_order: order + 1
  };
}

export function toJobInsert(
  input: JobDraftInput,
  id: string,
  createdBy: string
) {
  return {
    id,
    title: input.title.trim(),
    service_id: input.serviceId,
    client_context: input.clientContext.trim(),
    objective: input.objective.trim(),
    description: input.description.trim(),
    steps: input.steps.map((item) => item.trim()),
    deliverables: input.deliverables.map((item) => item.trim()),
    acceptance_criteria: input.acceptanceCriteria.map((item) => item.trim()),
    submission_evidence_required: input.submissionEvidenceRequired,
    deadline: input.deadline,
    publication_state: input.publicationState ?? "draft",
    created_by: createdBy
  };
}

function toReferenceInsert(
  jobId: string,
  reference: Job["references"][number],
  order: number
) {
  return {
    ...(reference.id && isUuid(reference.id) ? { id: reference.id } : {}),
    job_id: jobId,
    label: reference.label.trim(),
    kind: reference.kind,
    url: reference.kind === "link" ? reference.url?.trim() || null : null,
    storage_path: reference.kind === "file" ? reference.filePath?.trim() || null : null,
    file_name: reference.kind === "file" ? reference.fileName?.trim() || null : null,
    display_order: order + 1
  };
}

type ResponseLike<T> = {
  data: T | null;
  error: { message: string } | null;
};

export class SupabaseRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async resolve<T>(request: PromiseLike<ResponseLike<T>>) {
    const response = await request;
    if (response.error) throw new Error(response.error.message);
    return response.data as T;
  }

  private async select(table: string) {
    return this.resolve<DbRow[]>(
      this.client.from(table).select("*")
    );
  }

  private async selectActivity() {
    return this.resolve<DbRow[]>(
      this.client
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
    );
  }

  private async currentUserId() {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new Error(error?.message ?? "No active account session");
    return data.user.id;
  }

  async loadState(): Promise<DemoState> {
    const [profiles, professionals, services, requirements, enrolments, progress,
      readinessReviews, jobs, jobReferences, assignments, submissions,
      assignmentReviews, payments, notifications, activity] = await Promise.all([
      this.select("profiles"),
      this.select("professionals"),
      this.select("services"),
      this.select("service_requirements"),
      this.select("service_enrolments"),
      this.select("service_requirement_progress"),
      this.select("readiness_reviews"),
      this.select("jobs"),
      this.select("job_references"),
      this.select("assignments"),
      this.select("submissions"),
      this.select("assignment_reviews"),
      this.select("payments"),
      this.select("notifications"),
      this.selectActivity()
    ]);

    return mapRemoteState({
      profiles,
      professionals,
      services,
      requirements,
      enrolments,
      progress,
      readinessReviews,
      jobs,
      jobReferences,
      assignments,
      submissions,
      assignmentReviews,
      payments,
      notifications,
      activity
    });
  }

  async inviteProfessional(
    input: CreateProfessionalInput,
    professionalId: string
  ) {
    const { data, error } = await this.client.functions.invoke("invite-professional", {
      body: { ...input, professionalId }
    });
    if (error) throw new Error(error.message);
    const result = data as { error?: string; professionalId?: string } | null;
    if (result?.error) throw new Error(result.error);
    return result?.professionalId ?? professionalId;
  }

  async updateProfessional(
    professionalId: string,
    input: Partial<Pick<Professional, "name" | "email" | "phone" | "location" | "adminNotes" | "accountStatus">>
  ) {
    const professional = await this.resolve<DbRow>(
      this.client
        .from("professionals")
        .select("profile_id, profiles(email)")
        .eq("id", professionalId)
        .single()
    );
    const profileId = idValue(professional, "profile_id");
    const profile = value<DbRow>(professional, "profiles") ?? {};
    const currentEmail = textValue(profile, "email");
    const nextEmail = input.email?.trim();
    if (nextEmail && nextEmail !== currentEmail) {
      const currentUserId = await this.currentUserId();
      if (currentUserId !== profileId) {
        throw new Error(
          "A Professional's email can only be changed by the account owner."
        );
      }
      const { error } = await this.client.auth.updateUser({ email: nextEmail });
      if (error) throw new Error(error.message);
    }

    await this.resolve<string>(
      this.client.rpc("update_professional_profile", {
        p_professional_id: professionalId,
        p_display_name: input.name?.trim() ?? null,
        p_phone: input.phone?.trim() ?? null,
        p_location: input.location?.trim() ?? null,
        p_admin_notes: input.adminNotes?.trim() ?? null,
        p_account_status: input.accountStatus ?? null
      })
    );
  }

  async removeProfessional(professionalId: string) {
    await this.resolve<string>(
      this.client.rpc("remove_professional", { p_professional_id: professionalId })
    );
  }

  async setLeadCapability(professionalId: string, enabled: boolean) {
    await this.resolve<string>(
      this.client.rpc("set_lead_capability", {
        p_professional_id: professionalId,
        p_enabled: enabled
      })
    );
  }

  async createService(input: CreateServiceInput, serviceId: string) {
    await this.resolve<DbRow>(
      this.client.from("services").insert(toServiceInsert(input, serviceId)).select("id").single()
    );
    if (input.requirements.length > 0) {
      await this.resolve<DbRow[]>(
        this.client.from("service_requirements")
          .insert(input.requirements.map((item, index) => toServiceRequirementInsert(serviceId, item, index)))
          .select("id")
      );
    }
  }

  async updateService(
    serviceId: string,
    input: Partial<Pick<Service, "name" | "shortName" | "description">>
  ) {
    const patch = {
      ...(input.name === undefined ? {} : { name: input.name.trim() }),
      ...(input.shortName === undefined ? {} : { short_name: input.shortName.trim() }),
      ...(input.description === undefined ? {} : { description: input.description.trim() })
    };
    if (Object.keys(patch).length > 0) {
      await this.resolve<DbRow[]>(
        this.client.from("services").update(patch).eq("id", serviceId).select("id")
      );
    }
  }

  async replaceServiceRequirements(serviceId: string, requirements: ServiceRequirementInput[]) {
    await this.resolve<string>(
      this.client.rpc("replace_service_requirements", {
        p_service_id: serviceId,
        p_requirements: requirements.map((item) => ({
          ...(item.id && isUuid(item.id) ? { id: item.id } : {}),
          title: item.title,
          description: item.description,
          requiresEvidence: item.requiresEvidence
        }))
      })
    );
  }

  async setServiceActive(serviceId: string, active: boolean) {
    await this.resolve<DbRow[]>(
      this.client.from("services").update({ active }).eq("id", serviceId).select("id")
    );
  }

  async createServiceEnrolment(professionalId: string, serviceId: string, leadId?: string, enrolmentId?: string) {
    await this.resolve<DbRow>(
      this.client.from("service_enrolments").insert({
        ...(enrolmentId ? { id: enrolmentId } : {}),
        professional_id: professionalId,
        service_id: serviceId,
        lead_id: leadId ?? null
      }).select("id").single()
    );
  }

  async assignServiceLead(enrolmentId: string, leadId?: string) {
    await this.resolve<string>(
      this.client.rpc("assign_service_lead", {
        p_enrolment_id: enrolmentId,
        p_lead_id: leadId ?? null
      })
    );
  }

  async setRequirementProgress(
    enrolmentId: string,
    requirementId: string,
    input: Pick<RequirementProgress, "completed" | "evidenceLink" | "evidenceFilePath" | "evidenceFileName">
  ) {
    await this.resolve<null>(
      this.client.rpc("set_requirement_progress", {
        p_enrolment_id: enrolmentId,
        p_requirement_id: requirementId,
        p_completed: input.completed,
        p_evidence_link: input.evidenceLink ?? null,
        p_evidence_file_path: input.evidenceFilePath ?? null,
        p_evidence_file_name: input.evidenceFileName ?? null
      })
    );
  }

  async submitServiceEnrolment(enrolmentId: string) {
    await this.resolve<string>(
      this.client.rpc("submit_service_enrolment", { p_enrolment_id: enrolmentId })

    );
  }

  async reviewServiceEnrolment(command: ServiceEnrolmentReviewCommand) {
    await this.resolve<string>(
      this.client.rpc("review_service_enrolment", {
        p_enrolment_id: command.enrolmentId,
        p_decision: command.decision,
        p_comment: command.comment.trim()
      })
    );
  }

  async removeServiceEnrolment(enrolmentId: string) {
    await this.resolve<string>(
      this.client.rpc("remove_service_enrolment", { p_enrolment_id: enrolmentId })
    );
  }

  async createJob(input: JobDraftInput, jobId: string) {
    const createdBy = await this.currentUserId();
    await this.resolve<DbRow>(
      this.client.from("jobs").insert(toJobInsert(input, jobId, createdBy)).select("id").single()
    );
    await this.replaceJobReferences(jobId, input.references);
  }

  private async replaceJobReferences(jobId: string, references: Job["references"]) {
    await this.resolve<null>(
      this.client.from("job_references").delete().eq("job_id", jobId)
    );
    if (references.length > 0) {
      await this.resolve<DbRow[]>(
        this.client.from("job_references")
          .insert(references.map((item, index) => toReferenceInsert(jobId, item, index)))
          .select("id")
      );
    }
  }

  async updateJob(jobId: string, input: Partial<JobDraftInput>) {
    const patch = {
      ...(input.title === undefined ? {} : { title: input.title.trim() }),
      ...(input.serviceId === undefined ? {} : { service_id: input.serviceId }),
      ...(input.clientContext === undefined ? {} : { client_context: input.clientContext.trim() }),
      ...(input.objective === undefined ? {} : { objective: input.objective.trim() }),
      ...(input.description === undefined ? {} : { description: input.description.trim() }),
      ...(input.steps === undefined ? {} : { steps: input.steps.map((item) => item.trim()) }),
      ...(input.deliverables === undefined
        ? {}
        : { deliverables: input.deliverables.map((item) => item.trim()) }),
      ...(input.acceptanceCriteria === undefined
        ? {}
        : { acceptance_criteria: input.acceptanceCriteria.map((item) => item.trim()) }),
      ...(input.submissionEvidenceRequired === undefined
        ? {}
        : { submission_evidence_required: input.submissionEvidenceRequired }),
      ...(input.deadline === undefined ? {} : { deadline: input.deadline }),
      ...(input.publicationState === undefined ? {} : { publication_state: input.publicationState })
    };
    if (Object.keys(patch).length > 0) {
      await this.resolve<DbRow[]>(
        this.client.from("jobs").update(patch).eq("id", jobId).select("id")
      );
    }
    if (input.references !== undefined) await this.replaceJobReferences(jobId, input.references);
  }

  async publishJob(jobId: string) {
    await this.updateJob(jobId, { publicationState: "open" });
  }

  async archiveJob(jobId: string) {
    await this.updateJob(jobId, { publicationState: "archived" });
  }

  async addAssignments(jobId: string, inputs: NewAssignmentInput[]) {
    await this.resolve<unknown>(
      this.client.rpc("add_job_assignments", {
        p_job_id: jobId,
        p_assignments: inputs.map((input) => ({
          professionalId: input.professionalId,
          agreedPay: input.agreedPay,
          deadline: input.deadline,
          leadReviewerId: input.leadReviewerId ?? null
        }))
      })
    );
  }

  async startAssignment(assignmentId: string) {
    await this.resolve<string>(
      this.client.rpc("start_assignment", { p_assignment_id: assignmentId })

    );
  }

  async submitAssignment(
    assignmentId: string,
    input: Pick<Submission, "notes" | "link" | "filePath" | "fileName">
  ) {
    await this.resolve<string>(
      this.client.rpc("submit_assignment", {
        p_assignment_id: assignmentId,
        p_notes: input.notes.trim(),
        p_link: input.link?.trim() || null,
        p_file_path: input.filePath?.trim() || null,
        p_file_name: input.fileName?.trim() || null
      })
    );
  }

  async reviewAssignment(command: AssignmentReviewCommand) {
    await this.resolve<string>(
      this.client.rpc("review_assignment", {
        p_assignment_id: command.assignmentId,
        p_decision: command.decision,
        p_comment: command.comment.trim()
      })
    );
  }

  async completeAssignment(assignmentId: string) {
    await this.resolve<string>(
      this.client.rpc("complete_assignment", { p_assignment_id: assignmentId })

    );
  }

  async cancelAssignment(assignmentId: string, reason: string) {
    await this.resolve<string>(
      this.client.rpc("cancel_assignment", {
        p_assignment_id: assignmentId,
        p_reason: reason.trim()
      })
    );
  }

  async recordPayment(paymentId: string, input: RecordPaymentInput) {
    await this.resolve<string>(
      this.client.rpc("record_payment", {
        p_payment_id: paymentId,
        p_status: input.status,
        p_payment_date: input.paymentDate ?? null,
        p_method: input.method ?? null,
        p_reference: input.reference?.trim() || null,
        p_receipt_path: input.receiptFilePath?.trim() || null,
        p_receipt_file_name: input.receiptFileName?.trim() || null,
        p_internal_note: input.internalNote?.trim() || null,
        p_issue_note: input.issueNote?.trim() || null
      })
    );
  }

  async correctPayment(
    paymentId: string,
    input: Required<Pick<RecordPaymentInput, "paymentDate" | "method" | "internalNote">> &
      Pick<RecordPaymentInput, "reference" | "receiptFileName" | "receiptFilePath"> & {
        correctionNote: string;
      }
  ) {
    await this.resolve<string>(
      this.client.rpc("correct_paid_payment", {
        p_payment_id: paymentId,
        p_payment_date: input.paymentDate,
        p_method: input.method,
        p_reference: input.reference?.trim() || null,
        p_receipt_path: input.receiptFilePath?.trim() || null,
        p_receipt_file_name: input.receiptFileName?.trim() || null,
        p_internal_note: input.internalNote.trim(),
        p_correction_note: input.correctionNote.trim()
      })
    );
  }

  async markNotificationRead(notificationId: string) {
    await this.resolve<string>(
      this.client.rpc("mark_notification_read", { p_notification_id: notificationId })

    );
  }

  async uploadPrivateFile(
    bucket: "readiness-evidence" | "assignment-submissions" | "payment-receipts",
    path: string,
    file: File
  ) {
    const { error } = await this.client.storage.from(bucket).upload(path, file, {
      upsert: true
    });
    if (error) throw new Error(error.message);
    return path;
  }
}
