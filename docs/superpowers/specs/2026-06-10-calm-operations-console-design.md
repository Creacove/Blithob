# Blithob Calm Operations Console Design

## Purpose

Redesign the Blithob Professionals prototype as a calm, precise operations
workspace for coordinating people, training, jobs, reviews, and payments.
The result should feel intentionally designed rather than assembled from
generic dashboard components.

This is a product-wide redesign. Existing workflow logic and mock data remain
intact, but navigation, page hierarchy, visual language, microcopy, and
responsive behavior may change where that improves the experience.

## Design Principles

1. **Action before reporting.** Every dashboard should first answer, "What
   needs my attention?" Counts and summaries support that answer.
2. **Proximity communicates structure.** Related labels, values, and actions
   stay close. Distinct sections receive more space than elements within a
   section.
3. **Density without crowding.** Use the available viewport efficiently.
   Breathing room belongs inside components and around major page regions,
   not in arbitrary gaps between floating cards.
4. **Plain language builds confidence.** Labels describe recognizable work:
   People, Jobs, Reviews, Payments, Training, and Updates.
5. **Color communicates state or action.** Neutral surfaces carry the
   interface. Brand blue identifies links and primary actions. Orange appears
   only for warnings or urgent attention.
6. **Responsive behavior is designed, not collapsed.** Mobile layouts reorder
   content around the next action and use stable navigation that never covers
   page content.

## Product Structure

### Admin

The primary navigation contains:

- **Today**: operational overview and priority queue.
- **People**: workers, readiness, and training management.
- **Jobs**: opportunities, assignment, and delivery status.
- **Reviews**: submitted work and revision decisions.
- **Payments**: pending and completed payout records.

Notifications become a utility in the top bar with a visible unread count.
Training remains a dedicated route but is reached through a Workers/Training
local navigation inside People. This keeps the top-level mental model small
without removing prototype functionality.

### Trainer

The primary navigation contains:

- **Today**: readiness and submission priorities.
- **Trainees**: training progress and readiness decisions.
- **Reviews**: submissions awaiting feedback.
- **My work**: the trainer's own assignments.

Notifications remain a top-bar utility.

### Worker

The primary navigation contains:

- **Today**: next action, current workload, and recent updates.
- **Training**: required learning and approval progress.
- **Work**: current and completed assignments.
- **Payments**: payout records.
- **Profile**: contact and professional information.

On mobile these five destinations use a fixed bottom navigation. The page
receives enough bottom padding that the navigation never obscures content.

## Visual Direction

The visual character is a **calm operations console**: editorial clarity,
careful alignment, low visual noise, and small moments of brand warmth.

### Color

- Canvas: warm gray `#F5F5F2`.
- Primary surface: white `#FFFFFF`.
- Raised or selected surface: cool gray `#F0F2F4`.
- Primary ink: near-black navy `#15202B`.
- Secondary ink: slate `#5E6B78`.
- Border: `#DDE1E5`.
- Brand action: cobalt `#2457E6`.
- Brand action hover: `#1946C7`.
- Attention: burnt orange `#C85A17`.
- Positive: deep green `#167451`.
- Critical: deep red `#B42318`.

No gradients are used in the application shell. Shadows are shallow and
reserved for overlays, sticky navigation, and elevated menus. Cards use
borders and surface contrast rather than large blurred shadows.

### Typography

Use **IBM Plex Sans** for the entire product. Variation comes from size,
weight, and spacing rather than mixing families.

- Display: 40/44, semibold, desktop landing only.
- Page title: 32/38, semibold; 28/34 on mobile.
- Section title: 20/28, semibold.
- Component title: 16/24, semibold.
- Body: 16/24, regular.
- Supporting text: 14/20, regular.
- Metadata: 12/16, medium, used sparingly.

Body copy must not fall below 16px when it carries instructions or meaningful
content. Fourteen- and twelve-pixel styles are limited to secondary metadata,
timestamps, compact table headers, and status indicators. Paragraphs use a
maximum width of approximately 66 characters.

