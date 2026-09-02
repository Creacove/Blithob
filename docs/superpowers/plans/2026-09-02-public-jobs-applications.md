# Public Jobs and Applications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Make the public Blithob Pro website and authenticated operations app consume one Supabase source of truth for Services, Job listings, and Professional applications.

**Architecture:** Keep 'services', 'jobs', and 'job_references' as canonical operational records. Add a normalized public category taxonomy, safe read-only RPCs for anonymous discovery, and a transactional 'job_applications' model for authenticated applicants. The landing page and new public routes use a dedicated public repository; the existing Zustand/Supabase workflow store remains the internal app boundary.

**Tech Stack:** React 19, TypeScript, React Router, Zustand, Supabase JS, PostgreSQL migrations/RLS/RPCs, Vitest, Testing Library, Playwright, Netlify.

---

## Execution rules

- Work directly in C:\Users\USER\Documents\Blithop on 'main'; do not create or use a new worktree.
- Preserve the approved landing-page visual language and the existing internal workflow model.
- Never commit '.env.local', Supabase database passwords, Auth tokens, service-role keys, or private applicant data.
- Use test-first slices: write a focused failing test, run it to observe the expected failure, implement the smallest change, rerun the focused test, then run the relevant regression suite.
- Do not publish candidate-facing content until the factual content manifest has been reviewed. The current five landing jobs are input for review, not automatically true production records.
- The linked project already has migration '202608130010_account_profile_update'; new migrations start at '202609020011'.

## File map

### Database

- Create: 'supabase/migrations/202609020011_public_job_surface.sql' for public metadata, 'job_categories', 'job_applications', indexes, grants, RLS, and all named functions.
- Create: 'supabase/migrations/202609020012_public_job_content.sql' for idempotent, unpublished launch catalog/content rows after factual review.
- Create: 'supabase/tests/public_jobs_and_applications.sql' for public access and transition assertions.
- Modify: 'supabase/seed.sql' only if local development needs the same unpublished catalog fixture.

### Public data boundary

- Create: 'src/lib/publicListings.ts' for public DTOs, query parameters, RPC calls, and result normalization.
- Create: 'src/lib/publicListings.test.ts' for pure query/DTO behavior and Supabase client contract tests.

### Public and applicant UI

- Create: 'src/pages/public/PublicJobsPage.tsx'.
- Create: 'src/pages/public/PublicJobDetailPage.tsx'.
- Create: 'src/pages/public/PublicApplyPage.tsx'.
- Create: 'src/pages/public/PublicApplicationsPage.tsx'.
- Create: 'src/pages/public/publicPages.test.tsx'.
- Modify: 'src/pages/LandingPage.tsx' and 'src/components/landing/LandingArtwork.tsx' to consume live records and route every discovery action.
- Modify: 'src/pages/LoginPage.tsx', 'src/store/professionalStore.ts', and 'src/App.tsx' for public Professional signup, onboarding continuation, and routes.

### Internal app

- Create: 'src/pages/admin/ApplicationsPage.tsx' and 'src/pages/admin/ApplicationsPage.test.tsx'.
- Modify: 'src/pages/admin/JobEditorPage.tsx', 'JobsPage.tsx', 'JobDetailPage.tsx', 'ServicesPage.tsx', and 'ServiceDetailPage.tsx' for public publication fields, category, featured order, and application entry points.
- Modify: 'src/store/professionalStore.ts' and 'src/lib/supabaseRepository.ts' for application reads/mutations and profile completion.
- Modify: 'src/components/AppShell.tsx' if a new Professional 'My applications' navigation item is needed.

### QA and documentation

- Create or modify 'e2e/public-jobs.spec.ts' and 'e2e/application-flow.spec.ts'.
- Modify 'README.md' and 'docs/supabase-operations.md' with migration, Auth redirect, content publication, and QA runbooks.

---

## Task 1: Reconcile the remote baseline and write database contract tests

**Files:**
- Create: 'supabase/tests/public_jobs_and_applications.sql'
- Create: 'supabase/migrations/202609020011_public_job_surface.sql'
- Create: 'supabase/migrations/202609020012_public_job_content.sql'
- Modify: 'README.md', 'docs/supabase-operations.md'

- [ ] **Step 1: Record the remote baseline before changing it.**

Run:

