# Application Readiness Handoff Design

## Goal

Make the Admin application queue feel like one clear decision surface while preserving the domain rule that an Assignment may only be created for an active Professional with approved readiness for the Job's Service.

The Admin should make one decision—shortlist or decline—and Blithob should take care of the readiness handoff. The Applicant should see one understandable next task, not the internal distinction between applications, enrolments, and assignments.

## Evidence and invariant

The current application card exposes three equal status buttons, reveals pay and `Create Assignment` after shortlisting, and does not show the Job's Service or the Professional's readiness state. The conversion RPC delegates to `add_job_assignments`, which rejects a Professional unless an approved `service_enrolments` row exists for the Job's `service_id`. The current UI therefore presents an action that is valid only for a hidden prerequisite and reports a backend error too late.

The following invariant remains authoritative:

> An Assignment can be created only when the Job is open, the Professional is active, and the Professional has an approved, non-paused readiness enrolment for the Job's Service.

No client-side shortcut may weaken this invariant.

## Scope

Included:

- Atomic shortlist-to-readiness handoff for Admin review.
- Service and readiness context in the Admin application queue.
- Contextual application actions instead of three competing equal buttons.
- A compact, responsive filter toolbar and denser application card layout.
- A guarded assignment drawer that appears only when readiness is approved.
- Clear Applicant application/readiness status and one necessary notification at each meaningful transition.
- Automated tests for state transitions, readiness gating, rendering, and failure recovery.

Explicitly excluded:

- Changing the underlying Service requirement or review policy.
- Automatically approving readiness or assigning work without the existing review boundary.
- A new interview, offer, employer, or lead-management workflow.
- Removing the existing People, Services, or Reviews pages; the application queue will link to them only when a deeper review is needed.

## Product principles

1. **One decision at a time.** The primary button always represents the next valid transition for the current record.
2. **Progressive disclosure.** Pay, deadline, and assignment-specific fields appear only after the candidate is eligible to receive an Assignment.
3. **Use human language.** Applicant-facing copy says “Service readiness” and “Complete readiness”; “enrolment” remains an internal data term.
4. **Explain blockers where they occur.** A blocked action names the missing prerequisite and provides one route to resolve it.
5. **Preserve a single source of truth.** The database transaction determines readiness and assignment eligibility; the UI is a projection of that state.
6. **Minimal necessary messaging.** Shortlisting sends one message that includes the readiness next step when required. Assignment creation sends the existing assignment notification. No duplicate readiness-start email is added.

## Domain workflow

### Shortlist

When an Admin changes an application to `shortlisted`, the server transaction:

1. Locks the application and validates that it is not withdrawn or converted.
2. Resolves the Job's active Service.
3. Reuses the Professional's existing non-paused readiness enrolment for that Service, if one exists.
4. Creates a `not_started` readiness enrolment when no active enrolment exists. The enrolment uses the Service's existing requirements and optional Lead assignment rules.
5. Updates the application status and review metadata.
6. Queues the existing `application_shortlisted` email once, with the Job title, Service name, and whether readiness is required.
7. Logs one activity event containing the application and readiness IDs.

If the Professional already has approved readiness, no new enrolment is created and the application becomes immediately assignable.

### Readiness progression

The existing readiness workflow remains unchanged after the handoff:

`not_started` → `in_progress` → `waiting_for_lead`/`waiting_for_admin` → `approved`

The application queue displays this as a compact readiness substate. The Applicant is routed to the existing readiness detail page to complete requirements; the Admin is routed to the existing readiness review surface when a decision is needed.

### Assignment

The application is eligible for assignment only when the readiness status is `approved`, the Professional is active, and the Job is open. The Admin sees `Create assignment` as the primary action only in that state. The action opens a small drawer containing:

- Candidate and Job summary.
- Service and readiness confirmation.
- Agreed pay with currency formatting and positive-number validation.
- Deadline, prefilled from the Job when present.
- Optional Lead reviewer only if the existing assignment workflow supports one.

Submission calls the existing conversion RPC. The server re-checks every invariant in the same transaction, makes conversion idempotent, and returns a clear error if the record changed since the queue was loaded. A successful conversion changes the application to `converted` and exposes `Open assignment`.

## Backend contract

### Shortlist transition

Add a migration with an atomic `shortlist_job_application` RPC. The RPC must be Admin-only, lock the application, and return the application ID plus the readiness enrolment ID and status needed to refresh the queue. It must be idempotent when the application is already shortlisted and must not create duplicate active enrolments.

The existing rejected/under-review transitions remain available through the review RPC. Rejection must never delete a readiness record or an existing application document.

### Admin application read model

Extend `list_admin_applications` to return:

- `service_id` and `service_name`.
- `readiness_enrolment_id` and `readiness_status` for the Professional's active enrolment for the Job's Service.
- `readiness_completed_count` and `readiness_requirement_count`.
- `ready_for_assignment` computed server-side from the authoritative conditions.

The query must preserve bounded pagination and Admin authorization. The mapper should expose these as optional fields on `PublicApplication` so legacy/demo fixtures remain valid.