Headings, values, labels, table content, and navigation are left-aligned.
Numeric columns may be right-aligned when that improves comparison.

### Spacing

Use an 8-point base grid with a 4px half-step for optical adjustments:

- `4px`: icon or badge micro-gap.
- `8px`: related label-to-value spacing.
- `12px`: compact control padding.
- `16px`: standard component gap and mobile page padding.
- `24px`: card padding and related group separation.
- `32px`: major section separation.
- `48px`: desktop page-region separation.

Page content uses a maximum width of 1280px. Desktop main padding is 32px;
tablet is 24px; mobile is 16px. Headings sit closer to the content below them
than to the preceding section.

### Shape And Iconography

- Standard radius: 10px for controls and compact surfaces.
- Large radius: 16px for panels and overlays.
- Pills are reserved for statuses, not general containers.
- Lucide outline icons remain the single icon system.
- Decorative icons are removed from metric summaries unless they clarify a
  category or action.
- Minimum interactive target: 44 by 44px.

## Application Shell

### Desktop

The sidebar is 224px wide with a light surface, a bottom divider, and dark
text. The active item uses a soft cobalt tint and a 3px inset accent rather
than a white floating tile. Navigation rows are 44px high with consistent
16px icons and 12px label gaps.

The brand occupies a compact 64px header region. Reset and sign-out controls
move into a user menu opened from the profile block, removing low-priority
actions from permanent navigation.

The top bar is 64px high and contains the current section title, unread
notifications, and the user menu on smaller layouts. It does not repeat page
content.

### Mobile

Admin and trainer use a modal navigation drawer with a visible section title.
Worker navigation remains fixed at the bottom because workers revisit a small
set of frequent destinations.

The worker bottom navigation is full-width, anchored to the viewport edge,
and separated by a top border. It does not float over content. Labels remain
readable and use at least 11px text.

## Shared Page Patterns

### Page Header

Each page header contains:

- A concise page title.
- One sentence explaining the page's purpose when necessary.
- At most one primary action and one secondary action.

Date labels and role labels should not compete with the page title. Dynamic
context such as "2 reviews need attention" may replace decorative eyebrow
copy.

### Summary Band

Replace detached metric cards with one bordered summary band divided into
equal cells. Each cell places the value directly above a descriptive label,
with a one-line context statement only when necessary.

Metrics use contextual labels such as:

- `1 worker in training`
- `1 worker ready for jobs`
- `1 job awaiting review`
- `₦0 awaiting payment`

On mobile, the band becomes a two-column grid or a compact vertical list.
Values and labels remain grouped; icons do not sit on the opposite edge.

### Priority Queue

The most important dashboard region is a queue titled with a specific action:

- Admin: **Review and resolve**
- Trainer: **Your review queue**
- Worker: **Next action**

Rows contain a title, plain-language status, relevant person or service,
deadline, and a direct action. The whole row may be clickable, but the action
text remains visible. Urgent items sort first.

### Sections And Tables

Sections use a white surface, 1px border, 16px radius, and 24px desktop
padding. Section headers use a 16px gap below them. Long lists use aligned
rows rather than separate cards.

Tables include search or filters only where the dataset can plausibly grow.
Status chips can act as filters on Jobs, Reviews, and Payments. Mobile tables
become structured rows with visible field labels, never horizontal overflow.

### Empty States

Empty states explain why the area is empty and what will happen next:

- "No work is waiting for review. New submissions will appear here."
- "No payment is pending. Completed jobs create payout records."
- "No active assignment. New work will appear here when it is assigned."

Add an action only when the current role can directly resolve the empty state.

## Dashboard Designs

### Admin Today

1. Header: **Today**, a contextual sentence, and **Create job** as the primary
   action. **Add worker** is secondary.
2. Summary band: workers in training, workers ready, active jobs, jobs
   awaiting review, and payments pending.
3. Main column: **Review and resolve**, ordered by urgency and deadline.
4. Side column: **Recent activity**, compact and chronological.
5. Optional lower section: upcoming deadlines only when it adds information
   not already present in the priority queue.

