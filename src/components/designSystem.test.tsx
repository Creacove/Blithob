import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Drawer } from "./Drawer";
import { FilterSheet } from "./FilterSheet";
import { StatusBadge } from "./StatusBadge";
import { SummaryBand } from "./SummaryBand";
import { ToastProvider, useToast } from "./ToastProvider";
import {
  DesktopRecordRow,
  Field,
  Input,
  ProgressBar,
  ResponsiveRecord,
  Select,
  Section,
  StickyActionBar,
  Textarea
} from "./ui";

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <Drawer open={open} title="Assignment details" onClose={() => setOpen(false)}>
        <p>Full task brief</p>
      </Drawer>
    </>
  );
}

function ToastHarness() {
  const { success } = useToast();
  return (
    <button type="button" onClick={() => success("Changes saved")}>
      Save
    </button>
  );
}

describe("design system", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: query === "(max-width: 767px)",
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true
      })
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined
    });
  });

  it("uses contextual language for submitted work", () => {
    render(<StatusBadge status="submitted" />);

    expect(screen.getByText("Waiting for review")).toBeInTheDocument();
  });

  it("uses contextual language for payout records", () => {
    render(<StatusBadge status="pending" />);

    expect(screen.getByText("Payment due")).toBeInTheDocument();
  });

  it("groups summary metrics in one labelled region", () => {
    render(
      <SummaryBand
        items={[
          {
            label: "Jobs awaiting review",
            value: 2,
            note: "Needs a decision"
          }
        ]}
      />
    );

    expect(
      screen.getByRole("region", { name: "Workspace summary" })
    ).toBeInTheDocument();
    expect(screen.getByText("Jobs awaiting review")).toBeInTheDocument();
  });

  it("progressively discloses secondary mobile metrics", async () => {
    const user = userEvent.setup();
    render(
      <SummaryBand
        items={[
          { label: "Needs review", value: 2, mobilePriority: "primary" },
          { label: "Amount due", value: "N130,000", mobilePriority: "primary" },
          { label: "Scheduled", value: 0, mobilePriority: "secondary" },
          { label: "Issues", value: 0, mobilePriority: "secondary" }
        ]}
      />
    );

    expect(screen.queryByText("Scheduled")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all metrics" }));
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
  });

  it("renders action drawers through the document body", () => {
    render(
      <Drawer open title="Record payment" onClose={() => undefined}>
        <p>Payment form</p>
      </Drawer>
    );

    const dialog = screen.getByRole("dialog", { name: "Record payment" });
    expect(
      dialog.closest("[data-drawer-root]")?.parentElement
    ).toBe(document.body);
  });

  it("closes a drawer with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const trigger = screen.getByRole("button", { name: "Open drawer" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("labels Assignment and readiness statuses with plain language", () => {
    const { rerender } = render(
      <StatusBadge status="changes_requested_by_lead" />
    );
    expect(screen.getByText("Lead requested changes")).toHaveClass(
      "whitespace-nowrap"
    );

    rerender(<StatusBadge status="waiting_for_admin" />);
    expect(screen.getByText("Waiting for Admin")).toBeInTheDocument();
  });

  it("announces successful mutations without moving focus", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );
    const button = screen.getByRole("button", { name: "Save" });

    await user.click(button);

    expect(screen.getByRole("status")).toHaveTextContent("Changes saved");
    expect(button).toHaveFocus();
  });

  it("exposes progress values to assistive technology", () => {
    render(<ProgressBar value={3} max={5} label="Training progress" />);

    const progress = screen.getByRole("progressbar", {
      name: "Training progress"
    });
    expect(progress).toHaveAttribute("aria-valuenow", "3");
    expect(progress).toHaveClass("h-1.5", "bg-slate-100");
  });

  it("keeps desktop record columns explicit and shared across rows", () => {
    render(
      <DesktopRecordRow
        columns="minmax(14rem,1fr) 10rem 1.25rem"
        layoutAt="xl"
      >
        <span>Campaign Refresh</span>
        <span>Waiting for Admin</span>
        <span>Open</span>
      </DesktopRecordRow>
    );

    const row = screen.getByText("Campaign Refresh").parentElement;
    expect(row).toHaveAttribute("data-layout-at", "xl");
    expect(row).toHaveStyle({
      "--record-columns": "minmax(14rem,1fr) 10rem 1.25rem"
    });
  });

  it("preserves shared control styling when pages add custom classes", () => {
    render(
      <div>
        <Input aria-label="Search" className="pl-10" />
        <Select aria-label="Filter" className="sm:w-56">
          <option>All</option>
        </Select>
        <Field label="Description" className="sm:col-span-2">
          <Textarea aria-label="Description" className="min-h-40" />
        </Field>
      </div>
    );

    expect(screen.getByLabelText("Search")).toHaveClass("w-full", "pl-10");
    expect(screen.getByLabelText("Filter")).toHaveClass("w-full", "sm:w-56");
    expect(screen.getByLabelText("Description")).toHaveClass(
      "w-full",
      "min-h-40"
    );
    expect(screen.getByText("Description").closest("label")).toHaveClass(
      "sm:col-span-2"
    );
  });

  it("supports collapsed mobile disclosure sections", async () => {
    const user = userEvent.setup();
    render(
      <Section
        title="Decision history"
        mobileDisclosure="collapsed"
      >
        <p>Approved by Admin</p>
      </Section>
    );

    expect(screen.queryByText("Approved by Admin")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show Decision history" })
    );
    expect(screen.getByText("Approved by Admin")).toBeInTheDocument();
  });

  it("renders a compact record with primary and disclosed details", async () => {
    const user = userEvent.setup();
    render(
      <ResponsiveRecord
        title="Campaign Refresh"
        subtitle="David Mensah"
        status={<StatusBadge status="waiting_for_lead" />}
        facts={[
          { label: "Due", value: "21 Jun 2026" },
          { label: "Version", value: "1" }
        ]}
        details={<p>Lead review route</p>}
      />
    );

    expect(screen.getByText("Campaign Refresh")).toBeInTheDocument();
    expect(screen.queryByText("Lead review route")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show details" }));
    expect(screen.getByText("Lead review route")).toBeInTheDocument();
  });

  it("labels sticky mobile actions and filter sheets", async () => {
    const user = userEvent.setup();
    render(
      <>
        <StickyActionBar>
          <button type="button">Publish job</button>
        </StickyActionBar>
        <FilterSheet
          open
          title="Filter jobs"
          onClose={() => undefined}
        >
          <label>
            Status
            <select aria-label="Status">
              <option>All statuses</option>
            </select>
          </label>
        </FilterSheet>
      </>
    );

    expect(
      screen.getByRole("group", { name: "Page actions" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Filter jobs" })
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
  });
});
