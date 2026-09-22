# Application Readiness Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Ship the production-ready application pipeline in which one Admin shortlist decision automatically starts the correct Service-readiness path, assignment actions are impossible to trigger before eligibility, Applicants see one clear next step, and every necessary transactional email is delivered exactly once.

**Architecture:** Keep Supabase as the source of truth. Add one Admin-only transaction for shortlist plus readiness handoff, enrich the bounded Admin application read model with Service/readiness facts, and keep assignment conversion guarded by the existing database invariant. Split the large Admin queue into focused filter/card/drawer components, reuse the existing readiness and assignment pages, and retain the current transactional outbox/Resend delivery boundary.

**Tech Stack:** React 18 + TypeScript + React Router + Tailwind utility classes, Zustand, Supabase SQL/RPC/Storage, Supabase Edge Functions, Vitest, Supabase linked SQL tests, Playwright CLI.

---

## File map and responsibilities

### Database and delivery

- Create supabase/migrations/20260922130500_application_readiness_handoff.sql for the atomic shortlist RPC and the enriched list_admin_applications return contract.
- Modify supabase/tests/public_jobs_and_applications.sql to cover shortlist/readiness idempotency and assignment gating.
- Modify supabase/tests/transactional_email_outbox.sql to assert the essential event matrix and idempotency.
- Modify supabase/functions/send-transactional-email/index.ts for canonical links, readiness-aware shortlist copy, safe payload text, and complete event-template coverage.

### Shared application data

- Modify src/lib/publicListings.ts to add readiness fields to PublicApplication, expose shortlistApplication, and map the new RPC rows.
- Modify src/lib/publicListings.test.ts to verify the new row mapping and shortlist RPC call.

### Admin UI

- Replace src/pages/admin/AdminApplicationsPage.tsx with a page-level loader/filter coordinator.
- Create src/pages/admin/ApplicationFilters.tsx for the responsive desktop/mobile filter grid.
- Create src/pages/admin/ApplicationCard.tsx for the compact candidate/application card and contextual action model.
- Create src/pages/admin/AssignmentDrawer.tsx for pay/deadline validation and guarded conversion.
- Create src/pages/admin/applicationQueue.ts for pure status labels, readiness labels, and next-action selection.
- Modify src/pages/admin/AdminApplicationsPage.test.tsx and add focused tests beside the new components.

### Applicant UI and auth copy

- Modify src/pages/public/PublicApplicationsPage.tsx to render the shared progression and readiness CTA.
- Modify src/pages/public/PublicApplicationsPage.test.tsx for shortlisted/readiness/converted states.
- Modify src/pages/LoginPage.tsx only where invitation/recovery confirmation copy needs to distinguish “create password” from ordinary sign-up.
- Keep supabase/functions/invite-professional/index.ts on the canonical https://blithob.com/login?mode=invite redirect and add a regression assertion if the copy changes.

### Configuration tests

- Modify src/lib/transactionalEmailConfiguration.test.ts and src/lib/productionAuthConfiguration.test.ts to lock the production email/auth contracts.

---

### Task 1: Lock the current behavior with failing tests

**Files:**
- Modify: src/lib/publicListings.test.ts
- Modify: src/pages/admin/AdminApplicationsPage.test.tsx
- Modify: src/pages/public/PublicApplicationsPage.test.tsx
- Modify: src/lib/transactionalEmailConfiguration.test.ts

- [ ] **Step 1: Add the new application fixture fields and the expected shortlist method to the repository test.**

Add a row containing service_id, service_name, readiness_status, readiness_completed_count, readiness_requirement_count, and ready_for_assignment, then assert the mapped values. Add this call assertion:

~~~
await repository.shortlistApplication({
  applicationId: "application-1",
  adminNote: "Strong fit for the role."
});

expect(client.rpc).toHaveBeenCalledWith("shortlist_job_application", {
  p_application_id: "application-1",
  p_admin_note: "Strong fit for the role."
});
~~~

- [ ] **Step 2: Add Admin rendering tests for the three readiness states.**

Use repository fixtures for:

~~~
{ status: "shortlisted", readinessStatus: "in_progress", readyForAssignment: false }
{ status: "shortlisted", readinessStatus: "approved", readyForAssignment: true }
{ status: "submitted", readinessStatus: undefined, readyForAssignment: false }
~~~

Assert that the first fixture renders View readiness and does not render Agreed pay or Create assignment; the second renders Create assignment; and the third renders Start review.

- [ ] **Step 3: Add Applicant progression assertions.**

