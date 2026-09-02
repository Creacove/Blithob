export type AccountRole = "admin" | "professional";
export type DemoPersona = "admin" | "professional" | "lead";

export type ServiceEnrolmentStatus =
  | "not_started"
  | "in_progress"
  | "waiting_for_lead"
  | "changes_requested_by_lead"
  | "waiting_for_admin"
  | "changes_requested_by_admin"
  | "approved"
  | "paused";

export type JobPublicationState = "draft" | "open" | "archived";
export type JobOperationalStatus =
  | "draft"
  | "open"
  | "active"
  | "complete"
  | "archived";

export type AssignmentStatus =
  | "assigned"
  | "in_progress"
  | "waiting_for_lead"
  | "changes_requested_by_lead"
  | "waiting_for_admin"
  | "changes_requested_by_admin"
  | "approved"
  | "completed"
  | "cancelled";

export type PaymentStatus = "due" | "scheduled" | "paid" | "issue";
export type PaymentMethod =
  | "bank_transfer"
  | "mobile_money"
  | "cash"
  | "cheque"
  | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  accountRole: AccountRole;
  professionalId?: string;
}

export interface Professional {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  accountStatus: "active" | "inactive";
  isLead: boolean;
  joinedAt: string;
  adminNotes: string;
  completedAssignmentCount: number;
}

export interface ReadinessRequirement {
  id: string;
  title: string;
  description: string;
  requiresEvidence: boolean;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  shortName: string;
  description: string;
  active: boolean;
  slug?: string;
  publicLabel?: string;
  publicVisible?: boolean;
  displayOrder?: number;
  requirements: ReadinessRequirement[];
  createdAt: string;
  updatedAt: string;
}

export interface RequirementProgress {
  requirementId: string;
  completed: boolean;
  evidenceLink?: string;
  evidenceFilePath?: string;
  evidenceFileName?: string;
  completedAt?: string;
}

export interface ServiceEnrolment {
  id: string;
  professionalId: string;
  serviceId: string;
  leadId?: string;
  status: ServiceEnrolmentStatus;
  requirements: RequirementProgress[];
  leadCertifiedAt?: string;
  adminApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessReview {
  id: string;
  enrolmentId: string;
  reviewerUserId: string;
  reviewerType: "lead" | "admin";
  decision: "changes_requested" | "certified" | "approved";
  comment: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  serviceId: string;
  slug?: string;
  categoryId?: string;
  publicVisible?: boolean;
  publicSummary?: string;
  publicCompanyName?: string;
  employmentType?: string;
  workMode?: string;
  locationLabel?: string;
  rateMinMinor?: number;
  rateMaxMinor?: number;
  rateCurrency?: string;
  ratePeriod?: string;
  applicationDeadline?: string;
  featuredOrder?: number;
  clientContext: string;
  objective: string;
  description: string;
  steps: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
  references: Array<{
    id: string;
    label: string;
    kind: "link" | "file";
    url?: string;
    filePath?: string;
    fileName?: string;
  }>;
  submissionEvidenceRequired: boolean;
  deadline: string;
  publicationState: JobPublicationState;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  jobId: string;
  professionalId: string;
  leadReviewerId?: string;
  agreedPay: number;
  deadline: string;
  status: AssignmentStatus;
  startedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  version: number;
  notes: string;
  link?: string;
  filePath?: string;
  fileName?: string;
  submittedAt: string;
}

export interface AssignmentReview {
  id: string;
  assignmentId: string;
  submissionId: string;
  reviewerUserId: string;
  reviewerType: "lead" | "admin";
  decision: "changes_requested" | "certified" | "approved";
  comment: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  assignmentId: string;
  professionalId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paymentDate?: string;
  method?: PaymentMethod;
  reference?: string;
  receiptFilePath?: string;
  receiptFileName?: string;
  internalNote?: string;
  issueNote?: string;
  correctedAt?: string;
  correctionNote?: string;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  subject: string;
  subjectType?: string;
  subjectId?: string;
  createdAt: string;
}

export interface DemoState {
  users: User[];
  professionals: Professional[];
  services: Service[];
  serviceEnrolments: ServiceEnrolment[];
  readinessReviews: ReadinessReview[];
  jobs: Job[];
  assignments: Assignment[];
  submissions: Submission[];
  assignmentReviews: AssignmentReview[];
  payments: Payment[];
  notifications: Notification[];
  activity: ActivityEvent[];
}
