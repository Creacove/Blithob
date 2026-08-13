import { create } from "zustand";
import { persist } from "zustand/middleware";
import { migrateLegacyState } from "../domain/migrate";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { SupabaseRepository } from "../lib/supabaseRepository";
import type {
  DemoPersona,
  DemoState,
  Job,
  Professional,
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

type BackendMode = "demo" | "remote";
type AsyncValue<T> = T | Promise<T>;

export interface CreateProfessionalInput {
  name: string;
  email: string;
  phone: string;
  location: string;
  adminNotes?: string;
}

export interface ServiceRequirementInput {
  id?: string;
  title: string;
  description: string;
  requiresEvidence: boolean;
}

export interface CreateServiceInput {
  name: string;
  shortName: string;
  description: string;
  requirements: ServiceRequirementInput[];
}

export type JobDraftInput = Omit<
  Job,
  "id" | "createdAt" | "updatedAt" | "publicationState"
> & {
  publicationState?: Job["publicationState"];
};

interface ProfessionalActions {
  session: Session | null;
  backendMode: BackendMode;
  isBootstrapping: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  error: string | null;
  signIn: (persona: DemoPersona) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => void;
  initializeBackend: () => Promise<void>;
  refreshRemote: () => Promise<void>;
  clearError: () => void;
  currentUser: () => DemoState["users"][number] | undefined;
  currentProfessional: () => Professional | undefined;
  resetDemo: () => void;

  createProfessional: (input: CreateProfessionalInput) => AsyncValue<string>;
  updateProfessional: (
    professionalId: string,
    input: Partial<
      Pick<
        Professional,
        "name" | "email" | "phone" | "location" | "adminNotes" | "accountStatus"
      >
    >
  ) => AsyncValue<void>;
  removeProfessional: (professionalId: string) => AsyncValue<boolean>;
  setLeadCapability: (professionalId: string, enabled: boolean) => AsyncValue<void>;

  createService: (input: CreateServiceInput) => AsyncValue<string>;
  updateService: (
    serviceId: string,
    input: Partial<Pick<Service, "name" | "shortName" | "description">>
  ) => AsyncValue<void>;
  replaceServiceRequirements: (
    serviceId: string,
    requirements: ServiceRequirementInput[]
  ) => AsyncValue<void>;
  setServiceActive: (serviceId: string, active: boolean) => AsyncValue<boolean>;

  createServiceEnrolment: (
    professionalId: string,
    serviceId: string,
    leadId?: string
  ) => AsyncValue<string | undefined>;
  assignServiceLead: (enrolmentId: string, leadId?: string) => AsyncValue<void>;
  setRequirementProgress: (
    enrolmentId: string,
    requirementId: string,
    input: Pick<
      RequirementProgress,
      "completed" | "evidenceLink" | "evidenceFilePath" | "evidenceFileName"
    >
  ) => AsyncValue<void>;
  submitServiceEnrolment: (enrolmentId: string) => AsyncValue<void>;
  reviewServiceEnrolment: (command: ServiceEnrolmentReviewCommand) => AsyncValue<void>;
  removeServiceEnrolment: (enrolmentId: string) => AsyncValue<boolean>;

  createJob: (input: JobDraftInput) => AsyncValue<string | undefined>;
  updateJob: (jobId: string, input: Partial<JobDraftInput>) => AsyncValue<void>;
  publishJob: (jobId: string) => AsyncValue<boolean>;
  archiveJob: (jobId: string) => AsyncValue<void>;

  addAssignments: (jobId: string, inputs: NewAssignmentInput[]) => AsyncValue<void>;
  startAssignment: (assignmentId: string) => AsyncValue<void>;
  submitAssignment: (
    assignmentId: string,
    input: Parameters<typeof submitAssignmentWorkflow>[2]
  ) => AsyncValue<void>;
  reviewAssignment: (command: AssignmentReviewCommand) => AsyncValue<void>;
  completeAssignment: (assignmentId: string) => AsyncValue<void>;
  cancelAssignment: (assignmentId: string, reason: string) => AsyncValue<void>;

  recordPayment: (
    paymentId: string,
    input: RecordPaymentInput
  ) => AsyncValue<void>;
  correctPayment: (
    paymentId: string,
    input: Parameters<typeof correctPaymentWorkflow>[2]
  ) => AsyncValue<void>;
  markNotificationRead: (notificationId: string) => AsyncValue<void>;

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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

function commit(update: () => unknown) {
  update();
}

function validJobForPublishing(state: DemoState, job: Job) {
  const service = state.services.find((item) => item.id === job.serviceId);
  const hasContent = (items: string[]) =>
    items.length > 0 && items.every((item) => item.trim());
  const referencesAreValid = job.references.every(
    (reference) =>
      reference.label.trim() &&
      (reference.kind === "link"
        ? Boolean(reference.url?.trim())
        : Boolean(reference.fileName?.trim()))
  );
  return Boolean(
    service?.active &&
      job.title.trim() &&
      job.objective.trim() &&
      job.description.trim() &&
      hasContent(job.steps) &&
      hasContent(job.deliverables) &&
      hasContent(job.acceptanceCriteria) &&
      referencesAreValid &&
      job.deadline.trim()
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
      backendMode: isSupabaseConfigured ? "remote" : "demo",
      isBootstrapping: isSupabaseConfigured,
      isLoading: false,
      isPasswordRecovery: false,
      error: null,

      signIn: (persona) =>
        set((state) => {
          const user = userForPersona(state, persona);
          return {
            session: user ? { persona, userId: user.id } : null
          };
        }),
      signInWithPassword: async () => undefined,
      signUp: async () => false,
      requestPasswordReset: async () => undefined,
      updatePassword: async () => undefined,
      signOut: () => set({ session: null }),
      initializeBackend: async () => undefined,
      refreshRemote: async () => undefined,
      clearError: () => set({ error: null }),
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

      updateProfessional: (professionalId, input) => {
        commit(() => set((state) => {
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
        }));
      },

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

      setLeadCapability: (professionalId, enabled) => {
        commit(() => set((state) => ({
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
        })));
      },

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
                id: requirement.id ?? makeId("requirement"),
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

      updateService: (serviceId, input) => {
        commit(() => set((state) => ({
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
        })));
      },

      replaceServiceRequirements: (serviceId, requirements) => {
        commit(() => set((state) => {
          const nextRequirements = requirements.map((requirement, order) => ({
            id: requirement.id ?? makeId("requirement"),
            title: requirement.title.trim(),
            description: requirement.description.trim(),
            requiresEvidence: requirement.requiresEvidence,
            order
          }));
          return {
            services: state.services.map((item) =>
              item.id === serviceId
                ? {
                    ...item,
                    requirements: nextRequirements,
                    updatedAt: now()
                  }
                : item
            ),
            serviceEnrolments: state.serviceEnrolments.map((enrolment) =>
              enrolment.serviceId === serviceId
                ? {
                    ...enrolment,
                    requirements: nextRequirements.map(
                      (requirement) =>
                        enrolment.requirements.find(
                          (progress) =>
                            progress.requirementId === requirement.id
                        ) ?? {
                          requirementId: requirement.id,
                          completed: false
                        }
                    ),
                    updatedAt: now()
                  }
                : enrolment
            )
          };
        }));
      },

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
        const enrolmentId = makeId("enrolment");
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

      assignServiceLead: (enrolmentId, leadId) => {
        commit(() => set((state) => {
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
        }));
      },

      setRequirementProgress: (enrolmentId, requirementId, input) => {
        commit(() => set((state) =>
          setRequirementProgressWorkflow(
            state,
            enrolmentId,
            requirementId,
            input
          )
        ));
      },
      submitServiceEnrolment: (enrolmentId) => {
        commit(() => set((state) => submitServiceEnrolmentWorkflow(state, enrolmentId)));
      },
      reviewServiceEnrolment: (command) => {
        commit(() => set((state) => reviewServiceEnrolmentWorkflow(state, command)));
      },
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

      updateJob: (jobId, input) => {
        commit(() => set((state) => ({
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
        })));
      },

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

      archiveJob: (jobId) => {
        commit(() => set((state) => ({
          jobs: state.jobs.map((item) =>
            item.id === jobId
              ? { ...item, publicationState: "archived", updatedAt: now() }
              : item
          )
        })));
      },

      addAssignments: (jobId, inputs) => {
        commit(() => set((state) => addAssignmentsWorkflow(state, jobId, inputs)));
      },
      startAssignment: (assignmentId) => {
        commit(() => set((state) => startAssignmentWorkflow(state, assignmentId)));
      },
      submitAssignment: (assignmentId, input) => {
        commit(() => set((state) =>
          submitAssignmentWorkflow(state, assignmentId, input)
        ));
      },
      reviewAssignment: (command) => {
        commit(() => set((state) => reviewAssignmentWorkflow(state, command)));
      },
      completeAssignment: (assignmentId) => {
        commit(() => set((state) => completeAssignmentWorkflow(state, assignmentId)));
      },
      cancelAssignment: (assignmentId, reason) => {
        commit(() => set((state) =>
          cancelAssignmentWorkflow(state, assignmentId, reason)
        ));
      },

      recordPayment: (paymentId, input) => {
        commit(() => set((state) => recordPaymentWorkflow(state, paymentId, input)));
      },
      correctPayment: (paymentId, input) => {
        commit(() => set((state) => correctPaymentWorkflow(state, paymentId, input)));
      },
      markNotificationRead: (notificationId) => {
        commit(() => set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === notificationId ? { ...item, read: true } : item
          )
        })));
      },

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
      },
      partialize: (state) =>
        state.backendMode === "remote"
          ? { backendMode: "remote", session: null }
          : state
    }
  )
);

