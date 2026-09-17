# Blithob Phase 1 Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the live Blithob Phase 1 candidate-to-Admin journey with private CV/documents, durable application notifications, complete public discovery, security controls, and fresh release evidence.

**Architecture:** Keep the existing React/Vite application, Supabase Auth/Postgres/Storage backend, and Netlify SPA deployment. Add a small candidate-document boundary and durable email outbox around the existing RPC workflow; keep database authorization authoritative and use additive migrations so existing live users and applications remain valid.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Zustand, Supabase Auth/Postgres/Storage/RPCs, Supabase Edge Functions, Netlify, Vitest, Testing Library, and Playwright.

---

## Coordinator operating rules

The coordinator is Luna. The implementation branch is
`codex/phase-one-production-readiness` in the dedicated worktree
`C:\Users\USER\Documents\Blithop\.worktrees\phase-one-production-readiness`.

The baseline on this branch is 131 passing tests and 3 pre-existing timeout
failures: one `LandingPage.test.tsx` test and two `App.test.tsx` tests. Do not
hide those failures by increasing global timeouts; diagnose the slow import or
render path and add narrow test timeouts only where the test genuinely covers
an asynchronous boundary.

Use no more than three concurrent workers. Every worker receives one bounded
write set and returns only changed files, tests run, evidence, and blockers.
Workers must not edit the same migration sequence, shared repository file, or
page component concurrently. The coordinator reviews every diff before
integration and runs the full release gate after integration.

Do not push to production, apply destructive database changes, invent provider
credentials, or publish unverified Job facts. Preserve all unrelated
untracked files in the original checkout.

## Dependency waves

```text
Wave 0: baseline + contract decisions
          |
Wave 1: candidate-document database/storage  ||  release-test diagnosis
          |
Wave 2: candidate UI/application attachment  ||  public filters and SEO
          |
Wave 3: email outbox + Admin document review + privacy/security integration
          |
Wave 4: authenticated E2E, full verification, deployment smoke test
```

Wave 1 may run in parallel because the database worker owns only migrations
and SQL tests while the test worker owns only existing test diagnosis. Wave 2
frontend work begins after the database worker publishes the document/RPC
contract. Cross-cutting integration remains with the coordinator.

## Task 1: Freeze the implementation contract and capture baseline evidence

**Owner:** Luna coordinator

**Files:**
- Read: `docs/superpowers/specs/2026-09-17-phase-one-production-readiness-design.md`
- Read: `docs/supabase-operations.md`
- Read: `src/lib/publicListings.ts`
- Read: `src/pages/public/PublicApplyPage.tsx`
- Read: `src/pages/public/OnboardingPage.tsx`
- Read: `src/pages/professional/ProfilePage.tsx`
- Read: `src/pages/admin/AdminApplicationsPage.tsx`
- Read: `src/pages/admin/AdminDashboard.tsx`

- [ ] **Step 1: Confirm the fixed Phase 1 rules.**

Use these values throughout the implementation:

```text
document model: one active primary CV + up to five supporting documents
accepted files: PDF and DOCX only
maximum size: 10 MiB per file
application: primary CV version is required and is retained on the application
statuses: submitted, under_review, shortlisted, rejected, withdrawn, converted
deferred: employers, interview/offer/hired, visa, AI, payments, formal GDPR
```

- [ ] **Step 2: Run and record the baseline commands.**

Run from the implementation worktree:

```powershell
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```

Record exact pass/failure counts in the coordinator checkpoint. A baseline
failure is not complete evidence for a later task.

- [ ] **Step 3: Verify the linked database state without changing it.**

Run:

```powershell
npx supabase migration list --linked
npx supabase db lint --linked --fail-on error
```

Confirm the next migration number is after `202608130013` and that the linked
project remains the expected Blithob project. Do not reset or seed production
data during this step.

- [ ] **Step 4: Commit only the implementation-plan checkpoint.**

```powershell
git add docs/superpowers/plans/2026-09-17-phase-one-production-readiness.md
git commit -m "docs: plan phase one production readiness"
```

## Task 2: Add candidate-document schema, storage, RLS, and SQL tests

**Owner:** Luna worker A: Supabase boundary

