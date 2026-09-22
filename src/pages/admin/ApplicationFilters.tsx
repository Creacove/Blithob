import { FilterX } from "lucide-react";
import { Button, Field, Input, Select } from "../../components/ui";
import type { JobApplicationStatus } from "../../lib/publicListings";

const statusLabel: Record<JobApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
  converted: "Assigned"
};

export function ApplicationFilters({
  search,
  jobId,
  status,
  jobs,
  hasFilters,
  onSearchChange,
  onJobChange,
  onStatusChange,
  onClear
}: {
  search: string;
  jobId: string;
  status: "all" | JobApplicationStatus;
  jobs: Array<{ id: string; title: string }>;
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onJobChange: (value: string) => void;
  onStatusChange: (value: "all" | JobApplicationStatus) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_13rem_auto] lg:items-end">
        <Field label="Search applications">
          <Input
            aria-label="Search applications"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Candidate, email, job, or Service"
            className="w-full"
          />
        </Field>
        <Field label="Job">
          <Select
            aria-label="Filter applications by job"
            value={jobId}
            onChange={(event) => onJobChange(event.target.value)}
            className="w-full"
          >
            <option value="all">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            aria-label="Filter applications by status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as "all" | JobApplicationStatus)}
            className="w-full"
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        {hasFilters ? (
          <Button type="button" variant="quiet" onClick={onClear}>
            <FilterX size={15} aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