function emptyRemoteState(): DemoState {
  return {
    users: [],
    professionals: [],
    services: [],
    serviceEnrolments: [],
    readinessReviews: [],
    jobs: [],
    assignments: [],
    submissions: [],
    assignmentReviews: [],
    payments: [],
    notifications: [],
    activity: []
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

const remoteRepository = supabase ? new SupabaseRepository(supabase) : null;
let authSubscription: { unsubscribe: () => void } | null = null;
let remoteQueue = Promise.resolve();
let remoteSessionGeneration = 0;

function beginRemoteSession() {
  remoteSessionGeneration += 1;
  remoteQueue = Promise.resolve();
  return remoteSessionGeneration;
}

function invalidateRemoteSession() {
  beginRemoteSession();
}

function isCurrentRemoteSession(userId: string, generation: number) {
  const state = useProfessionalStore.getState();
  return (
    generation === remoteSessionGeneration &&
    state.backendMode === "remote" &&
    (!state.session || state.session.userId === userId)
  );
}

async function hydrateRemote(
  userId: string,
  showLoading = true,
  generation = remoteSessionGeneration
) {
  if (!remoteRepository) return;
  if (!isCurrentRemoteSession(userId, generation)) return;
  if (showLoading) useProfessionalStore.setState({ isLoading: true });
  try {
    const remoteState = await remoteRepository.loadState();
    if (!isCurrentRemoteSession(userId, generation)) return;
    const user = remoteState.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error(
        "Your Supabase account exists, but its Blithob profile is not ready yet."
      );
    }
    const professional = user.professionalId
      ? remoteState.professionals.find(
          (item) => item.id === user.professionalId
        )
      : undefined;
    const persona: DemoPersona =
      user.accountRole === "admin"
        ? "admin"
        : professional?.isLead
          ? "lead"
          : "professional";
    useProfessionalStore.setState({
      ...remoteState,
      backendMode: "remote",
      session: { userId, persona },
      isPasswordRecovery: false,
      error: null
    });
  } finally {
    if (generation === remoteSessionGeneration) {
      useProfessionalStore.setState({
        isLoading: false,
        isBootstrapping: false
      });
    }
  }
}

async function initializeBackend() {
  if (!remoteRepository || !supabase) {
    useProfessionalStore.setState({
      backendMode: "demo",
      isBootstrapping: false,
      isLoading: false,
      isPasswordRecovery: false
    });
    return;
  }

  useProfessionalStore.setState({
    backendMode: "remote",
    isBootstrapping: true,
    error: null
  });

  try {
    if (!authSubscription) {
      const { data: authData } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_OUT") {
            invalidateRemoteSession();
            useProfessionalStore.setState({
              ...emptyRemoteState(),
              session: null,
              isPasswordRecovery: false,
              isBootstrapping: false,
              isLoading: false
            });
            return;
          }
          if (event === "PASSWORD_RECOVERY") {
            beginRemoteSession();
            useProfessionalStore.setState({
              backendMode: "remote",
              session: null,
              isPasswordRecovery: true,
              isBootstrapping: false,
              isLoading: false,
              error: null
            });
            return;
          }
          if (
            session &&
            (event === "SIGNED_IN" || event === "USER_UPDATED")
          ) {
            const generation = beginRemoteSession();
            void hydrateRemote(session.user.id, true, generation).catch(
              (error: unknown) => {
                if (generation === remoteSessionGeneration) {
                  useProfessionalStore.setState({ error: errorMessage(error) });
                }
              }
            );
          }
        }
      );
      authSubscription = authData.subscription;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    if (data.session) {
      const generation = beginRemoteSession();
      await hydrateRemote(data.session.user.id, true, generation);
    } else {
      invalidateRemoteSession();
      useProfessionalStore.setState({
        ...emptyRemoteState(),
        session: null,
        isPasswordRecovery: false,
        isBootstrapping: false,
        isLoading: false
      });
    }
  } catch (error) {
    useProfessionalStore.setState({
      error: errorMessage(error),
      isBootstrapping: false,
      isLoading: false
    });
  }
}

