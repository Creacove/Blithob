import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DemoState,
  Notification,
  Opportunity,
  Review,
  Role,
  ServiceCategory,
  User,
  WorkerProfile
} from "../domain/types";
import {
  approveTraining as approveTrainingWorkflow,
  completeOpportunity as completeOpportunityWorkflow,
  createDemoState,
  leadApproveTraining as leadApproveTrainingWorkflow,
  rankEligibleWorkers,
  reviewSubmission as reviewSubmissionWorkflow,
  setOpportunityStatus,
  submitOpportunity as submitOpportunityWorkflow
} from "../domain/workflow";

interface Session {
  userId: string;
  role: Role;
}

interface WorkerInput {
  name: string;
  email: string;
  phone: string;
  location: string;
  trackId: string;
}

interface OpportunityInput {
  title: string;
  serviceId: string;
  description: string;
  steps: string;
  acceptanceCriteria: string[];
  expectedOutput: string;
  deadline: string;
  payAmount: number;
  readinessLevel: "foundation" | "approved";
  leadId?: string;
}

interface SubmissionInput {
  notes: string;
  link?: string;
  fileName?: string;
}

interface TrainingTrackInput {
  serviceId: string;
  title: string;
  tasks: Array<{
    title: string;
    description: string;
  }>;
}

interface ServiceCategoryInput {
  name: string;
  shortName: string;
  description: string;
  tasks?: Array<{ title: string; description: string }>;
}

interface AppActions {
  session: Session | null;
  signIn: (role: Role) => void;
  signOut: () => void;
  currentUser: () => User | undefined;
  resetDemo: () => void;

  // Workers
  addWorker: (input: WorkerInput) => void;
  promoteToLead: (workerId: string) => void;
  assignTrainingLead: (workerId: string, leadId: string) => void;
  updateWorkerProfile: (
    workerId: string,
    input: Pick<WorkerProfile, "name" | "email" | "phone" | "location">
  ) => void;

  // Services
  toggleService: (serviceId: string) => void;
  addServiceCategory: (input: ServiceCategoryInput) => void;
  updateServiceCategory: (id: string, input: ServiceCategoryInput) => void;

  // Training
  addTrainingTrack: (input: TrainingTrackInput) => void;
  toggleTrainingTask: (
    workerId: string,
    trackId: string,
    taskId: string
  ) => void;
  approveTraining: (workerId: string, trackId: string) => void;
  leadApproveTraining: (workerId: string, trackId: string) => void;

  // Opportunities / Jobs
  createOpportunity: (input: OpportunityInput) => string;
  assignWorkerToOpportunity: (opportunityId: string, workerId: string) => void;
  removeWorkerFromOpportunity: (opportunityId: string, workerId: string) => void;
  setLeadForOpportunity: (opportunityId: string, leadId: string | null) => void;
  startOpportunity: (opportunityId: string) => void;
  submitOpportunity: (
    opportunityId: string,
    workerId: string,
    input: SubmissionInput
  ) => void;
  reviewSubmission: (
    opportunityId: string,
    decision: "needs_revision" | "accepted" | "forwarded",
    comment: string
  ) => void;
  completeOpportunity: (opportunityId: string) => void;

  // Payouts
  markPayoutPaid: (
    payoutId: string,
    reference: string,
    paymentMethod: string,
    receiptFileName?: string
  ) => void;

  // Notifications
  markNotificationRead: (notificationId: string) => void;

  // Queries
  eligibleWorkers: (opportunityId: string) => ReturnType<typeof rankEligibleWorkers>;
}

export type AppStore = DemoState & AppActions;

const id = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const roleUser: Record<Role, string> = {
  admin: "user-admin",
  trainer: "user-trainer",
  worker: "user-amara"
};

const activity = (actor: string, action: string, subject: string) => ({
  id: id("activity"),
  actor,
  action,
  subject,
  createdAt: new Date().toISOString()
});