For a shortlisted application with readinessStatus: "in_progress", assert Complete readiness and a link to /professional/training/<enrolment-id>. For an approved/converted fixture, assert Ready for assignment/Assignment received and no readiness CTA.

- [ ] **Step 4: Extend the email configuration test with the complete event list.**

Assert the migration contains each essential event from the production matrix (application_received, application_shortlisted, application_rejected, the five readiness/work events, assignment-created/completed/cancelled, and both payment events), and assert the sender contains the canonical URL and readiness-aware payload keys.

- [ ] **Step 5: Run the focused tests and verify they fail for missing contracts.**

Run:

~~~
npm test -- src/lib/publicListings.test.ts src/pages/admin/AdminApplicationsPage.test.tsx src/pages/public/PublicApplicationsPage.test.tsx src/lib/transactionalEmailConfiguration.test.ts --run
~~~

Expected: FAIL because shortlistApplication, readiness fields, and the new contextual controls do not exist yet.

- [ ] **Step 6: Commit the red tests.**

~~~
git add src/lib/publicListings.test.ts src/pages/admin/AdminApplicationsPage.test.tsx src/pages/public/PublicApplicationsPage.test.tsx src/lib/transactionalEmailConfiguration.test.ts
git commit -m "test: define application readiness handoff behavior"
~~~

### Task 2: Add the atomic shortlist/readiness database contract

**Files:**
- Create: supabase/migrations/20260922130500_application_readiness_handoff.sql
- Modify: supabase/tests/public_jobs_and_applications.sql

- [ ] **Step 1: Add the Admin-only shortlist_job_application RPC.**

Use a security definer PL/pgSQL function with set search_path = public, extensions. The function must:

~~~
if not public.is_admin() then
  raise exception 'Only Admin can shortlist applications';
end if;

select a.*, j.service_id, j.title, s.name as service_name
into v_application, v_job_service_id, v_job_title, v_service_name
from public.job_applications a
join public.jobs j on j.id = a.job_id
join public.services s on s.id = j.service_id
where a.id = p_application_id
for update;
~~~

Reject withdrawn and converted rows. Select the Professional's non-paused enrolment for the Job's Service with for update; insert one with the default not_started status when none exists. Update the application to shortlisted, save the trimmed Admin note, reviewer, and timestamp, queue exactly one application_shortlisted event with job_title, service_name, and readiness_required, log the application/enrolment IDs, and return:

~~~
{
  "application_id": "...",
  "readiness_enrolment_id": "...",
  "readiness_status": "not_started",
  "ready_for_assignment": false
}
~~~

If the row is already shortlisted, reuse the existing non-paused enrolment and return the same shape without a second insert or email. Grant execute to authenticated; revoke public and anon.

- [ ] **Step 2: Replace the Admin application list function in the migration.**

Extend its return table with service_id, service_name, readiness_enrolment_id, readiness_status, readiness_completed_count, readiness_requirement_count, and ready_for_assignment. Use a left join lateral that selects the latest non-paused enrolment for the application Professional and Job Service. Use a second lateral aggregate over service_requirements and service_requirement_progress. Compute ready_for_assignment from approved readiness, active Professional, and open Job. Keep the existing Admin predicate, filters, limit cap of 100, offset, and total count.

- [ ] **Step 3: Add SQL assertions for the new transaction.**

In supabase/tests/public_jobs_and_applications.sql, after the existing application fixture is created:

~~~
select is((select status::text from public.job_applications where id = v_application_id), 'submitted', 'fixture starts submitted');
select jsonb_object_field(
  public.shortlist_job_application(v_application_id, 'Strong fit'),
  'readiness_status'
) = 'not_started'::jsonb;
select is((select count(*)::int from public.service_enrolments where professional_id = v_professional_id and service_id = v_service_id and status <> 'paused'), 1, 'shortlist creates one active readiness record');
select is((select count(*)::int from public.transactional_email_outbox where source_type = 'job_application' and source_id = v_application_id and event_type = 'application_shortlisted'), 1, 'shortlist queues one email');
~~~

Then call the RPC a second time and assert the active-enrolment and outbox counts remain one. Add an approved enrolment fixture and assert ready_for_assignment is true in list_admin_applications.

- [ ] **Step 4: Run the linked SQL test and lint.**

Run:

~~~
npx supabase db query --linked --project-ref cyrgywfdmfnqnontjnxv --file supabase/tests/public_jobs_and_applications.sql
npx supabase db lint --linked --fail-on error
~~~

Expected: SQL assertions pass and lint exits 0 (pre-existing warnings may remain, but no new errors).

- [ ] **Step 5: Commit the database contract.**

