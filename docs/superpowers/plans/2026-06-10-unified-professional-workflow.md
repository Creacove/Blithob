# Unified Professional Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split Worker/Trainer prototype with one Professional workspace, independent job assignments, service-readiness enrolments, routed reviews, and manual assignment-level payments.

**Architecture:** Keep the prototype client-only, but build a normalized v2
domain and Zustand store beside the legacy prototype so every checkpoint still
compiles. The v2 state is organized around Professionals, Services, Service
Enrolments, Jobs, Assignments, Submissions, Reviews, and Payments. Put business
rules in pure domain functions and selectors, keep store actions as thin
wrappers, switch React Router to the new pages only after route shells exist,
then delete the legacy model. Use body-portal drawers for contextual actions
and confirmation dialogs only for destructive or permission-changing
decisions.

**Tech Stack:** React 19, TypeScript 5.9, React Router 7, Zustand 5, React Hook Form, Zod, Tailwind CSS 4, Vitest, Testing Library, Playwright.

---

## Baseline

Run from `C:\Users\USER\Documents\Blithop`.

- `npm run build` passes.
- `npm test` has 1 existing failure: the legacy eligibility selector includes Lead Nneka in an assertion written for workers only.
- `npm run lint` has 2 existing errors in `src/pages/shared/MyWorkPage.tsx` and `src/store/appStore.ts`.
- The legacy E2E suite is shallow and does not verify independent assignments, Lead routing, readiness approval, or payment evidence.

The first four tasks intentionally replace the failing legacy model. Do not try to preserve its `trainer`, `trainingTracks`, `assignedWorkerId`, shared Job status, or Job-level submission behavior.

## Target File Map

### Domain and State

- Create `src/domain/model.ts`: normalized v2 entities and status unions.
- Create `src/domain/selectors.ts`: derived readiness, Job status, queues, and matching.
- Create `src/domain/selectors.test.ts`: selector coverage.
- Create `src/domain/professionalWorkflow.ts`: demo state and pure mutations.
- Create `src/domain/professionalWorkflow.test.ts`: readiness, assignment, review, completion, and payment tests.
- Create `src/domain/migrate.ts`: migrate legacy persisted state to v2.
- Create `src/domain/migrate.test.ts`: migration coverage.
- Create `src/store/professionalStore.ts`: session and thin action wrappers.
- Create `src/store/professionalStore.test.ts`: persona, action, and persistence tests.

### Shared Interface

- Create `src/components/Drawer.tsx`: viewport-level action drawer.
- Create `src/components/ConfirmDialog.tsx`: focused confirmation dialog.
- Create `src/components/RecordTimeline.tsx`: submission/review history.
- Create `src/components/ToastProvider.tsx`: accessible mutation feedback.
- Modify `src/components/Modal.tsx`: keep only as a compatibility wrapper until legacy pages are removed.
- Modify `src/components/StatusBadge.tsx`: v2 status vocabulary.
- Modify `src/components/ui.tsx`: compact list, toolbar, and field primitives.
- Modify `src/components/AppShell.tsx`: Admin and Professional navigation with Lead capabilities.
- Modify `src/index.css`: 8-point spacing, refined utilitarian visual system, responsive drawers, and shell.
- Modify `src/App.tsx`: durable Admin and Professional routes.
- Modify `src/App.test.tsx`: route and permission coverage.
- Modify `src/pages/LoginPage.tsx`: Admin, Professional, and Lead demo personas.

### Admin Workspace

- Modify `src/pages/admin/AdminDashboard.tsx`: action-oriented Today page.
- Create `src/pages/admin/PeoplePage.tsx`: searchable Professional directory.
- Create `src/pages/admin/ProfessionalDetailPage.tsx`: identity, enrolments, work, payments, notes, and permissions.
- Create `src/pages/admin/ServicesPage.tsx`: service directory.
- Create `src/pages/admin/ServiceDetailPage.tsx`: service editing and readiness requirements.
- Create `src/pages/admin/JobsPage.tsx`: compact Job directory.
- Create `src/pages/admin/JobEditorPage.tsx`: dedicated Job create/edit form.
- Create `src/pages/admin/JobDetailPage.tsx`: full brief and assignment table.
- Create `src/pages/admin/AdminAssignmentPage.tsx`: assignment evidence, review history, and completion.
- Create `src/pages/admin/AdminPaymentPage.tsx`: durable Payment detail and correction actions.
- Modify `src/pages/admin/AdminReviewsPage.tsx`: separate Work and Readiness queues.
- Create `src/pages/admin/AdminPaymentsPage.tsx`: manual Payment queue and recording drawer.

### Professional Workspace

- Create `src/pages/professional/TodayPage.tsx`: personal action queue.
- Create `src/pages/professional/WorkPage.tsx`: assignment inbox.
- Create `src/pages/professional/AssignmentPage.tsx`: full brief, status, submission, and timeline.
- Create `src/pages/professional/TrainingPage.tsx`: Service Enrolment directory.
- Create `src/pages/professional/TrainingDetailPage.tsx`: readiness checklist and evidence.
- Create `src/pages/professional/TeamPage.tsx`: Lead-supervised enrolments.
- Create `src/pages/professional/LeadReviewsPage.tsx`: assignments routed to the Lead.
- Create `src/pages/professional/PaymentsPage.tsx`: Payment records and receipt detail.
- Create `src/pages/professional/PaymentDetailPage.tsx`: durable personal Payment detail.
- Create `src/pages/professional/ProfilePage.tsx`: single editable identity panel.
- Modify `src/pages/NotificationsPage.tsx`: recipient-user notifications.

### Cleanup and Acceptance

- Modify `src/components/designSystem.test.tsx`: v2 status and drawer tests.
- Replace `e2e/prototype.spec.ts`: approved end-to-end scenario.
- Delete legacy pages after their replacements are routed:
  - `src/pages/admin/AdminTrainingPage.tsx`
  - `src/pages/admin/OpportunitiesPage.tsx`
  - `src/pages/admin/PayoutsPage.tsx`
  - `src/pages/admin/WorkersPage.tsx`
  - `src/pages/shared/MyWorkPage.tsx`
  - `src/pages/trainer/TraineesPage.tsx`
  - `src/pages/trainer/TrainerDashboard.tsx`
  - `src/pages/trainer/TrainerReviewsPage.tsx`
  - `src/pages/worker/WorkerDashboard.tsx`
  - `src/pages/worker/WorkerPayoutsPage.tsx`
  - `src/pages/worker/WorkerTrainingPage.tsx`
  - `src/pages/RouteShell.tsx`
- Delete the legacy model after every active import uses v2:
  - `src/domain/types.ts`
  - `src/domain/workflow.ts`
  - `src/domain/workflow.test.ts`
  - `src/store/appStore.ts`
  - `src/store/appStore.test.ts`

## Task 1: Normalize Entities and Derived Selectors

**Files:**
- Create: `src/domain/model.ts`
- Create: `src/domain/selectors.ts`
- Create: `src/domain/selectors.test.ts`
- Create: `src/domain/professionalWorkflow.ts`
- Create: `src/domain/professionalWorkflow.test.ts`
- Modify: `src/domain/workflow.test.ts`

- [ ] **Step 1: Replace the legacy domain types**

Create `src/domain/model.ts` with normalized v2 types. Use these exact status names so UI, workflow, and tests share one vocabulary:

```ts
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
  requirements: ReadinessRequirement[];
  createdAt: string;
  updatedAt: string;
}

export interface RequirementProgress {
  requirementId: string;
  completed: boolean;
  evidenceLink?: string;
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
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  version: number;
  notes: string;
  link?: string;
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
```

- [ ] **Step 2: Write selector tests**

Create `src/domain/selectors.test.ts` with tests that prove:

