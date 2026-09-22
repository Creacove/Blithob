# Production Readiness Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the tested candidate-document and Phase 1 operations work onto current `main`, integrate it with the existing transactional-email system, and verify a production-safe release.

**Architecture:** Start from current `main` in an isolated worktree. Add a new additive Supabase migration after the linked migration history, then port the typed document repository/store/UI and Admin/public operations. Keep `transactional_email_outbox`/`send-transactional-email` as the only email path; use follow-up migrations for legacy-RPC lockdown and compatibility.

**Tech Stack:** React 19, TypeScript, Zustand, Supabase Auth/Postgres/Storage/RPCs, Vitest, Netlify, Resend.

---

### Task 1: Port candidate-document backend and tests

**Files:**
- Create: `supabase/migrations/20260922130000_candidate_documents.sql`
- Create: `supabase/tests/candidate_documents.sql`
- Modify: `supabase/tests/public_jobs_and_applications.sql`

- [ ] **Step 1: Add the candidate-document SQL contract tests.**

Port the branch assertions for private bucket existence, anonymous denial, owner-only access, Admin metadata access, filename/MIME/size validation, failed replacement, CV replacement, supporting-document limit, foreign-CV rejection, and application-retained historical CVs.

- [ ] **Step 2: Run the focused SQL test and confirm it fails because the new schema/RPCs are absent.**

Run the repository's local SQL test command if the Supabase local stack is available; otherwise run the migration lint parser and record the unavailable local-stack prerequisite.

- [ ] **Step 3: Add the additive migration after `20260922113449`.**

Port the branch's `candidate_documents` table, nullable `job_applications.cv_document_id`, private `candidate-documents` bucket, RLS/storage policies, document RPCs, and `submit_job_application_with_cv`. In the new application RPC, after the insert, call:

```sql
perform public.queue_transactional_email(
  (select profile_id from public.professionals where id = v_professional_id),
  'application_received',
  'job_application',
  v_application_id,
  jsonb_build_object('job_title', v_job.title, 'company_name', v_job.public_company_name)
);
```

Use a timestamp newer than the linked migration history; do not reuse the branch's `202609170001` filename.

- [ ] **Step 4: Run the focused SQL tests and migration lint again.**

Expected: candidate-document contract assertions pass and no SQL lint errors are reported.

- [ ] **Step 5: Commit the backend checkpoint.**

```powershell
git add supabase/migrations supabase/tests
git commit -m "feat: add private candidate documents to current backend"
```

### Task 2: Add email compatibility and legacy-RPC protection

**Files:**
- Create: `supabase/migrations/20260922130100_transactional_email_hardening.sql`
- Create: `supabase/tests/transactional_email_outbox.sql`

- [ ] **Step 1: Write a failing regression assertion for a normal profile email.**

Assert that an application submitted through the CV-aware RPC creates exactly one `transactional_email_outbox` row with event type `application_received` and no cover-note/CV contents in the payload.

- [ ] **Step 2: Correct the email validation regex in `queue_transactional_email`.**

Use a character-class dot (`[.]`) so ordinary addresses such as `candidate@example.com` are accepted, while malformed addresses remain ignored.

- [ ] **Step 3: Run the regression SQL test and linked database lint.**

Expected: one idempotent `application_received` row is created and no secret/document text appears in the payload.

- [ ] **Step 4: Commit the hardening checkpoint.**

```powershell
git add supabase/migrations supabase/tests
git commit -m "fix: harden application email and CV submission"
```

### Task 3: Port typed document repository and store actions

**Files:**
- Create: `src/lib/candidateDocuments.ts`
- Create: `src/lib/candidateDocuments.test.ts`
- Modify: `src/lib/supabaseRepository.ts`
- Modify: `src/store/professionalStore.ts`
- Modify: `src/store/professionalStore.test.ts`

- [ ] **Step 1: Port repository tests and run them red.**

Cover registration, storage upload, completion, failed-upload archival, signed URL authorization, and client-side validation.

- [ ] **Step 2: Port the repository and store actions.**

Expose list/upload/archive/download actions for remote mode and retain deterministic demo-mode behavior without exposing a fake download link.

- [ ] **Step 3: Run the focused repository/store tests green.**

```powershell
npx vitest run src/lib/candidateDocuments.test.ts src/store/professionalStore.test.ts --reporter=verbose
```

- [ ] **Step 4: Commit the repository checkpoint.**

```powershell
git add src/lib/candidateDocuments.ts src/lib/candidateDocuments.test.ts src/lib/supabaseRepository.ts src/store/professionalStore.ts src/store/professionalStore.test.ts
git commit -m "feat: add candidate document repository"
```

### Task 4: Port candidate UI and application integration

**Files:**
- Create: `src/components/public/CandidateDocumentManager.tsx`
- Create: `src/components/public/CandidateDocumentManager.test.tsx`
- Modify: `src/pages/public/PublicApplyPage.tsx`
- Modify: `src/pages/public/OnboardingPage.tsx`
- Modify: `src/pages/professional/ProfilePage.tsx`
- Modify: `src/lib/publicListings.ts`
- Modify: `src/pages/public/PublicApplicationsPage.tsx`
- Modify: relevant page tests