**Files:**
- Create: `supabase/migrations/202609170001_candidate_documents.sql`
- Modify: `supabase/tests/public_jobs_and_applications.sql`
- Create: `supabase/tests/candidate_documents.sql`
- Test locally with: `supabase db reset` and the SQL test runner used by the repository

- [ ] **Step 1: Write failing SQL assertions first.**

Add assertions for these exact behaviors before implementing the migration:

```sql
-- the schema exposes the table and application reference
select has_table('public', 'candidate_documents');
select has_column('public', 'job_applications', 'cv_document_id');

-- the document type and active-count rules are enforced
select throws_ok($$select public.create_candidate_document('cv', 'resume.pdf', 'application/pdf', 0)$$);

-- anonymous users cannot list, create, or read candidate documents
-- a candidate can access only their own active documents
-- an Admin can list and read candidate documents
-- a candidate cannot access another candidate's storage path
-- a new application rejects a missing or foreign CV document
-- a replacement archives the old CV and leaves historical application links
-- more than five active supporting documents is rejected
```

Use the existing SQL test conventions in `supabase/tests/public_jobs_and_applications.sql`.
Use test fixtures created inside the transaction; do not depend on the five
meeting Jobs or on a real production account.

- [ ] **Step 2: Create the document table and constraints.**

Implement the following shape in the new migration:

```sql
create table public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete restrict,
  document_type text not null check (document_type in ('cv', 'supporting')),
  display_name text not null check (length(trim(display_name)) between 1 and 160),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index candidate_documents_one_active_cv
on public.candidate_documents (professional_id)
where document_type = 'cv' and is_active;

alter table public.job_applications
  add column if not exists cv_document_id uuid references public.candidate_documents(id) on delete restrict;

create index candidate_documents_professional_idx
on public.candidate_documents (professional_id, is_active, created_at desc);
create index job_applications_cv_document_idx
on public.job_applications (cv_document_id);
```

Create the private `candidate-documents` Storage bucket with a 10 MiB object
limit. Add Storage policies that permit authenticated candidates to insert and
read only paths whose first folder is their own Professional ID, and permit
Admins to read all objects in this bucket. Do not grant anonymous access.

- [ ] **Step 3: Add server-authoritative document RPCs.**

Implement these named functions with `security definer`, locked
`search_path = public, extensions`, and explicit grants:

```text
create_candidate_document(document_type, display_name, mime_type, size_bytes)
  -> returns one document row including id and storage_path
list_my_candidate_documents()
archive_my_candidate_document(document_id)
list_application_documents(application_id)
```

`create_candidate_document` resolves the authenticated candidate with the
existing `current_professional_id()` helper, validates the type/MIME/size,
creates a UUID-based path of the form
`<professional_id>/<document_id>.<pdf-or-docx-extension>`, and rejects a sixth
active supporting document. It must not accept a caller-supplied
`professional_id`, role, or arbitrary storage path.

`archive_my_candidate_document` archives only the caller's own unreferenced
active document. It must reject archiving the active CV while an application
would be left without a valid profile CV; historical application links remain
readable. Admins may not use a candidate RPC to mutate a candidate's profile
documents.

`list_application_documents` is Admin-only or restricted to the application
owner and returns explicit metadata only. It never returns signed URLs or
private storage tokens from SQL.

- [ ] **Step 4: Add the CV-aware submission contract without breaking the live client.**

Create a new RPC rather than changing the existing function signature in place:

```text
submit_job_application_with_cv(job_id, cv_document_id, cover_note, portfolio_url)
  -> returns application UUID
```

Copy the existing `submit_job_application` checks, then additionally verify
that the CV belongs to the authenticated Professional, is an active `cv`, and
is within the allowed metadata constraints. Insert `cv_document_id` on the
application. Keep the current `submit_job_application` function available
until the new frontend has been deployed and verified.

- [ ] **Step 5: Run focused SQL tests and migration lint.**

Run:

```powershell
npx supabase db reset
npx supabase db lint --local --fail-on error
```

Then run the repository SQL assertions:

```powershell
npx supabase test db
```

Expected result: all candidate-document ownership, limit,
foreign-CV, and legacy-compatibility assertions pass.

