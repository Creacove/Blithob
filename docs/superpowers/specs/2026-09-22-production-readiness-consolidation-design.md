# Production Readiness Consolidation Design

## Goal

Bring the private candidate-document workflow and the useful Phase 1 Admin/public operations work from `codex/phase-one-production-readiness` onto the current `main` line, while preserving the current transactional-email/Resend architecture and making the release safe for existing applications.

## Scope

Included:

- Private candidate CV and supporting-document storage in Supabase Storage.
- Server-authoritative document registration, completion, replacement, archival, ownership, and signed-download access.
- CV-aware job application submission that records the exact CV version used.
- Candidate upload controls in the professional profile and application journey.
- Admin application search/filtering and submitted-CV access.
- Public job filters/SEO/privacy assets from Phase 1, where they do not conflict with current main.
- Current transactional email integration for application confirmation and status events.
- Release tests for document ownership, CV submission, Admin access, and email outbox creation.

Explicitly excluded:

- The branch's legacy `email_outbox` table and `process-email-outbox` function. The current `transactional_email_outbox` and `send-transactional-email` implementation remain canonical.
- Employer, interview/offer/hired, AI matching, automated payments, or formal legal-compliance claims.
- Destructive changes to existing application rows.

## Architecture and rollout

The integration branch starts from current `main`. Existing application rows remain valid with a nullable `cv_document_id`. A new migration, timestamped after the current linked migration `20260922113449`, adds candidate documents, the private bucket and policies, and the CV-aware submission RPC. The new RPC queues `application_received` through the current transactional outbox in the same transaction.

The frontend uses the CV-aware RPC after the migration is applied. The legacy application RPC remains available during the rollout, then a follow-up migration revokes candidate execution so direct callers cannot bypass the CV requirement. Existing legacy applications remain readable and are shown without a CV where appropriate.

Onboarding/profile access is not blocked by a CV; applying for a Job is. Supporting documents remain optional profile-level documents unless a later product decision requires per-application selection/snapshots.

## Security and failure handling

- The bucket is private; anonymous access is denied.
- Server RPCs validate file type, extension, size, ownership, and active state.
- Storage paths are server-generated UUID paths and never use the raw filename.
- Admin and candidate signed URLs are generated only after authorization.
- Failed uploads archive the pending metadata row and preserve the previous active CV.
- The current transactional-email regex is corrected and the CV-aware application path is covered by an idempotent outbox test.
- Signed-download UI opens a user-initiated window before asynchronous URL creation to avoid popup blocking.

## Admin/public operations

The Admin queue receives bounded filters and pagination metadata. Supporting-document counts are retained, and Admin access to active supporting documents is exposed through the same authorization boundary as the submitted CV. Public country/rate/employment filters and SEO/privacy files are ported only from the branch portions that compile against current `main`.

## Verification gate

Before integration, run focused red/green tests for each change. Before pushing:

```powershell
npm test
npm run lint
npm run build
npx supabase db lint --linked --fail-on error
npx supabase migration list --linked
```

The live smoke test must cover signup/invitation, CV upload/replacement, application submission, Admin CV access, status transitions, and the transactional email outbox. No completion claim is made until the command outputs and Git diff are reviewed.
