# Blithob Phase 1 production-readiness design

## Status

Approved direction. This specification converts the current deployed Blithob
application into a production-ready Phase 1 candidate and internal-operations
product. Luna will coordinate implementation from the implementation plan that
follows this specification.

## Engineering lens

Use the public engineering principles associated with Kelsey Hightower's work:
prefer a small, understandable system; use boring managed primitives; make
failure visible; secure data at the boundary; and make releases reversible.
This is an engineering lens, not a claim about his private views or a request
to imitate a person.

The practical rules for this project are:

- complete the real candidate journey before adding new platform concepts;
- keep Supabase as the canonical backend and Netlify as the current host;
- enforce authorization and workflow rules in the database, not only the UI;
- add no employer, AI, visa, or advanced recruitment abstractions in Phase 1;
- use backward-compatible migrations because the application is already live;
- require fresh automated evidence before calling the release production-ready.

## Goal

A candidate can discover a real published Job, create and maintain an account,
upload a private CV and supporting documents, submit an application, receive
confirmation, and track its Phase 1 status. Blithob staff can publish Jobs,
review the application and its documents, update the allowed statuses, and
move a shortlisted applicant into the existing internal Assignment workflow.

The public site must remain usable on mobile, expose safe job information to
search engines and link previews, and withstand ordinary signup, spam, and
malicious-upload attempts without exposing private data.

## Phase 1 boundary

### Included

- Public landing page, Job directory, Job detail, and stable Job URLs.
- Candidate signup, email confirmation, sign-in, password recovery, profile
  completion, and profile editing.
- One active primary CV per candidate plus up to five active supporting
  documents.
- Candidate application submission with the selected CV version recorded on
  the application.
- Candidate application history and status visibility.
- Phase 1 statuses: Submitted, Under review, Shortlisted, Rejected, Withdrawn,
  and Converted to internal Assignment.
- Admin Job authoring, publication, application review, notes, document access,
  status changes, and Assignment conversion.
- Job filters for country, location, profession/category, compensation, work
  mode, and employment type.
- Application confirmation and application-status email notifications.
- Basic operational dashboard counts and actor-attributed activity history.
- Basic technical privacy, account security, anti-spam, upload security,
  mobile readiness, SEO, test coverage, deployment checks, and runbooks.
- Existing internal readiness, Assignment, review, training, and manual payout
  tracking workflows.

### Explicitly excluded

- Employer accounts, employer approval, self-service Job posting, and employer
  applicant management.
- Interview, Offer, and Hired stages or scheduling workflows.
- Visa sponsorship, international recruitment, and immigration workflows.
- AI CV parsing, skills matching, recommendations, or automated decisions.
- Payment processing, subscriptions, premium Jobs, recruitment fees, and
  automated payouts.
- Formal legal GDPR certification, DPIAs, DSAR automation, and a complete
  compliance-management programme.
- Granular enterprise RBAC, advanced BI, marketing attribution, and bespoke
  100,000-user infrastructure.
- Study Abroad, Travel, Immigration, or other separate service verticals.

These exclusions are planned product work, not incomplete Phase 1 defects.

## Current baseline

The deployed application already provides Supabase-backed public Jobs,
candidate Auth and onboarding, cover-note and portfolio applications, candidate
status pages, Admin Job publication, Admin application review, shortlist and
rejection actions, Assignment conversion, and the internal workforce workflow.

The confirmed completion gaps are candidate CV/document storage, application
email delivery, the full requested filter set, job-specific SEO metadata,
basic application analytics, authenticated end-to-end coverage, production
anti-abuse configuration, and the existing lint/unit/E2E release failures.

The five seeded public Jobs are meeting/reference content. Blithob must review
or replace their factual company, compensation, location, work mode, and
deadline information before treating them as production vacancies.

## Architecture

```text
Admin Job editor
      |
      v
Supabase Jobs + safe public RPCs ---> Public listing/detail/search metadata
      |
      v
Candidate Auth/Profile ---> private Candidate Documents
      |                              |
      +---------- Application <------+
                         |
            status event + email outbox
                         |
                         v
                  Admin review queue
                         |
                         v
                 existing Assignment flow
```

React remains the frontend, Supabase Auth/Postgres/Storage remains the backend,
and Netlify remains the host. No new general-purpose backend service, CMS,
search engine, message bus, or microservice is introduced.

## Workstream 1: candidate documents

### Data model

Add a `candidate_documents` table with:

- `id uuid primary key`;
- `professional_id uuid not null` referencing the candidate;
- `document_type text` restricted to `cv` or `supporting`;
- `display_name text` containing a sanitized user-facing name;
- `storage_path text unique` containing a server-generated private path;
- `mime_type text` restricted to PDF and DOCX MIME types;
- `size_bytes bigint` restricted to 1 byte through 10 MB;
- `is_active boolean not null default true`;
- `created_at`, `updated_at`, and `archived_at`.