~~~powershell
supabase migration list --linked --workdir .
supabase inspect db table-stats --linked --workdir .
~~~

Expected: migrations '202608130001' through '202608130010' are remote, and the operational tables currently have zero rows. Do not reset the linked database.

- [ ] **Step 2: Write the SQL assertions before the migration body.**

Create assertions that fail until the new objects exist:

~~~sql
begin;

select has_table('public', 'job_categories');
select has_table('public', 'job_applications');
select has_function('public', 'list_public_jobs');
select has_function('public', 'get_public_job');
select has_function('public', 'list_public_categories');
select has_function('public', 'submit_job_application');
select has_function('public', 'review_job_application');
select has_function('public', 'convert_job_application_to_assignment');

select has_column('public', 'jobs', 'public_visible');
select has_column('public', 'jobs', 'featured_order');
select has_column('public', 'jobs', 'application_deadline');
select has_column('public', 'services', 'public_visible');

select is_rls_enabled('public', 'job_categories');
select is_rls_enabled('public', 'job_applications');

rollback;
~~~

Use the repository's existing SQL-test conventions if the linked project does not expose 'has_table' helpers. Keep the assertions as a durable contract even when remote execution is unavailable locally.

- [ ] **Step 3: Write the migration schema and grants.**

The migration must create the 'job_application_status' enum, add the public metadata columns, create 'job_categories', add 'jobs.category_id', create 'job_applications', add updated-at triggers, and add the partial unique index on 'jobs.featured_order' plus the unique '(job_id, professional_id)' index. Store rate values as integer minor units with an explicit currency and period. Use 'public' schema-qualified names and a locked 'search_path' in every security-definer function.

- [ ] **Step 4: Add the public read functions.**

Implement these typed functions with explicit return columns:

~~~sql
public.list_public_services()
public.list_public_categories()
public.list_public_jobs(
  p_query text default null,
  p_service_slug text default null,
  p_category_slug text default null,
  p_work_mode text default null,
  p_location text default null,
  p_featured_only boolean default false,
  p_limit integer default 5,
  p_offset integer default 0
)
public.get_public_job(p_slug text)
~~~

Filter with:

~~~sql
j.publication_state = 'open'
and j.public_visible = true
and (j.application_deadline is null or j.application_deadline > now())
~~~

Also require non-blank public summary, company, employment type, work mode, and location. Return only candidate-safe columns and public references. Revoke function execution from 'public'; grant only the required read functions to 'anon' and 'authenticated'. Do not grant anonymous 'select' on the underlying operational tables.

- [ ] **Step 5: Add the application and onboarding functions.**

Implement:

~~~sql
public.complete_my_professional_profile(p_display_name text, p_phone text, p_location text)
public.submit_job_application(p_job_slug text, p_cover_note text, p_portfolio_url text default null)
public.withdraw_job_application(p_application_id uuid)
public.review_job_application(p_application_id uuid, p_status job_application_status, p_admin_note text)
public.convert_job_application_to_assignment(
  p_application_id uuid,
  p_agreed_pay bigint,
  p_deadline timestamptz,
  p_lead_reviewer_id uuid default null
)
~~~

The submit function must check the caller's authenticated Professional row, the public Job predicate, note/URL limits, and the unique application key in a single transaction. Conversion must call the same assignment validation rules as Admin Job detail and update the application/link/activity atomically.

- [ ] **Step 6: Add RLS and grants, then run the focused database checks.**

Allow anonymous execution of read functions only. Allow authenticated execution of applicant functions. Permit applicants to select their own applications and Admins to select/manage all applications. Deny direct application inserts/updates/deletes. Enable RLS on 'job_categories' and 'job_applications' and preserve the existing internal policies.

Run:

~~~powershell
supabase db lint --linked --fail-on error
supabase migration list --linked --workdir .
~~~

Expected: no lint errors and the local/remote migration lists show '011' in sync after applying it.

- [ ] **Step 7: Commit the database checkpoint.**

~~~powershell
git add supabase/migrations supabase/tests README.md docs/supabase-operations.md
git commit -m "feat: add public job and application data contracts"
~~~

## Task 2: Build the typed public listings repository

**Files:**
- Create: 'src/lib/publicListings.ts'
- Create: 'src/lib/publicListings.test.ts'