```ts
import { describe, expect, it } from "vitest";
import { createDemoState } from "./professionalWorkflow";
import {
  approvedServiceIdsFor,
  assignmentReviewDestination,
  jobOperationalStatus,
  rankEligibleProfessionals
} from "./selectors";

describe("domain selectors", () => {
  it("derives service approval from approved enrolments", () => {
    const state = createDemoState();
    expect(approvedServiceIdsFor(state, "professional-amara")).toContain(
      "service-social"
    );
  });

  it("keeps Lead capability inside the Professional model", () => {
    const state = createDemoState();
    const nneka = state.professionals.find(
      (item) => item.id === "professional-nneka"
    );
    expect(nneka).toMatchObject({ isLead: true, accountStatus: "active" });
    expect(state.users.find((item) => item.id === nneka?.userId)?.accountRole)
      .toBe("professional");
  });

  it("derives active Job progress from independent Assignments", () => {
    const state = createDemoState();
    expect(jobOperationalStatus(state, "job-campaign")).toBe("active");
  });

  it("routes a Lead's own work directly to Admin", () => {
    const state = createDemoState();
    expect(
      assignmentReviewDestination(state, "assignment-nneka-newsletter")
    ).toBe("admin");
  });

  it("matches approved Professionals and includes eligible Leads", () => {
    const state = createDemoState();
    const ids = rankEligibleProfessionals(state, "job-open-social").map(
      (match) => match.professional.id
    );
    expect(ids).toEqual([
      "professional-nneka",
      "professional-amara",
      "professional-david"
    ]);
  });
});
```

- [ ] **Step 3: Run selector tests and verify they fail**

Run:

```powershell
npx vitest run src/domain/selectors.test.ts
```

Expected: FAIL because normalized entities and selectors do not exist.

- [ ] **Step 4: Implement selectors**

Create `src/domain/selectors.ts` with pure functions:

```ts
import type {
  DemoState,
  JobOperationalStatus,
  Professional
} from "./model";

export function approvedServiceIdsFor(
  state: DemoState,
  professionalId: string
): string[] {
  return state.serviceEnrolments
    .filter(
      (item) =>
        item.professionalId === professionalId && item.status === "approved"
    )
    .map((item) => item.serviceId);
}

export function jobOperationalStatus(
  state: DemoState,
  jobId: string
): JobOperationalStatus {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job || job.publicationState === "draft") return "draft";
  if (job.publicationState === "archived") return "archived";
  const assignments = state.assignments.filter((item) => item.jobId === jobId);
  if (assignments.length === 0) return "open";
  if (
    assignments.every((item) =>
      ["completed", "cancelled"].includes(item.status)
    ) &&
    assignments.some((item) => item.status === "completed")
  ) {
    return "complete";
  }
  return "active";
}

export function assignmentReviewDestination(
  state: DemoState,
  assignmentId: string
): "lead" | "admin" {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (
    !assignment?.leadReviewerId ||
    assignment.leadReviewerId === assignment.professionalId
  ) {
    return "admin";
  }
  return "lead";
}

export function latestSubmissionFor(
  state: DemoState,
  assignmentId: string
) {
  return state.submissions
    .filter((item) => item.assignmentId === assignmentId)
    .sort((a, b) => b.version - a.version)[0];
}

export interface ProfessionalMatch {
  professional: Professional;
  activeAssignmentCount: number;
  score: number;
  reasons: string[];
}

export function rankEligibleProfessionals(
  state: DemoState,
  jobId: string
): ProfessionalMatch[] {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return [];
  return state.professionals
    .filter(
      (professional) =>
        professional.accountStatus === "active" &&
        approvedServiceIdsFor(state, professional.id).includes(job.serviceId)
    )
    .map((professional) => {
      const activeAssignmentCount = state.assignments.filter(
        (assignment) =>
          assignment.professionalId === professional.id &&
          !["completed", "cancelled"].includes(assignment.status)
      ).length;
      return {
        professional,
        activeAssignmentCount,
        score:
          100 -
          activeAssignmentCount * 20 +
          professional.completedAssignmentCount,
        reasons: [
          `Approved for ${
            state.services.find((item) => item.id === job.serviceId)?.name ??
            "this service"
          }`,
          `${activeAssignmentCount} active assignment${
            activeAssignmentCount === 1 ? "" : "s"
          }`,
          `${professional.completedAssignmentCount} completed assignment${
            professional.completedAssignmentCount === 1 ? "" : "s"
          }`
        ]
      };
    })
    .sort(
      (left, right) =>
        left.activeAssignmentCount - right.activeAssignmentCount ||
        right.professional.completedAssignmentCount -
          left.professional.completedAssignmentCount
    );
}
```

- [ ] **Step 5: Replace the demo fixture**

Create `createDemoState()` in `src/domain/professionalWorkflow.ts` using the normalized types and stable IDs used by the tests. The fixture must include:

- Admin user Ayo.
- Professional user Amara.
- Lead Professional user Nneka with `accountRole: "professional"` and `isLead: true`.
- Professional David.
- Professional Zainab in Social Media readiness supervised by Nneka.
- Social Media, Content, Virtual Assistance, and Data Entry Services with ordered readiness requirements.
- Approved enrolments for eligible service matching.
- `enrolment-zainab-social`: every requirement complete with required evidence,
  status `in_progress`, supervised by Nneka.
- `enrolment-zainab-waiting-admin`: status `waiting_for_admin`.
- `enrolment-nneka-data`: Nneka's own enrolment, status `waiting_for_lead`,
  used to verify self-review rejection.
- `enrolment-amara-social-approved`: approved and linked to existing work.
- `job-open-social`: published, evidence required, and no Assignments.
- `job-campaign`: published with independent Amara and David Assignments.
- `assignment-amara-campaign`: status `in_progress`, reviewed by Nneka.
- `assignment-david-campaign`: status `in_progress`, direct to Admin.
- `assignment-amara-revision`: status `in_progress`, reviewed by Nneka.
- `assignment-waiting-lead`: status `waiting_for_lead` with a current Submission.
- `assignment-approved`: status `approved`.
- `assignment-nneka-newsletter`: Nneka is the assignee and no Lead reviewer is
  set.
- `payment-due-cash` and `payment-due-transfer`: status `due`.
- `payment-paid-amara`: a paid record available for correction tests.

Use arrays for Job `steps`, `deliverables`, and `acceptanceCriteria`; do not retain newline-delimited step strings.

Create `src/domain/professionalWorkflow.test.ts` with one fixture
integrity test for this checkpoint:

```ts
import { describe, expect, it } from "vitest";
import { createDemoState } from "./professionalWorkflow";

describe("normalized demo state", () => {
  it("contains no orphan Assignment relationships", () => {
    const state = createDemoState();
    for (const assignment of state.assignments) {
      expect(state.jobs.some((item) => item.id === assignment.jobId)).toBe(true);
      expect(
        state.professionals.some(
          (item) => item.id === assignment.professionalId
        )
      ).toBe(true);
    }
  });
});
```

Do not import or alter the legacy `src/domain/workflow.ts`; Tasks 2 and 3 add
normalized mutations to `professionalWorkflow.ts`. Update the one failing
legacy ranking assertion in `src/domain/workflow.test.ts` to expect
`worker-nneka` before Amara and David because a Lead remains eligible for
personal work.

- [ ] **Step 6: Run domain tests**

Run:

```powershell
npx vitest run src/domain/selectors.test.ts src/domain/professionalWorkflow.test.ts
npm run build
```

Expected: selector and normalized fixture tests pass; the legacy app still
builds because the v2 model is additive.

- [ ] **Step 7: Commit normalized entities and selectors**

```powershell
git add src/domain/model.ts src/domain/selectors.ts src/domain/selectors.test.ts src/domain/professionalWorkflow.ts src/domain/professionalWorkflow.test.ts src/domain/workflow.test.ts
git commit -m "refactor: normalize professional workflow entities"
```

## Task 2: Implement Service Readiness Workflow

**Files:**
- Modify: `src/domain/professionalWorkflow.ts`
- Modify: `src/domain/professionalWorkflow.test.ts`

- [ ] **Step 1: Add normalized readiness tests**

Add these tests to `src/domain/professionalWorkflow.test.ts`:

```ts
it("submits completed readiness to the assigned Lead", () => {
  const state = createDemoState();
  const next = submitServiceEnrolment(state, "enrolment-zainab-social");
  expect(
    next.serviceEnrolments.find(
      (item) => item.id === "enrolment-zainab-social"
    )?.status
  ).toBe("waiting_for_lead");
});

it("requires evidence on requirements that declare it", () => {
  const state = createDemoState();
  const next = setRequirementProgress(
    state,
    "enrolment-zainab-social",
    "social-sample",
    { completed: true }
  );
  expect(next).toBe(state);
});

it("routes Lead certification to Admin", () => {
  const submitted = submitServiceEnrolment(
    createDemoState(),
    "enrolment-zainab-social"
  );
  const next = reviewServiceEnrolment(submitted, {
    enrolmentId: "enrolment-zainab-social",
    reviewerUserId: "user-nneka",
    reviewerType: "lead",
    decision: "certified",
    comment: "Evidence meets the service standard."
  });
  expect(
    next.serviceEnrolments.find(
      (item) => item.id === "enrolment-zainab-social"
    )?.status
  ).toBe("waiting_for_admin");
});

it("returns Admin-requested changes directly to Admin", () => {
  const state = createDemoState();
  const next = reviewServiceEnrolment(state, {
    enrolmentId: "enrolment-zainab-waiting-admin",
    reviewerUserId: "user-admin",
    reviewerType: "admin",
    decision: "changes_requested",
    comment: "Replace the sample with the final client-ready format."
  });
  expect(
    next.serviceEnrolments.find(
      (item) => item.id === "enrolment-zainab-waiting-admin"
    )?.status
  ).toBe("changes_requested_by_admin");
});

it("prevents a Lead from certifying their own enrolment", () => {
  const state = createDemoState();
  expect(
    reviewServiceEnrolment(state, {
      enrolmentId: "enrolment-nneka-data",
      reviewerUserId: "user-nneka",
      reviewerType: "lead",
      decision: "certified",
      comment: "Self review"
    })
  ).toBe(state);
});

it("does not remove approved or work-linked enrolments", () => {
  const state = createDemoState();
  expect(
    removeServiceEnrolment(state, "enrolment-amara-social-approved")
  ).toBe(state);
});
```

- [ ] **Step 2: Run readiness tests and verify they fail**

```powershell
npx vitest run src/domain/professionalWorkflow.test.ts
```

Expected: FAIL because the new readiness commands are not implemented.

- [ ] **Step 3: Implement readiness mutations**

Add pure functions to `src/domain/professionalWorkflow.ts`:

```ts
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
  return {
    ...state,
    serviceEnrolments: state.serviceEnrolments.map((item) =>
      item.id === enrolmentId
        ? {
            ...item,
            status: "in_progress",
            updatedAt: new Date().toISOString(),
            requirements: item.requirements.map((progress) =>
              progress.requirementId === requirementId
                ? {
                    ...progress,
                    ...input,
                    completedAt: input.completed
                      ? new Date().toISOString()
                      : undefined
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
    enrolment.status === "changes_requested_by_admin" || !enrolment.leadId;
  return updateEnrolmentStatus(
    state,
    enrolmentId,
    returnsToAdmin ? "waiting_for_admin" : "waiting_for_lead"
  );
}
```

Implement `reviewServiceEnrolment` with these exact transitions:

- Lead `changes_requested` -> `changes_requested_by_lead`.
- Lead `certified` -> `waiting_for_admin` and set `leadCertifiedAt`.
- Admin `changes_requested` -> `changes_requested_by_admin`.
- Admin `approved` -> `approved` and set `adminApprovedAt`.
- Reject self-review when the reviewer Professional matches the enrolment Professional.
- Append one `ReadinessReview`.
- Notify the Professional after changes or approval; notify Admin after Lead certification.

Also implement:

```ts
export function removeServiceEnrolment(
  state: DemoState,
  enrolmentId: string
): DemoState;

export function setServiceActive(
  state: DemoState,
  serviceId: string,
  active: boolean
): DemoState;
```

`removeServiceEnrolment` rejects approved enrolments and rejects removal when
the Professional has an Assignment for a Job using that Service.
`setServiceActive(false)` rejects deactivation while a draft/open Job or a
non-approved enrolment depends on the Service.

- [ ] **Step 4: Run readiness tests**

```powershell
npx vitest run src/domain/professionalWorkflow.test.ts -t "readiness|enrolment|Lead"
```

Expected: PASS.

- [ ] **Step 5: Commit readiness workflow**

```powershell
git add src/domain/professionalWorkflow.ts src/domain/professionalWorkflow.test.ts
git commit -m "feat: add routed service readiness workflow"
```

## Task 3: Implement Independent Assignment, Review, and Payment Workflow

**Files:**
- Modify: `src/domain/professionalWorkflow.ts`
- Modify: `src/domain/professionalWorkflow.test.ts`
- Modify: `src/domain/selectors.ts`
- Modify: `src/domain/selectors.test.ts`

- [ ] **Step 1: Add independent Assignment tests**

Add tests covering:

```ts
it("creates independent Assignments with different pay and reviewers", () => {
  const state = createDemoState();
  const next = addAssignments(state, "job-open-social", [
    {
      professionalId: "professional-amara",
      agreedPay: 145000,
      deadline: "2026-06-24",
      leadReviewerId: "professional-nneka"
    },
    {
      professionalId: "professional-david",
      agreedPay: 120000,
      deadline: "2026-06-25"
    }
  ]);
  const created = next.assignments.filter(
    (item) => item.jobId === "job-open-social"
  );
  expect(created).toHaveLength(2);
  expect(created.map((item) => item.agreedPay)).toEqual([145000, 120000]);
});

it("submits one Assignment without changing its sibling", () => {
  const state = createDemoState();
  const next = submitAssignment(state, "assignment-amara-campaign", {
    notes: "Calendar and captions are ready.",
    link: "https://example.com/amara-campaign"
  });
  expect(
    next.assignments.find(
      (item) => item.id === "assignment-amara-campaign"
    )?.status
  ).toBe("waiting_for_lead");
  expect(
    next.assignments.find(
      (item) => item.id === "assignment-david-campaign"
    )?.status
  ).toBe("in_progress");
});

it("preserves submission versions after revision", () => {
  const state = createDemoState();
  const once = submitAssignment(state, "assignment-amara-revision", {
    notes: "First version",
    link: "https://example.com/v1"
  });
  const revised = reviewAssignment(once, {
    assignmentId: "assignment-amara-revision",
    reviewerUserId: "user-nneka",
    reviewerType: "lead",
    decision: "changes_requested",
    comment: "Add publishing dates."
  });
  const twice = submitAssignment(revised, "assignment-amara-revision", {
    notes: "Dates added",
    link: "https://example.com/v2"
  });
  expect(
    twice.submissions
      .filter((item) => item.assignmentId === "assignment-amara-revision")
      .map((item) => item.version)
  ).toEqual([1, 2]);
});

it("routes Lead certification to Admin and Admin approval to approved", () => {
  const state = createDemoState();
  const certified = reviewAssignment(state, {
    assignmentId: "assignment-waiting-lead",
    reviewerUserId: "user-nneka",
    reviewerType: "lead",
    decision: "certified",
    comment: "Meets the brief."
  });
  const approved = reviewAssignment(certified, {
    assignmentId: "assignment-waiting-lead",
    reviewerUserId: "user-admin",
    reviewerType: "admin",
    decision: "approved",
    comment: "Final approval."
  });
  expect(
    approved.assignments.find(
      (item) => item.id === "assignment-waiting-lead"
    )?.status
  ).toBe("approved");
});

it("completes one Assignment and creates exactly one Payment", () => {
  const state = createDemoState();
  const next = completeAssignment(state, "assignment-approved");
  const repeated = completeAssignment(next, "assignment-approved");
  expect(
    next.payments.filter(
      (item) => item.assignmentId === "assignment-approved"
    )
  ).toHaveLength(1);
  expect(
    repeated.payments.filter(
      (item) => item.assignmentId === "assignment-approved"
    )
  ).toHaveLength(1);
});

it("allows Cash without a reference and requires it for transfer", () => {
  const state = createDemoState();
  const cash = recordPayment(state, "payment-due-cash", {
    status: "paid",
    paymentDate: "2026-06-10",
    method: "cash",
    reference: "",
    internalNote: "Paid from petty cash."
  });
  expect(
    cash.payments.find((item) => item.id === "payment-due-cash")?.status
  ).toBe("paid");

  const transfer = recordPayment(state, "payment-due-transfer", {
    status: "paid",
    paymentDate: "2026-06-10",
    method: "bank_transfer",
    reference: ""
  });
  expect(transfer).toBe(state);
});

it("requires an explicit reason to correct a paid Payment", () => {
  const state = createDemoState();
  expect(
    correctPayment(state, "payment-paid-amara", {
      paymentDate: "2026-06-10",
      method: "bank_transfer",
      reference: "TRF-CORRECTED",
      internalNote: "Corrected bank reference.",
      correctionNote: ""
    })
  ).toBe(state);
});

it("cancels only the selected Assignment", () => {
  const state = createDemoState();
  const next = cancelAssignment(
    state,
    "assignment-amara-campaign",
    "Client reduced the delivery scope."
  );
  expect(
    next.assignments.find(
      (item) => item.id === "assignment-amara-campaign"
    )?.status
  ).toBe("cancelled");
  expect(
    next.assignments.find(
      (item) => item.id === "assignment-david-campaign"
    )?.status
  ).toBe("in_progress");
});
```

