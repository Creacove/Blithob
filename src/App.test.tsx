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
    useProfessionalStore.setState({ backendMode: "demo", isBootstrapping: false });
  });

  it("lets a visitor enter the prototype and choose a persona", async () => {
    const user = userEvent.setup();
    renderAppAt("/");

    await user.click(screen.getAllByRole("link", { name: "Sign in" })[0]);

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

  it("keeps Admin navigation focused on the four operating areas", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/today");

    const navigation = screen.getAllByRole("navigation", { name: "Admin navigation" })[0];
    expect(within(navigation).getAllByRole("link")).toHaveLength(4);
    expect(within(navigation).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Jobs" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "People" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Payments" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open desktop user menu" }));
    expect(screen.getByRole("link", { name: "Job qualifications" })).toBeInTheDocument();
  });

  it("keeps Lead users inside the Professional workspace", () => {
    useProfessionalStore.getState().signIn("lead");
    renderAppAt("/professional/today");

    const navigation = screen.getAllByRole("navigation", { name: "Lead navigation" })[0];
    expect(within(navigation).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Jobs" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Reviews" })).toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "Team" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "Training" })).not.toBeInTheDocument();
  });

  it("does not expose Lead destinations to a regular Professional", () => {
    useProfessionalStore.getState().signIn("professional");
    renderAppAt("/professional/today");

    expect(screen.queryByRole("link", { name: "Team" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Reviews" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jobs" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Training" })).not.toBeInTheDocument();
  });

  it.each([
    ["admin", "/admin/today"],
    ["lead", "/professional/today"],
    ["professional", "/professional/today"]
  ] as const)(
    "keeps desktop account actions available for %s users",
    async (persona, path) => {
      const user = userEvent.setup();
      useProfessionalStore.getState().signIn(persona);
      renderAppAt(path);

      await user.click(
        screen.getByRole("button", { name: "Open desktop user menu" })
      );

      expect(
        screen.getByRole("button", { name: "Reset demo data" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign out" })
      ).toBeInTheDocument();
    }
  );

  it("hides demo reset controls for a remote account", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    useProfessionalStore.setState({ backendMode: "remote" });
    renderAppAt("/admin/today");

    await user.click(
      screen.getByRole("button", { name: "Open desktop user menu" })
    );

    expect(
      screen.queryByRole("button", { name: "Reset demo data" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("waits for remote auth before redirecting a protected deep link", () => {
    useProfessionalStore.setState({
      backendMode: "remote",
      isBootstrapping: true,
      session: null
    });
    renderAppAt("/admin/people");

    expect(screen.getByText(/Loading your workspace/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Sign in to Blithob" })
    ).not.toBeInTheDocument();
  });

  it("keeps Admin phone navigation to four destinations", async () => {
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/today");

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Admin mobile navigation"
    });
    expect(
      within(mobileNavigation).getAllByRole("link")
    ).toHaveLength(4);
    expect(within(mobileNavigation).queryByRole("button", { name: "More" })).not.toBeInTheDocument();
  });

  it("keeps Lead phone navigation focused on Home, Jobs, Work, and Reviews", () => {
    useProfessionalStore.getState().signIn("lead");
    renderAppAt("/professional/today");

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Lead mobile navigation"
    });
    expect(
      within(mobileNavigation).getAllByRole("link")
    ).toHaveLength(4);

    expect(within(mobileNavigation).getByRole("link", { name: "Home mobile" })).toBeInTheDocument();
    expect(within(mobileNavigation).getByRole("link", { name: "Jobs mobile" })).toBeInTheDocument();
    expect(within(mobileNavigation).getByRole("link", { name: "Work mobile" })).toBeInTheDocument();
    expect(within(mobileNavigation).getByRole("link", { name: "Reviews mobile" })).toBeInTheDocument();
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

    fireEvent.change(
      screen.getByPlaceholderText("Search by name, email, or location"),
      { target: { value: "Nneka" } }
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
    expect(screen.getByRole("link", { name: "View applicants" })).toHaveAttribute(
      "href",
      "/admin/applications?jobId=job-open-social"
    );
  });

  it("opens eligible Professionals in the Job assignment drawer", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/jobs/job-open-social");

    await user.click(
      screen.getByRole("button", { name: "Hire qualified people" })
    );

    expect(
      screen.getByRole("dialog", { name: "Hire qualified people" })
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
