import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { ToastProvider } from "./components/ToastProvider";
import { useProfessionalStore } from "./store/professionalStore";

function renderAppAt(path: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe("application routing", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signOut();
  });

  it("lets a visitor enter the prototype and choose a persona", async () => {
    const user = userEvent.setup();
    renderAppAt("/");

    await user.click(
      screen.getByRole("link", { name: "Explore the workspace" })
    );

    expect(
      screen.getByRole("heading", { name: "Choose a workspace" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue as Admin" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue as Lead" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue as Professional" })
    ).toBeInTheDocument();
  });

  it("shows Services as a first-class Admin destination", () => {
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/today");

    expect(
      screen.getByRole("link", { name: "Services" })
    ).toBeInTheDocument();
  });

  it("keeps Lead users inside the Professional workspace", () => {
    useProfessionalStore.getState().signIn("lead");
    renderAppAt("/professional/today");

    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reviews" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Training" })).toBeInTheDocument();
  });

  it("does not expose Lead destinations to a regular Professional", () => {
    useProfessionalStore.getState().signIn("professional");
    renderAppAt("/professional/today");

    expect(screen.queryByRole("link", { name: "Team" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Reviews" })
    ).not.toBeInTheDocument();
  });

  it("recovers from a persisted session whose user no longer exists", () => {
    useProfessionalStore.setState({
      session: { persona: "lead", userId: "missing-user" }
    });

    renderAppAt("/professional/today");

    expect(
      screen.getByRole("heading", { name: "Choose a workspace" })
    ).toBeInTheDocument();
  });

  it("searches the People directory and opens a Professional record", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/people");

    await user.type(
      screen.getByPlaceholderText("Search by name, email, or location"),
      "Nneka"
    );

    expect(screen.getByText("Nneka Eze")).toBeInTheDocument();
    expect(screen.queryByText("Amara Okafor")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("link", { name: "Open Nneka Eze" })
    );

    expect(
      screen.getByRole("heading", { name: "Nneka Eze" })
    ).toBeInTheDocument();
  });

  it("filters People by Lead capability", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/people");

    await user.click(screen.getByRole("button", { name: "Leads" }));

    expect(screen.getByText("Nneka Eze")).toBeInTheDocument();
    expect(screen.queryByText("Amara Okafor")).not.toBeInTheDocument();
  });

  it("explains the access granted by Lead capability", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/people/professional-amara");

    await user.click(
      screen.getByRole("button", { name: "Grant Lead capability" })
    );

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Team and Reviews"
    );
  });

  it("opens one Service and its ordered readiness requirements", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/services");

    await user.click(
      screen.getByRole("link", {
        name: "Open Social Media Management"
      })
    );

    expect(
      screen.getByRole("heading", { name: "Social Media Management" })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Portfolio sample")).toBeInTheDocument();
    expect(screen.queryByText(/training track/i)).not.toBeInTheDocument();
  });

  it("shows a structured Job directory and complete brief", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/jobs");

    expect(
      screen.getByRole("link", { name: "Create job" })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("link", { name: "Open Launch Social Media Calendar" })
    );

    expect(
      screen.getByRole("heading", { name: "Launch Social Media Calendar" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Produce a ready-to-schedule campaign plan.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acceptance criteria" })
    ).toBeInTheDocument();
  });

  it("opens eligible Professionals in the Job assignment drawer", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/jobs/job-open-social");

    await user.click(
      screen.getByRole("button", { name: "Add professionals" })
    );

    expect(
      screen.getByRole("dialog", { name: "Add professionals" })
    ).toBeInTheDocument();
    expect(screen.getByText("Amara Okafor")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Approved for Social Media Management/)
    ).not.toHaveLength(0);
  });

  it("opens one independent Assignment record", () => {
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/assignments/assignment-approved");

    expect(
      screen.getByRole("heading", { name: "Campaign Refresh" })
    ).toBeInTheDocument();
    expect(screen.getByText("David Mensah")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Submission versions" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Complete assignment" })
    ).toBeInTheDocument();
  });

  it("opens a saved Job in the structured editor", () => {
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/jobs/job-open-social/edit");

    expect(
      screen.getByRole("heading", { name: "Edit job" })
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Launch Social Media Calendar")
    ).toBeInTheDocument();
  });

  it("switches between independent Work and readiness review queues", async () => {
    const user = userEvent.setup();
    useProfessionalStore.setState((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === "assignment-waiting-lead"
          ? { ...assignment, status: "waiting_for_admin" }
          : assignment
      )
    }));
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/reviews");

    expect(screen.getByRole("tab", { name: /Work/ })).toBeInTheDocument();
    expect(screen.getAllByText("David Mensah")).not.toHaveLength(0);

    await user.click(screen.getByRole("tab", { name: /Readiness/ }));

    expect(screen.getByText("Zainab Bello")).toBeInTheDocument();
    expect(screen.getByText("Content Writing")).toBeInTheDocument();
  });

  it("records a Cash payment without requiring a reference", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/payments");

    await user.click(
      screen.getByRole("button", {
        name: "Record payment for payment-due-cash"
      })
    );
    fireEvent.change(screen.getByLabelText("Payment date"), {
      target: { value: "2026-06-16T10:00" }
    });
    await user.click(screen.getByRole("button", { name: "Save payment" }));

    expect(
      useProfessionalStore
        .getState()
        .payments.find((payment) => payment.id === "payment-due-cash")
        ?.status
    ).toBe("paid");
  });

  it("requires a reference for a bank transfer", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/payments");

    await user.click(
      screen.getByRole("button", {
        name: "Record payment for payment-due-transfer"
      })
    );
    expect(screen.getByLabelText("Payment state")).toHaveValue("paid");
    expect(screen.getByLabelText("Method")).toHaveValue("bank_transfer");
    const referenceInput = screen.getByLabelText(/^Payment reference/);
    fireEvent.change(screen.getByLabelText("Payment date"), {
      target: { value: "2026-06-21T10:00" }
    });

    expect(
      screen.getByRole("button", { name: "Save payment" })
    ).toBeDisabled();
    await user.type(referenceInput, "TRF-1048");
    expect(
      screen.getByRole("button", { name: "Save payment" })
    ).toBeEnabled();
  });

  it("completes one Assignment into one due Payment", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/assignments/assignment-approved");

    await user.click(
      screen.getByRole("button", { name: "Complete assignment" })
    );
    const dialog = screen.getByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Complete assignment" })
    );

    expect(screen.getByText("Payment due")).toBeInTheDocument();
    expect(
      useProfessionalStore
        .getState()
        .payments.filter(
          (payment) => payment.assignmentId === "assignment-approved"
        )
    ).toHaveLength(1);
  });
});
