# Job-first candidate pipeline

## Goal

Make the Job the primary product object and make every candidate's path from interest to Assignment understandable in two clear decisions. Support two entry paths—public applicants and invited Professionals—while keeping each candidate's Job decision independent when a Job has multiple people.

## Product principles

The product follows a Linear-style operating model: remove states that do not change an outcome, keep the Job context visible, automate predictable transitions, and give each screen one primary action.

The canonical relationship is:

`Job → Candidate → Next steps → Assignment`

The candidate may enter through a public application or an invitation. The source is metadata, not a different operating model.

## Two entry paths

### Public applicant

`Apply → Shortlist or not selected → Complete next steps → Approve or not selected → Assignment`

The application form creates the Candidate-for-Job record. Shortlisting immediately creates the required next-step plan and notifies the candidate.

### Invited Professional

`Invitation → Complete Service qualification once → Match to Job → Approve or not selected → Assignment`

An invitation can target a Service/team or a specific Job. A Professional who is already approved for the Job's Service skips repeated Service qualification and completes only Job-specific steps.

Both paths converge on the same Job candidate record and the same Admin decision surface.

## Role of Services and next steps

Services are reusable qualification templates, not the primary workflow. A Job selects a Service; that Service supplies the normal checklist, assessment, or interview requirements. A Job may add Job-specific steps.

Candidates see plain-language **Next steps**. They do not need to understand internal terms such as Service enrolment, readiness queue, or reviewer routing.

The reusable Service qualification may be shared by several Applications for the same Professional and Service. Each Application explicitly stores the qualification record it uses, so the Job relationship is not inferred at read time.

## Admin experience

Jobs are the primary operating surface. A Job detail contains:

- Candidates
- Assigned people
- Job details

The candidate queue has only three useful groups:

- **New** — Admin chooses Shortlist or Not selected.
- **Waiting on candidate** — next steps are underway.
- **Ready for decision** — Admin chooses Approve for Job or Not selected.

Remove the meaningless **Start review** action and do not store an “under review” step solely because an Admin opened a record. Opening the candidate is review.

For each candidate:

1. **Shortlist** immediately creates or reuses that Professional's Service qualification, links it to the candidate's Job record, and sends the next-steps email.
2. The candidate completes the required checklist, assessment, or interview.
3. When complete, that candidate alone moves to **Ready for decision**.
4. **Approve for Job** opens a compact confirmation sheet with pay, deadline, and reviewer prefilled. Confirming creates only that Professional's Assignment.
5. Other candidates for the same Job remain in their own states.

Pay remains explicitly confirmable per person because the same Job may have multiple Professionals with different terms. The Job deadline is the default deadline.

The global Applications destination may remain as a cross-Job inbox, but Job context and the candidate's primary action must always be visible.

## Professional experience

- Add **Applications** as a first-class professional AppShell destination on desktop, tablet, and mobile.
- Render application history in the signed-in workspace shell. Keep the public route as a compatibility entry/redirect.
- Show role, company, applied date, current state, and exactly one next action per candidate.
- Use only these candidate-facing states: Application received, Action needed, Decision pending, Assigned, Not selected.
- If an invited Professional is already Service-qualified, show only remaining Job-specific steps.
- Keep Today focused on one highest-priority action. An application may appear as a compact action item; the complete history remains on Applications.
- Never expose private Admin notes.

## State and data model

The visible candidate lifecycle is:

`Application received → Next steps → Ready for decision → Assigned`

Not selected and Withdrawn are terminal outcomes. The existing `converted` database status and `assignment_id` remain the persistence representation of Assigned.

Required database/API changes:

1. Add nullable `readiness_enrolment_id` to `job_applications`, with a foreign key and index. Backfill existing rows where one active Professional + Service qualification is unambiguous.
2. Update the shortlist RPC to write that link when it creates or reuses qualification.
3. Update readiness approval/read models so only linked candidate records expose `ready_for_assignment` and progress.
4. Extend `list_my_applications` with Service name, qualification id/status, progress counts, `ready_for_assignment`, and assignment id.
5. Keep per-candidate conversion as the authoritative Assignment gate.
6. Make the client shortlist parser accept the real JSON object response and retain compatibility with array-shaped test data.

## Email behavior

Send only essential state-change email:

- Invitation received
- Application received
- Next steps assigned
- Changes requested
- Final decision
- Assignment created

Do not send an email for an internal “under review” state or duplicate an email merely because a read model becomes ready for decision.

## Acceptance criteria

- Public applicants and invited Professionals converge on the same Job candidate workflow.
- Services provide reusable qualification requirements without becoming a separate Admin hunt.
- Admin can process a candidate with Shortlist → candidate completion → Approve → Confirm assignment.
- There is no Start review action or meaningless under-review transition.
- Each ready candidate can be approved independently on a multi-person Job.
- An approved Service qualification can be reused without forcing repeated steps.
- A professional can open Applications from the workspace and see accurate next steps.
- Shortlisting never throws after the RPC succeeds, regardless of object/array response shape.
- The existing assignment gate still validates positive per-person pay and uses the Job deadline by default.
- Relevant unit/page tests cover navigation, next-step derivation, shortlist parsing, readiness/application linkage, and multi-applicant isolation.

## Non-goals

- Bulk assignment or automatic assignment of every ready candidate.
- Replacing the existing Service checklist, Lead review, or evidence rules.
- Adding an unrequested interview product beyond representing it as a Job next step.
- Redesigning public Job discovery or application submission copy beyond workspace links.