- [ ] **Step 1: Write failing repository contract tests.**

Cover query normalization and the exact RPC calls:

~~~ts
it('omits empty filters and clamps public pagination', async () => {
  const client = makeFakeSupabaseClient({ jobs: [] });
  const result = await listPublicJobs(client, {
    query: '  designer ',
    limit: 999,
    offset: -10
  });
  expect(result.rows).toEqual([]);
  expect(client.rpc).toHaveBeenCalledWith('list_public_jobs', {
    p_query: 'designer',
    p_service_slug: null,
    p_category_slug: null,
    p_work_mode: null,
    p_location: null,
    p_featured_only: false,
    p_limit: 50,
    p_offset: 0
  });
});

it('maps a public RPC row without exposing internal fields', async () => {
  const row = { id: 'job-1', slug: 'product-designer', title: 'Product Designer', category_label: 'Design', service_label: 'Content', public_company_name: 'Northstar', rate_min_minor: 40000000, rate_max_minor: 65000000, rate_currency: 'NGN', rate_period: 'month', work_mode: 'Remote', location_label: 'Anywhere', public_summary: 'Design useful products.', application_deadline: null, featured_order: 1 };
  const result = await listPublicJobs(makeFakeSupabaseClient({ jobs: [row] }));
  expect(result.rows[0]).toEqual(expect.objectContaining({ slug: 'product-designer', title: 'Product Designer' }));
  expect(result.rows[0]).not.toHaveProperty('client_context');
});
~~~

Run the focused test and verify it fails because the repository module is not implemented.

- [ ] **Step 2: Implement the minimal public DTO boundary.**

Export 'PublicJob', 'PublicService', 'PublicCategory', 'PublicJobQuery', and 'PublicApplicationSummary' types. Implement 'listPublicJobs', 'getPublicJob', 'listPublicServices', and 'listPublicCategories' with typed RPC calls, bounded pagination (1..50), trimmed filters, and normalized errors. Keep this module independent of the authenticated Zustand store.

- [ ] **Step 3: Run the repository tests and refactor only after green.**

~~~powershell
npm test -- src/lib/publicListings.test.ts
~~~

Expected: all focused public repository tests pass.

- [ ] **Step 4: Commit the repository checkpoint.**

~~~powershell
git add src/lib/publicListings.ts src/lib/publicListings.test.ts
git commit -m "feat: add public Supabase listing repository"
~~~

## Task 3: Add public routes and live landing-page data

**Files:**
- Create: 'src/pages/public/PublicJobsPage.tsx'
- Create: 'src/pages/public/PublicJobDetailPage.tsx'
- Create: 'src/pages/public/publicPages.test.tsx'
- Modify: 'src/pages/LandingPage.tsx', 'src/components/landing/LandingArtwork.tsx', 'src/App.tsx'

- [ ] **Step 1: Write failing page tests.**

Cover database-backed rendering and routing:

~~~tsx
it('renders public job rows from the repository and links to slugs', async () => {
  render(<PublicJobsPage repository={repositoryWith({ rows: [jobFixture] })} />);
  expect(await screen.findByRole('heading', { name: 'Product Designer' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Product Designer/ })).toHaveAttribute('href', '/jobs/product-designer');
});

it('shows an honest empty state when no public jobs exist', async () => {
  render(<PublicJobsPage repository={repositoryWith({ rows: [] })} />);
  expect(await screen.findByText(/No open roles yet/i)).toBeInTheDocument();
});

it('turns the landing View all jobs and featured cards into real routes', async () => {
  render(<LandingPage repository={repositoryWith({ rows: [jobFixture] })} />);
  expect(screen.getByRole('link', { name: /View all jobs/i })).toHaveAttribute('href', '/jobs');
  expect(await screen.findByRole('link', { name: /View Product Designer job/i })).toHaveAttribute('href', '/jobs/product-designer');
});
~~~

Run the focused page tests and observe the expected failures before changing the production components.

- [ ] **Step 2: Implement 'PublicJobsPage'.**

Read URL search parameters into 'PublicJobQuery', render role/category/work mode/location controls, call 'listPublicJobs', preserve the query in links, and render loading, error/retry, empty, and paginated states. Use a candidate-facing layout consistent with the landing page, not the Admin table.

- [ ] **Step 3: Implement 'PublicJobDetailPage'.**