- [ ] **Step 2: Run Assignment tests and verify they fail**

```powershell
npx vitest run src/domain/professionalWorkflow.test.ts
```

Expected: FAIL because Assignment-level commands do not exist.

- [ ] **Step 3: Implement Assignment creation and submission**

Implement:

```ts
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
): DemoState;

export function startAssignment(
  state: DemoState,
  assignmentId: string
): DemoState;

export function submitAssignment(
  state: DemoState,
  assignmentId: string,
  input: Pick<Submission, "notes" | "link" | "fileName">
): DemoState;
```

Rules:

- Only active Professionals with an approved Service Enrolment for the Job can be assigned.
- Skip duplicate Professional/Job pairs.
- Remove `leadReviewerId` when it equals `professionalId`.
- `startAssignment` accepts only `assigned`.
- `submitAssignment` accepts `in_progress`, `changes_requested_by_lead`, and `changes_requested_by_admin`.
- Require notes. Require at least one link or file only when the Job has
  `submissionEvidenceRequired: true`.
- Version is previous maximum + 1.
- Route to `waiting_for_lead` only when `assignmentReviewDestination()` returns `lead`; otherwise route to `waiting_for_admin`.
- Never remove older Submissions.

- [ ] **Step 4: Implement Assignment reviews and completion**

Implement:

```ts
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
): DemoState;

export function completeAssignment(
  state: DemoState,
  assignmentId: string
): DemoState;

export function cancelAssignment(
  state: DemoState,
  assignmentId: string,
  reason: string
): DemoState;
```

Enforce:

- Lead may act only on `waiting_for_lead`, must be the assigned Lead, and cannot be the assignee.
- Admin may act only on `waiting_for_admin`.
- Lead changes -> `changes_requested_by_lead`.
- Lead certification -> `waiting_for_admin`.
- Admin changes -> `changes_requested_by_admin`.
- Admin approval -> `approved`.
- Every review references the latest Submission ID.
- Completion accepts only `approved`.
- Completion increments only that Professional's count.
- Completion creates one immediately `due` Payment for the Assignment's
  `agreedPay`, with `dueDate` set to the completion date.
- Cancellation requires a reason, rejects completed Assignments, preserves
  Submission and review history, and notifies the Professional.

- [ ] **Step 5: Implement manual Payment recording**

Implement:

```ts
export interface RecordPaymentInput {
  status: "scheduled" | "paid" | "issue";
  paymentDate?: string;
  method?: PaymentMethod;
  reference?: string;
  receiptFileName?: string;
  internalNote?: string;
  issueNote?: string;
}

export function recordPayment(
  state: DemoState,
  paymentId: string,
  input: RecordPaymentInput
): DemoState;
```

Validation:

- `paid` requires date and method.
- `paid` requires a trimmed reference unless method is `cash`.
- `issue` requires `issueNote`.
- Preserve optional receipt and internal note.
- Add Professional notification and activity.

Add an explicit correction command for paid records:

```ts
export function correctPayment(
  state: DemoState,
  paymentId: string,
  input: Required<
    Pick<RecordPaymentInput, "paymentDate" | "method" | "internalNote">
  > &
    Pick<RecordPaymentInput, "reference" | "receiptFileName"> & {
      correctionNote: string;
    }
): DemoState;
```

`correctPayment` accepts only `paid` records, requires a correction note,
revalidates the Cash reference exception, sets `correctedAt`, and writes an
activity event. Regular `recordPayment` rejects edits to an already paid
record.

- [ ] **Step 6: Run domain tests**

```powershell
npx vitest run src/domain/professionalWorkflow.test.ts src/domain/selectors.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Assignment workflows**

```powershell
git add src/domain/professionalWorkflow.ts src/domain/professionalWorkflow.test.ts src/domain/selectors.ts src/domain/selectors.test.ts
git commit -m "feat: add independent assignment review and payment flows"
```

## Task 4: Replace Store Sessions and Migrate Persisted Data

**Files:**
- Create: `src/domain/migrate.ts`
- Create: `src/domain/migrate.test.ts`
- Create: `src/store/professionalStore.ts`
- Create: `src/store/professionalStore.test.ts`

- [ ] **Step 1: Write legacy migration tests**

Create `src/domain/migrate.test.ts` with a minimal legacy snapshot:

```ts
it("converts trainer accounts into Lead Professionals", () => {
  const migrated = migrateLegacyState({
    users: [
      {
        id: "user-trainer",
        name: "Nneka",
        email: "nneka@example.com",
        role: "trainer",
        workerId: "worker-nneka"
      }
    ],
    workers: [
      {
        id: "worker-nneka",
        userId: "user-trainer",
        name: "Nneka",
        email: "nneka@example.com",
        phone: "0800",
        location: "Lagos",
        status: "active",
        approvedServiceIds: [],
        training: [],
        completedCount: 2,
        notes: "Lead",
        joinedAt: "2025-01-01",
        isLead: true
      }
    ]
  });
  expect(migrated.users[0]).toMatchObject({
    accountRole: "professional",
    professionalId: "worker-nneka"
  });
  expect(migrated.professionals[0]?.isLead).toBe(true);
});
```

Also test that one legacy Job with two `assignedWorkerIds` becomes two Assignments, and each legacy Submission is attached to the matching Assignment.

- [ ] **Step 2: Run migration tests and verify they fail**

```powershell
npx vitest run src/domain/migrate.test.ts
```

Expected: FAIL because `migrateLegacyState` does not exist.

- [ ] **Step 3: Implement defensive migration**

Create `src/domain/migrate.ts`:

```ts
import type { DemoState } from "./model";
import { createDemoState } from "./professionalWorkflow";

export function migrateLegacyState(input: unknown): DemoState {
  if (!input || typeof input !== "object") return createDemoState();
  const legacy = input as Record<string, unknown>;
  if (Array.isArray(legacy.professionals) && Array.isArray(legacy.jobs)) {
    return legacy as unknown as DemoState;
  }
  if (!Array.isArray(legacy.workers) || !Array.isArray(legacy.users)) {
    return createDemoState();
  }
  return convertLegacySnapshot(legacy as unknown as LegacySnapshot);
}
```

Define typed local legacy interfaces and implement `convertLegacySnapshot` in
the same file with these deterministic mappings:

- Legacy `role: "trainer"` becomes `accountRole: "professional"` and forces
  `isLead: true`.
- Legacy worker IDs become Professional IDs so cross-record references remain
  stable.
- Each Training Track becomes its Service's ordered `requirements`.
- Each worker training record becomes `enrolment-${workerId}-${serviceId}`.
- `approvedServiceIds` create approved enrolments when no training record
  already represents that Service.
- Each `assignedWorkerIds` entry becomes
  `assignment-${opportunityId}-${workerId}` with the legacy Job pay and
  deadline.
- A legacy Job Lead becomes the Assignment Lead except when the Lead is also
  the assignee.
- Legacy Submissions attach to the matching Assignment and start at version 1.
- Legacy reviews attach to that Assignment's latest Submission.
- Legacy payouts become Payments attached to the matching Assignment.
- Invalid orphan records are omitted; if users, workers, Services, or Jobs
  cannot be converted into a valid graph, return `createDemoState()`.

- [ ] **Step 4: Rewrite store tests around personas and normalized actions**

Create `src/store/professionalStore.test.ts` with:

```ts
it("signs the Lead persona into the Professional workspace", () => {
  useProfessionalStore.getState().signIn("lead");
  expect(useProfessionalStore.getState().currentUser()).toMatchObject({
    id: "user-nneka",
    accountRole: "professional"
  });
  expect(useProfessionalStore.getState().currentProfessional()?.isLead).toBe(true);
});