The dashboard should fit the primary operational picture within a typical
desktop viewport without forcing scrolling through dead space.

### Trainer Today

1. Header: **Today**, with a count of outstanding decisions.
2. Summary band: trainees awaiting review, submissions awaiting feedback, and
   personal active jobs.
3. Main column: **Your review queue**, combining trainee readiness and
   submitted work with clear item types.
4. Side column: **My work**, showing the nearest personal deadline.

### Worker Today

1. Header: greeting plus a plain-language readiness state.
2. **Next action** appears before metrics on every viewport.
3. Compact summary band: active jobs, completed jobs, pending payment.
4. **Recent updates** follows with no more than four items.

On mobile, the next-action panel must be visible without being trapped inside
multiple nested cards. Its action remains above the fold on common phone
sizes where content permits.

## Status Language

Status components may retain domain values internally, but visible copy must
be contextual:

- `submitted` -> **Waiting for review**
- `accepted` -> **Approved, ready to complete**
- `needs_revision` -> **Changes requested**
- `awaiting_review` -> **Training review needed**
- `pending` payout -> **Payment due**
- `scheduled` payout -> **Payment scheduled**

Status badges use sentence case, not uppercase. Icons are optional and should
be removed when the text is already clear.

## Interaction Feedback

- Successful mutations display a short toast confirming the result.
- Destructive or data-reset actions require confirmation.
- Form validation appears beside the relevant field in plain language.
- Buttons show disabled and busy states during submission.
- Drawers and modals close with Escape and restore focus to their trigger.
- Complex review and assignment tasks may use a side panel instead of a small
  centered modal when more than a few fields or decisions are involved.

The prototype does not need simulated network latency or skeleton loading
unless a workflow visibly benefits from it.

## Landing And Login

The public landing page keeps its confident dark brand presence but uses the
same IBM Plex Sans system. The hero becomes more balanced and specific:

- Headline: **Build a reliable remote team.**
- Supporting copy explains training, matching, review, and delivery.
- Primary action: **Explore the workspace**
- Secondary action: **Sign in**

The service list becomes a concise capability statement rather than a
decorative footer. The login page presents roles as clearly labeled demo
workspaces with a short description of what each role can do.

## Accessibility

- Text and controls meet WCAG AA contrast.
- Focus rings are always visible.
- Status is never communicated by color alone.
- Navigation and dialogs are fully keyboard operable.
- Page landmarks and headings follow a logical hierarchy.
- Motion respects `prefers-reduced-motion`.
- Touch targets are at least 44px.

## Responsive Breakpoints

- Mobile: below 640px.
- Tablet: 640px to 1023px.
- Desktop: 1024px and above.

Grid behavior is content-driven:

- Summary bands use 1-2 columns on mobile and expand across desktop.
- Two-column dashboard regions stack with the priority queue first.
- Page actions become full-width only when necessary.
- Long titles wrap naturally without shrinking below the type scale.

## Technical Boundaries

- Keep React, React Router, Zustand, Tailwind CSS, Lucide, and existing domain
  workflow logic.
- Preserve existing routes where practical so workflow tests and prototype
  links remain stable.
- Navigation labels may change without changing route paths.
- Add small shared components for the summary band, contextual subnavigation,
  toast feedback, and responsive list rows.
- Avoid a broad domain or store refactor; this project is a prototype and the
  redesign should focus on user experience.

## Verification

The redesign is complete when:

- Existing domain and store tests pass.
- Core admin and worker end-to-end workflows still pass with updated labels.
- New component tests cover contextual status labels and navigation.
- Desktop and mobile screenshots show no overlapping navigation, arbitrary
  card gaps, undersized body copy, or horizontal overflow.
- Keyboard checks cover the drawer, user menu, notifications, and primary
  forms.
- `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` pass.

## Out Of Scope

- Backend services, real authentication, email delivery, file upload,
  payment processing, or live client access.
- New domain workflows unrelated to the current prototype.
- A complete marketing website beyond the existing landing and login entry.
