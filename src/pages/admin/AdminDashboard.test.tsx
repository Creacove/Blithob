import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";
import { useProfessionalStore } from "../../store/professionalStore";

describe("Admin Today", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useProfessionalStore.setState({
      backendMode: "demo",
      isBootstrapping: false,
      isLoading: false,
      error: null,
      assignments: [],
      jobs: [],
      professionals: [],
      serviceEnrolments: [],
      services: [],
      payments: [],
      activity: []
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/admin/today"]}>
        <AdminDashboard />
      </MemoryRouter>
    );
  }

  it("explains when there are no deadlines or activity yet", () => {
    renderPage();

    expect(screen.getByText("No active Assignment deadlines.")).toBeInTheDocument();
    expect(screen.getByText("No recent activity yet.")).toBeInTheDocument();
  });

  it("links each active deadline to its assignment record", () => {
    useProfessionalStore.setState({
      jobs: [
        {
          id: "job-1",
          title: "Campaign refresh",
          serviceId: "service-1",
          clientContext: "",
          objective: "Improve reach",
          description: "Deliver the refresh.",
          steps: ["Plan"],
          deliverables: ["Calendar"],
          acceptanceCriteria: ["On brief"],
          references: [],
          submissionEvidenceRequired: false,
          deadline: "2026-09-01T12:00:00.000Z",
          publicationState: "open",
          createdAt: "2026-08-13T09:00:00.000Z",
          updatedAt: "2026-08-13T09:00:00.000Z"
        }
      ],
      professionals: [
        {
          id: "professional-1",
          userId: "profile-1",
          name: "Amara Okafor",
          email: "amara@example.com",
          phone: "+234 800 000 1001",
          location: "Lagos",
          accountStatus: "active",
          isLead: false,
          joinedAt: "2026-08-13T09:00:00.000Z",
          adminNotes: "",
          completedAssignmentCount: 0
        }
      ],
      assignments: [
        {
          id: "assignment-1",
          jobId: "job-1",
          professionalId: "professional-1",
          agreedPay: 50000,
          deadline: "2026-09-01T12:00:00.000Z",
          status: "in_progress",
          createdAt: "2026-08-13T09:00:00.000Z"
        }
      ]
    });

    renderPage();

    expect(
      screen.getByRole("link", { name: /Campaign refresh.*Amara Okafor/i })
    ).toHaveAttribute("href", "/admin/assignments/assignment-1");
  });

  it("links recent activity to the affected record", () => {
    useProfessionalStore.setState({
      activity: [
        {
          id: "activity-1",
          actor: "Ayo Admin",
          action: "started assignment",
          subject: "Campaign refresh — Amara Okafor",
          subjectType: "assignment",
          subjectId: "assignment-1",
          createdAt: "2026-08-13T10:00:00.000Z"
        }
      ]
    });

    renderPage();

    expect(
      screen.getByRole("link", {
        name: /Ayo Admin started assignment Campaign refresh/i
      })
    ).toHaveAttribute("href", "/admin/assignments/assignment-1");
  });
});