it("promotes a Professional without changing account role", () => {
  useProfessionalStore.getState().setLeadCapability("professional-amara", true);
  expect(
    useProfessionalStore.getState().professionals.find(
      (item) => item.id === "professional-amara"
    )?.isLead
  ).toBe(true);
  expect(
    useProfessionalStore.getState().users.find((item) => item.id === "user-amara")
      ?.accountRole
  ).toBe("professional");
});

it("creates two independent Assignments from one Admin action", () => {
  useProfessionalStore.getState().addAssignments("job-open-social", [
    {
      professionalId: "professional-amara",
      agreedPay: 145000,
      deadline: "2026-06-24",
      leadReviewerId: "professional-nneka"
    },
    {
      professionalId: "professional-david",
      agreedPay: 120000,
      deadline: "2026-06-25"
    }
  ]);
  expect(
    useProfessionalStore.getState().assignments.filter(
      (item) => item.jobId === "job-open-social"
    )
  ).toHaveLength(2);
});
```

- [ ] **Step 5: Create the v2 Zustand store**

Use this session model:

```ts
interface Session {
  userId: string;
  persona: DemoPersona;
}

const personaUser: Record<DemoPersona, string> = {
  admin: "user-admin",
  professional: "user-amara",
  lead: "user-nneka"
};
```

Expose:

- `signIn(persona)`, `signOut`, `currentUser`, `currentProfessional`, `resetDemo`.
- Professional CRUD and `setLeadCapability`.
- Service CRUD, ordered readiness requirements, and guarded activation.
- Enrolment creation, Lead assignment, progress, submission, review, and
  guarded removal.
- Job create/update/publish/archive.
- Assignment add/start/submit/review/complete/cancel.
- Payment recording and explicit correction.
- Notification read.
- Selector wrappers only where UI convenience requires them.

Use Zustand persistence:

```ts
persist(storeCreator, {
  name: "blithob-professionals-demo",
  version: 2,
  migrate: (persistedState, version) =>
    version < 2 ? migrateLegacyState(persistedState) : persistedState
});
```

- [ ] **Step 6: Run store and migration tests**

```powershell
npx vitest run src/domain/migrate.test.ts src/store/professionalStore.test.ts
npm run build
```

Expected: PASS; the unused v2 store compiles beside the legacy store.

- [ ] **Step 7: Commit store and migration**

```powershell
git add src/domain/migrate.ts src/domain/migrate.test.ts src/store/professionalStore.ts src/store/professionalStore.test.ts
git commit -m "refactor: migrate sessions and state to professional model"
```

## Task 5: Build the Overlay and Status Primitives

**Files:**
- Create: `src/components/Drawer.tsx`
- Create: `src/components/ConfirmDialog.tsx`
- Create: `src/components/RecordTimeline.tsx`
- Create: `src/components/ToastProvider.tsx`
- Modify: `src/components/StatusBadge.tsx`
- Modify: `src/components/ui.tsx`
- Modify: `src/components/designSystem.test.tsx`
- Modify: `src/index.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write component tests**

Add tests:

```tsx
it("renders action drawers through the document body", () => {
  render(
    <Drawer open title="Record payment" onClose={() => undefined}>
      <p>Payment form</p>
    </Drawer>
  );
  const dialog = screen.getByRole("dialog", { name: "Record payment" });
  expect(dialog.closest("[data-drawer-root]")?.parentElement).toBe(document.body);
});

it("closes a drawer with Escape and restores trigger focus", async () => {
  const user = userEvent.setup();
  render(<DrawerHarness />);
  const trigger = screen.getByRole("button", { name: "Open drawer" });
  await user.click(trigger);
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
});

it("labels Assignment and readiness statuses with plain language", () => {
  const { rerender } = render(
    <StatusBadge status="changes_requested_by_lead" />
  );
  expect(screen.getByText("Lead requested changes")).toBeInTheDocument();
  rerender(<StatusBadge status="waiting_for_admin" />);
  expect(screen.getByText("Waiting for Admin")).toBeInTheDocument();
});

it("announces successful mutations without moving focus", async () => {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <ToastHarness />
    </ToastProvider>
  );
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByRole("status")).toHaveTextContent("Changes saved");
});
```

- [ ] **Step 2: Run component tests and verify they fail**

```powershell
npx vitest run src/components/designSystem.test.tsx
```

Expected: FAIL because Drawer and v2 status labels do not exist.

- [ ] **Step 3: Implement `Drawer`**

`src/components/Drawer.tsx` must:

- render with `createPortal(..., document.body)`;
- use `role="dialog"` and `aria-modal="true"`;
- occupy `fixed inset-0 z-[100]`;
- use one backdrop;
- position a 480-640px panel at the right on desktop;
- become full-screen below 640px;
- close on backdrop and Escape;
- focus the close button on open;
- restore focus to the previously focused trigger on close;
- prevent body scrolling while open.

Use:

```tsx
<div data-drawer-root className="fixed inset-0 z-[100]">
  <button className="absolute inset-0 bg-slate-950/35" aria-label="Close drawer" />
  <section className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col bg-white shadow-2xl">
    <header className="flex items-start justify-between border-b border-[var(--border)] p-6">
      <h2 id={titleId}>{title}</h2>
      <button ref={closeButtonRef} type="button" onClick={onClose}>
        Close
      </button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
  </section>
</div>
```

- [ ] **Step 4: Implement confirmation and timeline components**

`ConfirmDialog` accepts:

```ts
{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onClose: () => void;
}
```

`RecordTimeline` accepts ordered items:

```ts
Array<{
  id: string;
  title: string;
  description?: string;
  actor?: string;
  timestamp: string;
  tone?: "neutral" | "positive" | "attention";
}>
```

- [ ] **Step 5: Implement accessible toast feedback**

`ToastProvider` exposes:

```ts
const { success, error } = useToast();
success("Assignment created");
error("Add a payment reference for bank transfer");
```

Render one `aria-live="polite"` region through `document.body`. Messages
auto-dismiss after 3.5 seconds, can be manually dismissed, and do not steal
focus. Wrap the application in `ToastProvider` from `src/main.tsx`. Every
successful form mutation and every rejected command surfaced by a page uses
this provider.

- [ ] **Step 6: Replace StatusBadge vocabulary**

Support all Service Enrolment, Assignment, Job operational, and Payment statuses. Use human labels such as:

- `waiting_for_lead` -> `Waiting for Lead`
- `changes_requested_by_lead` -> `Lead requested changes`
- `waiting_for_admin` -> `Waiting for Admin`
- `changes_requested_by_admin` -> `Admin requested changes`
- `due` -> `Payment due`
- `issue` -> `Payment issue`

Until Task 14 deletes legacy pages, keep the old status strings in the
component's accepted union and label map so those files continue to compile.
Remove the compatibility statuses during final cleanup.

- [ ] **Step 7: Add compact layout primitives**

In `src/components/ui.tsx`, add:

- `Toolbar`: one border container for search, filters, and actions.
- `RecordList`: one divided surface rather than separate floating cards.
- `MetaList`: aligned label/value pairs.
- `ProgressBar`: accessible `role="progressbar"`.

Keep all body copy at 16px or larger. Permit 14px only for metadata, helper text, status badges, and compact controls.

- [ ] **Step 8: Apply the visual system**

Update `src/index.css`:

- Keep IBM Plex Sans as the single family.
- Use an 8-point spacing rhythm.
- Keep canvas `#f5f5f2`, ink `#15202b`, blue `#2457e6`, and restrained orange attention.
- Use borders and tonal surfaces instead of repeated shadows.
- Limit content line length to `66ch`.
- Add `.drawer-enter` and `.drawer-backdrop` transitions with reduced-motion handling.
- Remove legacy CSS selectors that override `Poppins`, 24px card radii, and arbitrary shadow classes once old pages are removed.

- [ ] **Step 9: Run component tests**

```powershell
npx vitest run src/components/designSystem.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit shared interface primitives**

```powershell
git add src/components/Drawer.tsx src/components/ConfirmDialog.tsx src/components/RecordTimeline.tsx src/components/ToastProvider.tsx src/components/StatusBadge.tsx src/components/ui.tsx src/components/designSystem.test.tsx src/index.css src/main.tsx
git commit -m "feat: add viewport drawers and workflow status system"
```

## Task 6: Unify Routing, Login, and Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/NotificationsPage.tsx`
- Create: `src/pages/RouteShell.tsx`

