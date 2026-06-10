import { create } from "zustand";
import { persist } from "zustand/middleware";
import { migrateLegacyState } from "../domain/migrate";
import type {
  DemoPersona,
  DemoState,
  Job,
  Professional,
  ReadinessRequirement,
  RequirementProgress,
  Service
} from "../domain/model";
import {
  addAssignments as addAssignmentsWorkflow,
  cancelAssignment as cancelAssignmentWorkflow,
  completeAssignment as completeAssignmentWorkflow,
  correctPayment as correctPaymentWorkflow,
  createDemoState,
  type AssignmentReviewCommand,
  type NewAssignmentInput,
  type RecordPaymentInput,
  recordPayment as recordPaymentWorkflow,
  removeServiceEnrolment as removeServiceEnrolmentWorkflow,
  reviewAssignment as reviewAssignmentWorkflow,
  reviewServiceEnrolment as reviewServiceEnrolmentWorkflow,
  type ServiceEnrolmentReviewCommand,
  setRequirementProgress as setRequirementProgressWorkflow,
  setServiceActive as setServiceActiveWorkflow,
  startAssignment as startAssignmentWorkflow,
  submitAssignment as submitAssignmentWorkflow,
  submitServiceEnrolment as submitServiceEnrolmentWorkflow
} from "../domain/professionalWorkflow";
import {
  approvedServiceIdsFor,
  jobOperationalStatus,
  latestSubmissionFor,
  rankEligibleProfessionals
} from "../domain/selectors";

interface Session {
  userId: string;
  persona: DemoPersona;
}

export interface CreateProfessionalInput {
  name: string;
  email: string;
  phone: string;
  location: string;
  adminNotes?: string;
}

export interface CreateServiceInput {
  name: string;
  shortName: string;
  description: string;
  requirements: Array<
    Pick<
      ReadinessRequirement,
      "title" | "description" | "requiresEvidence"
    >
  >;
}

export type JobDraftInput = Omit<
  Job,
  "id" | "createdAt" | "updatedAt" | "publicationState"
> & {
  publicationState?: Job["publicationState"];
};

interface ProfessionalActions {
  session: Session | null;
  signIn: (persona: DemoPersona) => void;
  signOut: () => void;
  currentUser: () => DemoState["users"][number] | undefined;
  currentProfessional: () => Professional | undefined;
  resetDemo: () => void;

  createProfessional: (input: CreateProfessionalInput) => string;
  updateProfessional: (
    professionalId: string,
    input: Partial<
      Pick<
        Professional,
        "name" | "email" | "phone" | "location" | "adminNotes" | "accountStatus"
      >
    >
  ) => void;
  removeProfessional: (professionalId: string) => boolean;
  setLeadCapability: (professionalId: string, enabled: boolean) => void;

  createService: (input: CreateServiceInput) => string;
  updateService: (
    serviceId: string,
    input: Partial<Pick<Service, "name" | "shortName" | "description">>
  ) => void;
  replaceServiceRequirements: (
    serviceId: string,
    requirements: CreateServiceInput["requirements"]
  ) => void;
  setServiceActive: (serviceId: string, active: boolean) => boolean;

  createServiceEnrolment: (
    professionalId: string,
    serviceId: string,
    leadId?: string
  ) => string | undefined;
  assignServiceLead: (enrolmentId: string, leadId?: string) => void;
  setRequirementProgress: (
    enrolmentId: string,
    requirementId: string,
    input: Pick<
      RequirementProgress,
      "completed" | "evidenceLink" | "evidenceFileName"
    >
  ) => void;
  submitServiceEnrolment: (enrolmentId: string) => void;
  reviewServiceEnrolment: (command: ServiceEnrolmentReviewCommand) => void;
  removeServiceEnrolment: (enrolmentId: string) => boolean;

  createJob: (input: JobDraftInput) => string | undefined;
  updateJob: (jobId: string, input: Partial<JobDraftInput>) => void;
  publishJob: (jobId: string) => boolean;
  archiveJob: (jobId: string) => void;

  addAssignments: (jobId: string, inputs: NewAssignmentInput[]) => void;
  startAssignment: (assignmentId: string) => void;
  submitAssignment: (
    assignmentId: string,
    input: Parameters<typeof submitAssignmentWorkflow>[2]
  ) => void;
  reviewAssignment: (command: AssignmentReviewCommand) => void;
  completeAssignment: (assignmentId: string) => void;
  cancelAssignment: (assignmentId: string, reason: string) => void;

