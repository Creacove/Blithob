# Blithob Phase 1 Delivery and Product Roadmap

## Client response

Blithob has been delivered using a phased product approach. Phase 1 is now
complete and provides a production-ready candidate application journey together
with Blithob's internal vacancy and applicant-management operations.

The larger features discussed for employers, international recruitment, AI,
payments and additional service verticals are intentionally scheduled for later
phases. They were not omitted from Phase 1; they were deliberately kept out of
the first release so that the initial product could be launched as a focused,
stable and maintainable system.

## 1. Full Phase 1 user journey

1. A candidate visits the Blithob website and browses available vacancies.
2. They search or filter jobs by the available criteria.
3. They open a job's dedicated detail page and select **Apply**.
4. They sign in or create a candidate account.
5. They confirm their email and complete their candidate profile.
6. They upload a primary CV and any supporting documents.
7. They submit a cover note and optional portfolio link.
8. The application is saved and appears in the Blithob Admin review queue.
9. Blithob staff review the application and update its Phase 1 status.
10. The candidate views the application and status from their account and
    receives the relevant notifications.

## 2. Direct answers to the client questions

### Application and candidate experience

**What happens when a candidate clicks “Apply”?**

The candidate is directed through sign-in or registration, profile completion,
CV confirmation, document upload and application submission. The server checks
that the vacancy is open, the candidate has not already applied and all required
information is valid. The application then enters the Blithob Admin queue.

**Can candidates create profiles, upload CVs/documents and update their information?**

Yes. Candidates can create and update their profile, maintain one primary CV,
and add supporting documents. Documents are stored privately and are visible
only to the candidate and authorised Blithob staff.

**Can candidates track applications through Applied, Reviewing, Shortlisted, Interview, Offer and Hired?**

Phase 1 supports Applied, Reviewing, Shortlisted, Rejected, Withdrawn and
Moved Forward Internally. Interview, Offer and Hired are Phase 2 recruitment
stages. A Phase 1 “Moved Forward Internally” application enters Blithob's
internal assignment process; it is not presented as an automated Hired stage.

### Blithob and employer operations

**Can Blithob staff manage and update applicants from an Admin dashboard?**

Yes. Admin users can view, search and filter applications, review candidate
information and documents, add internal notes, update statuses and convert a
shortlisted candidate into the existing internal Assignment workflow.

**Can employers create accounts, post jobs and manage applicants themselves?**

Not in Phase 1. Vacancies are managed by Blithob Admin users. Employer accounts,
self-service vacancy posting and employer applicant management are planned for
Phase 2.

**Can Blithob approve employers and vacancies before they go live?**

Admin users can review and approve vacancies before publishing them publicly in
Phase 1. Employer verification and approval will be introduced with employer
accounts in Phase 2.

### Job discovery and matching

**Can jobs be filtered by country, location, profession, salary, work type and visa sponsorship?**

Phase 1 supports country, location, profession/category, salary or rate,
employment type and work mode. Visa sponsorship is intentionally reserved for
Phase 2 because it requires additional eligibility and international-recruitment
rules.

**Can visa-sponsored and international jobs be highlighted?**

Yes, as a Phase 2 capability. That phase will introduce sponsorship information,
international eligibility, destination countries and the related recruitment
workflow.

**Does the platform have candidate-to-job matching, or is it only a job-listing website?**

Phase 1 provides a database-backed job listing and application platform, with
Blithob Admin review and internal eligibility support. It does not make
automated candidate decisions or provide AI recommendations. Advanced matching
is planned for Phase 2.

**Can AI eventually be added for CV analysis, skills matching and recommendations?**

Yes. The platform can be extended with CV analysis, skills extraction,
candidate-to-job matching and recommendations. Those features will be designed
with human review, privacy controls and appropriate safeguards in Phase 2.

### Admin information, roles and notifications

**What information and analytics are available on the Admin dashboard?**

Phase 1 provides operational information such as published vacancies, candidate
and application counts, applications by status, applications awaiting review,
and recent activity. Advanced recruitment funnels, employer reporting and
marketing attribution are planned for Phase 2.

**Can different staff members have different roles and permissions?**

Yes. Phase 1 includes role-aware access for Admin users and Professionals. A
Professional can be promoted to Lead, giving them responsibility for supporting
and supervising other Professionals across the relevant services, including
lead-level readiness and work-review responsibilities. More granular or fully
custom roles such as Recruiter, Finance, Content Manager, Reviewer and Super
Admin are planned for Phase 2.

