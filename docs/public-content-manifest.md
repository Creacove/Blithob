# Public content manifest

The public website reads published rows from Supabase. This manifest is the
review queue for launch content; it is not a second source of truth.

## Categories

The five public discovery categories are seeded as `job_categories` rows:

- Tech
- Design
- Marketing
- Operations
- Customer Support

## Existing services

The operational Services catalog is the same catalog used by readiness and
Assignments. Public slugs and labels are attached to the existing rows:

- Social media (`social-media`)
- Content creation (`content-creation`)
- Virtual assistance (`virtual-assistance`)
- Data entry (`data-entry`)

## Candidate jobs

The current design copy is a review queue, not a second content source. These
five roles are the candidates that were previously shown in the landing-page
design; each must be confirmed by an Admin before it is published:

| Slug | Title | Company shown in design | Category | Rate shown in design |
| --- | --- | --- | --- | --- |
| `frontend-developer` | Frontend Developer | Skyline Labs | Tech | ₦450,000–₦650,000 / month |
| `social-media-manager` | Social Media Manager | Brightwave | Marketing | ₦250,000–₦400,000 / month |
| `customer-support-rep` | Customer Support Rep | Codeflow Systems | Customer Support | ₦280,000–₦420,000 / month |
| `operations-manager` | Operations Manager | Flowstead | Operations | ₦400,000–₦600,000 / month |
| `product-designer` | Product Designer | Northstar Studio | Design | ₦400,000–₦650,000 / month |

Migration `202608130013` publishes these five design-reference rows so the
meeting demo exercises the real public directory and application path. They
are system-seeded meeting content, not a replacement for factual recruiting
copy; an Admin should review or replace each row in the Job editor before
production use. The conversion path is the existing Admin Jobs editor; no
JavaScript fallback or duplicate CMS record is used.

To publish a role safely, an Admin should complete the public fields, confirm
`public_visible`, assign a unique `slug`, set `publication_state` to `open`,
and choose at most five `featured_order` slots.
