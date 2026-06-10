# Blithob Unified Professional Workflow Design

## Purpose

Rebuild the Blithob Professionals prototype around a simple operational model
that supports:

- professionals completing paid work;
- experienced professionals acting as Leads;
- Leads supervising training and reviewing job submissions;
- Admin retaining final authority over readiness, completion, and payments;
- several professionals completing the same job independently;
- clear, manual payment records with optional receipts.

The design replaces the current split Worker/Trainer identity and the shared
job-status model. It also removes ambiguous information architecture such as
placing services inside People and describing service training as independent
"training tracks."

## Product Principles

1. **One person, one workspace.** A Lead remains a professional and gains
   additional capabilities. They do not switch to a separate identity.
2. **A job is not an assignment.** A job defines the shared brief. Each
   assigned professional receives an independent assignment, status,
   submission, review history, pay amount, and payment record.
3. **Services define readiness.** A professional is approved for an entire
   service in v1. Each service has one editable readiness checklist.
4. **Responsibility is visible.** Every training enrolment and job assignment
   clearly identifies who performs the work, who reviews it, and who gives
   final approval.
5. **Dedicated pages for durable information.** People, services, jobs, and
   assignments use stable URLs and full pages. Temporary actions use drawers.
   Small confirmation dialogs are the only centered modals.
6. **Status belongs to the correct object.** Training progress belongs to a
   service enrolment. Delivery progress belongs to an assignment. Payment
   progress belongs to a payment record.

## Roles And Permissions

### Admin

Admin can:

- create and manage professionals;
- grant or remove Lead capability;
- create and edit services;
- define service readiness requirements;
- enrol professionals in services;
- assign a supervising Lead to an enrolment;
- give final readiness approval;
- create jobs and assign one or more professionals;
- assign a Lead reviewer to individual assignments;
- review work directly or after Lead certification;
- complete assignments;
- record manual payments and attach receipt evidence.

### Professional

Every non-Admin user is a Professional. A Professional can:

- view and update their profile;
- complete service training;
- view assigned work;
- start, complete, and submit assignments;
- respond to revision requests;
- view review history;
- view payment records.

### Lead Capability

A Professional with Lead capability can additionally:

- supervise service training enrolments assigned to them;
- review training evidence;
- request training changes;
- certify a professional as ready for Admin sign-off;
- review job assignments explicitly routed to them;
- request delivery changes;
- certify delivery and forward it to Admin.

Lead capability does not remove or replace the Professional experience. The
Lead keeps personal work, training, profile, and payment access.

## Core Data Model

### User

- `id`
- `name`
- `email`
- `accountRole`: `admin | professional`
- `professionalId` for Professional accounts

### Professional

- contact details;
- account status;
- `isLead`;
- joined date;
- admin notes;
- completed assignment count.

Service approval is not stored as a loose array. It is derived from approved
service enrolments.

### Service

- `id`
- `name`
- short name;
- description;
- active/inactive state;
- readiness requirements;
- created and updated timestamps.

A readiness requirement contains:

- title;
- description;
- whether evidence is required;
- display order.

There is one readiness checklist per service in v1. The product does not use
the term "training track."

### Service Enrolment

Represents one Professional training for one Service.

- `id`
- `professionalId`
- `serviceId`
- optional `leadId`
- status:
  - `not_started`
  - `in_progress`
  - `waiting_for_lead`
  - `changes_requested_by_lead`
  - `waiting_for_admin`
  - `changes_requested_by_admin`
  - `approved`
  - `paused`
- requirement progress;
- evidence attachments or links;
- Lead feedback;
- Lead certification date;
- Admin feedback;
- Admin approval date.

The same Professional may be enrolled in several services.

### Job

Defines the shared paid-work brief:

- title;
- service;
- client context;
- objective;
- full description;
- steps;
- deliverables;
- acceptance criteria;
- shared reference links or files;
- deadline;
- publication state: `draft | open | archived`;
- operational status derived from assignments;
- creation metadata.

The Job does not hold one worker, one reviewer, one submission, or one pay
amount.

### Assignment

Represents one Professional doing one Job:

- `id`
- `jobId`
- `professionalId`
- optional `leadReviewerId`
- agreed pay;
- assignment deadline, defaulting to the Job deadline;
- status:
  - `assigned`
  - `in_progress`
  - `waiting_for_lead`
  - `changes_requested_by_lead`
  - `waiting_for_admin`
  - `changes_requested_by_admin`
  - `approved`
  - `completed`
  - `cancelled`
- started, submitted, approved, and completed timestamps.

Assignment rules:

- a Lead cannot review their own assignment;
- if the assignee is the Job Lead, their assignment routes to Admin;
- if no Lead reviewer is assigned, submission routes directly to Admin;
- different assignees may have different pay amounts and reviewers;
- one assignee's progress never changes another assignee's assignment.

### Submission

Belongs to an Assignment, not directly to a Job:

- `assignmentId`
- version number;
- notes;
- links;
- file metadata;
- submitted timestamp.

Every resubmission creates a new version so review history is preserved.

### Review

Belongs to a specific Submission and Assignment:

- reviewer;
- reviewer type: `lead | admin`;
- decision:
  - `changes_requested`
  - `certified`
  - `approved`
- comment;
- timestamp.

Lead certification moves the Assignment to `waiting_for_admin`. Admin approval
moves it to `approved`. Admin then explicitly completes the Assignment, which
creates its payment record.

### Payment

Belongs to one completed Assignment:

- professional;
- job and assignment;
- amount;
- due date;
- status:
  - `due`
  - `scheduled`
  - `paid`
  - `issue`
- payment date;
- method:
  - bank transfer;
  - mobile money;
  - cash;
  - cheque;
  - other;
- transaction/reference number;
- optional receipt attachment metadata;
- optional internal note;
- issue note where applicable.

The v1 product does not move money. Admin manually records external payment
activity.

## Training Workflow

### Service Setup

1. Admin opens Services.
2. Admin creates or edits a Service.
3. Admin defines the Service readiness requirements as an ordered checklist.
4. Admin activates the Service when it can be used for enrolments and jobs.

### Enrolment

1. Admin opens a Professional detail page.
2. Admin selects **Enrol in service**.
3. Admin chooses one active Service.
4. Admin optionally selects a Lead.
5. The system creates a Service Enrolment.
6. The Professional sees it under Training.
7. The assigned Lead sees it under Team.

If no Lead is assigned, completed evidence routes directly to Admin.

### Professional Completion

1. The Professional opens a Service training detail page.
2. The page shows each readiness requirement, evidence expectation, progress,
   feedback, and final approval state.
3. The Professional marks requirements complete and attaches evidence where
   required.
4. When every requirement is complete, the Professional selects **Send for
   review**.
5. The enrolment routes to the assigned Lead or directly to Admin.

### Lead Review

1. Lead opens Team.
2. Team shows assigned enrolments grouped by urgency and status.
3. Lead opens an enrolment detail page.
4. Lead reviews requirement completion and evidence.
5. Lead either:
   - requests changes with specific feedback; or
   - certifies readiness.
6. Certification moves the enrolment to Admin's Readiness approvals queue.

A Lead cannot certify their own enrolment.

### Admin Final Approval

1. Admin reviews the Lead certification, evidence, and history.
2. Admin either requests changes or approves the Service Enrolment.
3. Approval makes the Professional eligible for Jobs requiring that Service.

If a Lead requests changes, the next submission returns to that Lead. If
Admin requests changes, the next submission returns directly to Admin while
the assigned Lead retains visibility into the enrolment.

## Job And Assignment Workflow

### Job Creation

Job creation is a dedicated page with sections:

1. Basics: title, service, client context.
2. Brief: objective and full description.
3. Execution: ordered steps.
4. Delivery: deliverables and acceptance criteria.
5. References: optional links or files.
6. Scheduling: deadline.
7. Assignments: added after the Job is saved.

The page supports saving a draft. A Job can be published as Open only when
the required brief information is complete. Publication state is stored on
the Job; operational progress is derived from its Assignments.

### Assigning Professionals

Admin opens the Job detail page and selects **Add professionals**.

A right-side assignment drawer shows:

- only Professionals approved for the selected Service;
- current workload;
- Lead capability;
- recent completion history;
- active assignment count.

For each selected Professional, Admin sets:

- agreed pay;
- optional assignment-specific deadline;
- Lead reviewer or Direct to Admin.

Admin may add several assignments in one action. The same Lead reviewer may be
used for several assignments. A Lead may also be one of the assignees, but
their own assignment routes to Admin.

### Professional Work

The Work page is a compact assignment inbox with filters:

- Needs action
- In progress
- Waiting for review
- Completed

Selecting an assignment opens a dedicated detail page containing:

- assignment status and pay;
- deadline and reviewer;
- objective and client context;
- full description;
- ordered steps;
- deliverables;
- acceptance criteria;
- references;
- review and submission timeline;
- primary action.

The Professional can start the Assignment, use a personal acceptance
checklist, and submit work from a side drawer.

### Submission Routing

If a Lead reviewer exists and is not the assignee:

1. Professional submits.
2. Assignment becomes `waiting_for_lead`.
3. Lead requests changes or certifies.
4. Certification makes the Assignment `waiting_for_admin`.
5. Admin requests changes or approves.

If no valid Lead reviewer exists:

1. Professional submits.
2. Assignment becomes `waiting_for_admin`.
3. Admin requests changes or approves.

Revision requests always return to the same Professional and preserve the
review history.

### Completion

Admin approval changes the Assignment to `approved`.

Admin then selects **Complete assignment**. Completion:

- changes status to `completed`;
- increments the Professional's completion count;
- creates one Payment record for that Assignment;
- notifies the Professional.

The Job status is derived:

- Draft: the Job has not been published.
- Open: the Job is published and has no active Assignments.
- Active: the Job is published and at least one Assignment is not completed
  or cancelled.
- Complete: the Job is published, every Assignment is completed or cancelled,
  and at least one was completed.
- Archived: the Job has been archived and cannot receive new Assignments.

## Payment Workflow

### Payment Queue

Admin Payments shows one row per Assignment payment, with filters:

- Due
- Scheduled
- Paid
- Issue

The row shows Professional, Job, amount, due date, status, method, and
reference where recorded.

### Recording Payment

Selecting **Record payment** opens a right-side drawer.

Required:

- payment date;
- payment method;
- reference number, unless the method is Cash.

Optional:

- receipt attachment;
- internal note.

Admin can:

- mark as Scheduled;
- mark as Paid;
- mark a Payment issue with a reason.

The worker Payment detail page shows:

- amount;
- status;
- due and paid dates;
- method;
- reference;
- receipt when available;
- associated Job and Assignment.

## Information Architecture

### Admin Navigation

- **Today**: operational action queue.
- **People**: Professional directory and individual records.
- **Services**: service catalogue and readiness requirements.
- **Jobs**: shared briefs and assignment management.
- **Reviews**: Admin review queue for assignments and readiness.
- **Payments**: manual payment queue and history.

Admin Training is removed as a top-level or People sub-tab.

### Professional Navigation

- **Today**
- **Work**
- **Training**
- **Payments**
- **Profile**

### Lead Navigation

Lead capability inserts:

- **Team**: supervised service enrolments.
- **Reviews**: assigned work submissions.

Final order:

- Today
- Work
- Team
- Reviews
- Training
- Payments
- Profile

Lead navigation is permission-based within the same Professional workspace.

## Page Design

### Today

Today is retained only as an action-oriented home:

- the nearest action;
- review or approval counts;
- deadlines;
- payment issues;
- concise recent updates.

It does not duplicate full directory or management pages.

### People

One toolbar contains:

- search;
- All / Professionals / Leads filter;
- Add professional.

Remove the current nested Workers/Training navigation. Rows navigate to
dedicated Professional pages.

Professional detail sections:

- Overview
- Services and training
- Work history
- Payments
- Internal notes
- Permissions

Lead promotion is managed under Permissions with a confirmation explaining
the added Team and Reviews capabilities.

### Services

Services uses a directory and detail layout.

Service detail contains:

- overview;
- readiness requirements;
- enrolled Professionals;
- approved Professionals;
- Jobs using the Service;
- active/inactive controls.

Creating and editing readiness requirements happens inline or in a full-page
edit state, not through multiple nested modals.

### Jobs

Jobs uses a structured list with:

- title;
- service;
- derived Job status;
- assignment progress, such as `2 of 3 completed`;
- deadline;
- action count.

Job detail contains:

- full brief;
- assignments table;
- shared references;
- activity.

Each Assignment row links to a dedicated Assignment detail page.

### Reviews

Admin Reviews uses two clear queues:

- Work
- Readiness

Each item represents one Assignment or one Service Enrolment. It never
represents an ambiguous shared Job.

Lead Reviews only contains Work assigned to that Lead.
Lead Team contains training supervision.

### Profile

Remove the duplicate summary/contact presentation.

Use one editable account panel with:

- identity and permission badges;
- approved Services;
- name;
- email;
- phone;
- location;
- save action.

## Overlay System

### Dedicated Pages

- Professional detail
- Service detail and edit
- Job create and detail
- Assignment detail
- Service training detail
- Payment detail

### Right-Side Drawers

- assign Professionals to a Job;
- submit Assignment work;
- review Assignment or training evidence where the page context remains
  useful;
- record a Payment;
- add Service enrolment.

Drawers:

- render through a body portal;
- cover the full application viewport;
- include one overlay;
- are not clipped by the content shell;
- are 480-640px on desktop;
- become full-screen on mobile;
- close with Escape;
- restore focus to the trigger.

### Confirmation Dialogs

Centered dialogs are reserved for:

- granting/removing Lead capability;
- cancelling an Assignment;
- removing an enrolment;
- deactivating a Service;
- resetting demo data.

## Migration From Current Prototype

1. Convert `trainer` users to `professional` users with `isLead: true`.
2. Convert each Training Track into the readiness requirements for its
   associated Service.
3. Convert worker training records into Service Enrolments.
4. Convert each Job's assigned worker list into independent Assignments.
5. Move Job pay amounts onto Assignments.
6. Move existing submissions and reviews from Job IDs to Assignment IDs.
7. Derive Job status from Assignments.
8. Remove legacy `assignedWorkerId`, shared Job delivery status, and Trainer
   routes after compatibility migration.

## Validation And Feedback

- Required evidence is validated before training review submission.
- Assignment submission requires notes and at least one link or file when the
  Job specifies an external deliverable.
- A reviewer cannot approve their own work or training.
- Lead reviewer choices exclude the assignee.
- Inactive Services cannot receive new enrolments or Jobs.
- Paid records cannot be edited without an explicit correction action.
- Every mutation confirms success with a toast.
- Errors remain beside the affected field or action.

## Testing And Acceptance Criteria

### Domain Tests

- Lead capability does not replace Professional access.
- A Professional can have several Service Enrolments.
- Lead certification routes training to Admin.
- Lead-requested training changes return to the Lead.
- Admin-requested training changes return directly to Admin.
- Admin approval makes the Professional eligible for Service matching.
- Two Professionals assigned to one Job have independent statuses.
- One Professional can submit while another remains in progress.
- Lead cannot review their own Assignment.
- Lead certification routes an Assignment to Admin.
- Direct assignments route straight to Admin.
- Completing one Assignment creates exactly one Payment.
- Payment records store method, reference, optional receipt, and note.

### Component And Routing Tests

- Lead navigation includes both Professional and Lead destinations.
- Services is a dedicated Admin destination.
- People no longer exposes nested Training navigation.
- Job and Assignment detail routes render independently.
- Drawers render outside the shell and cover the viewport.

### End-To-End Flows

1. Admin creates a Service, readiness requirements, and an enrolment.
2. Professional completes training, Lead certifies it, Admin approves it.
3. Admin creates one Job and assigns two Professionals with separate pay.
4. One assignment routes through a Lead; the other routes directly to Admin.
5. Both Professionals submit independently.
6. Lead requests a revision, then certifies the corrected submission.
7. Admin approves and completes each Assignment independently.
8. Two Payment records are created.
9. Admin records one bank transfer with receipt and one cash payment without a
   reference.
10. Professionals can view their own payment evidence.

## Out Of Scope

- automatic payment processing;
- client accounts;
- chat or threaded comments;
- multiple readiness programmes for one Service;
- service capability subcategories;
- assignment dependencies;
- team-shared submissions;
- time tracking;
- automatic Lead selection.