- [ ] **Step 1: Add failing component/application tests.**

Cover CV-required application submission, upload validation/retry, replacement, existing-application state, and status display.

- [ ] **Step 2: Port the UI and repository contract.**

Require a completed CV on the Apply page. Keep onboarding/profile completion available without a CV. Preserve signed-out redirect paths and existing application duplicate handling.

- [ ] **Step 3: Fix signed-download popup timing.**

Open a blank tab directly inside the click handler, then assign the signed URL after the asynchronous authorization request succeeds; close the tab on error.

- [ ] **Step 4: Run focused UI tests green.**

```powershell
npx vitest run src/components/public/CandidateDocumentManager.test.tsx src/pages/public/PublicApplyPage.test.tsx src/pages/public/PublicApplicationsPage.test.tsx --reporter=verbose
```

- [ ] **Step 5: Commit the candidate UI checkpoint.**

```powershell
git add src/components/public src/pages/public src/pages/professional src/lib/publicListings.ts src/store/professionalStore.ts
git commit -m "feat: require private CVs for job applications"
```

### Task 5: Port Admin review/document access with bounded pagination

**Files:**
- Create: `src/pages/admin/AdminApplicationsPage.test.tsx`
- Create: `supabase/migrations/20260922130200_admin_application_operations.sql`
- Modify: `src/lib/publicListings.ts`
- Modify: `src/pages/admin/AdminApplicationsPage.tsx`
- Modify: `src/pages/admin/AdminDashboard.tsx`

- [ ] **Step 1: Add failing Admin tests.**

Cover job/status/search filters, CV-view action, signed-link failure, pagination/load-more behavior, and dashboard metrics.

- [ ] **Step 2: Add the bounded Admin RPC.**

Return CV metadata, supporting-document count, and `total_count`; cap `limit` at 100 and normalize offset. Add an Admin-only RPC for authorized document metadata/URLs.

- [ ] **Step 3: Fix dashboard metrics semantics.**

Define `awaiting_review` as the statuses that actually need Admin action (`submitted` and `under_review`) and keep individual status counts distinct.

- [ ] **Step 4: Implement the Admin UI pagination and document actions.**

Add a visible load-more control when `total_count` exceeds the current offset. Preserve Admin-only authorization errors and do not expose signed URLs in DTOs or logs.

- [ ] **Step 5: Run focused Admin tests and commit.**

```powershell
npx vitest run src/pages/admin/AdminApplicationsPage.test.tsx src/pages/admin/AdminDashboard.test.tsx --reporter=verbose
git add supabase/migrations src/pages/admin src/lib/publicListings.ts
git commit -m "feat: complete Admin application review queue"
```

### Task 6: Port public filters, SEO, and privacy assets

**Files:**
- Create: `supabase/migrations/20260922130300_public_job_filters.sql`
- Modify: `src/lib/publicListings.ts`, `src/pages/public/PublicJobsPage.tsx`, `src/pages/public/PublicJobDetailPage.tsx`, `src/App.tsx`
- Create: `src/pages/public/PrivacyPage.tsx`, tests, `public/robots.txt`, `public/sitemap.xml`

- [ ] **Step 1: Port tests for normalized filters and public metadata.**
- [ ] **Step 2: Add the additive country/filter columns and current-signature RPC.**
- [ ] **Step 3: Port URL-persisted filters, job metadata, privacy route, robots, and sitemap.**
- [ ] **Step 4: Run focused public tests and commit.**

```powershell
npx vitest run src/lib/publicListings.test.ts src/pages/public/PublicJobsPage.test.tsx src/pages/public/PublicJobDetailPage.test.tsx src/pages/public/PrivacyPage.test.tsx --reporter=verbose
git add src public supabase/migrations
git commit -m "feat: complete public discovery and privacy basics"
```

### Task 7: Full release verification and integration

**Files:**
- Create: `supabase/migrations/20260922130400_revoke_legacy_application_submission.sql`

- [ ] **Step 1: Keep the legacy submission RPC during the additive rollout.**

Deploy the CV-aware frontend and verify at least one real CV-backed application before revoking the old RPC.

- [ ] **Step 2: Revoke candidate execution of the legacy RPC after frontend verification.**

```sql
revoke execute on function public.submit_job_application(uuid, text, text) from authenticated;
```

Keep the function definition and existing rows for compatibility; only new candidate execution is blocked.

- [ ] **Step 3: Run the complete frontend gate.**

```powershell
npm test
npm run lint
npm run build
```

- [ ] **Step 4: Run the linked Supabase gate.**

```powershell
npx supabase migration list --linked
npx supabase db lint --linked --fail-on error
```

- [ ] **Step 5: Review the final diff and working tree.**

Confirm only the intended implementation/spec/plan files are changed; do not stage unrelated user files.

- [ ] **Step 6: Apply migrations, smoke-test the live Admin/Professional flows, then push the integration branch.**

Apply additive migrations in order, verify the live upload/application/email path, and push only after every release-gate command has fresh passing output.