Enforce one active `cv` row per candidate with a partial unique index. Enforce
the five-active-supporting-document limit in the document registration RPC.
Replacement creates a new row and archives the old row instead of mutating the
old version.

Add nullable `cv_document_id` to `job_applications`. Existing applications may
remain null. Every new Phase 1 application created through the new submission
contract must reference the candidate's active CV. Because the document row is
versioned and retained, replacing a profile CV does not rewrite historical
applications.

### Storage and access

Create a private `candidate-documents` bucket. Object paths use UUID segments,
not the original filename. Candidates can create and read only their own
objects. Admins can read all candidate documents. No anonymous or employer
access exists.

Storage and table policies must agree. Access is through short-lived signed
URLs generated only after authorization. Documents are downloaded as
attachments; the application does not execute or embed uploaded content.

Accept PDF and DOCX only. Reject `.doc`, executable formats, macros, double
extensions, mismatched MIME/extension pairs, files larger than 10 MB, empty
files, and names outside the sanitized display-name rules. The browser mirrors
these checks for usability, while the server remains authoritative.

Candidates can archive an unreferenced document. A document referenced by an
application remains retained and readable to the candidate and Admin even if
it is no longer the active profile CV. Physical deletion is reserved for the
retention/deletion process and must not break application records.

### User experience

Profile and onboarding expose a clear primary-CV control and optional
supporting-document list. Applying requires a primary CV and shows which CV
version will be submitted. Upload progress, validation errors, replacement,
retry, and signed-link expiry states must be explicit and mobile usable.

## Workstream 2: application journey and notifications

### Application contract

Preserve the existing application statuses and transition rules. Introduce a
new submission RPC contract that accepts the CV document ID and validates, in
one transaction:

- the authenticated candidate owns an active Professional record;
- the Job is public, open, and before its application deadline;
- the referenced CV belongs to that candidate and is an active valid CV;
- the cover note and portfolio URL satisfy existing limits;
- the candidate has not already applied for the Job.

The application record and its initial notification/outbox event are written
atomically. Admin review RPCs write the new status, reviewer identity, activity
event, in-app notification, and email-outbox event atomically.

### Backward-compatible rollout

Do not break the deployed client while database and frontend versions overlap:

1. Migration A adds document storage, tables, policies, optional application
   reference, and a versioned CV-aware submission RPC while retaining the
   current submission RPC.
2. Deploy the frontend using the CV-aware RPC and verify real candidate and
   Admin journeys.
3. Migration B revokes candidate access to the legacy submission RPC after the
   new frontend is confirmed live. Existing application rows remain valid.

### Email delivery

Use a small durable `email_outbox` table rather than sending email from the
browser. It stores recipient user ID/email, event type, minimal template data,
status, attempt count, next attempt time, provider message ID, timestamps, and
an idempotency key.

An authenticated server-side Edge Function processes pending rows with the
configured email provider, records success or failure, and retries transient
failures up to five times. Application submission, Under review, Shortlisted,
Rejected, Withdrawn, and Converted events receive candidate-facing templates.
Admin-only notes are never included in email.

Supabase Auth SMTP remains responsible for signup confirmation, recovery, and
invitation emails. Provider credentials, sender-domain verification, Auth site
URL, and redirect allow-list are deployment configuration and never browser
environment variables.

## Workstream 3: public discovery and SEO

Add `country_code` to Jobs using ISO 3166-1 alpha-2 values. Reuse existing
category/service, location label, work mode, employment type, and rate fields.
Extend the safe public Job RPC with bounded country, category/profession,
location, compensation, work-mode, and employment-type filters. Keep visa and
sponsorship fields absent in Phase 1.

Filters are represented in URL search parameters so a search can be shared,
reloaded, and navigated with browser back/forward controls. Invalid values are
ignored or normalized without exposing a database error.

Each Job retains its stable `/jobs/:slug` URL. Job detail updates document
title, meta description, canonical URL, Open Graph data, and JobPosting JSON-LD
using only safe public fields. `robots.txt` and a sitemap include public,
unexpired Jobs. The build generates crawlable job metadata from the public RPC;
publishing Jobs after a build requires a new deployment until a later phase
introduces automated build hooks or server rendering.

## Workstream 4: Admin operations

The Admin application queue supports status, Job, and candidate search filters,
bounded pagination, newest-first ordering, and direct access to the candidate's
submitted CV version and active supporting documents.

Allowed actions remain Under review, Shortlisted, Rejected, and conversion to
the existing Assignment flow. There is no Interview, Offer, Hired, employer,
or automated matching action.