- [ ] **Step 1: Write route and navigation tests**

Replace role-route tests with:

```tsx
it("shows Services as a first-class Admin destination", async () => {
  useProfessionalStore.getState().signIn("admin");
  renderAppAt("/admin/today");
  expect(screen.getByRole("link", { name: "Services" })).toBeInTheDocument();
});

it("keeps Lead users inside the Professional workspace", () => {
  useProfessionalStore.getState().signIn("lead");
  renderAppAt("/professional/today");
  expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Reviews" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Training" })).toBeInTheDocument();
});

it("does not expose Lead destinations to a regular Professional", () => {
  useProfessionalStore.getState().signIn("professional");
  renderAppAt("/professional/today");
  expect(screen.queryByRole("link", { name: "Team" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Reviews" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run route tests and verify they fail**

```powershell
npx vitest run src/App.test.tsx
```

Expected: FAIL because the legacy routes are split by trainer/worker.

- [ ] **Step 3: Replace route guards**

Use:

```tsx
function ProtectedAccount({ role }: { role: AccountRole }) {
  const user = useProfessionalStore((state) => state.currentUser());
  if (!user) return <Navigate to="/login" replace />;
  if (user.accountRole !== role) {
    return (
      <Navigate
        to={user.accountRole === "admin" ? "/admin/today" : "/professional/today"}
        replace
      />
    );
  }
  return <Outlet />;
}