Load by slug, render safe summary/rate/location/work mode/deadline/category and public references, show a not-found state, and link 'Apply' to '/jobs/:slug/apply'. Do not import Admin-only fields or the private workspace store.

- [ ] **Step 4: Replace landing constants and no-op controls.**

Make 'LandingPage' load featured rows and public categories through the public repository. Pass live rows into 'LiveJobsBoard'; render only returned rows and an honest “more opportunities coming soon” state when fewer than five exist. Make each overlay action a React Router link. Make 'SearchPanel' controlled, populate category options from the public category query, and navigate to '/jobs' with encoded query parameters. Make category folders links to '/jobs?category=<slug>'.

- [ ] **Step 5: Register routes and run the focused regression suite.**

Add public routes before protected route groups in 'src/App.tsx':

~~~tsx
<Route path="/jobs" element={<PublicJobsPage />} />
<Route path="/jobs/:slug" element={<PublicJobDetailPage />} />
~~~

Run:

~~~powershell
npm test -- src/pages/LandingPage.test.tsx src/pages/public/publicPages.test.tsx
~~~

- [ ] **Step 6: Commit the public discovery checkpoint.**

~~~powershell
git add src/pages/LandingPage.tsx src/components/landing/LandingArtwork.tsx src/pages/public src/App.tsx
git commit -m "feat: connect landing discovery to public jobs"
~~~

## Task 4: Add public Professional signup, onboarding, and application submission

**Files:**
- Create: 'src/pages/public/PublicApplyPage.tsx'
- Create: 'src/pages/public/PublicApplicationsPage.tsx'
- Create: 'src/pages/public/applicationFlow.test.tsx'
- Modify: 'src/pages/LoginPage.tsx', 'src/store/professionalStore.ts', 'src/lib/supabaseRepository.ts', 'src/App.tsx', 'src/components/AppShell.tsx'

- [ ] **Step 1: Write failing auth/application flow tests.**

Cover return-path preservation, signup mode, profile completion, duplicate status rendering, and application submission:

~~~tsx
it('preserves the job return path when a visitor needs to sign in', () => {
  render(<PublicApplyPage job={jobFixture} session={null} />);
  expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
    'href',
    '/login?next=%2Fjobs%2Fproduct-designer%2Fapply'
  );
});

it('renders an existing application status instead of a second form', async () => {
  render(<PublicApplyPage job={jobFixture} session={sessionFixture} existingApplication={applicationFixture} />);
  expect(await screen.findByText(/already submitted/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /submit application/i })).not.toBeInTheDocument();
});

it('submits a new application and shows server-confirmed success', async () => {
  const user = userEvent.setup();
  render(<PublicApplyPage job={jobFixture} session={sessionFixture} submitApplication={submitApplication} />);
  await user.type(screen.getByLabelText(/cover note/i), 'I can deliver this work.');
  await user.click(screen.getByRole('button', { name: /submit application/i }));
  expect(submitApplication).toHaveBeenCalledWith(expect.objectContaining({ jobSlug: 'product-designer' }));
  expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
});
~~~

Run this suite and confirm it fails for missing routes/components/actions.

- [ ] **Step 2: Add Supabase profile completion to the repository/store.**

Expose 'completeMyProfessionalProfile', 'submitJobApplication', 'withdrawJobApplication', and 'loadMyApplications' through the existing store boundary. The profile RPC must create/update the current authenticated Professional without allowing a client-supplied role. Refresh the remote workspace after each successful mutation.

- [ ] **Step 3: Extend 'LoginPage' without weakening Admin auth.**

Add a sign-up mode with display name/email/password, use Supabase 'signUp', show the email-confirmation state when no session is returned, and preserve a validated 'next' path. Keep Admin invitations and existing password reset behavior. Signed-out visitors must never see the demo persona picker in a configured production build.

- [ ] **Step 4: Implement onboarding continuation and 'PublicApplyPage'.**

If a signed-in user lacks a Professional row, render the profile completion form, call the RPC, then return to the original Job. Otherwise render the cover-note/portfolio form, submit through the application RPC, and display the server status. Validate required note and URL protocol in the UI while keeping SQL validation authoritative.

- [ ] **Step 5: Implement 'PublicApplicationsPage' and navigation.**