### Email and notifications

Keep the existing transactional outbox. Extend the `application_shortlisted` payload/template so the Applicant receives one clear next step:

- Approved already: “Your application for [Job] has been shortlisted. We’ll share the assignment details next.”
- Readiness required: “Your application for [Job] has been shortlisted. Complete your [Service] readiness steps to become eligible for the assignment.”

Do not add a separate “readiness created” email. Existing readiness review/approval and assignment-created events remain unchanged.

## Admin UI design

### Page structure

- Page header with one Refresh action and a useful result summary (`12 applications · 4 need review`).
- Toolbar implemented as a responsive grid: search expands, Job and Status selects stay compact, and a clear-filters action appears only when needed. Controls have visible labels on desktop and accessible names on mobile.
- Application cards use a dense two-column desktop layout and a single-column mobile layout. The card header contains company, role, candidate identity, submission age, and the status badge.
- A small metadata row shows `Service: [name]` and the readiness state.

### Contextual actions

The card exposes one primary next action based on state:

| Application state | Primary action | Secondary action |
| --- | --- | --- |
| Submitted | Start review | Change status menu |
| Under review | Shortlist | Decline / change status |
| Shortlisted + readiness not approved | View readiness | Change status |
| Shortlisted + readiness approved | Create assignment | Change status |
| Converted | Open assignment | View application |
| Rejected/withdrawn | View application | None |

The old three-button row is removed. “Decline” is a deliberate destructive action in the status menu or as a clearly separated text action, never visually equal to the primary path.

### Readiness presentation

Use a concise state treatment rather than a disabled mystery button:

- `Not started`: “Candidate has not started readiness.” Link to the candidate/readiness view.
- `In progress`: show completed/total requirements and “Candidate is completing readiness.”
- `Waiting for review`: “Readiness submitted” and link to Reviews.
- `Approved`: “Ready to assign.”
- `Changes requested`: show the existing review comment when available.

The Admin note remains private and is labelled as such. Any future candidate-facing message must be a separate, explicit field; the current “What should the candidate know next?” placeholder must not imply that private notes are automatically sent.

### Assignment drawer

The drawer is the only place where agreed pay is requested. It formats values as the selected currency, validates positive integers, prevents double submission, and includes a short confirmation sentence: “This creates the Assignment and notifies the Professional.” If readiness is no longer approved when submitted, the drawer closes with a specific recovery message and refreshes the application rather than displaying a generic RPC failure.

## Applicant UI design

The existing My Applications and Professional Today surfaces should use the same progression language:

`Submitted` → `Under review` → `Shortlisted` → `Complete readiness` → `Ready for assignment` → `Assignment received`

Only the next actionable step is emphasized. When readiness is required, the application links directly to the existing readiness detail page. The Applicant should not need to visit Services or People pages, and should not see a dead-end “assignment unavailable” state.

## Failure handling

- If the shortlist transaction fails, the application remains in its previous state and the UI shows the server message.
- If readiness creation succeeds but email delivery is unavailable, the workflow still succeeds; the outbox status is observable and the Applicant sees the task in-app.
- If a readiness record is paused or removed between list and click, the queue refreshes and shows the correct state.
- If an Assignment already exists, conversion returns the existing Assignment and the application renders as converted; no duplicate record or notification is created.
- If the Job closes before conversion, the Admin sees “This Job is no longer open for assignment” and a link to review the Job, not an unhandled error.

## Verification plan

### Database tests

- Shortlisting without an active enrolment creates exactly one `not_started` enrolment for the Job's Service.
- Repeated shortlisting reuses the same enrolment and queues one shortlist email.
- Shortlisting with approved readiness creates no duplicate enrolment and reports `ready_for_assignment = true`.
- Conversion rejects unapproved readiness and succeeds after approval.
- Conversion remains idempotent and cannot assign inactive Professionals or closed Jobs.
- Admin-only authorization remains enforced for shortlist and application list RPCs.

### Frontend tests

- Toolbar renders a desktop grid and accessible labels; filters preserve search, Job, and status behavior.
- Each application state renders only its contextual primary action.
- Assignment pay is not rendered for ineligible shortlisted applications.
- The readiness state and requirement counts are rendered from the server DTO.
- The drawer validates pay, prevents duplicate submissions, and recovers from stale-readiness errors.
- My Applications renders the same progression and links to readiness.

### Release smoke

1. Submit an application as a new Professional.
2. Shortlist it as Admin and verify one readiness record plus one outbox event.
3. Complete and approve readiness; verify the Admin card changes to `Ready to assign`.
4. Create the Assignment and verify the application becomes `Converted`, the Assignment exists, and exactly one assignment notification is queued.
5. Repeat the conversion click and verify no duplicate Assignment or notification.

## Rollout

Deploy the database migration before the frontend that consumes the new fields. The frontend must tolerate missing optional readiness fields during the rollout and show a safe “Refresh to check readiness” state rather than exposing the legacy assignment form. After the live smoke passes, remove the legacy equal-action presentation and make the new contextual action model the only Admin path.
