import { ChevronRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import {
  EmptyState,
  Input,
  RecordList,
  Select,
  Toolbar
} from "../../components/ui";
import type { JobOperationalStatus } from "../../domain/model";
import { formatDate } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

export function JobsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const jobs = useProfessionalStore((state) => state.jobs);
  const services = useProfessionalStore((state) => state.services);
  const assignments = useProfessionalStore((state) => state.assignments);
  const getJobStatus = useProfessionalStore(
    (state) => state.jobOperationalStatus
  );

  const filtered = jobs.filter((job) => {
    const status = getJobStatus(job.id);
    const matchesQuery = [job.title, job.objective, job.description]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    return (
      matchesQuery &&
      (statusFilter === "all" || status === statusFilter) &&
      (serviceFilter === "all" || job.serviceId === serviceFilter)
    );
  });

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Create complete work briefs and track each Professional through an independent Assignment."
        actions={
          <Link
            to="/admin/jobs/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[var(--blue)] px-4 text-sm font-semibold text-white hover:bg-[var(--blue-hover)]"
          >
            <Plus size={16} aria-hidden="true" />
            Create job
          </Link>
        }
      />

      <Toolbar className="mt-6" label="Job filters">
        <label className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Jobs"
            className="pl-10"
          />
        </label>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="sm:w-44"
        >
          <option value="all">All statuses</option>
          {(["draft", "open", "active", "complete", "archived"] as const).map(
            (status) => (
              <option key={status} value={status}>
                {status[0].toUpperCase() + status.slice(1)}
              </option>
            )
          )}
        </Select>
        <Select
          aria-label="Filter by Service"
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="sm:w-56"
        >
          <option value="all">All Services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
      </Toolbar>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No Jobs found"
            description="Adjust the filters or create a new structured Job brief."
          />
        </div>
      ) : (
        <RecordList className="mt-4" label="Job directory">
          {filtered.map((job) => {
            const jobAssignments = assignments.filter(
              (assignment) => assignment.jobId === job.id
            );
            const completed = jobAssignments.filter(
              (assignment) => assignment.status === "completed"
            ).length;
            const actionCount = jobAssignments.filter((assignment) =>
              ["waiting_for_admin", "approved"].includes(assignment.status)
            ).length;
            const service = services.find(
              (item) => item.id === job.serviceId
            );
            return (
              <JobRow
                key={job.id}
                id={job.id}
                title={job.title || "Untitled Job"}
                service={service?.name ?? "Unknown Service"}
                status={getJobStatus(job.id)}
                progress={`${completed} of ${jobAssignments.length} completed`}
                deadline={job.deadline}
                actionCount={actionCount}
              />
            );
          })}
        </RecordList>
      )}
    </div>
  );
}

function JobRow({
  id,
  title,
  service,
  status,
  progress,
  deadline,
  actionCount
}: {
  id: string;
  title: string;
  service: string;
  status: JobOperationalStatus;
  progress: string;
  deadline: string;
  actionCount: number;
}) {
  return (
    <Link
      to={`/admin/jobs/${id}`}
      aria-label={`Open ${title}`}
      className="grid gap-4 px-4 py-4 transition hover:bg-[var(--surface-subtle)] sm:grid-cols-[minmax(14rem,1fr)_auto] sm:items-center sm:px-5 xl:grid-cols-[minmax(15rem,1.25fr)_auto_minmax(22rem,1fr)_auto]"
    >
      <span className="min-w-0">
        <strong className="block truncate text-base font-semibold text-[var(--ink)]">
          {title}
        </strong>
        <span className="mt-1 block text-sm text-[var(--muted)]">
          {service}
        </span>
      </span>
      <StatusBadge status={status} />
      <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
        <span className="font-medium">{progress}</span>
        <span>
          {deadline ? `Due ${formatDate(deadline)}` : "No deadline"}
        </span>
        <span
          className={actionCount > 0 ? "font-semibold text-orange-700" : ""}
        >
          {actionCount} action{actionCount === 1 ? "" : "s"}
        </span>
      </span>
      <ChevronRight size={18} className="text-[var(--muted)]" aria-hidden />
    </Link>
  );
}
