import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Drawer } from "./Drawer";
import { StatusBadge } from "./StatusBadge";
import { SummaryBand } from "./SummaryBand";
import { ToastProvider, useToast } from "./ToastProvider";
import { ProgressBar } from "./ui";

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
  afterEach(() => cleanup());

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
    expect(screen.getByText("Lead requested changes")).toBeInTheDocument();

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

    expect(
      screen.getByRole("progressbar", { name: "Training progress" })
    ).toHaveAttribute("aria-valuenow", "3");
  });
});
