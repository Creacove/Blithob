import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import {
  DesktopRecordRow,
  EmptyState,
  RecordList,
  ResponsiveRecord,
  Select
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import type { AssignmentStatus } from "../../domain/model";
import { formatCurrency, formatDate } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

type WorkFilter = "needs_action" | "in_progress" | "waiting" | "completed";

const filters: Array<{ id: WorkFilter; label: string }> = [
  { id: "needs_action", label: "Needs action" },
  { id: "in_progress", label: "In progress" },
  { id: "waiting", label: "Waiting for review" },
  { id: "completed", label: "Completed" }
];

export function WorkPage() {
  const [filter, setFilter] = useState<WorkFilter>("in_progress");
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const services = useProfessionalStore((state) => state.services);
  const professionals = useProfessionalStore((state) => state.professionals);
  const submissions = useProfessionalStore((state) => state.submissions);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const ownAssignments = useMemo(
    () =>
      professional
        ? assignments
            .filter((item) => item.professionalId === professional.id)
            .sort((left, right) => left.deadline.localeCompare(right.deadline))
        : [],
    [assignments, professional]
  );
  const visible = ownAssignments.filter((item) =>
    statusesFor(filter).includes(item.status)
  );

  return (
    <div>
      <PageHeader
        title="Work"
        description="Jobs you have been hired for, with the brief, deadline, pay, and feedback."
      />
      <SummaryBand
        className="mt-6"
        items={filters.map((item) => ({
          label: item.label,
          value: ownAssignments.filter((assignment) =>
            statusesFor(item.id).includes(assignment.status)
          ).length,
          tone: item.id === "needs_action" ? "attention" : "default",
          mobilePriority:
            item.id === "needs_action" || item.id === "in_progress"
              ? "primary"
              : "secondary"
        }))}
      />

      <div className="mt-5 md:hidden">
        <label>
          <span className="mb-2 block text-sm font-medium text-[var(--ink)]">
            Show work
          </span>
          <Select
            aria-label="Work filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as WorkFilter)}
          >
            {filters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div
        role="tablist"
        aria-label="Work filters"
        className="mt-6 hidden gap-1 rounded-xl border border-[var(--border)] bg-white p-1 md:flex"
      >
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold transition ${
              filter === item.id
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--surface-subtle)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={`No ${filters
              .find((item) => item.id === filter)
              ?.label.toLowerCase()} work`}
            description="Hired jobs will move between these views as you work and receive feedback."
          />
        </div>
      ) : (
        isMobile ? (
          <div className="mt-4 grid gap-3" aria-label="Assignment inbox mobile">
            {visible.map((assignment) => {
              const job = jobs.find((item) => item.id === assignment.jobId);
              const service = services.find(
                (item) => item.id === job?.serviceId
              );
              return (
                <ResponsiveRecord
                  key={assignment.id}
                  to={`/professional/work/${assignment.id}`}
                  ariaLabel={`Open ${job?.title ?? "Assignment"} mobile`}
                  title={job?.title ?? "Assignment"}
                  subtitle={service?.name ?? "Service"}
                  status={<StatusBadge status={assignment.status} />}
                  facts={[
                    {
                      label: "Pay",
                      value: formatCurrency(assignment.agreedPay)
                    },
                    {
                      label: "Next step",
                      value: workNextAction(
                        assignment.status,
                        submissions.some((submission) => submission.assignmentId === assignment.id)
                      )
                    }
                  ]}
                  details={<span>Due {formatDate(assignment.deadline)}</span>}
                />
              );
            })}
          </div>
        ) : (
          <RecordList className="mt-4" label="Assignment inbox">
          {visible.map((assignment) => {
            const job = jobs.find((item) => item.id === assignment.jobId);
            const service = services.find(
              (item) => item.id === job?.serviceId
            );
            const reviewer = professionals.find(
              (item) => item.id === assignment.leadReviewerId
            );
            const hasSubmission = submissions.some(
              (submission) => submission.assignmentId === assignment.id
            );
            return (
              <DesktopRecordRow
                key={assignment.id}
                to={`/professional/work/${assignment.id}`}
                ariaLabel={`Open ${job?.title ?? "Assignment"}`}
                columns="minmax(14rem,1.2fr) 10.5rem 7.5rem 9.5rem minmax(10rem,0.9fr) minmax(10rem,0.75fr) 1.25rem"
                className="gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">
                    {job?.title ?? "Assignment"}
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    {service?.name ?? "Service"}
                  </p>
                </div>
                <div className="min-w-0">
                  <StatusBadge status={assignment.status} />
                </div>
                <p className="font-semibold text-[var(--ink)]">
                  {formatCurrency(assignment.agreedPay)}
                </p>
                <p className="whitespace-nowrap text-sm text-[var(--muted)]">
                  Due {formatDate(assignment.deadline)}
                </p>
                <p className={`truncate text-sm font-semibold ${assignment.status.includes("changes_requested") ? "text-orange-700" : "text-[var(--ink)]"}`}>
                  {workNextAction(assignment.status, hasSubmission)}
                </p>
                <p className="truncate text-sm text-[var(--muted)]">
                  Reviewer: {reviewer?.name ?? "Direct to Admin"}
                </p>
                <ArrowRight
                  size={18}
                  className="text-[var(--blue)]"
                  aria-hidden
                />
              </DesktopRecordRow>
            );
          })}
          </RecordList>
        )
      )}
    </div>
  );
}

function workNextAction(status: AssignmentStatus, hasSubmission: boolean) {
  if (status === "assigned") return "Start work";
  if (status === "changes_requested_by_lead" || status === "changes_requested_by_admin") return "Submit revision";
  if (status === "waiting_for_lead" || status === "waiting_for_admin") return hasSubmission ? "Waiting for review" : "Submit work";
  if (status === "approved") return "Complete work";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Submit work";
}

function statusesFor(filter: WorkFilter): AssignmentStatus[] {
  const groups: Record<WorkFilter, AssignmentStatus[]> = {
    needs_action: [
      "assigned",
      "changes_requested_by_lead",
      "changes_requested_by_admin"
    ],
    in_progress: ["in_progress"],
    waiting: ["waiting_for_lead", "waiting_for_admin", "approved"],
    completed: ["completed", "cancelled"]
  };
  return groups[filter];
}