- [ ] **Step 6: Commit the backend checkpoint.**

```powershell
git add supabase/migrations/202609170001_candidate_documents.sql supabase/tests/candidate_documents.sql supabase/tests/public_jobs_and_applications.sql
git commit -m "feat: add private candidate documents"
```

## Task 3: Add the typed frontend document boundary

**Owner:** Luna worker B after Task 2's RPC contract is reviewed

**Files:**
- Create: `src/lib/candidateDocuments.ts`
- Create: `src/lib/candidateDocuments.test.ts`
- Modify: `src/lib/supabaseRepository.ts`
- Modify: `src/store/professionalStore.ts`

- [ ] **Step 1: Write repository tests for the document contract.**

Use a fake RPC/storage client and assert the repository:

```ts
it("registers metadata before uploading to the server-generated path", async () => {
  await repository.upload({ type: "cv", file: pdfFile });
  expect(rpc).toHaveBeenCalledWith("create_candidate_document", expect.objectContaining({
    p_document_type: "cv",
    p_mime_type: "application/pdf",
    p_size_bytes: pdfFile.size
  }));
  expect(storage.upload).toHaveBeenCalledWith(
    expect.stringMatching(/^professional-1\/[0-9a-f-]+\.pdf$/),
    pdfFile,
    expect.objectContaining({ upsert: false })
  );
});

it("archives a failed registration after storage upload failure", async () => {
  await expect(repository.upload({ type: "cv", file: pdfFile })).rejects.toThrow(/upload/i);
  expect(rpc).toHaveBeenCalledWith("archive_my_candidate_document", expect.anything());
});

it("creates a short-lived signed URL only after listing authorized metadata", async () => {
  await repository.getDownloadUrl(documentFixture);
  expect(storage.createSignedUrl).toHaveBeenCalledWith(documentFixture.storagePath, 300);
});
```

Reject unsupported extension/MIME and files over 10 MiB before invoking RPC.
Never log file contents, access tokens, or signed URLs.

- [ ] **Step 2: Implement the repository boundary.**

Define `CandidateDocument`, `CandidateDocumentType`, and
`CandidateDocumentsRepository` in `src/lib/candidateDocuments.ts`. The
repository must expose only:

```ts
list(): Promise<CandidateDocument[]>;
upload(input: { type: CandidateDocumentType; file: File }): Promise<CandidateDocument>;
archive(documentId: string): Promise<void>;
getDownloadUrl(document: CandidateDocument): Promise<string>;
```

Use the browser Supabase client already exported by `src/lib/supabase.ts`.
Register metadata through the RPC, upload with `upsert: false` and the server
path, then reload the list. If the upload fails, call the archive RPC and
surface the original upload error. Signed URLs expire after 300 seconds.

Keep candidate uploads in the new repository so candidate and internal evidence
bucket types cannot be confused. Do not widen the existing
`SupabaseRepository.uploadPrivateFile` bucket union.

- [ ] **Step 3: Add store actions with demo-mode behavior.**

Expose `candidateDocuments`, `loadCandidateDocuments`, `uploadCandidateDocument`,
and `archiveCandidateDocument` through `professionalStore.ts`. Remote mode uses
the new repository. Demo/test mode uses deterministic in-memory documents with
no filesystem access and the same validation rules.

After a successful upload or archive, refresh only the candidate/profile data
needed by the current route; do not rehydrate the entire remote workspace for a
single upload.

- [ ] **Step 4: Run focused tests and commit.**

```powershell
npm test -- src/lib/candidateDocuments.test.ts src/store/professionalStore.test.ts --run
git add src/lib/candidateDocuments.ts src/lib/candidateDocuments.test.ts src/lib/supabaseRepository.ts src/store/professionalStore.ts
git commit -m "feat: add candidate document repository"
```

## Task 4: Build the candidate document and application UI

**Owner:** Luna worker B

**Files:**
- Create: `src/components/public/CandidateDocumentManager.tsx`
- Create: `src/components/public/CandidateDocumentManager.test.tsx`
- Modify: `src/pages/public/OnboardingPage.tsx`
- Modify: `src/pages/professional/ProfilePage.tsx`
- Modify: `src/pages/public/PublicApplyPage.tsx`
- Modify: `src/pages/public/PublicApplicationsPage.tsx`
- Modify: `src/lib/publicListings.ts`
- Modify: `src/pages/public/public.css`

