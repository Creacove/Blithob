import type { JobApplicationStatus, PublicApplication } from "../../lib/publicListings";

export type ApplicationAction =
  | "start_review"
  | "shortlist"
  | "view_readiness"
  | "create_assignment"
  | "open_assignment"
  | "view_application";

const statusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
  converted: "Assigned"
};

export function applicationStatusLabel(status: JobApplicationStatus) {
  return statusLabels[status];
}

export function primaryAction(application: PublicApplication): ApplicationAction {
  switch (application.status) {
    case "submitted":
      return "start_review";
    case "under_review":
      return "shortlist";
    case "shortlisted":
      return application.readyForAssignment === true
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
    return `${completed} of ${total} readiness requirements complete.`;
  }
  return "Candidate is completing readiness.";
}

export function readinessCopy(application: PublicApplication): {
  label: string;
  tone: "neutral" | "attention" | "success";
  detail: string;
} {
  switch (application.readinessStatus) {
    case "approved":
      return {
        label: "Ready to assign",
        tone: "success",
        detail: "Service readiness is approved."
      };
    case "in_progress":
      return {
        label: "Readiness in progress",
        tone: "attention",
        detail: progressDetail(application)
      };
    case "waiting_for_lead":
    case "waiting_for_admin":
      return {
        label: "Readiness submitted",
        tone: "attention",
        detail: "Readiness is waiting for review."
      };
    case "changes_requested_by_lead":
    case "changes_requested_by_admin":
      return {
        label: "Changes requested",
        tone: "attention",
        detail: "Candidate needs to update readiness."
      };
    case "paused":
      return {
        label: "Readiness paused",
        tone: "neutral",
        detail: "Readiness must be resumed before assignment."
      };
    case "not_started":
      return {
        label: "Readiness not started",
        tone: "attention",
        detail: "Candidate has not started readiness."
      };
    default:
      return {
        label: "Readiness unavailable",
        tone: "neutral",
        detail: "Refresh to check readiness."
      };
  }
}

