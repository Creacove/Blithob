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
import { App } from "../../App";
import { ToastProvider } from "../../components/ToastProvider";
import { useProfessionalStore } from "../../store/professionalStore";

function renderAppAt(path: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe("professional workspace", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signIn("professional");
  });

  it("shows Amara only her independent Assignments", () => {
    renderAppAt("/professional/work");

    expect(screen.getByRole("heading", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByText("₦120,000")).toBeInTheDocument();
    expect(screen.getByText("₦45,000")).toBeInTheDocument();
    expect(screen.queryByText("₦95,000")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Waiting for Lead")
    ).not.toBeInTheDocument();
  });

  it("starts one Assignment without changing another Professional's record", async () => {
    const user = userEvent.setup();
    useProfessionalStore.setState((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === "assignment-amara-campaign"
          ? { ...assignment, status: "assigned", startedAt: undefined }
          : assignment
      )
    }));
    renderAppAt("/professional/work/assignment-amara-campaign");

    await user.click(
      screen.getByRole("button", { name: "Start assignment" })
    );

    expect(
      useProfessionalStore
        .getState()
        .assignments.find(
          (assignment) => assignment.id === "assignment-amara-campaign"
        )?.status
    ).toBe("in_progress");
    expect(
      useProfessionalStore
        .getState()
        .assignments.find(
          (assignment) => assignment.id === "assignment-david-campaign"
        )?.status
    ).toBe("in_progress");
  });

  it("submits a revision as the next Submission version", async () => {
    const user = userEvent.setup();
    useProfessionalStore.setState((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === "assignment-amara-revision"
          ? {
              ...assignment,
              status: "changes_requested_by_lead",
              submittedAt: "2026-06-08T09:00:00.000Z"
            }
          : assignment
      ),
      submissions: [
        ...state.submissions,
        {
          id: "submission-amara-revision-1",
          assignmentId: "assignment-amara-revision",
          version: 1,
          notes: "Initial submission",
          link: "https://example.com/amara/revision-v1",
          submittedAt: "2026-06-08T09:00:00.000Z"
        }
      ],
      assignmentReviews: [
        ...state.assignmentReviews,
        {
          id: "review-amara-revision-1",
          assignmentId: "assignment-amara-revision",
          submissionId: "submission-amara-revision-1",
          reviewerUserId: "user-nneka",
          reviewerType: "lead",
          decision: "changes_requested",
          comment: "Clarify the performance summary.",
          createdAt: "2026-06-09T09:00:00.000Z"
        }
      ]
    }));
    renderAppAt("/professional/work/assignment-amara-revision");

    await user.click(
      screen.getByRole("button", { name: "Submit revision" })
    );
    fireEvent.change(screen.getByLabelText("Submission notes"), {
      target: { value: "Updated the summary and source notes." }
    });
    fireEvent.change(screen.getByLabelText(/^Submission link/), {
      target: { value: "https://example.com/amara/revision-v2" }
    });
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Submit revision"
      })
    );

    const submissions = useProfessionalStore
      .getState()
      .submissions.filter(
        (submission) =>
          submission.assignmentId === "assignment-amara-revision"
      );
    expect(submissions).toHaveLength(2);
    expect(submissions.at(-1)?.version).toBe(2);
  });

  it("derives approved Services from approved enrolments", () => {
    renderAppAt("/professional/profile");

    const approvedServices = screen.getByRole("region", {
      name: "Approved Services"
    });
    expect(
      within(approvedServices).getByText("Social Media Management")
    ).toBeInTheDocument();
    expect(
      within(approvedServices).queryByText("Content Writing")
    ).not.toBeInTheDocument();
  });

  it("uses one editable Email field without a duplicate contact summary", () => {
    renderAppAt("/professional/profile");

    expect(screen.getAllByLabelText("Email")).toHaveLength(1);
    expect(screen.getAllByDisplayValue("amara@example.com")).toHaveLength(1);
  });

  it("provides Professional mobile account actions from Profile", async () => {
    const user = userEvent.setup();
    renderAppAt("/professional/profile");

    expect(
      screen.getByRole("button", { name: "Reset demo data" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(
      screen.getByRole("heading", { name: "Choose a workspace" })
    ).toBeInTheDocument();
  });

  it("rejects a Payment belonging to another Professional", () => {
    renderAppAt("/professional/payments/payment-due-cash");

    expect(
      screen.getByRole("heading", { name: "Payment not found" })
    ).toBeInTheDocument();
  });

  it("shows a Lead the Service enrolments assigned to their Team", () => {
    useProfessionalStore.getState().signIn("lead");

    renderAppAt("/professional/team");

    expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    expect(screen.getAllByText("Zainab Bello")).not.toHaveLength(0);
    expect(
      screen.getAllByText("Social Media Management")
    ).not.toHaveLength(0);
    expect(
      document.querySelector(
        'a[href="/professional/team/enrolment-nneka-data"]'
      )
    ).not.toBeInTheDocument();
  });

  it("lets a Lead certify an assigned readiness record", async () => {
    const user = userEvent.setup();
    useProfessionalStore.setState((state) => ({
      serviceEnrolments: state.serviceEnrolments.map((enrolment) =>
        enrolment.id === "enrolment-zainab-social"
          ? { ...enrolment, status: "waiting_for_lead" }
          : enrolment
      )
    }));
    useProfessionalStore.getState().signIn("lead");

    renderAppAt("/professional/team/enrolment-zainab-social");

    expect(
      screen.getByRole("heading", { name: "Social Media Management" })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Lead feedback"), {
      target: { value: "Evidence meets the Service standard." }
    });
    await user.click(
      screen.getByRole("button", { name: "Certify readiness" })
    );

    expect(
      useProfessionalStore
        .getState()
        .serviceEnrolments.find(
          (enrolment) => enrolment.id === "enrolment-zainab-social"
        )?.status
    ).toBe("waiting_for_admin");
  });

  it("lets a Lead review only Assignments routed to them", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("lead");

    renderAppAt("/professional/reviews");

    expect(
      screen.getByRole("heading", { name: "Reviews" })
    ).toBeInTheDocument();
    expect(screen.getByText("David Mensah")).toBeInTheDocument();
    expect(screen.getByText("Campaign Refresh")).toBeInTheDocument();
    expect(screen.queryByText("Lead Newsletter Draft")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Review assignment assignment-waiting-lead"
      })
    );
    fireEvent.change(screen.getByLabelText("Lead feedback"), {
      target: { value: "The submission meets the brief." }
    });
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Certify for Admin"
      })
    );

    expect(
      useProfessionalStore
        .getState()
        .assignments.find(
          (assignment) => assignment.id === "assignment-waiting-lead"
        )?.status
    ).toBe("waiting_for_admin");
  });
});