Render only the current Professional's application summaries, with status, Job title, submitted/reviewed timestamps, and links back to public Job detail. Add a navigation entry in the Professional shell without exposing Admin application data.

- [ ] **Step 6: Run focused and existing auth/store tests.**

~~~powershell
npm test -- src/pages/public/applicationFlow.test.tsx src/pages/LoginPage.test.tsx src/store/professionalStore.test.ts src/App.test.tsx
~~~

Keep local demo-mode tests deterministic while configured production mode uses Supabase Auth and remote rows.

- [ ] **Step 7: Commit the applicant checkpoint.**

~~~powershell
git add src/pages/public src/pages/LoginPage.tsx src/store/professionalStore.ts src/lib/supabaseRepository.ts src/App.tsx src/components/AppShell.tsx
git commit -m "feat: add Professional signup and job applications"
~~~

## Task 5: Connect Admin publication and application review

**Files:**
- Create: 'src/pages/admin/ApplicationsPage.tsx'
- Create: 'src/pages/admin/ApplicationsPage.test.tsx'
- Modify: 'src/pages/admin/JobEditorPage.tsx', 'src/pages/admin/JobsPage.tsx', 'src/pages/admin/JobDetailPage.tsx', 'src/pages/admin/ServicesPage.tsx', 'src/pages/admin/ServiceDetailPage.tsx', 'src/store/professionalStore.ts', 'src/lib/supabaseRepository.ts', 'src/App.tsx'

- [ ] **Step 1: Write failing Admin tests.**

Cover publication fields, featured-slot validation, application filters, and conversion:

