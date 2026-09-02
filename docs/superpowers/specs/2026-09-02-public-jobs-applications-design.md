# Public Jobs and Applications Design

## Status

Approved direction. The user approved a database-first architecture with
public job discovery, authenticated Professional applications, and no separate
website CMS copy of the operational data.

## Goal

Make the public Blithob Pro website and the authenticated operations app
consume one canonical Supabase data model so that published Jobs and Services
appear consistently everywhere, visitors can browse and apply, and Admins can
move applications into the existing Assignment workflow.

## Research lens

This design uses Martin Kleppmann's data-intensive-systems lens: records are
written once into a canonical model, while audience-specific read models are
derived from that model. The plan does not claim that Kleppmann designed
Blithob; it applies the consistency and data-boundary principles from his work
on reliable data systems and Automerge.

Relevant references:

- [Martin Kleppmann's research and publications](https://martin.kleppmann.com/index.html)
- [Making Sense of Stream Processing](https://martin.kleppmann.com/papers/stream-processing.pdf)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase database functions](https://supabase.com/docs/guides/database/functions)
- [Supabase JavaScript signUp](https://supabase.com/docs/reference/javascript/auth-signup)

Supabase's access model is important here: grants decide whether an exposed
object is reachable and RLS/policy logic decides which rows are allowed. Public
read functions therefore return an explicit safe projection rather than
granting anonymous access to the internal `jobs` or `services` tables.

## Current audit

The landing page currently declares five `jobs` in
`src/pages/LandingPage.tsx`. The role, company, rate, type, location,
description, and featured ordering are all compile-time values. The `SearchPanel`
and `LiveJobsBoard` in `src/components/landing/LandingArtwork.tsx` are visual
controls with no database query or route behavior. The category folders are
also a hardcoded five-item array.

The app already has canonical-looking operational tables and Admin editing
flows for `services`, `service_requirements`, `jobs`, and `job_references`.
Those tables are currently protected for authenticated workspace users only;
there is no public job route, no public listing projection, and no
`job_applications` table. The linked Supabase project has the existing schema
migrations applied but currently contains zero rows in the operational tables,
so the website cannot truthfully show live records until approved content is
inserted and published.

The repository is also one migration behind the linked project: remote
migration `202608130010_account_profile_update` already exists. New migrations
must begin after that version and must not overwrite or silently omit it.

## Product decisions

- Public visitors may browse open, public Jobs without signing in.
- Applying requires a Supabase Auth Professional account.
- Admin accounts remain invite-only and continue to use the internal
  operations workflow.
- A public application never auto-assigns work. Admin review and conversion to
  an Assignment remain explicit decisions.
- A Job or Service is authored once in Supabase. The website never stores a
  second copy of its content in a JavaScript constant or separate CMS table.
- The current landing jobs and category labels are candidate launch content,
  not automatically factual claims. They become public only after an Admin
  confirms the company, pay, location, work mode, and application deadline.
- A first application release requires a cover note and supports an optional
  portfolio link. Resume upload is intentionally deferred until the business
  confirms its document and retention requirements.

## Architecture

```text
Admin Services / Jobs editor
              |
              v
      canonical Supabase tables
       services + jobs + refs
              |
       safe database functions
          /             \
         v               v
 public landing/listing  authenticated app
     read models        workspace + applications
                              |
                              v
                    application -> assignment RPC
```

The existing internal `services` and `jobs` tables remain the write/source
records. Public functions expose only fields intended for discovery. The React
store/repository continues to own authenticated workspace state, while a small
public-listings repository owns anonymous discovery queries. Both boundaries
point at the same database rows.

The current five public folder labels and four operational readiness Services
are different concepts, so the design makes that distinction explicit. A
normalized `job_categories` taxonomy will drive public discovery and link to a
Job; `services` will continue to drive readiness and any public service copy.
Neither taxonomy nor Services duplicates Job content, and the UI never infers
categories from display strings.

## Data model

### Services

Add public catalog metadata to `services`:

- `slug text unique` — stable URL/filter key;
- `public_visible boolean not null default false` — whether the Service may
  appear on the public site;
- `display_order integer not null default 0` — deterministic folder/list order;
- `public_label text` — optional public-facing label when the internal name is
  unsuitable.

Existing readiness requirements remain attached to the same Service rows. The
Admin Services screen edits the canonical row and its public visibility/order.

### Public job categories

Create `job_categories` as the canonical discovery taxonomy:

- `id uuid primary key`;
- `slug text unique`;
- `label text`;
- `description text not null default ''`;
- `active boolean not null default true`;
- `display_order integer not null`;
- `created_at`, `updated_at`.

The launch manifest will propose the five labels already used by the landing
artwork—Tech, Design, Marketing, Operations, and Customer Support—but they are
published only after the owner confirms the wording. Jobs link to one category
through `category_id`; the public folder UI reads this table, while the
operational Service relation remains available for readiness and assignment
eligibility.

### Jobs

Add public listing fields to `jobs`:

- `slug text unique`;
- `category_id uuid references job_categories(id)`;
- `public_visible boolean not null default false`;
- `public_summary text not null default ''`;
- `public_company_name text not null default ''`;
- `employment_type text not null default ''`;
- `work_mode text not null default ''`;
- `location_label text not null default ''`;
- `rate_min_minor bigint`;
- `rate_max_minor bigint`;
- `rate_currency text not null default 'NGN'`;
- `rate_period text not null default 'project'`;
- `application_deadline timestamptz`;
- `featured_order smallint` with a check restricting values to `1` through
  `5`, plus a partial unique index so each featured slot is occupied at most
  once.

The existing `deadline` remains the internal delivery deadline used by the
operations workflow. It must not be displayed as the candidate application
deadline. Public eligibility is:

```text
publication_state = 'open'
AND public_visible = true
AND (application_deadline IS NULL OR application_deadline > now())
```

The SQL function excludes rows missing a non-blank `public_summary`,
`public_company_name`, `employment_type`, `work_mode`, or `location_label`.
Internal fields such as `client_context`, `steps`,
`acceptance_criteria`, `created_by`, assignments, and payments are not part of
the public projection.

### Public read contracts

Expose only explicit, typed database-function results:

- `list_public_services()` returns active, public Services ordered by
  `display_order` and name;
- `list_public_categories()` returns active Job categories ordered by
  `display_order` and label;
- `list_public_jobs(query, service_slug, work_mode, location, featured_only,
  limit, offset)` returns safe Job cards and a total/count signal;
- `get_public_job(slug)` returns one safe Job detail, its public Service
  summary, and public references.

The functions are read-only, use a locked `search_path`, filter publication
state inside SQL, and are granted only to `anon` and `authenticated` as
needed. Direct anonymous table access is not granted. The public repository
will call these functions through the existing browser-safe Supabase client.

### Applications

Create `job_applications`:

- `id uuid primary key`;
- `job_id uuid not null references jobs(id) on delete restrict`;
- `professional_id uuid not null references professionals(id) on delete
  restrict`;
- `cover_note text not null`;
- `portfolio_url text`;
- `status application_status not null default 'submitted'`;
- `admin_note text not null default ''`;
- `reviewed_by uuid references profiles(id) on delete set null`;
- `reviewed_at timestamptz`;
- `assignment_id uuid unique references assignments(id) on delete set null`;
- `created_at`, `updated_at`;
- unique `(job_id, professional_id)`.

The initial status enum is `submitted`, `under_review`, `shortlisted`,
`rejected`, `withdrawn`, and `converted`. Database functions enforce valid
transitions, job publication eligibility, profile ownership, non-duplicate
applications, note/URL length limits, and conversion only by an Admin. Every
review or conversion writes an `activity_events` record.

### Applicant onboarding

The current Auth bootstrap expects a matching `professionals` row. Public
signup therefore needs a safe `complete_my_professional_profile` function that
creates or updates the authenticated user's Professional row with display name,
phone, and location. The caller cannot choose `account_role`; it remains a
server-controlled Professional default. Admin invitation behavior stays on the
existing Edge Function path.

## Routes and UI behavior

### Public routes

- `/` — landing page with live featured Jobs and Services;
- `/jobs` — searchable, filterable public Job directory;
- `/jobs/:slug` — safe public Job detail;
- `/jobs/:slug/apply` — authenticated application form or auth/onboarding
  continuation;
- `/login?next=...` — sign-in/sign-up/reset entry with a preserved return path;
- `/onboarding?next=...` — Professional profile completion;
- `/professional/applications` — applicant's own application statuses.

### Landing behavior

- `View all jobs` navigates to `/jobs`.
- `Search Jobs` navigates to `/jobs` with query parameters instead of being a
  no-op button.
- Role, category, and location controls are controlled inputs backed by the
  public repository. Category options come from the public catalog.
- Featured cards use `featured_order` and link to `/jobs/:slug`. The desktop
  and mobile artwork remains responsive, but the text is live data.
- Category folders use active `job_categories` rows and link to filtered Jobs;
  any separate public service copy uses active `services` rows.
- If fewer than five jobs are published, the layout renders only real rows and
  an honest “more opportunities coming soon” state; it never pads the page with
  fake cards.
- Production loading, empty, and error states are explicit. Deterministic
  fixtures may remain for local tests only.

### Application flow

1. A signed-out visitor selects `Apply` and is sent to `/login?next=...`.
2. The auth page supports sign-in and public Professional account creation;
   Admins are still invited through the internal flow.
3. Supabase email confirmation is handled before the applicant can submit.
4. A new applicant completes the minimum Professional profile, then returns to
   the original Job.
5. The application form submits through `submit_job_application`, shows the
   server status, and links to “My applications”.
6. If an application already exists, the page shows its current status instead
   of offering a second submission.

### Internal app flow

- Admin Jobs editor gains the public fields, visibility toggle, application
  deadline, and featured slot.
- Admin Services gains public visibility and display order controls.
- `/admin/applications` lists applications with filters for Job and status.
- Job detail shows its applications and allows review, shortlist/reject, and
  conversion into an Assignment with the existing assignment rules.
- Professional navigation gains “My applications” with status and timestamps.

## Security and abuse controls

- No service-role key or database password enters the browser build.
- Public functions return explicit columns and use a locked search path.
- `job_applications` has RLS for own-applicant reads and Admin reads; direct
  applicant insert/update/delete is denied in favor of RPCs.
- Application RPCs verify `auth.uid()`, the linked Professional, public Job
  state, deadline, and uniqueness in one transaction.
- Input limits are enforced in SQL and mirrored in the form: cover note length,
  URL length and protocol, and bounded pagination/filter values.
- Supabase Auth rate limits protect account creation. If authenticated spam
  appears after launch, an Edge Function/Turnstile gate can be added without
  changing the canonical application model.
- Supabase Auth redirect allow-list must include the Netlify URL and eventual
  custom domain before email confirmation/reset is tested in production.

## Content and migration strategy

1. Reconcile remote migration `202608130010` locally before creating the next
   migration.
2. Add the public fields, application enum/table, RLS, grants, and named RPCs
   in a versioned migration after `010`.
3. Add an idempotent content migration/manifest for the current five landing
   jobs and public category/service candidates. All candidate Jobs start as
   drafts and not public.
4. Preserve existing Service IDs where present. Insert the normalized
   `job_categories` taxonomy and map Jobs to categories explicitly; never map
   by string comparison in React.
5. Admin confirms factual launch content and publishes exactly the desired
   featured order through the app. The landing page begins showing records only
   after this gate.
6. Avoid a destructive reset of the linked project. The remote database is
   currently empty, but all seed SQL must be idempotent and safe to rerun.

## File boundaries

Expected implementation units:

- `supabase/migrations/202609020011_public_job_surface.sql` — category/public
  listing schema, indexes, grants, RLS, and public/application RPCs;
- `supabase/migrations/202609020012_public_job_content.sql` — reviewed,
  unpublished launch catalog and Job manifest;
- `supabase/tests/public_jobs_and_applications.sql` — anonymous/public/RLS and
  transition assertions;
- `src/lib/publicListingsRepository.ts` and its tests — public function calls,
  typed mapping, query parameters, and error normalization;
- `src/pages/public/PublicJobsPage.tsx`, `PublicJobDetailPage.tsx`,
  `PublicApplyPage.tsx`, and `PublicApplicationsPage.tsx` — public and
  applicant-facing routes;
- `src/pages/admin/ApplicationsPage.tsx` — Admin review queue;
- `src/pages/LandingPage.tsx` and `src/components/landing/LandingArtwork.tsx`
  — live data injection, links, filters, loading, and empty states;
- `src/pages/LoginPage.tsx`, `src/store/professionalStore.ts`, and `src/App.tsx`
  — public signup, onboarding continuation, application actions, and routes;
- `src/pages/admin/JobEditorPage.tsx`, `JobsPage.tsx`, `JobDetailPage.tsx`,
  `ServicesPage.tsx`, and `ServiceDetailPage.tsx` — publication metadata and
  application review entry points;
- `README.md` and `docs/supabase-operations.md` — setup, migration, Auth
  redirects, content publication, and release runbook.

## Verification and release criteria

The work is complete only when all of the following are true:

- Anonymous browser can load `/`, `/jobs`, and `/jobs/:slug` from Supabase
  public functions and cannot query internal tables.
- Landing featured cards, category folders, search, and “View all jobs” use
  live data and route to real pages.
- A new Professional can sign up, confirm email, complete a profile, submit
  exactly one application for a public Job, and see its status after reload.
- Admin can review an application and convert it into one existing Assignment;
  duplicate conversion and invalid transitions are rejected by the database.
- Draft, internal-only, archived, and expired Jobs never appear in public
  results.
- `supabase db lint --linked --fail-on error`, SQL assertions, Vitest, lint,
  production build, and Playwright public/authenticated smoke flows pass.
- Netlify production environment contains only the public Supabase URL and
  publishable/anon key; no service-role material appears in source or bundle.
- The approved launch content has been published by an Admin and matches the
  same rows visible in the Admin Jobs and Services screens.

## Non-goals

- No separate CMS or website-only Job table.
- No automatic assignment of applicants to work.
- No public client accounts or client-facing project portal.
- No payment processing change.
- No resume/document upload until retention, access, and storage requirements
  are approved.
- No real-time subscription requirement for the first release; page-load
  queries and post-mutation refreshes are sufficient. Realtime can be added as
  an optimization after the canonical flow is stable.