The dashboard adds operational counts for public/open Jobs, total applications,
applications by Phase 1 status, and applications awaiting review. Existing
activity events remain the audit source. Every Job publication, application
status change, and Assignment conversion records actor, action, subject,
timestamp, and safe metadata. This is an operational audit trail, not a formal
compliance ledger.

## Workstream 5: privacy, security, and abuse controls

- Keep service-role keys and provider secrets out of the browser and Git.
- Keep direct candidate writes to workflow tables denied; use named RPCs.
- Test anonymous, candidate-owner, other-candidate, and Admin access paths.
- Configure Supabase Auth rate limits and CAPTCHA for public signup.
- Bound every public query and paginate Admin application queries.
- Validate all upload metadata server-side and store documents privately.
- Add security headers suitable for the existing Netlify SPA without breaking
  Supabase connections or required assets.
- Publish basic Privacy and Terms pages describing account, application, and
  document use, retention contact, and deletion-request channel.
- Log server failures without recording cover notes, document contents,
  credentials, signed URLs, or unnecessary personal data.

Formal legal compliance language requires client/legal approval. The code can
implement the technical controls and clearly marked draft copy, but must not claim
certification or legal compliance that has not been reviewed.

## Workstream 6: quality and release

### Required automated coverage

- SQL tests for document ownership, Admin access, anonymous denial, document
  limits, CV-aware application submission, duplicate prevention, and every
  status transition.
- Repository tests for upload, signed access, archive, application submission,
  email outbox mapping, filters, pagination, and normalized errors.
- Component tests for onboarding/profile upload, Apply continuation, existing
  application state, Admin document access, filters, and failure states.
- Authenticated E2E for signup/sign-in, profile completion, CV upload,
  application, Admin review, candidate status refresh, and document access.
- Public E2E for Job listing/detail, filters, direct routes, mobile layout,
  metadata, sitemap, and anonymous denial of private data.

### Release gate

The release is not production-ready until all of these produce fresh passing
evidence:

```powershell
npm test
npm run lint
npm run build
npx supabase migration list --linked
npx supabase db lint --linked --fail-on error
npm run test:e2e
```

Also verify in a clean browser on mobile and desktop:

- public Job discovery and direct Job URLs;
- candidate Auth redirects and email confirmation;
- CV upload and replacement;
- one complete candidate application;
- Admin review and document access;
- candidate status update and email delivery;
- no demo persona controls or internal data exposure.

Known current lint, unit-timeout, responsive-E2E, and visual-baseline failures
must be diagnosed and resolved; they cannot be waived by changing the release
claim. Snapshot updates require visual inspection, not automatic acceptance.

## Rollout and rollback

Use additive migrations first. Never reset the linked production database.
Back up schema/data before migrations and record migration IDs in the operations
runbook. Deploy database capability before the frontend that consumes it, and
revoke legacy submission access only after the new path is verified.

Frontend rollback is a Netlify rollback to the last verified deployment.
Database rollback uses compensating migrations; applied production migrations
are not edited or removed. New columns remain nullable where historical data
requires it. Feature failures must leave existing public browsing and Admin
operations available.

## Luna coordination contract

Luna is the implementation coordinator and may delegate only bounded tasks
with disjoint write scopes. Luna must:

1. Read this specification and the implementation plan completely before
   editing.
2. Preserve all user-owned untracked files and unrelated changes.
3. Keep the database/API contract and final integration on the critical path.
4. Use at most three concurrent workers and never assign two workers the same
   files or shared migration sequence.
5. Require tests before implementation changes and review every returned diff.
6. Integrate in dependency order rather than merging all work at the end.
7. Run the full release gate after integration and report exact exit codes and
   failure counts.
8. Apply or deploy to production only after backward compatibility, backups,
   external email configuration, and smoke-test prerequisites are confirmed.
9. Stop rather than invent credentials, legal language, factual Job content,
   DNS access, or provider configuration.
10. Return concise checkpoints: changed files, tests run, evidence, blockers,
    and the next critical-path action.

## External inputs and truthful blockers

Implementation can proceed without these values, but production claims that
depend on them cannot:

- verified sender domain and email-provider credentials;
- final public domain and Supabase Auth redirect entries;
- approved Privacy/Terms wording and retention contact;
- reviewed factual content for every published Job;
- confirmed production Admin and candidate test accounts or a safe process to
  create them.

Luna must implement graceful configuration checks and document these inputs.
Their absence is an external deployment blocker, not a reason to weaken tests
or silently substitute fake production values.

## Completion definition

Phase 1 is complete when the included candidate-to-Admin journey works on the
deployed site with private documents, durable notifications, requested non-visa
filters, job-specific metadata, mobile usability, actor-attributed activity,
and fresh passing release evidence. Deferred Phase 2 capabilities must not be
counted against the Phase 1 completion percentage or represented as already
implemented.