~~~tsx
it('requires public fields before an Admin can publish a public Job', async () => {
  render(<JobEditorPage job={draftJobFixture} />);
  expect(screen.getByLabelText(/public company/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/featured slot/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled();
});

it('lets an Admin review and convert a shortlisted application', async () => {
  const user = userEvent.setup();
  render(<ApplicationsPage applications={[shortlistedApplicationFixture]} />);
  await user.click(screen.getByRole('button', { name: /convert to assignment/i }));
  expect(convertApplication).toHaveBeenCalledWith(expect.objectContaining({ applicationId: 'application-1' }));
});
~~~

Run the focused suite and observe expected failures.

- [ ] **Step 2: Add public metadata to Job and Service forms.**

Job editing must save slug, category, public summary/company, work mode, location, employment type, rate range/currency/period, application deadline, public visibility, and featured order. Service editing must save slug, public visibility, and display order. Prevent duplicate featured slots in the UI and surface the database error if a concurrent Admin claims a slot.

- [ ] **Step 3: Implement the Admin Applications queue and Job detail panel.**

Add status/Job filters, applicant identity, submitted time, safe cover-note preview, and explicit review actions. Shortlist/reject actions call the named RPC and refresh canonical state. Conversion asks for agreed pay/deadline/lead, then calls the conversion RPC and shows the resulting Assignment link.

- [ ] **Step 4: Add routes and store/repository actions.**

Register '/admin/applications'; add application loading/review/conversion methods to the remote repository/store; keep application data out of the public DTOs and non-Admin store projections.

- [ ] **Step 5: Run Admin/workflow regressions and commit.**

~~~powershell
npm test -- src/pages/admin/ApplicationsPage.test.tsx src/pages/admin src/store/professionalStore.test.ts src/lib/supabaseRepository.test.ts
git add src/pages/admin src/store/professionalStore.ts src/lib/supabaseRepository.ts src/App.tsx
git commit -m "feat: add Admin publication and application review"
~~~

## Task 6: Insert reviewed launch content and make the catalog coherent

**Files:**
- Modify: 'supabase/migrations/202609020012_public_job_content.sql', 'supabase/seed.sql', 'src/pages/LandingPage.test.tsx', 'src/components/landing/LandingArtwork.tsx'
- Create: 'docs/public-content-manifest.md'

- [ ] **Step 1: Write the content manifest from current landing copy.**

Document the five candidate Job records with slug, title, company, category, operational Service, rate in NGN minor units, work mode, location, public summary, application deadline, and factual-review status. Document the five candidate category labels (Tech, Design, Marketing, Operations, Customer Support) and the operational Service catalog separately.

- [ ] **Step 2: Add idempotent unpublished SQL.**

Use stable UUIDs/slugs and 'insert ... on conflict ... do update' for approved catalog records. Insert candidate Jobs with 'publication_state = draft', 'public_visible = false', and no featured order. Do not invent a company, salary, or deadline to make the page look full.

- [ ] **Step 3: Add landing fixtures that prove no static production fallback.**

Update the landing tests so the five candidate fixtures are supplied by the repository mock and so an empty repository produces the honest empty state. Remove the compile-time 'const jobs' array and category array from production components.

- [ ] **Step 4: Apply content only after factual review.**

Run:

~~~powershell
supabase db push --linked --workdir .
supabase db lint --linked --fail-on error
~~~

Keep candidate rows unpublished until an authorized Admin confirms the factual fields in the Admin UI. Then set public visibility/open state and featured slots through the application, not by editing production tables manually.

- [ ] **Step 5: Commit the content checkpoint.**

~~~powershell
git add supabase/migrations/202609020012_public_job_content.sql supabase/seed.sql docs/public-content-manifest.md src/pages/LandingPage.test.tsx src/components/landing/LandingArtwork.tsx
git commit -m "content: add reviewed public job catalog manifest"
~~~

## Task 7: End-to-end QA, security checks, and production release

**Files:**
- Create: 'e2e/public-jobs.spec.ts'
- Create: 'e2e/application-flow.spec.ts'
- Modify: 'README.md', 'docs/supabase-operations.md', 'netlify.toml' only if a redirect/header is needed

- [ ] **Step 1: Add local public discovery E2E coverage.**

With demo fixtures or a deterministic test repository, assert that:

- '/' loads without console errors;
- 'View all jobs' navigates to '/jobs';
- search/category filters update the URL and results;
- a featured card reaches '/jobs/:slug';
- missing and empty states are readable on mobile and desktop;
- no internal fields are present in public page text or links.

- [ ] **Step 2: Add configured Supabase contract checks.**

Create a QA script or Playwright project that uses only the public anon key to assert anonymous public functions return safe rows, direct REST reads of internal tables are denied/empty, draft/archived jobs are absent, and the production bundle contains no service-role key or database password.

- [ ] **Step 3: Add authenticated application E2E coverage.**

Using a pre-created test Professional/Admin account supplied through local environment variables (never committed), cover signup-confirmation handling or sign-in, profile completion, one application, duplicate blocking, Admin review, conversion to Assignment, and applicant status reload. Skip only the external email-confirmation step when the provider cannot deliver in CI, and assert the remaining server contracts directly.

- [ ] **Step 4: Run the full verification loop.**

~~~powershell
supabase migration list --linked --workdir .
supabase db lint --linked --fail-on error
npm test
npm run lint
npm run build
npm run test:e2e
~~~

Read every exit code and failure count. Fix failures with a focused test first, then rerun the full loop.

- [ ] **Step 5: Deploy and smoke-test production.**

Build with the Netlify Supabase URL and public anon key, deploy the 'dist' directory to the linked Netlify site, and verify from a clean browser:

~~~text
https://blithob-proto-20260609.netlify.app/
https://blithob-proto-20260609.netlify.app/jobs
~~~

Check desktop and mobile layout, live rows, direct Job detail, Auth redirect, and absence of prototype persona controls. Configure the Netlify URL and eventual custom domain in Supabase Auth redirect settings before testing email links.

- [ ] **Step 6: Push the verified main branch and record the release.**

~~~powershell
git status --short --branch
git diff --check
git log --oneline --decorate -12
git push origin main
~~~

Record the deployed URL, migration IDs, QA commands, and any external Auth email limitation in 'docs/supabase-operations.md'.

## Completion checklist

- [ ] Public landing jobs, categories, search, and Job detail are backed by Supabase functions, not constants.
- [ ] The 'View all jobs' and every featured/category action routes to real public pages.
- [ ] Public signup, onboarding, application submit, duplicate blocking, and applicant status work.
- [ ] Admin publication, application review, and Assignment conversion work through RLS/RPC boundaries.
- [ ] No internal job/application fields leak to anonymous users.
- [ ] Reviewed content is published and visible identically in Admin, landing, and public Jobs pages.
- [ ] Database lint, SQL assertions, unit tests, lint, build, E2E, and production smoke checks have fresh passing evidence.
