export type Role = "admin" | "trainer" | "worker";

export type OpportunityStatus =
  | "draft"
  | "open"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "needs_revision"
  | "accepted"
  | "completed";

export type PayoutStatus = "pending" | "scheduled" | "paid";

export type TrainingStatus =
  | "in_progress"
  | "awaiting_review"
  | "lead_approved"
  | "approved";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  workerId?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  active: boolean;
}

export interface TrainingTask {
  id: string;
  title: string;
  description: string;
  requiresEvidence: boolean;
}

export interface TrainingTrack {
  id: string;
  serviceId: string;
  title: string;
  tasks: TrainingTask[];
}

export interface WorkerTraining {
  trackId: string;
  completedTaskIds: string[];
  status: TrainingStatus;
  evidenceNote?: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "training" | "ready" | "active";
  approvedServiceIds: string[];
  training: WorkerTraining[];
  completedCount: number;
  notes: string;
  joinedAt: string;
  /** True when this worker has been promoted to Lead role */
  isLead: boolean;
  /** The Lead worker assigned to supervise this worker's training (set by admin) */
  trainingLeadId?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  serviceId: string;
  description: string;
  /** Plain text steps, one per line — rendered as a numbered list */
  steps: string;
  /** Acceptance criteria — each item is one criterion rendered as a checkbox */
  acceptanceCriteria: string[];
  expectedOutput: string;
  deadline: string;
  payAmount: number;
  readinessLevel: "foundation" | "approved";
  status: OpportunityStatus;
  /** Workers assigned to this job (multi-assign) */
  assignedWorkerIds: string[];
  /** Legacy single-assign field kept for compatibility */
  assignedWorkerId?: string;
  /** The Lead who acts as quality reviewer for this job's submissions */
  leadId?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  opportunityId: string;
  workerId: string;
  assignedAt: string;
}

export interface Submission {
  id: string;
  opportunityId: string;
  workerId: string;
  notes: string;
  link?: string;
  fileName?: string;
  submittedAt: string;
}

export interface Review {
  id: string;
  opportunityId: string;
  reviewerId: string;
  decision: "needs_revision" | "accepted" | "forwarded";
  comment: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  opportunityId: string;
  workerId: string;
  amount: number;
  dueDate: string;
  status: PayoutStatus;
  paidAt?: string;
  reference?: string;
  paymentMethod?: string;
  receiptFileName?: string;
}

export interface Notification {
  id: string;
  recipientRole: Role;
  recipientId?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  channel: "in_app" | "email_simulation";
}

export interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  subject: string;
  createdAt: string;
}

export interface DemoState {
  users: User[];
  workers: WorkerProfile[];
  services: ServiceCategory[];
  trainingTracks: TrainingTrack[];
  opportunities: Opportunity[];
  assignments: Assignment[];
  submissions: Submission[];
  reviews: Review[];
  payouts: Payout[];
  notifications: Notification[];
  activity: ActivityEvent[];
}

export interface WorkerMatch {
  worker: WorkerProfile;
  workload: number;
  score: number;
  reasons: string[];
}
