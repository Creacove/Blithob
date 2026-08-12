# Blithob Supabase Backend Design

## Status

Approved direction, ready for implementation planning.

This design turns the current client-only Blithob Professionals prototype into
the first production application backed by Supabase. The target Supabase
project is `Blithob` in the `Creacove2` organization, project ref
`cyrgywfdmfnqnontjnxv`, hosted in West EU (Ireland).

The current working-tree UI changes are preserved. GitHub publication is
independent of this backend work and is intentionally deferred.

## Goals

- Replace browser `localStorage` as the source of truth with Supabase Auth,
  Postgres, Storage, and the generated Data API.
- Preserve the current unified Professional workflow and its existing routes
  and language.
- Enforce role and workflow permissions in the database, not only in React.
- Keep Admin, Professional, and Lead behavior understandable and auditable.
- Make schema changes reproducible through committed SQL migrations.
- Keep the first production version small: no client accounts, automatic
  payments, chat, time tracking, or complex workflow engine.

## Non-goals

- Rebuild the visual interface.
- Keep the obsolete Worker/Trainer model as a production model.
- Add a separate API server for ordinary reads and writes.
- Move money through Supabase. Payments remain manual records until the later
  Paystack phase.
- Automatically email every mutation in the first backend slice. Notifications
  are stored in-app first; email delivery can consume the same events later.

## Product contract

The production model is the one documented in
`docs/superpowers/specs/2026-06-10-unified-professional-workflow-design.md`:

- An Admin manages the operation.
- Every non-Admin account is a Professional.
- A Professional may have Lead capability without becoming a separate role.
- A Job is a shared brief.
- An Assignment is one Professional doing one Job.
- Readiness belongs to a Professional's Service Enrolment.
- Work reviews belong to a specific Submission.
- Payments belong to completed Assignments.

The legacy `src/domain/types.ts`, `src/domain/workflow.ts`, and
`src/store/appStore.ts` model remain compatibility material until all active
routes use the Supabase-backed unified model. They are not part of the new
database schema.

## Status enums

The migration defines these PostgreSQL enums so invalid workflow states cannot
enter the database:

- `account_role`: `admin | professional`
- `professional_account_status`: `active | inactive`
- `service_enrolment_status`: `not_started | in_progress | waiting_for_lead |
  changes_requested_by_lead | waiting_for_admin | changes_requested_by_admin |
  approved | paused`
- `job_publication_state`: `draft | open | archived`
- `assignment_status`: `assigned | in_progress | waiting_for_lead |
  changes_requested_by_lead | waiting_for_admin | changes_requested_by_admin |
  approved | completed | cancelled`
- `payment_status`: `due | scheduled | paid | issue`
- `payment_method`: `bank_transfer | mobile_money | cash | cheque | other`
- `readiness_reviewer_type` and `assignment_reviewer_type`: `lead | admin`
- `readiness_review_decision` and `assignment_review_decision`:
  `changes_requested | certified | approved`
- `reference_kind`: `link | file`

## Architecture

```text
React pages
    |
    v
Zustand session/server store
    |
    v
Supabase repository services + workflow RPC calls
    |                         \
    v                          v
Supabase Auth             Postgres + RLS
                               |
                               v
                         Storage evidence files
```

### Frontend boundary

Add a single browser-safe client at `src/lib/supabase.ts`, configured only
from:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The anon key is safe for a browser only because RLS is the security boundary.
No service-role key, database password, or direct connection string may enter
the frontend, `.env` files tracked by Git, or the repository.

Add focused repository modules under `src/services/` for queries and mutations.
The store remains the page-facing state boundary, but it stops persisting the
entire `DemoState` locally. It will own:

- the authenticated Supabase session;
- loading and mutation error state;
- canonical rows loaded from Supabase;
- thin async actions that call repository methods or RPCs.

Pure selectors and validation in `src/domain/` remain useful for rendering and
unit tests. They are not trusted as the only authorization or transition
enforcement.

### Database boundary

Direct CRUD is appropriate for low-risk Admin configuration and read queries.
Multi-table workflow mutations use Postgres functions exposed as RPCs so
status changes, audit events, notifications, and payment creation commit as
one transaction. This keeps the UI thin and prevents a second browser tab from
creating an invalid intermediate state.