function LeadOnly() {
  const professional = useProfessionalStore(
    (state) => state.currentProfessional()
  );
  return professional?.isLead ? <Outlet /> : <Navigate to="/professional/today" replace />;
}
```

- [ ] **Step 4: Define the new durable routes**

Admin:

```tsx
/admin/today
/admin/people
/admin/people/:professionalId
/admin/services
/admin/services/:serviceId
/admin/jobs
/admin/jobs/new
/admin/jobs/:jobId
/admin/assignments/:assignmentId
/admin/reviews
/admin/payments
/admin/payments/:paymentId
/admin/notifications
```

Professional:

```tsx
/professional/today
/professional/work
/professional/work/:assignmentId
/professional/training
/professional/training/:enrolmentId
/professional/team
/professional/team/:enrolmentId
/professional/reviews
/professional/payments
/professional/payments/:paymentId
/professional/profile
/professional/notifications
```

Nest Team and Reviews under `LeadOnly`.

Add redirects from `/admin/dashboard`, `/admin/workers`, `/admin/training`, `/admin/opportunities`, `/admin/payouts`, `/worker/*`, and `/trainer/*` to their nearest v2 destinations.

For routes whose final page is implemented in Tasks 7-12, use a temporary
`RouteShell`:

```tsx
export function RouteShell({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return <PageHeader title={title} description={description} />;
}
```

Replace each `RouteShell` import as its final page is completed, and delete the
component in Task 14.

- [ ] **Step 5: Rebuild AppShell navigation**

Admin order:

```ts
["Today", "People", "Services", "Jobs", "Reviews", "Payments"]
```

Professional order:

```ts
["Today", "Work", ...(isLead ? ["Team", "Reviews"] : []), "Training", "Payments", "Profile"]
```

Use one Professional shell for Amara and Nneka. Derive unread notifications by `recipientUserId`. Enable the bottom mobile navigation for every Professional, including Leads.

- [ ] **Step 6: Update demo login**

Keep three demo choices, but call:

```ts
signIn("admin");
signIn("lead");
signIn("professional");
```

Navigate Admin to `/admin/today`; both Professional personas to `/professional/today`.

- [ ] **Step 7: Run route tests**

```powershell
npx vitest run src/App.test.tsx
npm run build
```

Expected: PASS after temporary route components are wired to existing or
replacement pages; the switched application build also passes. Do not use
blank pages; each temporary route must at least render its final page heading.

- [ ] **Step 8: Commit unified routing**

```powershell
git add src/App.tsx src/App.test.tsx src/components/AppShell.tsx src/pages/LoginPage.tsx src/pages/NotificationsPage.tsx src/pages/RouteShell.tsx
git commit -m "feat: unify professional and lead workspace routing"
```

## Task 7: Build Admin People and Professional Detail

**Files:**
- Create: `src/pages/admin/PeoplePage.tsx`
- Create: `src/pages/admin/ProfessionalDetailPage.tsx`
- Modify: `src/store/professionalStore.ts`
- Modify: `src/store/professionalStore.test.ts`

- [ ] **Step 1: Add Professional management store tests**

Test:

- `createProfessional` creates a Professional account without forcing an enrolment.
- `setLeadCapability(id, true)` adds capability only.
- `createServiceEnrolment` accepts one Service and optional Lead.
- Assigning the same Professional to the same active Service twice is rejected.

- [ ] **Step 2: Implement People directory**

`PeoplePage` uses one `Toolbar` containing:

- search input;
- `All`, `Professionals`, `Leads` segmented filter;
- `Add professional` button.

Each row shows identity, capability, active enrolment count, approved Service count, active Assignment count, and completed count. The entire row links to `/admin/people/:professionalId`.

Do not add a Workers/Training section switch or a second filter row.

- [ ] **Step 3: Implement dedicated Professional detail**

Use a page header and six clearly labeled sections:

1. Overview: contact details and account state.
2. Services and training: one row per Service Enrolment with Lead and status.
3. Work history: Assignment rows.
4. Payments: Assignment Payment rows.
5. Internal notes: editable Admin-only note.
6. Permissions: Lead capability.

Actions:

- `Enrol in service` opens a right Drawer with active Service and optional Lead.
- `Grant Lead capability` and `Remove Lead capability` use `ConfirmDialog`.
- `Remove enrolment` uses `ConfirmDialog` and is disabled after approval or
  after related work exists.
- Profile contact editing uses one form, not a read-only duplicate plus form.

- [ ] **Step 4: Verify People interaction tests**

Add Testing Library assertions to `src/App.test.tsx` or a focused `PeoplePage.test.tsx`:

- Search finds Nneka.
- Lead filter excludes Amara.
- Clicking Nneka opens the dedicated URL.
- Lead confirmation explains Team and Reviews access.

Run:

```powershell
npx vitest run src/App.test.tsx src/store/professionalStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit People experience**

```powershell
git add src/pages/admin/PeoplePage.tsx src/pages/admin/ProfessionalDetailPage.tsx src/store/professionalStore.ts src/store/professionalStore.test.ts src/App.tsx
git commit -m "feat: add professional directory and records"
```

## Task 8: Build Services and Readiness Management

**Files:**
- Create: `src/pages/admin/ServicesPage.tsx`
- Create: `src/pages/admin/ServiceDetailPage.tsx`
- Modify: `src/store/professionalStore.ts`
- Modify: `src/store/professionalStore.test.ts`

- [ ] **Step 1: Add Service management tests**

Test:

```ts
it("creates one Service with an ordered readiness checklist", () => {
  const id = useProfessionalStore.getState().createService({
    name: "Research support",
    shortName: "Research",
    description: "Structured desk research and summaries.",
    requirements: [
      {
        title: "Review research standards",
        description: "Understand citation and source requirements.",
        requiresEvidence: false
      },
      {
        title: "Submit a sample brief",
        description: "Produce one sourced sample report.",
        requiresEvidence: true
      }
    ]
  });
  const service = useProfessionalStore
    .getState()
    .services.find((item) => item.id === id);
  expect(service?.requirements.map((item) => item.order)).toEqual([0, 1]);
});
```

Also test inactive Services cannot receive new enrolments or Jobs.

- [ ] **Step 2: Implement Services directory**

Rows show:

- Service name and description;
- active/inactive status;
- number enrolled;
- number approved;
- active Job count;
- requirement count.

Primary action is `New service`. Rows link to `/admin/services/:serviceId`.

- [ ] **Step 3: Implement Service detail and edit**

Sections:

- Overview with name, short name, description, and active state.
- Ordered readiness requirements with add, edit, remove, and move up/down.
- Enrolled Professionals.
- Approved Professionals.
- Jobs using the Service.

Use inline edit states or a dedicated edit section. Do not create nested Service and Training Track modals. The UI must never use the term `training track`.

Activating or deactivating a Service uses `ConfirmDialog`. Deactivation is
blocked while draft/open Jobs or non-approved enrolments require the Service.

- [ ] **Step 4: Run Service tests**

```powershell
npx vitest run src/store/professionalStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Service management**

```powershell
git add src/pages/admin/ServicesPage.tsx src/pages/admin/ServiceDetailPage.tsx src/store/professionalStore.ts src/store/professionalStore.test.ts src/App.tsx
git commit -m "feat: add service readiness management"
```

## Task 9: Build Jobs, Assignment Creation, and Detail Pages

**Files:**
- Create: `src/pages/admin/JobsPage.tsx`
- Create: `src/pages/admin/JobEditorPage.tsx`
- Create: `src/pages/admin/JobDetailPage.tsx`
- Create: `src/pages/admin/AdminAssignmentPage.tsx`
- Modify: `src/store/professionalStore.ts`

- [ ] **Step 1: Add Job validation tests**

Test:

- Draft Job accepts incomplete brief.
- Publishing requires title, active Service, objective, description, at least one step, one deliverable, one acceptance criterion, and deadline.
- Archived Job rejects new Assignments.
- Assignment Lead choices exclude the assignee.

- [ ] **Step 2: Implement the Job directory**

Use one compact list with:

- title;
- Service;
- derived operational status;
- Assignment progress text such as `2 of 3 completed`;
- deadline;
- action count.

Filters: status and Service in one Toolbar. `Create job` links to `/admin/jobs/new`.

- [ ] **Step 3: Implement dedicated Job editor**

Use React Hook Form and Zod with these sections:

1. Basics: title, Service, client context.
2. Brief: objective and full description.
3. Execution: dynamic ordered steps.
4. Delivery: dynamic deliverables and acceptance criteria.
5. References: dynamic Link or File metadata rows.
6. Scheduling: deadline.

Provide `Save draft` and `Publish job`. After save, navigate to `/admin/jobs/:jobId`.

Link rows require a URL. File rows store file-name metadata because the
prototype does not upload binaries. Add a `Require link or file with each
submission` checkbox bound to `submissionEvidenceRequired`.

- [ ] **Step 4: Implement Job detail**

Render:

- derived status, Service, deadline, and publication state;
- objective, context, full description;
- ordered steps;
- deliverables;
- acceptance criteria;
- references;
- Assignment table;
- activity.

`Add professionals` opens a Drawer. Each selected Professional has independent fields:

```ts
{
  professionalId: string;
  agreedPay: number;
  deadline: string;
  leadReviewerId?: string;
}
```

Show only eligible Professionals. Display workload, Lead capability, completion count, and approved Service reason. Default Lead to empty. If the selected Professional is the Lead, label routing `Direct to Admin`.

- [ ] **Step 5: Implement Admin Assignment detail**

Show:

- Professional, pay, deadline, status, and reviewer;
- inherited Job brief;
- all Submission versions;
- all review decisions;
- Payment state after completion.

For `waiting_for_admin`, show `Review submission` Drawer. For `approved`, show `Complete assignment` confirmation. Never complete a whole Job from this page.

`Cancel assignment` uses `ConfirmDialog`, requires a short reason, and is
disabled after completion.

- [ ] **Step 6: Run Job and Assignment tests**

```powershell
npx vitest run src/domain/professionalWorkflow.test.ts src/store/professionalStore.test.ts src/App.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit Job and Assignment pages**

```powershell
git add src/pages/admin/JobsPage.tsx src/pages/admin/JobEditorPage.tsx src/pages/admin/JobDetailPage.tsx src/pages/admin/AdminAssignmentPage.tsx src/store/professionalStore.ts src/App.tsx
git commit -m "feat: add structured jobs and independent assignments"
```

## Task 10: Build Admin Reviews, Payments, and Today

**Files:**
- Modify: `src/pages/admin/AdminReviewsPage.tsx`
- Create: `src/pages/admin/AdminPaymentsPage.tsx`
- Modify: `src/pages/admin/AdminDashboard.tsx`
- Create: `src/pages/admin/AdminPaymentPage.tsx`

- [ ] **Step 1: Implement Admin review queues**

Use two visible queue tabs:

- Work: Assignments in `waiting_for_admin`, approved Assignments awaiting completion, and Admin-requested revisions awaiting resubmission.
- Readiness: Service Enrolments in `waiting_for_admin` and Admin-requested revisions.

Each row names the exact Professional, Job or Service, previous reviewer, latest evidence time, and next action. It must never represent a shared Job as one review item.

- [ ] **Step 2: Implement review drawers**

Work Drawer:

- full latest Submission;
- link/file evidence;
- acceptance criteria;
- previous reviews;
- feedback textarea;
- `Request changes` and `Approve`.

Readiness Drawer:

- requirement-by-requirement evidence;
- Lead certification and feedback;
- previous decisions;
- feedback textarea;
- `Request changes` and `Approve readiness`.

- [ ] **Step 3: Implement Payment queue**

Filters:

```ts
["due", "scheduled", "paid", "issue"]
```

Rows show Professional, Job, amount, due date, status, method, and reference.

The `Record payment` Drawer includes:

- payment state;
- payment date;
- method;
- conditional reference requirement;
- receipt file name;
- internal note;
- issue reason when state is `issue`.

Disable reference validation only for Cash. Show saved receipt metadata on paid rows and detail.

Each row links to `/admin/payments/:paymentId`. `AdminPaymentPage` shows the
Professional, Assignment, Job, amount, due date, payment evidence, internal
note, and issue history. Paid records are read-only until Admin chooses
`Correct record`; that Drawer requires `correctionNote` and calls
`correctPayment`.

- [ ] **Step 4: Rebuild Admin Today**

Today contains:

- nearest Admin action;
- Work review count;
- readiness approval count;
- Assignment deadlines;
- payment issues;
- concise recent activity.

Primary links go to the exact queue or detail record. Do not duplicate People or Jobs directories.

- [ ] **Step 5: Verify Admin pages**

Add component tests for:

- Work/Readiness queue switching.
- Cash payment without reference.
- Bank transfer requiring reference.
- Completing one Assignment creates one due Payment row.

Run:

```powershell
npx vitest run
```

Expected: all unit and component tests pass.

- [ ] **Step 6: Commit Admin operations**

```powershell
git add src/pages/admin/AdminReviewsPage.tsx src/pages/admin/AdminPaymentsPage.tsx src/pages/admin/AdminDashboard.tsx src/pages/admin/AdminPaymentPage.tsx src/App.tsx
git commit -m "feat: add admin review and payment operations"
```

## Task 11: Build Professional Work, Training, Payments, and Profile

**Files:**
- Create: `src/pages/professional/TodayPage.tsx`
- Create: `src/pages/professional/WorkPage.tsx`
- Create: `src/pages/professional/AssignmentPage.tsx`
- Create: `src/pages/professional/TrainingPage.tsx`
- Create: `src/pages/professional/TrainingDetailPage.tsx`
- Create: `src/pages/professional/PaymentsPage.tsx`
- Create: `src/pages/professional/PaymentDetailPage.tsx`
- Create: `src/pages/professional/ProfilePage.tsx`

- [ ] **Step 1: Implement Professional Today**

Show one next action chosen in this order:

1. Assignment revision requested.
2. Assignment due soon and in progress.
3. Training revision requested.
4. Training requirement incomplete.
5. Payment issue.

Then show compact counts for active Assignments, approved Services, and due Payments, plus recent notifications.

- [ ] **Step 2: Implement Work inbox**

Filters:

- Needs action
- In progress
- Waiting for review
- Completed

Rows show Job title, Service, Assignment status, pay, deadline, and reviewer. Row click navigates to `/professional/work/:assignmentId`.

- [ ] **Step 3: Implement Assignment detail**

Render full brief:

- status and pay;
- deadline and reviewer;
- objective and client context;
- full description;
- ordered steps;
- deliverables;
- acceptance criteria as a local self-checklist;
- references;
- Submission versions and review timeline.

Actions:

- `Start assignment` for `assigned`.
- `Submit work` for `in_progress`.
- `Submit revision` for either changes-requested state.

Submission uses a right Drawer. Require notes, and require a link or file when
the Job has `submissionEvidenceRequired: true`. The Drawer displays the latest
revision feedback when present.

- [ ] **Step 4: Implement Training directory and detail**

Training rows show Service, progress, assigned Lead or Direct to Admin, and status.

Detail page:

- one ordered readiness checklist from the Service;
- evidence link/file controls only where required;
- visible Lead/Admin feedback;
- timeline;
- `Send for review` enabled only when every requirement is valid.

After Admin approval, show that the Professional is eligible for future Jobs in that Service.

- [ ] **Step 5: Implement Payments**

Show amount, status, due/paid dates, method, reference, receipt, and associated
Job/Assignment. Rows link to `/professional/payments/:paymentId`, and
`PaymentDetailPage` rejects any Payment that belongs to another Professional.
Receipt metadata is visible but not downloadable because the prototype stores
file names only.

- [ ] **Step 6: Implement one Profile panel**

Use one editable panel with:

- initials and Professional/Lead badges;
- approved Services;
- name;
- email;
- phone;
- location;
- one save action.

Do not repeat contact details in a second summary block.

- [ ] **Step 7: Verify Professional pages**

Add tests:

- Amara sees only her Assignments.
- Starting one Assignment does not affect David's.
- Submitting a revision creates the next version.
- Approved Services are derived from enrolments.
- Profile has one Email input and no duplicate Email value block.

Run:

```powershell
npx vitest run
```

Expected: PASS.

- [ ] **Step 8: Commit Professional workspace**

```powershell
git add src/pages/professional src/App.tsx
git commit -m "feat: add professional delivery and readiness workspace"
```

## Task 12: Build Lead Team and Review Capabilities

**Files:**
- Create: `src/pages/professional/TeamPage.tsx`
- Create: `src/pages/professional/LeadReviewsPage.tsx`
- Modify: `src/pages/professional/TodayPage.tsx`

- [ ] **Step 1: Add Lead queue tests**

Test:

- Team includes only enrolments where `leadId` is the current Lead.
- Lead Reviews includes only Assignments where `leadReviewerId` is the current Lead and status is `waiting_for_lead`.
- Nneka's own Assignment never appears in Nneka's Lead Reviews.
- Lead certification forwards to Admin.

- [ ] **Step 2: Implement Team**

Group supervised Service Enrolments by:

- Needs review
- Changes requested
- In progress
- Waiting for Admin
- Approved

Rows show Professional, Service, progress, evidence completeness, and status. Detail uses the same Training detail layout in read/review mode.

- [ ] **Step 3: Implement Lead Reviews**

Rows represent Assignments, not Jobs. Show Professional, Job, deadline, submission version, and status.

Review Drawer:

- latest Submission;
- Job deliverables and acceptance criteria;
- prior reviews;
- required feedback;
- `Request changes`;
- `Certify and send to Admin`.

- [ ] **Step 4: Update Lead Today**

Lead Today keeps all Professional actions and adds:

- training evidence awaiting Lead review;
- work submissions awaiting Lead review.

Do not hide the Lead's personal Work, Training, Payments, or Profile.

- [ ] **Step 5: Run Lead tests**

```powershell
npx vitest run src/domain/professionalWorkflow.test.ts src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Lead capabilities**

```powershell
git add src/pages/professional/TeamPage.tsx src/pages/professional/LeadReviewsPage.tsx src/pages/professional/TodayPage.tsx
git commit -m "feat: add lead supervision and certification queues"
```

## Task 13: Replace End-to-End Acceptance Coverage

**Files:**
- Modify: `e2e/prototype.spec.ts`
- Modify: `playwright.config.ts` only if the existing server configuration does not start the rebuilt app.

- [ ] **Step 1: Write the approved readiness flow**

Create a Playwright test that:

1. Signs in as Admin.
2. Opens Zainab's Professional record.
3. Creates or confirms a Social Media enrolment assigned to Nneka.
4. Signs in as Zainab or uses the seeded Professional readiness scenario.
5. Completes required evidence and sends for review.
6. Signs in as Lead Nneka and certifies it.
7. Signs in as Admin and approves readiness.
8. Confirms Zainab is now eligible for Social Media Jobs.

Use role and label locators; do not use CSS selectors.

- [ ] **Step 2: Write the multi-Assignment delivery flow**

The test must:

1. Admin creates one structured Job.
2. Admin assigns Amara with Nneka as Lead and David direct to Admin.
3. Amara submits.
4. Nneka requests changes.
5. Amara submits version 2.
6. Nneka certifies.
7. Admin approves and completes Amara's Assignment.
8. David remains independently in progress until his own submission.
9. Admin approves and completes David's Assignment.
10. Exactly two Payment records exist.

- [ ] **Step 3: Write manual Payment evidence coverage**

Record:

- one Bank transfer with reference and receipt file name;
- one Cash payment without a reference.

Then sign in as each Professional and verify their own method, amount, and receipt evidence.

- [ ] **Step 4: Keep permission and responsive checks**

Retain tests that:

- Professional routes cannot open Admin pages.
- Regular Professionals cannot open Team/Reviews routes.
- Lead mobile navigation includes Work, Team, Reviews, Training, and Payments.
- A Drawer covers the viewport and is not clipped by the main content shell.

- [ ] **Step 5: Run E2E**

```powershell
npm run test:e2e
```

Expected: all scenarios pass in Chromium.

- [ ] **Step 6: Commit E2E coverage**

```powershell
git add e2e/prototype.spec.ts playwright.config.ts
git commit -m "test: cover unified readiness delivery and payment flows"
```

## Task 14: Remove Legacy Surface and Run Final QA

**Files:**
- Delete legacy page files listed in Target File Map.
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `README.md`

- [ ] **Step 1: Remove dead routes, imports, actions, and terminology**

Search:

```powershell
rg -n "trainer|training track|assignedWorkerId|assignedWorkerIds|Opportunity|opportunities|WorkerProfile|trainingTracks|payouts" src e2e
```

Expected after cleanup:

- `trainer` appears only in migration fixtures or explanatory migration comments.
- `training track`, `assignedWorkerId`, and `assignedWorkerIds` appear only in migration code/tests.
- Runtime UI uses Professional, Lead, Service, Job, Assignment, Review, and Payment.

- [ ] **Step 2: Delete replaced pages**

Delete the legacy files listed under Cleanup and Acceptance. Remove compatibility `Modal` only if no active page imports it; otherwise keep it solely for confirmation-sized uses and document that limitation.

- [ ] **Step 3: Remove obsolete CSS overrides**

Delete selectors targeting old `Poppins`, 24px/26px card radii, and shadow utility patterns. Confirm no current page depends on them.

- [ ] **Step 4: Update README**

Document:

- demo personas;
- Admin and Professional navigation;
- Lead capability;
- readiness -> Assignment -> review -> Payment flow;
- local commands;
- prototype limitation that files store metadata only.

- [ ] **Step 5: Run full verification**

```powershell
npm test
npm run lint
npm run build
npm run test:e2e
```

Expected:

- all Vitest tests pass;
- ESLint reports zero errors;
- TypeScript/Vite production build passes;
- all Playwright scenarios pass.

- [ ] **Step 6: Perform browser design QA**

Inspect at desktop width 1440px and mobile width 390px:

- Admin Today, People, Service detail, Job detail, Reviews, Payments.
- Professional Today, Work detail, Training detail, Payments, Profile.
- Lead Today, Team, Reviews, personal Work.
- Drawers have one overlay, cover the whole viewport, trap no content inside the shell, and restore focus.
- No body text is smaller than 16px except metadata and controls.
- Toolbars do not stack duplicate tabs/search/filter surfaces.
- Durable records have dedicated URLs.
- Empty, loading-free prototype, validation, revision, approved, completed, and issue states are visually distinct.

- [ ] **Step 7: Commit cleanup**

```powershell
git add README.md src e2e
git commit -m "chore: remove legacy worker trainer prototype"
```

## Completion Criteria

Implementation is complete only when:

- Admin is a separate account role.
- Every non-Admin account is a Professional.
- Lead is a capability and never replaces Professional access.
- Service readiness uses one editable checklist per Service.
- Lead-supervised training reaches Admin final approval.
- Jobs contain structured briefs.
- Each assignee has an independent Assignment, Submission history, review path, pay amount, and Payment.
- Lead work routes directly to Admin.
- Admin can record external Payment method, date, reference rules, receipt metadata, notes, schedule, paid state, and issues.
- Navigation matches the approved information architecture.
- People, Services, Jobs, Assignments, Enrolments, and Payments use durable detail pages.
- Action drawers render through `document.body`.
- Unit, component, lint, build, and E2E checks all pass.