~~~
git add supabase/migrations/20260922130500_application_readiness_handoff.sql supabase/tests/public_jobs_and_applications.sql
git commit -m "feat: atomically hand shortlisted applications to readiness"
~~~

### Task 3: Map the backend contract into the repository

**Files:**
- Modify: src/lib/publicListings.ts
- Modify: src/lib/publicListings.test.ts

- [ ] **Step 1: Add optional readiness fields and a shortlist command.**

Extend PublicApplication with:

~~~
serviceId?: string;
serviceName?: string;
readinessEnrolmentId?: string;
readinessStatus?: string;
readinessCompletedCount?: number;
readinessRequirementCount?: number;
readyForAssignment?: boolean;
~~~

Add to PublicListingsRepository:

~~~
shortlistApplication(input: {
  applicationId: string;
  adminNote?: string;
}): Promise<string>;
~~~

Return the application ID from the RPC's JSON result. Keep the existing reviewApplication for under_review and rejected.

- [ ] **Step 2: Map the new database names without breaking old fixtures.**

In mapApplication, use optionalText and numberValue. Map ready_for_assignment only when the database returns a boolean; otherwise leave it undefined, allowing the UI to show Refresh to check readiness during rollout.

- [ ] **Step 3: Implement the RPC call.**

~~~
async shortlistApplication(input) {
  const data = await resolve<unknown>(client.rpc("shortlist_job_application", {
    p_application_id: input.applicationId,
    p_admin_note: input.adminNote?.trim() || null
  }));
  const row = rows(data)[0];
  return text(row, "application_id") || input.applicationId;
}
~~~

Add the same no-op method to createEmptyPublicListingsRepository and all test repository fixtures.

- [ ] **Step 4: Run repository tests and commit.**

~~~
npm test -- src/lib/publicListings.test.ts --run
git add src/lib/publicListings.ts src/lib/publicListings.test.ts
git commit -m "feat: expose application readiness data"
~~~

### Task 4: Build the pure Admin queue view model

**Files:**
- Create: src/pages/admin/applicationQueue.ts
- Create: src/pages/admin/applicationQueue.test.ts

- [ ] **Step 1: Define pure status/readiness labels and action types.**

Export:

~~~
export type ApplicationAction =
  | "start_review"
  | "shortlist"
  | "view_readiness"
  | "create_assignment"
  | "open_assignment"
  | "view_application";

export function primaryAction(application: PublicApplication): ApplicationAction;
export function readinessCopy(application: PublicApplication): {
  label: string;
  tone: "neutral" | "attention" | "success";
  detail: string;
};
export function applicationStatusLabel(status: JobApplicationStatus): string;
~~~

Use readyForAssignment === true as the only client-side signal for create_assignment. A shortlisted row with missing readiness fields must resolve to view_readiness, never to the legacy assignment form.

- [ ] **Step 2: Add table-driven tests.**

Assert every row in the design matrix, including converted, rejected, and withdrawn states, plus missing optional readiness fields.

- [ ] **Step 3: Run the pure tests and commit.**

~~~
npm test -- src/pages/admin/applicationQueue.test.ts --run
git add src/pages/admin/applicationQueue.ts src/pages/admin/applicationQueue.test.ts
git commit -m "feat: define contextual application actions"
~~~

### Task 5: Replace the Admin application page with a production queue

**Files:**
- Replace: src/pages/admin/AdminApplicationsPage.tsx
- Create: src/pages/admin/ApplicationFilters.tsx
- Create: src/pages/admin/ApplicationCard.tsx
- Create: src/pages/admin/AssignmentDrawer.tsx
- Modify: src/pages/admin/AdminApplicationsPage.test.tsx

- [ ] **Step 1: Build ApplicationFilters as a responsive grid.**

Render labelled controls in:

~~~
<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_13rem_auto]">
  <Field label="Search applications">
    <Input className="w-full" ... />
  </Field>
  <Field label="Job"><Select className="w-full" ... /></Field>
  <Field label="Status"><Select className="w-full" ... /></Field>
  {hasFilters && <Button variant="quiet" ...>Clear filters</Button>}
</div>
~~~

Keep search/job/status state in the page coordinator and debounce only if needed after measuring; do not add a second query library.

- [ ] **Step 2: Build ApplicationCard around the next valid action.**

The header contains company, role, applicant, applied date, and status. The metadata row contains Service and readiness state. The body uses lg:grid-cols-[minmax(0,1fr)_22rem], with documents/cover note on the left and a right-hand Next step panel. Render one primary action from primaryAction; put Decline and other transitions in a clearly labelled Change status control. Render private Admin note with Field label="Private Admin note"; never call it a candidate message.

