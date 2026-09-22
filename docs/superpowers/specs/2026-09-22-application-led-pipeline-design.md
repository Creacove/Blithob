# Application-led candidate pipeline

## Goal

Make a Job Application the single, understandable record that connects an applicant, the required Service readiness, and that applicant's eventual Assignment. A Job may have multiple applicants and multiple assignments, but every applicant is progressed and assigned independently.

## Current problem

- The Admin Applications page creates or reuses a Service enrolment when an applicant is shortlisted, but the enrolment is not explicitly linked back to the Application.
- Readiness approval updates only the Service enrolment. The Application remains visually shortlisted, and the Admin must discover the separate readiness queue before returning to the Application.
- `list_my_applications` returns only the basic application fields, so the professional cannot reliably see Service readiness progress or why an application is ready for its next step.
- The professional application history is rendered outside the signed-in AppShell, so it is absent from workspace navigation and Today.
- The shortlist RPC returns a JSON object, while the client assumes an array and can throw after a successful shortlist/email.

## Product model

The Application is the canonical Job ↔ Professional record. Its lifecycle is:

`Applied → Reviewing → Shortlisted → Readiness → Ready to assign → Assigned`

Rejected and Withdrawn are terminal outcomes. Assigned is represented by the existing `converted` status plus `assignment_id`; the UI presents this as **Assigned**.

Readiness remains a reusable Service-level prerequisite. A Professional may use the same approved Service enrolment for multiple applications for that Service. Each Application stores the readiness enrolment it is using, so the relationship is explicit and does not depend on re-deriving a match from Professional + Service at read time.

When a readiness enrolment reaches `approved`, every linked shortlisted Application for that enrolment becomes **Ready to assign** in its read model. No other applicant is changed. The system does not create an Assignment automatically because a Job can have multiple Professionals and each Assignment can have different pay, deadline, and reviewer.

## Admin experience

The Admin Applications destination remains the decision workspace.

- Keep one primary next action per Application:
  - Submitted: Start review
  - Under review: Shortlist or Not selected
  - Shortlisted/readiness incomplete: Open readiness
  - Ready to assign: Confirm assignment
  - Assigned: Open assignment
- Do not expose assignment controls before readiness is approved.
- Confirm assignment opens the existing assignment drawer for that one candidate, with the Job deadline prefilled. Pay remains an explicit per-candidate confirmation because assignments can differ.
- After confirmation, refresh the Application row and show Assigned/Open assignment. The other applicants remain unchanged.
- Readiness approval from Reviews must refresh or navigate back to the linked Application context, so Admin does not need to remember a second queue.

## Professional experience

- Add **Applications** as a first-class professional AppShell destination on desktop, tablet, and mobile.
- Render the application history inside the workspace shell rather than the public marketing shell. Keep the public route as a compatibility redirect or shared page entry.
- Each application row/card shows role, company, current state, applied date, and exactly one next action:
  - Complete readiness when required
  - View status while under review
  - Open Assignment when assigned
  - Browse another role for an empty state
- Today stays focused on one highest-priority action. If an application needs action, it can appear as a compact next-action item; the full application list remains on Applications.
- Do not expose Admin notes or other private fields to professionals.

## Data and API changes

1. Add a nullable `readiness_enrolment_id` foreign key to `job_applications`, indexed for application/readiness lookups. Existing rows are backfilled from the current Professional + Job Service match when one unambiguous active enrolment exists.
2. Update the shortlist RPC to write that link when it creates or reuses the Service enrolment.
3. Update readiness approval handling/read models so linked applications expose `ready_for_assignment` and readiness progress without changing unrelated applications.
4. Extend `list_my_applications` with Service/readiness fields needed by the professional workspace: Service name, readiness enrolment id/status, progress counts, `ready_for_assignment`, and assignment id.
5. Keep the existing per-candidate conversion RPC as the authoritative assignment gate.
6. Make the client shortlist parser accept the JSON object returned by `shortlist_job_application` and retain compatibility with an array-shaped test response.

## Email behavior

Keep email volume limited to meaningful state changes already supported by the transactional outbox:

- application received
- application shortlisted
- readiness review requested
- readiness approved or changes requested
- assignment created

No duplicate email should be sent merely because an Application read model changes from shortlisted to ready-to-assign.

## Acceptance criteria

- A professional with an application can reach Applications from the workspace navigation on desktop and mobile.
- A professional's Applications page shows the actual readiness state returned by the backend and provides the correct next action.
- Shortlisting an application never throws after the RPC succeeds, regardless of object/array response shape.
- Shortlisting one candidate creates or reuses only that candidate's Service enrolment and links it to that Application.
- Approving readiness changes only applications linked to that enrolment to Ready to assign.
- An Admin can confirm an Assignment for one ready candidate without opening a separate Service record, and other applicants remain untouched.
- Assignment creation still requires positive per-candidate pay and uses the Job deadline by default.
- Assigned professionals see the Assignment from their normal Work destination and from the converted application.
- Relevant unit/page tests cover the state transitions, response parsing, navigation, and multi-applicant isolation.

## Non-goals

- Bulk assignment or automatic assignment of every ready applicant.
- Replacing the Service readiness checklist or Lead/Admin review rules.
- Adding a new hiring/interview stage not represented by the current product.
- Changing public job discovery or application submission copy beyond links into the signed-in workspace.
