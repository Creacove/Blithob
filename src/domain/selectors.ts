import type {
  DemoState,
  JobOperationalStatus,
  Professional
} from "./model";

export function approvedServiceIdsFor(
  state: DemoState,
  professionalId: string
): string[] {
  return state.serviceEnrolments
    .filter(
      (item) =>
        item.professionalId === professionalId && item.status === "approved"
    )
    .map((item) => item.serviceId);
}

export function jobOperationalStatus(
  state: DemoState,
  jobId: string
): JobOperationalStatus {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job || job.publicationState === "draft") return "draft";
  if (job.publicationState === "archived") return "archived";
  const assignments = state.assignments.filter((item) => item.jobId === jobId);
  if (assignments.length === 0) return "open";
  if (
    assignments.every((item) =>
      ["completed", "cancelled"].includes(item.status)
    ) &&
    assignments.some((item) => item.status === "completed")
  ) {
    return "complete";
  }
  return "active";
}

export function assignmentReviewDestination(
  state: DemoState,
  assignmentId: string
): "lead" | "admin" {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (
    !assignment?.leadReviewerId ||
    assignment.leadReviewerId === assignment.professionalId
  ) {
    return "admin";
  }
  return "lead";
}

export function latestSubmissionFor(
  state: DemoState,
  assignmentId: string
) {
  return state.submissions
    .filter((item) => item.assignmentId === assignmentId)
    .sort((a, b) => b.version - a.version)[0];
}

export interface ProfessionalMatch {
  professional: Professional;
  activeAssignmentCount: number;
  score: number;
  reasons: string[];
}

export function rankEligibleProfessionals(
  state: DemoState,
  jobId: string
): ProfessionalMatch[] {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return [];
  return state.professionals
    .filter(
      (professional) =>
        professional.accountStatus === "active" &&
        approvedServiceIdsFor(state, professional.id).includes(job.serviceId)
    )
    .map((professional) => {
      const activeAssignmentCount = state.assignments.filter(
        (assignment) =>
          assignment.professionalId === professional.id &&
          !["completed", "cancelled"].includes(assignment.status)
      ).length;
      return {
        professional,
        activeAssignmentCount,
        score:
          100 -
          activeAssignmentCount * 20 +
          professional.completedAssignmentCount,
        reasons: [
          `Approved for ${
            state.services.find((item) => item.id === job.serviceId)?.name ??
            "this service"
          }`,
          `${activeAssignmentCount} active assignment${
            activeAssignmentCount === 1 ? "" : "s"
          }`,
          `${professional.completedAssignmentCount} completed assignment${
            professional.completedAssignmentCount === 1 ? "" : "s"
          }`
        ]
      };
    })
    .sort(
      (left, right) =>
        left.activeAssignmentCount - right.activeAssignmentCount ||
        right.professional.completedAssignmentCount -
          left.professional.completedAssignmentCount
    );
}