Use links to /admin/people/<professionalId> for readiness inspection, /admin/reviews for waiting-for-review records, and /admin/assignments/<assignmentId> for converted rows. Do not render agreed pay unless readyForAssignment === true and the drawer is open.

- [ ] **Step 3: Build AssignmentDrawer with guarded form behavior.**

Use the existing Drawer component with width="default". The form owns agreedPay, deadline, leadReviewerId, isSubmitting, and a local error. Validate Number.isInteger(amount) && amount > 0; show the Job's currency label; disable the submit button during the RPC; close on success; call the page's onComplete callback so it refreshes the bounded queue.

The footer must say:

~~~
<Button variant="secondary" onClick={onClose}>Cancel</Button>
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? "Creating…" : "Create assignment"}
</Button>
~~~

If the RPC rejects because readiness or the Job changed, show This application is no longer ready to assign. Refreshing the queue…, close the drawer, and invoke onStaleRecord.

- [ ] **Step 4: Make AdminApplicationsPage coordinate data, not layout.**

Retain bounded paging and CV signed-url behavior. Add shortlistApplication to the review handler. On shortlist, call the new RPC, then reload the first page. On view_readiness, navigate to the Professional detail route. On create_assignment, open the drawer. Keep the error alert at page level and expose loading/empty/load-more states.

- [ ] **Step 5: Update tests for layout and actions.**

Assert the filters are labelled, the card does not show the old three-button row, pay is absent before eligibility, and stale conversion refreshes the queue. Keep the existing CV/supporting-document and load-more assertions.

- [ ] **Step 6: Run Admin tests and commit.**

~~~
npm test -- src/pages/admin/applicationQueue.test.ts src/pages/admin/AdminApplicationsPage.test.tsx --run
git add src/pages/admin/AdminApplicationsPage.tsx src/pages/admin/ApplicationFilters.tsx src/pages/admin/ApplicationCard.tsx src/pages/admin/AssignmentDrawer.tsx src/pages/admin/applicationQueue.ts src/pages/admin/applicationQueue.test.ts src/pages/admin/AdminApplicationsPage.test.tsx
git commit -m "feat: redesign Admin application queue"
~~~

### Task 6: Align the Applicant journey with the same state model

**Files:**
- Modify: src/pages/public/PublicApplicationsPage.tsx
- Modify: src/pages/public/PublicApplicationsPage.test.tsx
- Modify: src/pages/professional/TodayPage.tsx only if its existing readiness summary does not link to the application-created enrolment.

- [ ] **Step 1: Add a shared progression row to each application card.**

Use the labels Submitted, Under review, Shortlisted, Complete readiness, Ready for assignment, and Assignment received. Emphasize exactly one next state based on the application and readiness fields. Keep withdraw available only for submitted, under_review, and shortlisted.

- [ ] **Step 2: Add the one readiness CTA.**

For shortlisted with a non-approved readiness enrolment, render:

~~~
<Link to={"/professional/training/" + application.readinessEnrolmentId}>
  Complete readiness <ArrowRight size={16} aria-hidden />
</Link>
~~~

If readinessEnrolmentId is absent during rollout, render a non-breaking Readiness details are refreshing message and a reload action rather than a broken link.

- [ ] **Step 3: Keep application status copy concise and non-technical.**

Remove existing assignment workflow language from Applicant copy. Use Your application moved forward. Assignment details will appear here when ready. for converted rows.

- [ ] **Step 4: Update tests and commit.**

~~~
npm test -- src/pages/public/PublicApplicationsPage.test.tsx --run
git add src/pages/public/PublicApplicationsPage.tsx src/pages/public/PublicApplicationsPage.test.tsx src/pages/professional/TodayPage.tsx
git commit -m "feat: show one clear Applicant next step"
~~~

### Task 7: Complete the transactional email matrix and auth guarantees

**Files:**
- Modify: supabase/functions/send-transactional-email/index.ts
- Modify: supabase/functions/invite-professional/index.ts only if the canonical redirect assertion identifies a mismatch.
- Modify: src/pages/LoginPage.tsx only if invitation/recovery confirmation copy needs the final wording.
- Modify: src/lib/transactionalEmailConfiguration.test.ts
- Modify: src/lib/productionAuthConfiguration.test.ts
- Modify: supabase/tests/transactional_email_outbox.sql

- [ ] **Step 1: Make template payload handling explicit and safe.**

