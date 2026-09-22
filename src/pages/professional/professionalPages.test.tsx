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
import type { PublicApplication, PublicListingsRepository } from "../../lib/publicListings";
import { JobsPage as ProfessionalJobsPage } from "./JobsPage";

const defaultRefreshRemote = useProfessionalStore.getState().refreshRemote;

function renderAppAt(path: string, state?: unknown) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[state === undefined ? path : { pathname: path, state }]}>
        <App />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe("professional workspace", () => {
  afterEach(() => {
    cleanup();
    useProfessionalStore.setState({
      backendMode: "demo",
      refreshRemote: defaultRefreshRemote
    });
  });

  beforeEach(() => {
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signIn("professional");
  });

  it("keeps applications inside Jobs and shows one clear qualification action", async () => {
    const application: PublicApplication = {
      id: "application-1",
      jobId: "job-1",
      jobSlug: "social-media-manager",
      jobTitle: "Social Media Manager",
      companyName: "Brightwave",
      status: "shortlisted",
      coverNote: "Relevant experience",
      readinessEnrolmentId: "qualification-1",
      readinessStatus: "in_progress",
      readinessCompletedCount: 1,
      readinessRequirementCount: 3,
      createdAt: "2026-09-22T10:00:00Z",
      updatedAt: "2026-09-22T10:00:00Z"
    };
    const repository: PublicListingsRepository = {
      async listServices() { return []; },
      async listCategories() { return []; },
      async listJobs() { return { jobs: [], total: 0 }; },
      async getJob() { return null; },
      async listMyApplications() { return [application]; },
      async listAdminApplications() { return []; },
      async completeProfessionalProfile() { return "professional-1"; },
      async submitApplication() { return "application-1"; },
      async withdrawApplication(id) { return id; },
      async reviewApplication(input) { return input.applicationId; },
      async shortlistApplication(input) { return input.applicationId; },
      async convertApplication() { return "assignment-1"; }
    };

    render(
      <MemoryRouter>
        <ProfessionalJobsPage repository={repository} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Jobs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse jobs" })).toHaveAttribute("href", "/jobs");
    expect(await screen.findByText("Social Media Manager")).toBeInTheDocument();
    expect(screen.getByText("Action required")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Complete steps" })).toHaveAttribute(
      "href",
      "/professional/training/qualification-1"
    );
    expect(screen.getByText("1 of 3 complete")).toBeInTheDocument();
    expect(screen.queryByText("Shortlisted")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View job" })).not.toBeInTheDocument();
  });

  it("shows a route to qualifications when shortlisted readiness details are missing", async () => {
    const application: PublicApplication = {
      id: "application-2",
      jobId: "job-2",
      jobSlug: "social-media-manager",
      jobTitle: "Social Media Manager",
      companyName: "Brightwave",
      status: "shortlisted",
      coverNote: "Relevant experience",
      createdAt: "2026-09-22T10:00:00Z",
      updatedAt: "2026-09-22T10:00:00Z"
    };
    const repository: PublicListingsRepository = {
      async listServices() { return []; },
      async listCategories() { return []; },
      async listJobs() { return { jobs: [], total: 0 }; },
      async getJob() { return null; },
      async listMyApplications() { return [application]; },
      async listAdminApplications() { return []; },
      async completeProfessionalProfile() { return "professional-1"; },
      async submitApplication() { return "application-2"; },
      async withdrawApplication(id) { return id; },
      async reviewApplication(input) { return input.applicationId; },
      async shortlistApplication(input) { return input.applicationId; },
      async convertApplication() { return "assignment-2"; }
    };

    render(
      <MemoryRouter>
        <ProfessionalJobsPage repository={repository} />
      </MemoryRouter>
    );

    expect(await screen.findByText("Action required")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find steps" })).toHaveAttribute(
      "href",
      "/professional/training"
    );
    expect(screen.queryByText(/Nothing is needed from you yet/)).not.toBeInTheDocument();
  });

  it("loads a newly created qualification before opening its checklist", async () => {
    const state = useProfessionalStore.getState();
    const professional = state.currentProfessional();
    const service = state.services.find((item) => item.requirements.length > 0);
    expect(professional).toBeDefined();
    expect(service).toBeDefined();
    const enrolmentId = "newly-shortlisted-qualification";

    useProfessionalStore.setState({
      backendMode: "remote",
      serviceEnrolments: [],
      refreshRemote: async () => {
        useProfessionalStore.setState((current) => ({
          serviceEnrolments: [
            ...current.serviceEnrolments,
            {
              id: enrolmentId,
              professionalId: professional!.id,
              serviceId: service!.id,
              status: "not_started",
              requirements: service!.requirements.map((item) => ({
                requirementId: item.id,
                completed: false
              })),
              createdAt: "2026-09-22T10:00:00Z",
              updatedAt: "2026-09-22T10:00:00Z"
            }
          ]
        }));
      }
    });

    renderAppAt(`/professional/training/${enrolmentId}`, {
      jobTitle: "Social Media Manager"
    });

    expect(await screen.findByRole("heading", { name: "Qualification steps" })).toBeInTheDocument();
    expect(await screen.findByText(service!.requirements[0].title)).toBeInTheDocument();
    expect(screen.getByText("For Social Media Manager")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Jobs" })).toHaveAttribute(
      "href",
      "/professional/jobs"
    );
  });

  it("refreshes qualifications before showing the list for a new shortlist", async () => {
    const state = useProfessionalStore.getState();
    const professional = state.currentProfessional();
    const service = state.services.find((item) => item.requirements.length > 0);
    expect(professional).toBeDefined();
    expect(service).toBeDefined();
    const enrolmentId = "new-shortlist-list-enrolment";

    useProfessionalStore.setState({
      backendMode: "remote",
      serviceEnrolments: [],
      refreshRemote: async () => {
        useProfessionalStore.setState((current) => ({
          serviceEnrolments: [
            ...current.serviceEnrolments,
            {
              id: enrolmentId,
              professionalId: professional!.id,
              serviceId: service!.id,
              status: "not_started",
              requirements: service!.requirements.map((item) => ({
                requirementId: item.id,
                completed: false
              })),
              createdAt: "2026-09-22T10:00:00Z",
              updatedAt: "2026-09-22T10:00:00Z"
            }
          ]
        }));
      }
    });

    renderAppAt("/professional/training");

    expect(await screen.findByRole("link", { name: `Open ${service!.name} qualification` }))
      .toHaveAttribute("href", `/professional/training/${enrolmentId}`);
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
      screen.getByRole("button", { name: "Start work" })
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

  it("presents reusable job requirements as Qualifications, not Training", () => {
    renderAppAt("/professional/training");

    expect(screen.getByRole("heading", { name: "Qualifications" })).toBeInTheDocument();
    expect(screen.getByText(/Complete steps attached to your job applications/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Training" })).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "Qualification reviews" })).toHaveAttribute(
      "href",
      "/professional/team"
    );
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
        name: "Approve and send to Admin"
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