  recordPayment: (
    paymentId: string,
    input: RecordPaymentInput
  ) => void;
  correctPayment: (
    paymentId: string,
    input: Parameters<typeof correctPaymentWorkflow>[2]
  ) => void;
  markNotificationRead: (notificationId: string) => void;

  approvedServiceIdsFor: (professionalId: string) => string[];
  jobOperationalStatus: (
    jobId: string
  ) => ReturnType<typeof jobOperationalStatus>;
  latestSubmissionFor: (
    assignmentId: string
  ) => ReturnType<typeof latestSubmissionFor>;
  eligibleProfessionals: (
    jobId: string
  ) => ReturnType<typeof rankEligibleProfessionals>;
}

export type ProfessionalStore = DemoState & ProfessionalActions;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

function validJobForPublishing(state: DemoState, job: Job) {
  const service = state.services.find((item) => item.id === job.serviceId);
  return Boolean(
    service?.active &&
      job.title.trim() &&
      job.objective.trim() &&
      job.description.trim() &&
      job.steps.length > 0 &&
      job.deliverables.length > 0 &&
      job.acceptanceCriteria.length > 0 &&
      job.deadline
  );
}

function userForPersona(state: DemoState, persona: DemoPersona) {
  if (persona === "admin") {
    return (
      state.users.find((user) => user.id === "user-admin") ??
      state.users.find((user) => user.accountRole === "admin")
    );
  }

  const professionals = state.professionals.filter(
    (professional) =>
      professional.accountStatus === "active" &&
      (persona === "lead" ? professional.isLead : !professional.isLead)
  );
  const preferredUserId =
    persona === "lead" ? "user-nneka" : "user-amara";
  return (
    state.users.find(
      (user) =>
        user.id === preferredUserId &&
        professionals.some(
          (professional) => professional.id === user.professionalId
        )
    ) ??
    state.users.find((user) =>
      professionals.some(
        (professional) => professional.id === user.professionalId
      )
    )
  );
}