- [ ] **Step 1: Write failing UI tests.**

Cover these exact user-visible states:

```tsx
it("requires a primary CV before continuing to apply", async () => {
  render(<CandidateDocumentManager documents={[]} onUpload={upload} />);
  expect(screen.getByText(/primary CV is required/i)).toBeInTheDocument();
});

it("shows an uploaded CV and supports replacement without losing the old label", async () => {
  render(<CandidateDocumentManager documents={[cvFixture]} onUpload={upload} />);
  expect(screen.getByText("resume.pdf")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /replace CV/i })).toBeInTheDocument();
});

it("submits the selected CV document ID with the application", async () => {
  render(<PublicApplyPage repository={repository} />);
  await user.click(screen.getByRole("button", { name: /submit application/i }));
  expect(repository.submitApplication).toHaveBeenCalledWith(expect.objectContaining({
    cvDocumentId: "cv-1"
  }));
});
```

Add coverage for unsupported files, oversize files, upload failure/retry,
mobile layout, existing application status, and candidate-only document lists.

- [ ] **Step 2: Implement the reusable document manager.**

The component receives documents and callbacks; it does not import Supabase or
the global store. Render one primary CV section and one supporting-document
section. Use a real `<input type="file">` with `accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"`.

Show filename, size, upload state, validation error, retry action, archive
action, and a short-lived download action. Use `aria-live` for upload status.
Disable Apply/Continue when no active CV exists.

- [ ] **Step 3: Integrate onboarding and profile.**

Load documents when the authenticated Professional is present. Onboarding
allows the candidate to finish identity fields and upload a CV before the
Continue button navigates to the original `next` path. Profile shows the same
manager without duplicating upload logic.

- [ ] **Step 4: Integrate the application form.**

Extend `PublicListingsRepository.submitApplication` with `cvDocumentId: string`.
Before submit, load the candidate document list, identify the active CV, and
show its filename/version. Submit through
`submit_job_application_with_cv`. On success reload the application and show
the current status. Do not add Interview, Offer, or Hired labels.

- [ ] **Step 5: Run focused UI tests and commit.**

```powershell
npm test -- src/components/public/CandidateDocumentManager.test.tsx src/pages/public/PublicApplyPage.test.tsx src/pages/public/PublicApplicationsPage.test.tsx --run
git add src/components/public src/pages/public/OnboardingPage.tsx src/pages/professional/ProfilePage.tsx src/lib/publicListings.ts src/pages/public/public.css
git commit -m "feat: complete candidate CV application flow"
```

## Task 5: Complete public filters, Job editing, and SEO

**Owner:** Luna coordinator; begin after the document worker publishes the
repository contract so shared `publicListings.ts` edits are serialized.

**Files:**
- Create: `scripts/generate-public-seo.mjs`
- Modify: `supabase/migrations/202609170003_public_job_filters.sql`
- Modify: `src/domain/model.ts`
- Modify: `src/store/professionalStore.ts`
- Modify: `src/lib/supabaseRepository.ts`
- Modify: `src/lib/publicListings.ts`
- Modify: `src/pages/public/PublicJobsPage.tsx`
- Modify: `src/pages/public/PublicJobsPage.test.tsx`
- Modify: `src/pages/public/PublicJobDetailPage.tsx`
- Modify: `src/pages/public/PublicJobDetailPage.test.tsx`
- Modify: `src/pages/admin/JobEditorPage.tsx`
- Modify: `src/pages/admin/JobsPage.tsx`
- Modify: `index.html`
- Modify: `package.json`
- Create: `public/robots.txt`

- [ ] **Step 1: Write failing filter contract tests.**

Add repository tests asserting these RPC parameters:

```ts
await repository.listJobs({
  countryCode: "NG",
  location: "Lagos",
  categorySlug: "design",
  minRateMinor: 100000,
  maxRateMinor: 500000,
  workMode: "Remote",
  employmentType: "Full-time",
  limit: 12,
  offset: 0
});

expect(rpc).toHaveBeenCalledWith("list_public_jobs", expect.objectContaining({
  p_country_code: "NG",
  p_location: "Lagos",
  p_category_slug: "design",
  p_min_rate_minor: 100000,
  p_max_rate_minor: 500000,
  p_work_mode: "Remote",
  p_employment_type: "Full-time"
}));
```

Add page tests that filters survive reload and are represented in URL search
parameters. Invalid numbers and unknown country values must be ignored.

- [ ] **Step 2: Add the country field and safe SQL filters.**

Add nullable `country_code text` with a two-uppercase-letter check, an index on
`(country_code, publication_state, public_visible)`, and bounded nullable RPC
parameters. Use compensation overlap semantics:

```text
job matches minimum when job.rate_max_minor is null OR job.rate_max_minor >= p_min_rate_minor
job matches maximum when job.rate_min_minor is null OR job.rate_min_minor <= p_max_rate_minor
```

Do not add visa, sponsorship, or international-workflow fields. Update Admin Job
editing and the typed `Job`/`PublicJobSummary` models to save and display the
country.

- [ ] **Step 3: Implement the public filter UI.**

Use controlled inputs in `PublicJobsPage.tsx` and serialize filters as `q`, `country`, `location`,
`category`, `minRate`, `maxRate`, `workMode`, and `employmentType`. Reset offset
when a filter changes. Keep public results bounded and render honest loading,
error, empty, and pagination states.

- [ ] **Step 4: Add crawlable Job metadata.**

Implement `scripts/generate-public-seo.mjs` using Node's built-in `fetch` and
the build-time `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` variables. Fetch
public Job rows through the safe RPC, write `dist/sitemap.xml`, and write one
`dist/jobs/<slug>/index.html` shell with escaped title, description,
canonical URL, Open Graph tags, and JobPosting JSON-LD. Keep the SPA entry point
and Netlify fallback intact. When build-time Supabase variables are absent,
generate only the root sitemap shell and exit with a clear non-zero error in
production builds; local demo builds may use the deterministic fixture list.

Add `public/robots.txt` pointing to `/sitemap.xml`. Job detail also updates
client-side metadata for in-app navigation. Never place internal fields,
application data, or candidate information in metadata.

- [ ] **Step 5: Run focused tests and build.**

```powershell
npm test -- src/lib/publicListings.test.ts src/pages/public/PublicJobsPage.test.tsx src/pages/public/PublicJobDetailPage.test.tsx --run
npm run build
git add scripts/generate-public-seo.mjs public/robots.txt package.json index.html src/domain/model.ts src/store/professionalStore.ts src/lib/supabaseRepository.ts src/lib/publicListings.ts src/pages/public src/pages/admin/JobEditorPage.tsx src/pages/admin/JobsPage.tsx supabase/migrations/202609170003_public_job_filters.sql
git commit -m "feat: complete public job discovery and SEO"
```

## Task 6: Add durable application email outbox and notifications

**Owner:** Luna coordinator with the Supabase worker reviewing SQL

**Files:**
- Create: `supabase/migrations/202609170002_application_email_outbox.sql`
- Create: `supabase/functions/process-email-outbox/index.ts`
- Modify: `supabase/tests/public_jobs_and_applications.sql`
- Modify: `src/pages/public/PublicApplicationsPage.tsx`
- Modify: `docs/supabase-operations.md`

- [ ] **Step 1: Write failing outbox assertions.**

Assert that application submit and Admin review create exactly one outbox row
per idempotency key, with no cover-note or Admin-note content in the payload.
Assert that candidate reads cannot select the outbox table and that retry
metadata is updated only by the server-side processor.

- [ ] **Step 2: Create the outbox table and mutation hooks.**

Use this shape:

```sql
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  event_type text not null check (event_type in ('application_submitted', 'application_under_review', 'application_shortlisted', 'application_rejected', 'application_withdrawn', 'application_converted')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
```

Add a private `enqueue_application_email` helper called by the application
submission/review/withdraw/conversion RPCs in the same transaction as the
status mutation. Payload contains only safe template fields: Job title,
company name, status label, public Job URL, and a short generic next-step
message. Admin notes and document data are excluded.

