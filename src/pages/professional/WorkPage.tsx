import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import {
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
        description="Every Assignment has its own brief, deadline, reviewer, submission history, and pay."
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
            Show assignments
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
              ?.label.toLowerCase()} Assignments`}
            description="Assignments will move between these views as you work and receive feedback."
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
                      label: "Deadline",
                      value: formatDate(assignment.deadline)
                    }
                  ]}
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
            return (
              <Link
                key={assignment.id}
                to={`/professional/work/${assignment.id}`}
                className="grid gap-3 px-4 py-4 transition hover:bg-[var(--surface-subtle)] sm:px-5 xl:grid-cols-[minmax(14rem,1.2fr)_minmax(9rem,0.7fr)_auto_auto_minmax(10rem,0.7fr)_auto] xl:items-center"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {job?.title ?? "Assignment"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {service?.name ?? "Service"}
                  </p>
                </div>
                <StatusBadge status={assignment.status} />
                <p className="font-semibold text-[var(--ink)]">
                  {formatCurrency(assignment.agreedPay)}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Due {formatDate(assignment.deadline)}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Reviewer: {reviewer?.name ?? "Direct to Admin"}
                </p>
                <ArrowRight
                  size={18}
                  className="text-[var(--blue)]"
                  aria-hidden
                />
              </Link>
            );
          })}
          </RecordList>
        )
      )}
    </div>
  );
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