const notification = (
  recipientRole: Role,
  title: string,
  message: string,
  recipientId?: string
): Notification => ({
  id: id("notification"),
  recipientRole,
  recipientId,
  title,
  message,
  createdAt: new Date().toISOString(),
  read: false,
  channel: "email_simulation"
});

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createDemoState(),
      session: null,
      signIn: (role) => set({ session: { role, userId: roleUser[role] } }),
      signOut: () => set({ session: null }),
      currentUser: () => {
        const session = get().session;
        return session
          ? get().users.find((user) => user.id === session.userId)
          : undefined;
      },
      resetDemo: () => set({ ...createDemoState() }),

      // ── Workers ─────────────────────────────────────────────────────────
      addWorker: (input) =>
        set((state) => {
          const workerId = id("worker");
          const userId = id("user");
          const worker: WorkerProfile = {
            id: workerId,
            userId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            location: input.location,
            status: "training",
            approvedServiceIds: [],
            training: [
              {
                trackId: input.trackId,
                completedTaskIds: [],
                status: "in_progress"
              }
            ],
            completedCount: 0,
            notes: "New worker added through the prototype.",
            joinedAt: new Date().toISOString().slice(0, 10),
            isLead: false
          };
          const user: User = {
            id: userId,
            name: input.name,
            email: input.email,
            role: "worker",
            workerId
          };
          return {
            workers: [worker, ...state.workers],
            users: [...state.users, user],
            notifications: [
              notification(
                "worker",
                "Welcome to Blithob Professionals",
                "Your account is ready and your first training track has been assigned.",
                workerId
              ),
              ...state.notifications
            ],
            activity: [
              activity("Ayo Blithob", "added worker", input.name),
              ...state.activity
            ]
          };
        }),

      promoteToLead: (workerId) =>
        set((state) => {
          const worker = state.workers.find((w) => w.id === workerId);
          if (!worker || worker.isLead) return state;
          return {
            workers: state.workers.map((w) =>
              w.id === workerId ? { ...w, isLead: true } : w
            ),
            users: state.users.map((u) =>
              u.workerId === workerId ? { ...u, role: "trainer" as Role } : u
            ),
            notifications: [
              notification(
                "trainer",
                "You've been promoted to Lead",
                "You now have access to the Lead workspace and can review work and train others.",
                workerId
              ),
              ...state.notifications
            ],
            activity: [
              activity("Admin", "promoted to Lead", worker.name),
              ...state.activity
            ]
          };
        }),

      assignTrainingLead: (workerId, leadId) =>
        set((state) => {
          const lead = state.workers.find((w) => w.id === leadId);
          const worker = state.workers.find((w) => w.id === workerId);
          if (!lead || !worker) return state;
          return {
            workers: state.workers.map((w) =>
              w.id === workerId ? { ...w, trainingLeadId: leadId } : w
            ),
            activity: [
              activity(
                "Admin",
                "assigned training Lead",
                `${lead.name} → ${worker.name}`
              ),
              ...state.activity
            ]
          };
        }),

      updateWorkerProfile: (workerId, input) =>
        set((state) => ({
          workers: state.workers.map((worker) =>
            worker.id === workerId ? { ...worker, ...input } : worker
          ),
          users: state.users.map((user) =>
            user.workerId === workerId
              ? { ...user, name: input.name, email: input.email }
              : user
          )
        })),

      // ── Services ─────────────────────────────────────────────────────────
      toggleService: (serviceId) =>
        set((state) => {
          const service = state.services.find((item) => item.id === serviceId);
          if (!service) return state;
          return {
            services: state.services.map((item) =>
              item.id === serviceId ? { ...item, active: !item.active } : item
            ),
            activity: [
              activity(
                "Admin",
                service.active ? "deactivated service" : "activated service",
                service.name
              ),
              ...state.activity
            ]
          };
        }),

      addServiceCategory: (input) =>
        set((state) => {
          const newService: ServiceCategory = {
            id: id("service"),
            name: input.name,
            shortName: input.shortName,
            description: input.description,
            active: true
          };
          return {
            services: [...state.services, newService],
            activity: [
              activity("Admin", "added service category", input.name),
              ...state.activity
            ]
          };
        }),

      updateServiceCategory: (serviceId, input) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.id === serviceId ? { ...s, ...input } : s
          )
        })),

      // ── Training ─────────────────────────────────────────────────────────
      addTrainingTrack: (input) =>
        set((state) => ({
          trainingTracks: [
            {
              id: id("track"),
              serviceId: input.serviceId,
              title: input.title,
              tasks: input.tasks.map((task) => ({
                id: id("task"),
                title: task.title,
                description: task.description,
                requiresEvidence: true
              }))
            },
            ...state.trainingTracks
          ],
          activity: [
            activity("Admin", "created training track", input.title),
            ...state.activity
          ]
        })),

      toggleTrainingTask: (workerId, trackId, taskId) =>
        set((state) => {
          const track = state.trainingTracks.find((item) => item.id === trackId);
          const worker = state.workers.find((w) => w.id === workerId);
          return {
            workers: state.workers.map((w) => {
              if (w.id !== workerId) return w;
              return {
                ...w,
                training: w.training.map((progress) => {
                  if (progress.trackId !== trackId) return progress;
                  const exists = progress.completedTaskIds.includes(taskId);
                  const completedTaskIds = exists
                    ? progress.completedTaskIds.filter((item) => item !== taskId)
                    : [...progress.completedTaskIds, taskId];
                  const allComplete = track?.tasks.every((task) =>
                    completedTaskIds.includes(task.id)
                  );

                  let newStatus = progress.status;
                  if (allComplete && progress.status === "in_progress") {
                    newStatus = "awaiting_review";
                    // Notification will be fired below in the outer set
                  } else if (!allComplete && progress.status === "awaiting_review") {
                    newStatus = "in_progress";
                  }

                  return { ...progress, completedTaskIds, status: newStatus };
                })
              };
            }),
            notifications: (() => {
              const trackObj = state.trainingTracks.find((t) => t.id === trackId);
              const allDone = trackObj?.tasks.every((t) =>
                [...(worker?.training.find((p) => p.trackId === trackId)?.completedTaskIds ?? []),
                 ...(state.workers.find((w) => w.id === workerId)?.training.find((p) => p.trackId === trackId)?.completedTaskIds ?? [])
                ].includes(t.id)
              );
              // Only add notification when becoming awaiting_review
              const wasInProgress = worker?.training.find((p) => p.trackId === trackId)?.status === "in_progress";
              if (allDone && wasInProgress && worker?.trainingLeadId) {
                const lead = state.workers.find((w) => w.id === worker.trainingLeadId);
                if (lead) {
                  return [
                    notification(
                      "trainer",
                      "Training review needed",
                      `${worker.name} has completed all tasks for ${trackObj?.title ?? "a training track"}.`,
                      lead.id
                    ),
                    ...state.notifications
                  ];
                }
              }
              return state.notifications;
            })()
          };
        }),

      approveTraining: (workerId, trackId) =>
        set((state) => approveTrainingWorkflow(state, workerId, trackId)),

      leadApproveTraining: (workerId, trackId) =>
        set((state) => {
          const currentUser = get().currentUser();
          const leadWorker = state.workers.find(
            (w) => w.userId === currentUser?.id
          );
          return leadApproveTrainingWorkflow(
            state,
            workerId,
            trackId,
            leadWorker?.name ?? "Lead"
          );
        }),

      // ── Opportunities ────────────────────────────────────────────────────
      createOpportunity: (input) => {
        const opportunityId = id("opportunity");
        set((state) => {
          const opportunity: Opportunity = {
            id: opportunityId,
            title: input.title,
            serviceId: input.serviceId,
            description: input.description,
            steps: input.steps,
            acceptanceCriteria: input.acceptanceCriteria,
            expectedOutput: input.expectedOutput,
            deadline: input.deadline,
            payAmount: input.payAmount,
            readinessLevel: input.readinessLevel,
            status: "open",
            assignedWorkerIds: [],
            leadId: input.leadId || undefined,
            createdAt: new Date().toISOString().slice(0, 10)
          };
          return {
            opportunities: [opportunity, ...state.opportunities],
            activity: [
              activity("Admin", "created job", input.title),
              ...state.activity
            ]
          };
        });
        return opportunityId;
      },

      assignWorkerToOpportunity: (opportunityId, workerId) =>
        set((state) => {
          const opportunity = state.opportunities.find(
            (item) => item.id === opportunityId
          );
          const worker = state.workers.find((item) => item.id === workerId);
          if (
            !opportunity ||
            !worker ||
            !worker.approvedServiceIds.includes(opportunity.serviceId)
          ) {
            return state;
          }
          if (opportunity.assignedWorkerIds.includes(workerId)) return state;

          const newIds = [...opportunity.assignedWorkerIds, workerId];
          return {
            opportunities: state.opportunities.map((item) =>
              item.id === opportunityId
                ? {
                    ...item,
                    assignedWorkerIds: newIds,
                    assignedWorkerId: newIds[0],
                    status:
                      item.status === "open" ? "assigned" : item.status
                  }
                : item
            ),
            assignments: [
              {
                id: id("assignment"),
                opportunityId,
                workerId,
                assignedAt: new Date().toISOString()
              },
              ...state.assignments
            ],
            notifications: [
              notification(
                "worker",
                "New job assigned",
                `${opportunity.title} is ready for you to review.`,
                workerId
              ),
              ...state.notifications
            ],
            activity: [
              activity("Admin", "assigned", `${worker.name} → ${opportunity.title}`),
              ...state.activity
            ]
          };
        }),

      removeWorkerFromOpportunity: (opportunityId, workerId) =>
        set((state) => {
          const opportunity = state.opportunities.find(
            (item) => item.id === opportunityId
          );
          if (!opportunity) return state;
          const newIds = opportunity.assignedWorkerIds.filter(
            (wid) => wid !== workerId
          );
          return {
            opportunities: state.opportunities.map((item) =>
              item.id === opportunityId
                ? {
                    ...item,
                    assignedWorkerIds: newIds,
                    assignedWorkerId: newIds[0],
                    status: newIds.length === 0 ? "open" : item.status
                  }
                : item
            )
          };
        }),

      setLeadForOpportunity: (opportunityId, leadId) =>
        set((state) => ({
          opportunities: state.opportunities.map((item) =>
            item.id === opportunityId
              ? { ...item, leadId: leadId ?? undefined }
              : item
          )
        })),

      startOpportunity: (opportunityId) =>
        set((state) =>
          setOpportunityStatus(state, opportunityId, "in_progress")
        ),

      submitOpportunity: (opportunityId, workerId, input) =>
        set((state) =>
          submitOpportunityWorkflow(state, opportunityId, {
            ...input,
            workerId
          })
        ),

      reviewSubmission: (opportunityId, decision, comment) =>
        set((state) => {
          const currentUser = get().currentUser();
          const reviewer = state.workers.find(
            (w) => w.userId === currentUser?.id
          );
          return reviewSubmissionWorkflow(
            state,
            opportunityId,
            decision,
            comment,
            reviewer?.name ?? currentUser?.name ?? "Reviewer"
          );
        }),

      completeOpportunity: (opportunityId) =>
        set((state) => completeOpportunityWorkflow(state, opportunityId)),

      // ── Payouts ──────────────────────────────────────────────────────────
      markPayoutPaid: (payoutId, reference, paymentMethod, receiptFileName) =>
        set((state) => {
          const payout = state.payouts.find((item) => item.id === payoutId);
          const worker = state.workers.find(
            (item) => item.id === payout?.workerId
          );
          if (!payout) return state;
          return {
            payouts: state.payouts.map((item) =>
              item.id === payoutId
                ? {
                    ...item,
                    status: "paid",
                    paidAt: new Date().toISOString().slice(0, 10),
                    reference,
                    paymentMethod,
                    receiptFileName
                  }
                : item
            ),
            notifications: [
              notification(
                "worker",
                "Payment recorded",
                `${paymentMethod} payment of ₦${payout.amount.toLocaleString()} has been recorded. Ref: ${reference}`,
                payout.workerId
              ),
              ...state.notifications
            ],
            activity: [
              activity(
                "Admin",
                "recorded payment for",
                worker?.name ?? "worker"
              ),
              ...state.activity
            ]
          };
        }),

      // ── Notifications ────────────────────────────────────────────────────
      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === notificationId ? { ...item, read: true } : item
          )
        })),

      // ── Queries ──────────────────────────────────────────────────────────
      eligibleWorkers: (opportunityId) =>
        rankEligibleWorkers(get(), opportunityId)
    }),
    {
      name: "blithob-professionals-demo"
    }
  )
);
