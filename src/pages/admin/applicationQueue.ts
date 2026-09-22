import type { JobApplicationStatus, PublicApplication } from "../../lib/publicListings";

export type ApplicationAction =
  | "shortlist"
  | "view_readiness"
  | "create_assignment"
  | "open_assignment"
  | "view_application";

const statusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Applied",
  under_review: "Applied",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
  converted: "Hired"
};

export function applicationStatusLabel(status: JobApplicationStatus) {
  return statusLabels[status];
}

export function primaryAction(application: PublicApplication): ApplicationAction {
  switch (application.status) {
    case "submitted":
      return "shortlist";
    case "under_review":
      return "shortlist";
    case "shortlisted":
      return application.readyForAssignment === true || application.readinessStatus === "approved"
        ? "create_assignment"
        : "view_readiness";
    case "converted":
      return application.assignmentId ? "open_assignment" : "view_application";
    default:
      return "view_application";
  }
}

function progressDetail(application: PublicApplication) {
  const completed = application.readinessCompletedCount;
  const total = application.readinessRequirementCount;
  if (typeof completed === "number" && typeof total === "number" && total > 0) {
    return `${completed} of ${total} qualification steps complete.`;
  }
  return "Candidate is completing the qualification steps.";
}

export function readinessCopy(application: PublicApplication): {
  label: string;
  tone: "neutral" | "attention" | "success";
  detail: string;
} {
  switch (application.readinessStatus) {
    case "approved":
      return {
        label: "Ready to hire",
        tone: "success",
        detail: "Qualification is complete."
      };
    case "in_progress":
      return {
        label: "Qualification in progress",
        tone: "attention",
        detail: progressDetail(application)
      };
    case "waiting_for_lead":
    case "waiting_for_admin":
      return {
        label: "Qualification submitted",
        tone: "attention",
        detail: "Qualification is waiting for review."
      };
    case "changes_requested_by_lead":
    case "changes_requested_by_admin":
      return {
        label: "Changes requested",
        tone: "attention",
        detail: "Candidate needs to update their evidence."
      };
    case "paused":
      return {
        label: "Qualification paused",
        tone: "neutral",
        detail: "Qualification must be resumed before hiring."
      };
    case "not_started":
      return {
        label: "Qualification not started",
        tone: "attention",
        detail: "Candidate has not started the required steps."
      };
    default:
      return {
        label: "Qualification unavailable",
        tone: "neutral",
        detail: "Refresh to check the qualification."
      };
  }
}
