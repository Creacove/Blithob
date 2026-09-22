# Job-Centred Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Jobs the centre of the admin, professional, and lead experiences while hiding internal workflow complexity.

**Architecture:** Preserve the current Job, Application, ServiceEnrolment, Assignment, Review, and Payment records. Change navigation, presentation, and transition labels; add a workspace-native professional Jobs page; keep legacy URLs as redirects; and represent jobs without requirements using a service with an empty checklist.

**Tech Stack:** React 19, React Router, Zustand, TypeScript, Vitest, Testing Library, Tailwind/CSS.

---

### Task 1: Simplify role navigation

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [x] Add failing navigation tests for Admin (Home, Jobs, People, Payments), Professional (Home, Jobs, Work, Payments, Profile), and Lead (Home, Reviews, Jobs, Work, Payments, Profile).
- [x] Run `npm test -- src/App.test.tsx` and confirm the new assertions fail.
- [x] Update the navigation arrays, secondary Admin qualification access, labels, mobile navigation, and legacy redirects.
- [x] Run `npm test -- src/App.test.tsx` and confirm it passes.

### Task 2: Put applications inside Professional Jobs

**Files:**
- Create: `src/pages/professional/JobsPage.tsx`
- Modify: `src/pages/public/PublicApplicationsPage.tsx`
- Modify: `src/App.tsx`
- Test: `src/pages/professional/professionalPages.test.tsx`

- [x] Add failing tests proving My applications is workspace-native, uses plain states, links required qualifications, and offers Browse jobs.
- [x] Run the professional page tests and confirm the new tests fail.
- [x] Extract/reuse the application list data behavior in a compact Professional Jobs page and redirect the legacy applications URL.
- [x] Run the professional page tests and confirm they pass.

### Task 3: Make Admin application decisions direct

**Files:**
- Modify: `src/pages/admin/applicationQueue.ts`
- Modify: `src/pages/admin/ApplicationCard.tsx`
- Modify: `src/pages/admin/AdminApplicationsPage.tsx`
- Modify: `src/pages/admin/AssignmentDrawer.tsx`
- Test: `src/pages/admin/AdminApplicationsPage.test.tsx`
- Test: `src/pages/admin/applicationQueue.test.ts`

- [x] Add failing tests for direct Shortlist, Not selected, contextual qualification action, and Hire terminology.
- [x] Run the Admin application tests and confirm expected failures.
- [x] Remove Start review and duplicate status controls, reduce each card to decision-critical information, and rename assignment creation to Hire.
- [x] Run the Admin application tests and confirm they pass.

### Task 4: Make Jobs the Admin operating surface

**Files:**
- Modify: `src/pages/admin/JobsPage.tsx`
- Modify: `src/pages/admin/JobDetailPage.tsx`
- Modify: `src/pages/admin/AdminDashboard.tsx`
- Test: `src/App.test.tsx`

- [x] Add failing tests for job-level applicant access and secondary qualification configuration.
- [x] Run the tests and confirm expected failures.
- [x] Add applicant entry points from Jobs and remove internal-system copy from Home and Jobs.
- [x] Run the tests and confirm they pass.

### Task 5: Plain language and qualification context

**Files:**
- Modify: `src/pages/professional/TodayPage.tsx`
- Modify: `src/pages/professional/TrainingPage.tsx`
- Modify: `src/pages/professional/TrainingDetailPage.tsx`
- Modify: `src/pages/professional/LeadReviewsPage.tsx`
- Modify: `src/components/StatusBadge.tsx`
- Test: `src/pages/professional/professionalPages.test.tsx`

- [x] Add failing tests for Qualifications wording, contextual actions, and plain review decisions.
- [x] Run the professional tests and confirm expected failures.
- [x] Replace Training/Service-readiness/Assignment language where users see it and connect Lead reviews to qualification reviews.
- [x] Run the professional tests and confirm they pass.

### Task 6: Regression and browser QA

**Files:**
- Modify only files required by failures found during verification.

- [x] Run `npm test` and resolve regressions with a failing test before each fix.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Browser-check Admin, Professional, Lead, public application, qualification, hire, and responsive navigation flows.
- [x] Review the final diff for accidental schema or unrelated changes.