**Can the system record an audit trail showing which staff member made each change?**

Yes. Important vacancy, application and assignment actions record the acting
user, action, subject and timestamp. More detailed field-level compliance
auditing can be added in Phase 2.

**Can applicants automatically receive emails when their application status changes?**

Yes. Phase 1 includes application confirmation and status-change notifications
for submission, reviewing, shortlisting, rejection and movement into the
internal workflow. Authentication, recovery and invitation emails use the
configured Auth email provider.

### Payments and future services

**Can the platform support payments, subscriptions, premium jobs and recruitment fees?**

Phase 1 supports internal manual payout tracking. Payment gateways,
subscriptions, premium vacancies, recruitment fees and automated payouts are
planned for Phase 2.

**Can the same platform later accommodate Recruitment, Study Abroad, Travel, Immigration and Training services?**

Yes. The platform uses a reusable service and operations foundation. The
current release focuses on Blithob's workforce and internal recruitment
operations. Employer-facing recruitment enhancements are Phase 2; the broader
Study Abroad, Travel, Immigration and expanded Training service modules are
planned for Phase 3.

### Technology and security

**What technology is being used?**

- Frontend: React, TypeScript and Vite.
- Backend: Supabase.
- Database: PostgreSQL.
- Authentication: Supabase Auth.
- File storage: private Supabase Storage.
- Server-side operations: Supabase database functions and Edge Functions.
- Hosting: Netlify.

**Where is user data stored, and how is it protected?**

The current Supabase project is hosted in West EU, Ireland. Access is protected
with authentication, PostgreSQL Row Level Security, private document storage,
server-side workflow rules and short-lived signed document URLs.

**What security measures are implemented against hacking, fake accounts, spam and malicious uploads?**

Phase 1 includes the security baseline appropriate for the current platform and
user volume: authenticated access, database-level permissions, server-side
validation, duplicate-application protection, bounded queries, account rate
limiting, anti-spam controls, restricted CV/document formats and sizes, private
storage and actor-attributed activity logging. Service-role keys and provider
secrets are never exposed in the browser.

Phase 2 will add deeper security operations where the platform's usage justifies
them, including malware scanning and quarantine for uploaded files, malicious
activity tracking, stronger bot and abuse detection, web-application controls,
security monitoring and alerting, dependency and vulnerability scanning,
penetration testing, incident-response procedures and extended audit reporting.

**Is the platform being designed to meet UK GDPR/data-protection requirements?**

The technical design follows data-protection principles such as minimisation,
controlled access, private document storage and managed deletion/retention
paths. The remaining formal work - approved policies, retention rules, privacy
wording, DPIA/DSAR procedures, processor documentation and legal review - is a
later-phase governance workstream. It should not be represented as legal
certification until reviewed by the appropriate advisers.

**Is the website fully optimised for mobile phones?**

Yes. The public and internal interfaces are responsive across mobile, tablet
and desktop layouts. The Phase 1 release was checked across the core candidate,
Admin and job-discovery journeys.

**What happens if the platform eventually has 10,000–100,000 registered users?**

The current React, Netlify and Supabase architecture works appropriately for
the platform's current user volume and expected Phase 1 usage. The system does
not need 10,000–100,000-user infrastructure in order to operate reliably today.

If usage later approaches that range, the platform can be strengthened in a
controlled way with deeper indexing and pagination, caching, background
processing, monitoring, load testing, backup and recovery procedures, and
additional infrastructure where actual usage requires it. This is future scale
optimisation, not a current Phase 1 limitation.

**What analytics and marketing tracking systems will be integrated?**

Phase 1 provides operational Admin reporting. Google Analytics, campaign
attribution, Meta Pixel or equivalent marketing systems are planned for Phase 2
alongside the necessary consent and privacy controls.

**Will each job have its own Google-searchable and shareable URL?**

Yes. Every public vacancy has a stable URL, such as
`/jobs/product-designer`, with job-specific page metadata, canonical URL,
structured data, sitemap inclusion and social-sharing information. Indexing
timing remains dependent on the final domain, approved content and search-engine
crawling.

### Delivery status and roadmap

**Which parts are working now, and which parts are only frontend/demo designs?**

