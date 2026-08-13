# Blithob production-readiness pass design

## Goal

Make the live Blithob workspace trustworthy for day-to-day use, starting with
the Admin Today page and then checking every reachable role page for controls
that look operational but do not persist or explain their empty state.

## Decisions

- Supabase remains the source of truth in the deployed app; the local adapter
  remains only for deterministic development tests.
- Admin Today will show active assignment deadlines from `assignments`, not raw
  job deadlines. An open job with no assignment is a staffing state and belongs
  on Jobs, not in an assignment-deadline list.
- Activity will be ordered newest-first at the repository boundary, limited to
  a useful recent window, and rendered with human-readable subjects.
- Durable activity entries will be created by the database for job lifecycle
  changes and assignment starts. Existing workflow RPCs already log their
  transitions and will remain the single source for those transitions.
- Empty states will describe the next real action. No new simulation or
  dashboard-only state will be introduced.
- Invitation delivery will remain server-side. The Edge Function will support
  the configured provider path, while domain verification and provider secrets
  remain deployment configuration rather than source-code values.

## Acceptance criteria

1. Today renders a useful empty state for both assignment deadlines and recent
   activity, and active assignment rows link to the correct assignment.
2. Remote activity is newest-first and does not expose UUIDs as user-facing
   subjects.
3. Job creation/update and assignment start produce durable activity entries.
4. Reached pages have no confirmed no-op operational controls, and stale demo
   controls are unavailable in remote mode.
5. Focused tests, the full unit suite, lint, build, database lint/migrations,
   and production smoke checks pass before release.
