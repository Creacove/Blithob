# Calm Operations Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Blithob prototype as a coherent, responsive operations console with task-first dashboards, simplified navigation, contextual statuses, and a strict shared visual system.

**Architecture:** Preserve the React Router routes, Zustand domain workflows, and form behavior. Introduce a small set of shared presentation primitives, redesign the shell and three role dashboards around them, then apply the same typography, spacing, panel, and row patterns to the remaining pages.

**Tech Stack:** React 19, TypeScript, React Router, Zustand, Tailwind CSS 4, Lucide React, Vitest, Testing Library, Playwright.

---

## File Map

- `src/index.css`: global tokens, font, responsive shell, and animation rules.
- `src/components/AppShell.tsx`: role navigation, top bar, drawer, user menu, and worker mobile navigation.
- `src/components/SummaryBand.tsx`: compact grouped metrics.
- `src/components/PageHeader.tsx`: consistent page hierarchy and actions.
- `src/components/StatusBadge.tsx`: contextual visible status language.
- `src/components/ui.tsx`: controls, panels, empty states, and shared layout styles.
- `src/pages/*`: page-specific composition and copy.
- `src/components/designSystem.test.tsx`: shared component behavior and status-copy tests.
- `src/App.test.tsx`: route and redesigned dashboard expectations.
- `e2e/prototype.spec.ts`: preserved admin and worker workflows with updated navigation labels.

### Task 1: Lock The New Shared Behaviors With Tests

**Files:**
- Create: `src/components/designSystem.test.tsx`
- Modify: `src/App.test.tsx`
- Modify: `e2e/prototype.spec.ts`

- [ ] **Step 1: Write failing tests for contextual statuses and summary metrics**

```tsx
it("uses contextual language for submitted work", () => {
  render(<StatusBadge status="submitted" />);
  expect(screen.getByText("Waiting for review")).toBeInTheDocument();
});

it("groups summary metrics in one labelled region", () => {
  render(
    <SummaryBand
      items={[{ label: "Jobs awaiting review", value: 2, note: "Needs a decision" }]}
    />
  );
  expect(screen.getByRole("region", { name: "Workspace summary" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests and verify they fail because the new component and labels do not exist**

Run: `npm test -- src/components/designSystem.test.tsx src/App.test.tsx`

Expected: FAIL for missing `SummaryBand` and old status text.

- [ ] **Step 3: Update end-to-end selectors for the approved navigation language**

Use `Reviews`, `Payments`, `Work`, and `Explore the workspace` in place of the old labels.

### Task 2: Build The Visual System

**Files:**
- Create: `src/components/SummaryBand.tsx`
- Modify: `src/index.css`
- Modify: `src/components/PageHeader.tsx`
- Modify: `src/components/StatusBadge.tsx`
- Modify: `src/components/ui.tsx`
- Modify: `src/components/BrandMark.tsx`
- Modify: `src/components/Modal.tsx`

- [ ] **Step 1: Implement the summary band API required by the failing test**

```tsx
export interface SummaryItem {
  label: string;
  value: string | number;
  note?: string;
}

