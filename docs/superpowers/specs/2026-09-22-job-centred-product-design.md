# Job-Centred Product Design

## Product rule

Blithob is a job platform. A person finds a job, applies, completes only the reusable qualification steps they are missing, gets hired, does the work, and gets paid. Services remain internal qualification templates; they are not a competing product area.

## User-facing model

- Job: an opportunity.
- Application: one person's request for one job.
- Qualification: reusable requirements for similar jobs.
- Work: a job after the person is hired.
- Payment: money due for completed work.

System terms such as enrolment, converted, assignment, readiness route, and operational status remain internal.

## Experience

Professionals use Home, Jobs, Work, Payments, and Profile. Jobs contains their applications and a direct route to browse public jobs. Qualifications appear only when an application or invitation requires action.

Admins use Home, Jobs, People, and Payments. Applications and reviews remain valid routes but are reached from the job or the Home action queue. Qualification templates are secondary configuration.

Leads use Home, Reviews, Work, Payments, and Profile. Their review queue separates qualification and work decisions without adding a second workspace identity.

## Application decisions

Opening an application is review; there is no Start review action. Admin chooses Shortlist or Not selected. Shortlisting reuses or creates the linked service qualification. A qualified candidate becomes Ready to hire. Hire opens one compact confirmation for that candidate's pay and deadline and creates independent work. One job may hire multiple people.

## Qualification policy

A job may have no qualification requirements. When its linked service has requirements, they are enabled by default. Completed qualification for the same service is reused across jobs.

## Candidate language

Applied, Action required, Waiting for decision, Ready to hire, Hired, Not selected, and Withdrawn are the only visible outcome concepts.

## Email policy

Email only for invitation, application receipt, action required, changes requested, final decision, hire/work assignment, material deadline changes, and payment events. Internal status movement produces in-app updates only.