- [ ] **Step 3: Implement the Edge Function processor.**

`process-email-outbox/index.ts` must require an internal authorization header,
claim a bounded batch of pending rows atomically through a server RPC, send via
Resend using `RESEND_API_KEY` and `EMAIL_FROM`, and mark rows sent or retryable.
Use five attempts with exponential backoff. A missing provider key must leave
the row failed with a safe configuration error; it must not expose secrets or
block application submission.

Add a documented Supabase Cron invocation for the function. Do not put the
service-role key or Resend key in Vite variables or source control.

- [ ] **Step 4: Wire candidate-facing notification copy and test.**

Show an in-app confirmation immediately after submission and clearly state that
email delivery may follow. Add tests for the status label/body mapping and
duplicate event idempotency.

- [ ] **Step 5: Run focused SQL/function checks and commit.**

```powershell
npx supabase db lint --local --fail-on error
npm test -- src/pages/public/PublicApplicationsPage.test.tsx --run
git add supabase/migrations/202609170002_application_email_outbox.sql supabase/functions/process-email-outbox/index.ts supabase/tests/public_jobs_and_applications.sql src/pages/public/PublicApplicationsPage.tsx docs/supabase-operations.md
git commit -m "feat: add durable application notifications"
```

## Task 7: Complete Admin application review, documents, metrics, and audit display

**Owner:** Luna coordinator

**Files:**
- Modify: `supabase/migrations/202609170004_admin_application_operations.sql`
- Modify: `src/lib/publicListings.ts`
- Modify: `src/pages/admin/AdminApplicationsPage.tsx`
- Modify: `src/pages/admin/AdminApplicationsPage.test.tsx`
- Modify: `src/pages/admin/AdminDashboard.tsx`
- Modify: `src/pages/admin/AdminDashboard.test.tsx`
- Modify: `src/lib/supabaseRepository.ts`

- [ ] **Step 1: Add failing Admin tests.**

Cover:

```tsx
it("filters the queue by Job and status", async () => {
  render(<AdminApplicationsPage repository={repository} />);
  await user.selectOptions(screen.getByLabelText(/filter applications by job/i), "job-1");
  await user.selectOptions(screen.getByLabelText(/filter applications by status/i), "shortlisted");
  expect(repository.listAdminApplications).toHaveBeenLastCalledWith({ jobId: "job-1", status: "shortlisted" });
});

it("offers the Admin the submitted CV version", async () => {
  render(<AdminApplicationsPage repository={repositoryWithApplicationDocument} />);
  expect(screen.getByRole("button", { name: /view CV/i })).toBeInTheDocument();
});

it("shows application status counts on Today", async () => {
  render(<AdminDashboard />);
  expect(await screen.findByText(/awaiting review/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Extend the Admin list contract.**

Add bounded `limit`, `offset`, `jobId`, status, candidate search, and explicit
document metadata to the Admin RPC/repository. Keep `cv_document_id` and file
metadata out of anonymous/public DTOs. Order newest first and return a total
count.

- [ ] **Step 3: Add queue controls and safe document access.**

Render Job/status/candidate filters, pagination, submitted time, cover-note
preview, and a View CV action. View CV asks the candidate-document repository
for a 300-second signed URL after the Admin authorization check. Do not render
the document in an iframe or include its URL in page state longer than needed.

Keep review actions limited to the Phase 1 status set. Surface server errors
without discarding unsaved Admin notes.

- [ ] **Step 4: Add operational metrics and activity mapping.**

Add counts for open public Jobs, total applications, applications awaiting
review, and applications by Phase 1 status to `AdminDashboard.tsx`. Reuse the
existing activity feed and human-readable subject mapping. Ensure Job
publication, application review, conversion, and document events show the
actor where the backend provides it.

- [ ] **Step 5: Run focused tests and commit.**

```powershell
npm test -- src/pages/admin/AdminApplicationsPage.test.tsx src/pages/admin/AdminDashboard.test.tsx src/lib/publicListings.test.ts --run
git add supabase/migrations/202609170004_admin_application_operations.sql src/lib/publicListings.ts src/lib/supabaseRepository.ts src/pages/admin/AdminApplicationsPage.tsx src/pages/admin/AdminApplicationsPage.test.tsx src/pages/admin/AdminDashboard.tsx src/pages/admin/AdminDashboard.test.tsx
git commit -m "feat: finish Admin application operations"
```

## Task 8: Add privacy page, abuse controls, and production configuration

**Owner:** Luna coordinator

**Files:**
- Create: `src/pages/public/PrivacyPage.tsx`
- Create: `src/pages/public/PrivacyPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/LoginPage.tsx`
- Modify: `netlify.toml`
- Modify: `docs/supabase-operations.md`
- Modify: `README.md`

- [ ] **Step 1: Add failing privacy and configuration tests.**

Assert that `/privacy` is public, describes account/application/document use,
does not claim legal certification, and that a configured production build
does not render the demo persona picker.

- [ ] **Step 2: Implement the public privacy route.**

Add a concise Privacy page with the current data categories, purpose, private
document handling, and a client-provided retention/deletion contact expressed as
a clearly marked configuration value, plus a link back to Jobs. Do not
invent a legal entity, address, retention period, or compliance certification.

- [ ] **Step 3: Configure safe deployment headers and Auth prerequisites.**

Add only Netlify headers that are compatible with Supabase and the Vite SPA:
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
and a frame policy that does not break required Auth flows. Document the
Supabase Auth site URL, redirect allow-list, SMTP, CAPTCHA, and Resend settings
as dashboard/provider configuration.

- [ ] **Step 4: Verify no secret leakage and no permissive upload path.**

Search source and built output for `service_role`, database passwords, provider
keys, and raw signed URLs. Verify candidate Storage policies require
authenticated ownership or Admin status. If a client-visible configuration is
missing, fail with a useful message rather than silently enabling demo mode in
production.

- [ ] **Step 5: Run focused checks and commit.**

```powershell
npm test -- src/pages/public/PrivacyPage.test.tsx src/pages/LoginPage.test.tsx --run
npm run build
rg -n "service_role|SUPABASE_SERVICE_ROLE|RESEND_API_KEY|DATABASE_PASSWORD" dist src supabase/functions
git add src/pages/public/PrivacyPage.tsx src/pages/public/PrivacyPage.test.tsx src/App.tsx src/pages/LoginPage.tsx netlify.toml docs/supabase-operations.md README.md
git commit -m "chore: harden phase one production configuration"
```

The search is expected to find variable names only in server-side Edge
Function code and documentation; it must not find secret values or service
keys in `dist`.

## Task 9: Add full candidate-to-Admin Playwright coverage and repair baseline failures

**Owner:** Luna worker C after Tasks 2–8 are integrated

**Files:**
- Create: `e2e/public-jobs.spec.ts`
- Create: `e2e/application-flow.spec.ts`
- Modify: `e2e/responsive.spec.ts` only when the assertion is proven stale
- Modify: `e2e/visual.spec.ts` only after visual inspection
- Modify: `src/App.test.tsx` only for a proven test-boundary issue
- Modify: `src/pages/LandingPage.test.tsx` only for a proven test-boundary issue

- [ ] **Step 1: Add public discovery E2E.**

Using the existing demo-mode Playwright configuration, assert:

```text
/ loads without a console error
View all jobs reaches /jobs
featured Job reaches /jobs/:slug
filters update URL and results
empty and missing states are readable
/privacy is public
mobile and desktop have no horizontal overflow
```

- [ ] **Step 2: Add the authenticated application E2E contract.**

Use test credentials from environment variables only. Cover sign-in or signup,
profile completion, PDF CV upload, optional supporting document, application
submit, duplicate prevention, Admin review, shortlist, document access,
conversion, candidate status reload, and withdrawal where valid. If external
email confirmation cannot run in CI, test the Auth boundary separately and
record that provider limitation; do not skip the application/database flow.

- [ ] **Step 3: Diagnose current baseline failures.**

Run the failing tests individually with diagnostics:

```powershell
npm test -- src/pages/LandingPage.test.tsx -t "candidate-first" --run --reporter=verbose
npm test -- src/App.test.tsx -t "visitor enter|desktop account actions" --run --reporter=verbose
```

Fix the actual import/render/navigation issue. Do not raise the global timeout
or replace assertions with weaker snapshots. Run each repaired test alone and
then as part of the full unit suite.

- [ ] **Step 4: Repair E2E only with evidence.**

For the known responsive failure, correct the assertion only if the measured
layout relation is invalid after inspecting the page at the failing viewport.
For the stale visual baseline, capture the new screenshot, inspect it, and
update the snapshot only when the visual change is intentional and correct.

- [ ] **Step 5: Commit the integration-test checkpoint.**

```powershell
git add e2e src/App.test.tsx src/pages/LandingPage.test.tsx
git commit -m "test: verify phase one candidate journey"
```

## Task 10: Apply migrations, configure external services, deploy, and verify

**Owner:** Luna coordinator

**Files:**
- Modify: `docs/supabase-operations.md`
- Modify: `README.md`

- [ ] **Step 1: Run the complete local verification gate.**

```powershell
npm test
npm run lint
npm run build
npx supabase db lint --local --fail-on error
npm run test:e2e
```

Every result must include an exit code and pass/failure count. A failure is
fixed with a focused test first, then the complete command is rerun.

- [ ] **Step 2: Verify and apply additive migrations to the linked project.**

After local SQL tests pass:

```powershell
npx supabase migration list --linked
npx supabase db lint --linked --fail-on error
npx supabase db push --linked
npx supabase migration list --linked
```

Confirm the migration list is synchronized. Do not use `db reset` against the
linked project and do not manually edit production tables to bypass RPC rules.

- [ ] **Step 3: Configure external release prerequisites.**

Before claiming email/security readiness, confirm from the project dashboards:

```text
Netlify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
Supabase Auth site URL and redirect allow-list
verified sender domain and Auth SMTP
RESEND_API_KEY and EMAIL_FROM for the Edge Function
Supabase CAPTCHA/rate-limit configuration
approved Job content and published visibility
```

If a value is unavailable, document it as an external blocker and leave the
application path functional with a visible in-app state. Never substitute a
fake value.

- [ ] **Step 4: Deploy the verified frontend.**

Use the existing Netlify deployment path after the build succeeds. Verify from
a clean desktop and mobile browser:

```text
https://blithob-proto-20260609.netlify.app/
https://blithob-proto-20260609.netlify.app/jobs
https://blithob-proto-20260609.netlify.app/privacy
```

Also open a real public Job, Apply, candidate application history, Admin queue,
CV download, and status-change path. Confirm no internal fields or demo persona
controls appear in production mode.

- [ ] **Step 5: Record the release evidence.**

Update `docs/supabase-operations.md` with deployed URL, migration IDs, build
commit, verification commands, configured external services, and any explicit
remaining blocker. Update `README.md` with candidate-document setup and the
Admin content-publication workflow.

- [ ] **Step 6: Commit documentation only, then report.**

```powershell
git add docs/supabase-operations.md README.md
git commit -m "docs: record phase one release evidence"
git status --short --branch
```

## Final acceptance checklist

- [ ] A candidate can register/sign in, complete a profile, upload a PDF/DOCX
  CV, add supporting documents, and replace the active CV.
- [ ] A candidate can apply exactly once to a live Job with the CV version
  retained on the application.
- [ ] A candidate can see Submitted, Under review, Shortlisted, Rejected,
  Withdrawn, and Converted states; Interview, Offer, and Hired do not appear.
- [ ] Admin can publish Jobs, filter applications, view the submitted CV,
  review applications, and convert shortlisted candidates to Assignments.
- [ ] Public Jobs filter by country, location, category/profession, rate,
  work mode, and employment type; visa/sponsorship is absent from Phase 1.
- [ ] Application events create durable in-app/email-outbox records with no
  sensitive note or document data in email payloads.
- [ ] Private Storage, RLS, RPC ownership, upload validation, Auth abuse
  controls, and no-secret checks have fresh passing evidence.
- [ ] `/jobs/:slug` URLs, sitemap, robots, metadata, and mobile layout work.
- [ ] Unit tests, lint, build, SQL lint/migrations, and E2E tests have current
  evidence, with any external email/provider limitation documented precisely.
- [ ] No Phase 2 feature is represented as an implemented Phase 1 feature.