### Server-only boundary

Supabase Edge Functions are used only where a server-only capability is
required, initially inviting a Professional account through the Auth Admin
API. The function verifies the caller's Admin role and never exposes the
service-role key to the browser.

## Database schema

All application tables live in `public` and use UUID primary keys. Timestamps
are `timestamptz` in UTC. User-facing money values are stored as integer
minor units in the smallest currency unit with an explicit `currency` column;
the current UI can continue formatting Nigerian naira while the database does
not silently assume that every future record has the same currency.

### Identity and people

#### `profiles`

One row per `auth.users` account.

- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text not null`
- `email text not null unique`, synchronized from `auth.users.email`
- `account_role account_role not null default 'professional'`
- `created_at`, `updated_at`

Auth remains the authority for authentication. A trigger keeps the copied
directory email synchronized so Admin directory queries can use the normal
Data API without exposing the `auth` schema or requiring a second server for
every list view.

#### `professionals`

Professional-specific profile information, one-to-one with `profiles`.

- `id uuid primary key`
- `profile_id uuid unique not null references profiles(id)`
- `phone`, `location`, `admin_notes`
- `account_status professional_account_status not null default 'active'`
- `is_lead boolean not null default false`
- `joined_at timestamptz not null default now()`
- `created_at`, `updated_at`

`completed_assignment_count` is derived from completed Assignments. It is not
stored as a mutable counter that could drift.

### Services and readiness

#### `services`

- `id`, `name`, `short_name`, `description`
- `active boolean not null default true`
- `created_at`, `updated_at`

#### `service_requirements`

One ordered readiness checklist per Service.

- `id`, `service_id` foreign key
- `title`, `description`
- `requires_evidence boolean not null default false`
- `display_order integer not null`
- unique `(service_id, display_order)`

#### `service_enrolments`

One Professional's readiness process for one Service.

- `id`, `professional_id`, `service_id`
- nullable `lead_id` referencing `professionals`
- `status service_enrolment_status`
- `lead_certified_at`, `admin_approved_at`
- `created_at`, `updated_at`

There may be multiple historical enrolments for a Professional and Service,
but only one non-paused enrolment may exist at a time. A partial unique index
enforces that rule.

#### `service_requirement_progress`

One row per enrolment requirement.

- composite primary key `(enrolment_id, requirement_id)`
- `completed boolean not null default false`
- `evidence_link`, `evidence_file_path`, `evidence_file_name`
- `completed_at`

Database validation ensures the requirement belongs to the enrolment's
Service.

#### `readiness_reviews`

Append-only review history.

- `id`, `enrolment_id`, `reviewer_user_id`
- `reviewer_type readiness_reviewer_type`
- `decision readiness_review_decision`
- `comment`, `created_at`

### Work delivery

#### `jobs`

The shared paid-work brief.

- `id`, `title`, `service_id`
- `client_context`, `objective`, `description`
- `steps text[]`, `deliverables text[]`, `acceptance_criteria text[]`
- `submission_evidence_required boolean not null default false`
- `deadline timestamptz`
- `publication_state job_publication_state`
- `created_by uuid references profiles(id)`
- `created_at`, `updated_at`

Operational Job status is derived from publication state and Assignments. It
is not stored as a second mutable status column.

#### `job_references`

Normalized shared references for a Job.

- `id`, `job_id`
- `label`, `kind reference_kind`
- optional `url`, `storage_path`, `file_name`
- `display_order`

Link references keep their URL. File references gain a Storage path when real
uploads are enabled; the existing prototype's file-name-only behavior remains
valid during migration.

#### `assignments`

One Professional doing one Job.

- `id`, `job_id`, `professional_id`
- nullable `lead_reviewer_id`
- `agreed_pay integer`, `currency text`, `deadline timestamptz`
- `status assignment_status`
- `started_at`, `submitted_at`, `approved_at`, `completed_at`
- `cancelled_at`, `cancellation_reason`
- `created_at`
- unique `(job_id, professional_id)`

Lead reviewer validity is enforced by workflow functions: the reviewer must
have Lead capability and cannot be the assignee.

#### `submissions`

Append-only versions of an Assignment's work.

- `id`, `assignment_id`
- `version integer not null`
- `notes not null`
- optional `link`, `file_path`, `file_name`
- `submitted_at`
- unique `(assignment_id, version)`

#### `assignment_reviews`

Append-only reviews tied to a concrete Submission.

- `id`, `assignment_id`, `submission_id`, `reviewer_user_id`
- `reviewer_type assignment_reviewer_type`
- `decision assignment_review_decision`
- `comment`, `created_at`

### Payments and operations

#### `payments`

Exactly one payment record per completed Assignment.

- `id`, `assignment_id unique`, `professional_id`
- `amount integer`, `currency`, `due_date`
- `status payment_status`
- optional `payment_date`, `method`, `reference`
- optional `receipt_path`, `receipt_file_name`
- optional `internal_note`, `issue_note`
- `corrected_at`, `correction_note`
- `created_at`, `updated_at`

Completing an Assignment creates its payment atomically. A paid row cannot be
edited through the normal update path; an explicit correction RPC is required.

#### `notifications`

- `id`, `recipient_user_id`
- `title`, `message`, `created_at`, `read_at`

RLS restricts a Professional to their own notifications. Admins can see
operational notifications relevant to the Admin queue.

#### `activity_events`

Append-only audit-friendly operational history.

- `id`, `actor_user_id`
- `action`, `subject_type`, `subject_id`, `metadata jsonb`, `created_at`

The UI can continue displaying a concise actor/action/subject projection while
the database retains stable subject identifiers.

## Workflow RPCs

The first migration set will add small, named functions rather than one
generic state machine. Each function validates the caller, current status,
related records, and required inputs before applying all side effects.

### Readiness

- `submit_service_enrolment(enrolment_id)`
- `review_service_enrolment(enrolment_id, decision, comment)`
- `set_requirement_progress(enrolment_id, requirement_id, ...)`

Rules include complete required evidence before submission, no self-review,
Lead-only certification for assigned Lead reviews, and Admin-only final
approval.

### Assignments

- `add_job_assignments(job_id, assignments jsonb)`
- `start_assignment(assignment_id)`
- `submit_assignment(assignment_id, ...)`
- `review_assignment(assignment_id, decision, comment)`
- `complete_assignment(assignment_id)`
- `cancel_assignment(assignment_id, reason)`

Submission routing follows the current domain rules: valid Lead reviewer first,
otherwise Admin. A Lead certification moves work to Admin, Admin approval moves
work to `approved`, and explicit completion creates the Payment and activity
event in one transaction.

### Payments

- `record_payment(payment_id, ...)`
- `correct_paid_payment(payment_id, ...)`

Paid records require a date, method, and a reference except for cash. Issue
records require an issue note. Corrections preserve the correction note and
timestamp.

## Row Level Security

RLS is enabled on every application table. Policies use small `security
definer` helper functions that read the current user's `profiles` row; those
helpers are locked to the intended `search_path`.

### Access summary

| Data | Admin | Professional | Assigned Lead |
| --- | --- | --- | --- |
| Profiles and professionals | Manage all | Read/update self | Read permitted people needed for review |
| Services and requirements | Manage all | Read active/related | Read active/related |
| Own service enrolments | Manage all | Read/update own | Read/review assigned |
| Jobs | Manage all | Read open/assigned | Read open/assigned |
| Assignments | Manage all | Read/update own work | Read/review routed work |
| Submissions | Read/write as workflow allows | Own assignments | Routed assignments |
| Payments | Manage all | Read own | No access unless also assignee |
| Notifications | Read operational/admin | Read own | Read own |
| Activity | Read all operational history | Read relevant history | Read relevant history |

Direct table writes that could bypass a transition are denied. The frontend
calls the corresponding RPC instead.

## Storage

Use private buckets with stable database paths:

- `readiness-evidence`
- `assignment-submissions`
- `payment-receipts`

Files are addressed by record ID and generated object name, not by a user
provided filename. Storage policies mirror the table policies. The frontend
uploads through the anon client only after the user is authenticated, writes
the resulting path into the related row through the workflow RPC, and obtains
short-lived signed URLs for display. The current filename-only fields remain
for compatibility and migration.

## Authentication and onboarding

- Replace the role-selector demo login with Supabase Auth session handling.
- Use invited Auth accounts with password setup through the invitation flow for
  Admin and Professionals in the first production slice; no open public
  sign-up.
- The first Admin is bootstrapped through a controlled project setup step, not
  by trusting a client-supplied role.
- Admin-created Professional accounts use an Edge Function because inviting a
  user requires the Auth Admin API and service-role credentials.
- A database trigger creates the initial `profiles` row for a new Auth user;
  the invitation workflow then creates the Professional row and sends the
  onboarding email.
- Route guards are user-experience protection. RLS and RPC authorization are
  the actual security enforcement.

## Migration and seed strategy

1. Add `supabase/config.toml` and versioned migrations.
2. Create enums, tables, indexes, helper functions, RLS, and workflow RPCs in
   dependency order.
3. Add a local/development seed that mirrors the deterministic
   `createDemoState()` scenario without creating real production accounts.
4. Add a one-time migration adapter only if existing browser state needs to be
   preserved; malformed or legacy snapshots fall back to the known demo seed.
5. Keep `createDemoState()` for pure domain tests while the production app
   reads from Supabase.

No live data is copied into the production project automatically. Seed data is
opt-in and clearly separated from real Auth users.

## Frontend integration sequence

1. Add environment validation and the Supabase client.
2. Add an auth provider/session bootstrap and replace demo session reads.
3. Add typed database projections for the existing domain model.
4. Replace store hydration with parallel queries for the current user's
   permitted workspace.
5. Convert one vertical slice at a time: profile, services/readiness, jobs and
   assignments, reviews, then payments.
6. Add loading, empty, retry, and field-level error states without changing the
   approved visual structure.
7. Remove the local persistence path only after all active routes use the
   Supabase repository.

The first vertical-slice gate is Admin can create a Service, enrol a
Professional, and the Professional can complete and submit readiness without
any browser-local persistence. The next gate is one Job with two independent
Assignments and separate review routing.

## Verification gates

### Schema and security

- Migrations apply cleanly to a fresh local/project database.
- Every application table has RLS enabled.
- Anonymous requests cannot read application data.
- A Professional cannot read another Professional's private work or payment.
- A Lead cannot approve their own training or Assignment.
- An Admin can complete an Assignment only once and receives exactly one
  Payment.

### Application behavior

- Auth session survives reload without persisting domain data in localStorage.
- The current Admin and Professional routes render from Supabase rows.
- Two Assignments for one Job progress independently.
- Review and payment transitions show canonical server results and recover from
  failures without corrupting local state.
- Evidence and receipt paths cannot be read by unauthorized users.

### Automated checks

Run at each phase gate:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

Add SQL/RLS tests and repository tests before claiming production readiness.

## Delivery phases

### Phase 1 - Foundation

Supabase client, environment contract, Auth session, profiles, professionals,
role policies, migration scaffolding, and first Admin bootstrap.

### Phase 2 - Core schema and workflow security

Services, readiness, Jobs, Assignments, Submissions, Reviews, Payments,
Notifications, Activity, RLS, and workflow RPCs.

### Phase 3 - Frontend vertical slices

Replace local hydration and mutations in the approved route order, starting
with Profile and Services/Readiness, then Jobs/Assignments, Reviews, and
Payments.

### Phase 4 - Evidence and operational polish

Private Storage buckets, signed URLs, invite function, in-app notification
reliability, retries, and audit visibility.

### Phase 5 - Release hardening

Full RLS tests, end-to-end auth flows, migration replay, production build,
deployment environment configuration, and removal of obsolete prototype paths.

## Explicit decisions

- Supabase is the backend and Postgres is the source of truth.
- The unified Professional model is canonical.
- RLS is mandatory and enabled by default.
- Multi-table business transitions are transaction-backed RPCs.
- Manual payout tracking comes before Paystack.
- GitHub connection is useful for version control but is not a dependency for
  database correctness or frontend integration.