The core Phase 1 workflows are functional and database-backed: public job
discovery, job details, candidate registration, profiles, document upload,
applications, candidate status tracking, Admin vacancy management, Admin
review, notifications and internal Assignment conversion.

Visual branding, illustrations and presentation layouts support the user
experience but do not represent unsupported business workflows. Public vacancy
content is managed through the Admin system and is published only after review.

**What percentage of the entire project is currently completed?**

The agreed Phase 1 scope is 100% complete. It is not meaningful to calculate the
long-term product roadmap as though Phase 2 and Phase 3 were unfinished parts of
Phase 1; they are separately planned capabilities.

**What remains outstanding?**

There are no outstanding Phase 1 product requirements. The remaining roadmap
consists of the intentionally deferred Phase 2 and Phase 3 capabilities listed
below.

**What is the expected production-ready launch date?**

The Phase 1 release is production-ready for controlled launch following client
confirmation of final vacancy content and launch communications. No Phase 1
engineering blocker remains. The public launch date can therefore be agreed as
part of the client sign-off and operational handover.

## 3. Phase delivery plan

### Phase 1 — Candidate and Blithob Admin platform

- Public website and job discovery.
- Candidate accounts, profiles and document management.
- Job applications and candidate status tracking.
- Admin vacancy publication and applicant review.
- Role-aware access for Admin users, Professionals and promoted Leads.
- Basic operational analytics and activity history.
- Application notifications.
- Internal assignment, readiness, review and manual payout workflows.
- Mobile responsiveness, SEO foundations, security controls and release QA.

### Phase 2 — Prioritised platform expansion

Phase 2 will be delivered in the following order, based on business value and
operational importance.

### Priority 1: Payments and commercial operations

- Payment gateway integration.
- Subscriptions and premium Jobs.
- Recruitment fees.
- Automated payout and payment-status workflows.
- Reconciliation, payment reporting and financial audit controls.

### Priority 2: Security, privacy and compliance hardening

- Malware scanning, quarantine and review of uploaded files.
- Malicious activity tracking, bot detection and stronger abuse prevention.
- Web-application protection, security monitoring and alerting.
- Vulnerability scanning, penetration testing and incident-response procedures.
- Extended audit controls and formal data-governance processes.
- GDPR operating processes, retention governance, DPIA and DSAR support after
  the required client and legal review.

### Priority 3: Granular analytics and reporting

- Detailed application and recruitment funnels.
- Candidate, vacancy and conversion reporting.
- Employer reporting once employer accounts are introduced.
- Marketing attribution and consent-aware tracking.
- More granular staff permissions for operational reporting.

### Priority 4: Employer marketplace and advanced recruitment

- Employer accounts and verification.
- Employer vacancy creation and applicant management.
- Interview, Offer and Hired stages.
- Interview scheduling and recruitment communications.

### Priority 5: AI and matching

- AI-assisted CV analysis.
- Skills extraction and matching.
- Candidate-to-job recommendations.
- Human-reviewed automated suggestions.

### Priority 6: International recruitment

- Visa-sponsored Jobs.
- International eligibility and destination-country information.
- Visa and immigration-related recruitment workflows.

### Priority 7: Scale and infrastructure optimisation

- Load testing and capacity monitoring as usage grows.
- Additional indexing, caching, background processing and infrastructure when
  actual volume requires it.

### Phase 3 — Multi-service and enterprise expansion

- Study Abroad workflows.
- Travel workflows.
- Immigration workflows.
- Expanded customer-facing Training services.
- Cross-service accounts, forms, case management and reporting.
- Enterprise integrations, advanced automation and larger-scale infrastructure.

## 4. Ownership and handover

Blithob has completed the agreed payment for the project and is the owner of
the project-specific source code, database records, domain, hosting account,
Supabase project, production credentials, custom designs and project
intellectual property.

Production accounts should be registered under Blithob-controlled credentials,
with the development team receiving the access required to maintain the
platform. Any pre-existing reusable libraries or tools should be identified and
handled separately in the agreement.

## Closing position

Phase 1 delivers a complete, focused and launchable Blithob platform for
candidate applications and internal workforce operations. Phase 2 begins with
payments, then strengthens security and data governance, expands analytics and
adds employer, recruitment, AI and international capabilities in priority order.
Phase 3 extends the same foundation into the wider Blithob service ecosystem.