export const useProfessionalStore = create<ProfessionalStore>()(
  persist(
    (set, get) => ({
      ...createDemoState(),
      session: null,

      signIn: (persona) =>
        set((state) => {
          const user = userForPersona(state, persona);
          return {
            session: user ? { persona, userId: user.id } : null
          };
        }),
      signOut: () => set({ session: null }),
      currentUser: () => {
        const session = get().session;
        return session
          ? get().users.find((user) => user.id === session.userId)
          : undefined;
      },
      currentProfessional: () => {
        const user = get().currentUser();
        return user?.professionalId
          ? get().professionals.find(
              (professional) => professional.id === user.professionalId
            )
          : undefined;
      },
      resetDemo: () => set({ ...createDemoState(), session: null }),

      createProfessional: (input) => {
        const professionalId = makeId("professional");
        const userId = makeId("user");
        set((state) => ({
          users: [
            ...state.users,
            {
              id: userId,
              name: input.name.trim(),
              email: input.email.trim(),
              accountRole: "professional",
              professionalId
            }
          ],
          professionals: [
            ...state.professionals,
            {
              id: professionalId,
              userId,
              name: input.name.trim(),
              email: input.email.trim(),
              phone: input.phone.trim(),
              location: input.location.trim(),
              accountStatus: "active",
              isLead: false,
              joinedAt: now(),
              adminNotes: input.adminNotes?.trim() ?? "",
              completedAssignmentCount: 0
            }
          ]
        }));
        return professionalId;
      },

      updateProfessional: (professionalId, input) =>
        set((state) => {
          const professional = state.professionals.find(
            (item) => item.id === professionalId
          );
          if (!professional) return state;
          const nextName = input.name?.trim() || professional.name;
          const nextEmail = input.email?.trim() || professional.email;
          return {
            professionals: state.professionals.map((item) =>
              item.id === professionalId
                ? {
                    ...item,
                    ...input,
                    name: nextName,
                    email: nextEmail,
                    phone: input.phone?.trim() ?? item.phone,
                    location: input.location?.trim() ?? item.location,
                    adminNotes:
                      input.adminNotes?.trim() ?? item.adminNotes
                  }
                : item
            ),
            users: state.users.map((item) =>
              item.id === professional.userId
                ? { ...item, name: nextName, email: nextEmail }
                : item
            )
          };
        }),

      removeProfessional: (professionalId) => {
        const state = get();
        const professional = state.professionals.find(
          (item) => item.id === professionalId
        );
        if (
          !professional ||
          state.serviceEnrolments.some(
            (item) => item.professionalId === professionalId
          ) ||
          state.assignments.some(
            (item) => item.professionalId === professionalId
          )
        ) {
          return false;
        }
        set({
          professionals: state.professionals.filter(
            (item) => item.id !== professionalId
          ),
          users: state.users.filter((item) => item.id !== professional.userId)
        });
        return true;
      },

      setLeadCapability: (professionalId, enabled) =>
        set((state) => ({
          professionals: state.professionals.map((item) =>
            item.id === professionalId ? { ...item, isLead: enabled } : item
          ),
          serviceEnrolments: enabled
            ? state.serviceEnrolments
            : state.serviceEnrolments.map((item) =>
                item.leadId === professionalId
                  ? {
                      ...item,
                      leadId: undefined,
                      status:
                        item.status === "waiting_for_lead"
                          ? "waiting_for_admin"
                          : item.status,
                      updatedAt: now()
                    }
                  : item
              ),
          assignments: enabled
            ? state.assignments
            : state.assignments.map((item) =>
                item.leadReviewerId === professionalId
                  ? {
                      ...item,
                      leadReviewerId: undefined,
                      status:
                        item.status === "waiting_for_lead"
                          ? "waiting_for_admin"
                          : item.status
                    }
                  : item
              )
        })),

      createService: (input) => {
        const serviceId = makeId("service");
        const createdAt = now();
        set((state) => ({
          services: [
            ...state.services,
            {
              id: serviceId,
              name: input.name.trim(),
              shortName: input.shortName.trim(),
              description: input.description.trim(),
              active: true,
              requirements: input.requirements.map((requirement, order) => ({
                id: makeId("requirement"),
                title: requirement.title.trim(),
                description: requirement.description.trim(),
                requiresEvidence: requirement.requiresEvidence,
                order
              })),
              createdAt,
              updatedAt: createdAt
            }
          ]
        }));
        return serviceId;
      },

      updateService: (serviceId, input) =>
        set((state) => ({
          services: state.services.map((item) =>
            item.id === serviceId
              ? {
                  ...item,
                  name: input.name?.trim() || item.name,
                  shortName: input.shortName?.trim() || item.shortName,
                  description:
                    input.description?.trim() ?? item.description,
                  updatedAt: now()
                }
              : item
          )
        })),

      replaceServiceRequirements: (serviceId, requirements) =>
        set((state) => ({
          services: state.services.map((item) =>
            item.id === serviceId
              ? {
                  ...item,
                  requirements: requirements.map((requirement, order) => ({
                    id: item.requirements[order]?.id ?? makeId("requirement"),
                    title: requirement.title.trim(),
                    description: requirement.description.trim(),
                    requiresEvidence: requirement.requiresEvidence,
                    order
                  })),
                  updatedAt: now()
                }
              : item
          )
        })),

      setServiceActive: (serviceId, active) => {
        const state = get();
        const next = setServiceActiveWorkflow(state, serviceId, active);
        if (next === state) return false;
        set(next);
        return true;
      },

      createServiceEnrolment: (professionalId, serviceId, leadId) => {
        const state = get();
        const service = state.services.find((item) => item.id === serviceId);
        const professional = state.professionals.find(
          (item) => item.id === professionalId
        );
        const duplicate = state.serviceEnrolments.some(
          (item) =>
            item.professionalId === professionalId &&
            item.serviceId === serviceId &&
            item.status !== "paused"
        );
        if (!service?.active || !professional || duplicate) return undefined;

        const lead =
          leadId !== professionalId
            ? state.professionals.find(
                (item) => item.id === leadId && item.isLead
              )
            : undefined;
        const enrolmentId = `enrolment-${professionalId}-${serviceId}`;
        const createdAt = now();
        set({
          serviceEnrolments: [
            ...state.serviceEnrolments,
            {
              id: enrolmentId,
              professionalId,
              serviceId,
              leadId: lead?.id,
              status: "not_started",
              requirements: service.requirements.map((requirement) => ({
                requirementId: requirement.id,
                completed: false
              })),
              createdAt,
              updatedAt: createdAt
            }
          ]
        });
        return enrolmentId;
      },

      assignServiceLead: (enrolmentId, leadId) =>
        set((state) => {
          const enrolment = state.serviceEnrolments.find(
            (item) => item.id === enrolmentId
          );
          const lead = state.professionals.find(
            (item) => item.id === leadId && item.isLead
          );
          if (!enrolment || leadId === enrolment.professionalId) return state;
          return {
            serviceEnrolments: state.serviceEnrolments.map((item) =>
              item.id === enrolmentId
                ? { ...item, leadId: lead?.id, updatedAt: now() }
                : item
            )
          };
        }),

      setRequirementProgress: (enrolmentId, requirementId, input) =>
        set((state) =>
          setRequirementProgressWorkflow(
            state,
            enrolmentId,
            requirementId,
            input
          )
        ),
      submitServiceEnrolment: (enrolmentId) =>
        set((state) => submitServiceEnrolmentWorkflow(state, enrolmentId)),
      reviewServiceEnrolment: (command) =>
        set((state) => reviewServiceEnrolmentWorkflow(state, command)),
      removeServiceEnrolment: (enrolmentId) => {
        const state = get();
        const next = removeServiceEnrolmentWorkflow(state, enrolmentId);
        if (next === state) return false;
        set(next);
        return true;
      },

      createJob: (input) => {
        const state = get();
        if (!state.services.some((item) => item.id === input.serviceId && item.active)) {
          return undefined;
        }
        const jobId = makeId("job");
        const createdAt = now();
        set({
          jobs: [
            ...state.jobs,
            {
              ...input,
              id: jobId,
              publicationState: input.publicationState ?? "draft",
              createdAt,
              updatedAt: createdAt
            }
          ]
        });
        return jobId;
      },

      updateJob: (jobId, input) =>
        set((state) => ({
          jobs: state.jobs.map((item) =>
            item.id === jobId
              ? {
                  ...item,
                  ...input,
                  id: item.id,
                  createdAt: item.createdAt,
                  updatedAt: now()
                }
              : item
          )
        })),

      publishJob: (jobId) => {
        const state = get();
        const job = state.jobs.find((item) => item.id === jobId);
        if (!job || !validJobForPublishing(state, job)) return false;
        set({
          jobs: state.jobs.map((item) =>
            item.id === jobId
              ? { ...item, publicationState: "open", updatedAt: now() }
              : item
          )
        });
        return true;
      },

      archiveJob: (jobId) =>
        set((state) => ({
          jobs: state.jobs.map((item) =>
            item.id === jobId
              ? { ...item, publicationState: "archived", updatedAt: now() }
              : item
          )
        })),

      addAssignments: (jobId, inputs) =>
        set((state) => addAssignmentsWorkflow(state, jobId, inputs)),
      startAssignment: (assignmentId) =>
        set((state) => startAssignmentWorkflow(state, assignmentId)),
      submitAssignment: (assignmentId, input) =>
        set((state) =>
          submitAssignmentWorkflow(state, assignmentId, input)
        ),
      reviewAssignment: (command) =>
        set((state) => reviewAssignmentWorkflow(state, command)),
      completeAssignment: (assignmentId) =>
        set((state) => completeAssignmentWorkflow(state, assignmentId)),
      cancelAssignment: (assignmentId, reason) =>
        set((state) =>
          cancelAssignmentWorkflow(state, assignmentId, reason)
        ),

      recordPayment: (paymentId, input) =>
        set((state) => recordPaymentWorkflow(state, paymentId, input)),
      correctPayment: (paymentId, input) =>
        set((state) => correctPaymentWorkflow(state, paymentId, input)),
      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === notificationId ? { ...item, read: true } : item
          )
        })),

      approvedServiceIdsFor: (professionalId) =>
        approvedServiceIdsFor(get(), professionalId),
      jobOperationalStatus: (jobId) =>
        jobOperationalStatus(get(), jobId),
      latestSubmissionFor: (assignmentId) =>
        latestSubmissionFor(get(), assignmentId),
      eligibleProfessionals: (jobId) =>
        rankEligibleProfessionals(get(), jobId)
    }),
    {
      name: "blithob-professionals-demo",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return {
            ...migrateLegacyState(persistedState),
            session: null
          } as ProfessionalStore;
        }
        return persistedState as ProfessionalStore;
      }
    }
  )
);