function scheduleRemote(operation: () => Promise<void>) {
  const state = useProfessionalStore.getState();
  if (
    !remoteRepository ||
    state.backendMode !== "remote" ||
    !state.session
  ) {
    return undefined;
  }

  const userId = state.session.userId;
  const generation = remoteSessionGeneration;
  const task = remoteQueue.catch(() => undefined).then(async () => {
    if (!isCurrentRemoteSession(userId, generation)) return;
    useProfessionalStore.setState({ isLoading: true });
    try {
      await operation();
      if (isCurrentRemoteSession(userId, generation)) {
        await hydrateRemote(userId, false, generation);
      }
    } catch (error) {
      if (!isCurrentRemoteSession(userId, generation)) return;
      const operationError = errorMessage(error);
      try {
        await hydrateRemote(userId, false, generation);
      } catch (refreshError) {
        useProfessionalStore.setState({ error: errorMessage(refreshError) });
      }
      useProfessionalStore.setState({ error: operationError });
      throw error;
    } finally {
      if (generation === remoteSessionGeneration) {
        useProfessionalStore.setState({ isLoading: false });
      }
    }
  });
  remoteQueue = task.catch(() => undefined);
  return task;
}

const baseActions = useProfessionalStore.getState();

useProfessionalStore.setState({
  initializeBackend,
  refreshRemote: async () => {
    const state = useProfessionalStore.getState();
    if (state.backendMode !== "remote" || !state.session) return;
    const generation = remoteSessionGeneration;
    await hydrateRemote(state.session.userId, true, generation).catch((error: unknown) => {
      useProfessionalStore.setState({ error: errorMessage(error) });
    });
  },
  signInWithPassword: async (email, password) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    useProfessionalStore.setState({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error("Supabase did not return a session.");
      const generation = beginRemoteSession();
      await hydrateRemote(data.session.user.id, true, generation);
    } catch (error) {
      useProfessionalStore.setState({ error: errorMessage(error) });
      throw error;
    } finally {
      useProfessionalStore.setState({ isLoading: false });
    }
  },
  signUp: async (email, password, displayName) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    useProfessionalStore.setState({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() }
        }
      });
      if (error) throw new Error(error.message);
      if (data.session) {
        const generation = beginRemoteSession();
        await hydrateRemote(data.session.user.id, true, generation);
        return false;
      }
      return true;
    } catch (error) {
      useProfessionalStore.setState({ error: errorMessage(error) });
      throw error;
    } finally {
      useProfessionalStore.setState({ isLoading: false });
    }
  },
  requestPasswordReset: async (email) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    useProfessionalStore.setState({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      useProfessionalStore.setState({ error: errorMessage(error) });
      throw error;
    } finally {
      useProfessionalStore.setState({ isLoading: false });
    }
  },
  updatePassword: async (password) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    useProfessionalStore.setState({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      useProfessionalStore.setState({ isPasswordRecovery: false });
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const generation = beginRemoteSession();
        await hydrateRemote(data.session.user.id, true, generation);
      }
    } catch (error) {
      useProfessionalStore.setState({ error: errorMessage(error) });
      throw error;
    } finally {
      useProfessionalStore.setState({ isLoading: false });
    }
  },
  clearError: () => useProfessionalStore.setState({ error: null }),
  signOut: () => {
    const wasRemote = useProfessionalStore.getState().backendMode === "remote";
    invalidateRemoteSession();
    baseActions.signOut();
    if (supabase && wasRemote) {
      void supabase.auth.signOut();
    }
  },
  resetDemo: () => {
    if (useProfessionalStore.getState().backendMode === "remote") {
      void useProfessionalStore.getState().refreshRemote();
      return;
    }
    baseActions.resetDemo();
  },
  createProfessional: (input) => {
    const id = baseActions.createProfessional(input) as string;
    if (remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.inviteProfessional(input, id).then(() => undefined));
      return task ? task.then(() => id) : id;
    }
    return id;
  },
  updateProfessional: (professionalId, input) => {
    baseActions.updateProfessional(professionalId, input);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.updateProfessional(professionalId, input));
    }
  },
  removeProfessional: (professionalId) => {
    const removed = baseActions.removeProfessional(professionalId);
    if (removed && remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.removeProfessional(professionalId));
      return task ? task.then(() => removed) : removed;
    }
    return removed;
  },
  setLeadCapability: (professionalId, enabled) => {
    baseActions.setLeadCapability(professionalId, enabled);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.setLeadCapability(professionalId, enabled));
    }
  },
  createService: (input) => {
    const id = baseActions.createService(input) as string;
    if (remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.createService(input, id));
      return task ? task.then(() => id) : id;
    }
    return id;
  },
  updateService: (serviceId, input) => {
    baseActions.updateService(serviceId, input);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.updateService(serviceId, input));
    }
  },
  replaceServiceRequirements: (serviceId, requirements) => {
    baseActions.replaceServiceRequirements(serviceId, requirements);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.replaceServiceRequirements(serviceId, requirements));
    }
  },
  setServiceActive: (serviceId, active) => {
    const changed = baseActions.setServiceActive(serviceId, active);
    if (changed && remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.setServiceActive(serviceId, active));
      return task ? task.then(() => changed) : changed;
    }
    return changed;
  },
  createServiceEnrolment: (professionalId, serviceId, leadId) => {
    const id = baseActions.createServiceEnrolment(
      professionalId,
      serviceId,
      leadId
    ) as string | undefined;
    if (id && remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.createServiceEnrolment(professionalId, serviceId, leadId, id));
      return task ? task.then(() => id) : id;
    }
    return id;
  },
  assignServiceLead: (enrolmentId, leadId) => {
    baseActions.assignServiceLead(enrolmentId, leadId);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.assignServiceLead(enrolmentId, leadId));
    }
  },
  setRequirementProgress: (enrolmentId, requirementId, input) => {
    baseActions.setRequirementProgress(enrolmentId, requirementId, input);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.setRequirementProgress(enrolmentId, requirementId, input));
    }
  },
  submitServiceEnrolment: (enrolmentId) => {
    baseActions.submitServiceEnrolment(enrolmentId);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.submitServiceEnrolment(enrolmentId));
    }
  },
  reviewServiceEnrolment: (command) => {
    baseActions.reviewServiceEnrolment(command);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.reviewServiceEnrolment(command));
    }
  },
  removeServiceEnrolment: (enrolmentId) => {
    const removed = baseActions.removeServiceEnrolment(enrolmentId);
    if (removed && remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.removeServiceEnrolment(enrolmentId));
      return task ? task.then(() => removed) : removed;
    }
    return removed;
  },
  createJob: (input) => {
    const id = baseActions.createJob(input) as string | undefined;
    if (id && remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.createJob(input, id));
      return task ? task.then(() => id) : id;
    }
    return id;
  },
  updateJob: (jobId, input) => {
    baseActions.updateJob(jobId, input);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.updateJob(jobId, input));
    }
  },
  publishJob: (jobId) => {
    const published = baseActions.publishJob(jobId);
    if (published && remoteRepository) {
      const task = scheduleRemote(() => remoteRepository.publishJob(jobId));
      return task ? task.then(() => published) : published;
    }
    return published;
  },
  archiveJob: (jobId) => {
    baseActions.archiveJob(jobId);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.archiveJob(jobId));
    }
  },
  addAssignments: (jobId, inputs) => {
    baseActions.addAssignments(jobId, inputs);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.addAssignments(jobId, inputs));
    }
  },
  startAssignment: (assignmentId) => {
    baseActions.startAssignment(assignmentId);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.startAssignment(assignmentId));
    }
  },
  submitAssignment: (assignmentId, input) => {
    baseActions.submitAssignment(assignmentId, input);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.submitAssignment(assignmentId, input));
    }
  },
  reviewAssignment: (command) => {
    baseActions.reviewAssignment(command);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.reviewAssignment(command));
    }
  },
  completeAssignment: (assignmentId) => {
    baseActions.completeAssignment(assignmentId);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.completeAssignment(assignmentId));
    }
  },
  cancelAssignment: (assignmentId, reason) => {
    baseActions.cancelAssignment(assignmentId, reason);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.cancelAssignment(assignmentId, reason));
    }
  },
  recordPayment: (paymentId, input) => {
    baseActions.recordPayment(paymentId, input);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.recordPayment(paymentId, input));
    }
  },
  correctPayment: (paymentId, input) => {
    baseActions.correctPayment(paymentId, input);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.correctPayment(paymentId, input));
    }
  },
  markNotificationRead: (notificationId) => {
    baseActions.markNotificationRead(notificationId);
    if (remoteRepository) {
      return scheduleRemote(() => remoteRepository.markNotificationRead(notificationId));
    }
  }
});