export function SummaryBand({ items }: { items: SummaryItem[] }) {
  return (
    <section aria-label="Workspace summary" className="summary-band">
      {items.map((item) => (
        <div key={item.label} className="summary-cell">
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          {item.note && <small>{item.note}</small>}
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Replace Montserrat/Poppins with IBM Plex Sans and define the approved color, spacing, border, and surface tokens**

- [ ] **Step 3: Restyle page headers, controls, panels, empty states, brand mark, and modal around 16px body copy, 10-16px radii, quiet borders, and compact 8px-grid spacing**

- [ ] **Step 4: Implement contextual status labels**

Map `submitted` to `Waiting for review`, `accepted` to `Approved`, `needs_revision` to `Changes requested`, `awaiting_review` to `Training review needed`, and payout `pending` to `Payment due`.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- src/components/designSystem.test.tsx`

Expected: PASS.

### Task 3: Redesign The Application Shell

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Add failing route tests for the new admin `Today`, `People`, `Jobs`, `Reviews`, and `Payments` navigation labels**

- [ ] **Step 2: Run the route test and verify the old navigation labels fail the assertion**

Run: `npm test -- src/App.test.tsx`

- [ ] **Step 3: Implement the light 224px desktop sidebar, compact active state, notification utility, user menu, and mobile drawer**

- [ ] **Step 4: Keep existing route paths but change visible labels and place Admin training behind a local People subnavigation**

- [ ] **Step 5: Replace the floating worker mobile dock with an edge-anchored bottom navigation and sufficient page padding**

- [ ] **Step 6: Run route tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

### Task 4: Recompose The Three Role Dashboards

**Files:**
- Modify: `src/pages/admin/AdminDashboard.tsx`
- Modify: `src/pages/trainer/TrainerDashboard.tsx`
- Modify: `src/pages/worker/WorkerDashboard.tsx`
- Modify: `src/components/Metric.tsx`

- [ ] **Step 1: Add failing dashboard assertions for `Today`, `Review and resolve`, `Your review queue`, and worker `Next action` ordering**

- [ ] **Step 2: Run the focused tests and verify the old headings fail**

Run: `npm test -- src/App.test.tsx`

- [ ] **Step 3: Replace detached metrics with `SummaryBand`**

- [ ] **Step 4: Make the primary queue the dominant region, sort urgent work first, and use plain contextual action labels**

- [ ] **Step 5: Put the worker next-action panel before the summary band on all viewports**

- [ ] **Step 6: Run dashboard tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

### Task 5: Apply The System To Operational Pages

**Files:**
- Modify: `src/pages/admin/WorkersPage.tsx`
- Modify: `src/pages/admin/OpportunitiesPage.tsx`
- Modify: `src/pages/admin/AdminTrainingPage.tsx`
- Modify: `src/pages/admin/AdminReviewsPage.tsx`
- Modify: `src/pages/admin/PayoutsPage.tsx`
- Modify: `src/pages/trainer/TraineesPage.tsx`
- Modify: `src/pages/trainer/TrainerReviewsPage.tsx`
- Modify: `src/pages/shared/MyWorkPage.tsx`
- Modify: `src/pages/worker/WorkerTrainingPage.tsx`
- Modify: `src/pages/worker/WorkerPayoutsPage.tsx`
- Modify: `src/pages/worker/ProfilePage.tsx`
- Modify: `src/pages/NotificationsPage.tsx`

- [ ] **Step 1: Replace decorative eyebrow copy and ambiguous page titles with task-based labels**

- [ ] **Step 2: Convert floating cards to bordered panels and aligned rows using shared radii and spacing**

- [ ] **Step 3: Raise instructional and content text to 16px, retaining 12-14px only for metadata**

- [ ] **Step 4: Replace ambiguous actions such as `Resolve` and `Open workspace` with specific verbs**

- [ ] **Step 5: Add the People/Training local navigation on the admin people pages**

- [ ] **Step 6: Verify TypeScript and component tests**

Run: `npm test`

Expected: all Vitest suites pass.

### Task 6: Redesign Landing And Login

**Files:**
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/pages/LoginPage.tsx`
- Modify: `index.html`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Add a failing test for the `Explore the workspace` entry action**

- [ ] **Step 2: Run the focused test and verify the old CTA fails**

Run: `npm test -- src/App.test.tsx`

- [ ] **Step 3: Implement the balanced dark landing page with `Build a reliable remote team.` and clearer capability copy**

- [ ] **Step 4: Rebuild role selection as concise demo-workspace rows with explicit role outcomes**

- [ ] **Step 5: Run the focused test**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

### Task 7: Full Verification And Visual Review

**Files:**
- Modify as needed based on failures and browser findings.

- [ ] **Step 1: Run unit tests**

Run: `npm test`

- [ ] **Step 2: Run lint**

Run: `npm run lint`

- [ ] **Step 3: Run production build**

Run: `npm run build`

- [ ] **Step 4: Run end-to-end flows**

Run: `npm run test:e2e`

- [ ] **Step 5: Start the local app and inspect admin desktop and worker mobile in the in-app browser**

Check for horizontal overflow, overlapping navigation, inconsistent spacing,
undersized body copy, weak hierarchy, and unreachable actions.

- [ ] **Step 6: Fix each visual defect, then repeat unit, lint, build, and end-to-end verification**