Add helpers for service_name, readiness_required, and admin_note; escape user-provided content before interpolation into HTML. Use plain-text content as the source of truth and a small HTML wrapper. Preserve EMAIL_FROM with the default Blithob <hello@blithob.com> and the canonical https://blithob.com link.

- [ ] **Step 2: Update shortlist copy without adding an extra email type.**

Implement this behavior:

~~~
application_shortlisted: {
  subject: "Your application has been shortlisted",
  body: readinessRequired
    ? "Your application for " + jobTitle + " has been shortlisted. Complete your " + (serviceName || "Service") + " readiness steps to become eligible for the assignment."
    : "Your application for " + jobTitle + " has been shortlisted. We will share the assignment details next."
}
~~~

Append an explicit Admin note only when the RPC payload contains one; never turn the private Admin note into candidate-facing copy implicitly.

- [ ] **Step 3: Verify every essential event has a template and one recipient.**

Cover the event matrix in the spec. Keep under-review, withdrawal, CV upload, internal notes, and readiness creation email-free. Keep Auth invitation, signup confirmation, and password reset in Supabase Auth rather than the transactional outbox.

- [ ] **Step 4: Add SQL idempotency assertions.**

In supabase/tests/transactional_email_outbox.sql, invoke each transition twice where practical and assert one outbox row per (recipient_user_id, event_type, source_type, source_id). Assert the shortlist payload includes service_name and readiness_required; assert no row exists for readiness_created.

- [ ] **Step 5: Run delivery/configuration tests and commit.**

~~~
npm test -- src/lib/transactionalEmailConfiguration.test.ts src/lib/productionAuthConfiguration.test.ts --run
npx supabase db query --linked --project-ref cyrgywfdmfnqnontjnxv --file supabase/tests/transactional_email_outbox.sql
git add supabase/functions/send-transactional-email/index.ts supabase/functions/invite-professional/index.ts src/pages/LoginPage.tsx src/lib/transactionalEmailConfiguration.test.ts src/lib/productionAuthConfiguration.test.ts supabase/tests/transactional_email_outbox.sql
git commit -m "feat: finish production transactional email coverage"
~~~

### Task 8: Run the full production gate and live smoke test

**Files:**
- No new source files; inspect the complete diff and generated build.

- [ ] **Step 1: Run all frontend gates.**

~~~
npm test -- --reporter=dot
npm run lint
npm run build
~~~

Expected: all tests pass, lint exits 0, and build completes. The existing Vite chunk-size warning is acceptable unless a new chunk grows materially.

- [ ] **Step 2: Run database gates.**

~~~
npx supabase db lint --linked --fail-on error
npx supabase migration list --linked
~~~

Expected: no new lint errors and the application-readiness migration is applied after 20260922130400.

- [ ] **Step 3: Run the live Playwright smoke.**

Use playwright-cli against https://blithob.com with an Admin and Professional session:

1. Open /admin/applications and verify filters occupy one desktop toolbar row.
2. Shortlist a candidate with no approved readiness; verify the card says Readiness in progress, no pay field is visible, and one shortlist email/outbox row exists.
3. Complete/approve readiness through the existing Professional/Admin review pages; reload applications and verify Ready to assign.
4. Create the Assignment once; verify Converted, the assignment route, and one assignment email/outbox row.
5. Repeat the create action using the stale page and verify the idempotent existing Assignment path.
6. Open /professional/applications and verify the candidate sees Complete readiness rather than an internal enrolment error.
7. Verify invitation/password creation and password reset redirects remain on blithob.com.

- [ ] **Step 4: Review the diff for accidental scope.**

~~~
git status --short
git diff origin/main...HEAD --stat
git diff origin/main...HEAD --check
~~~

Confirm no changes to unrelated dirty work, no secrets, no legacy localhost redirects, and no client-side service-role key.

- [ ] **Step 5: Commit any final test-only fixes and prepare the release handoff.**

~~~
git add -A
git commit -m "chore: verify application pipeline production readiness"
~~~

Report the commit, migration ID, test outputs, and the live smoke evidence before deployment/PR attachment.

## Self-review checklist

- Every requirement in the design spec maps to Tasks 2–8: atomic shortlist, read model, Admin UI, Applicant UI, email matrix, auth redirects, failure handling, and verification.
- No step relies on TODO, TBD, or an unspecified future implementation.
- PublicApplication field names are consistent between the SQL return columns, mapper, fixtures, and components.
- Only readyForAssignment === true reveals assignment pay/drawer; missing optional data is safe during rollout.
- The server remains authoritative for approval, active Professional, open Job, and idempotent Assignment creation.

