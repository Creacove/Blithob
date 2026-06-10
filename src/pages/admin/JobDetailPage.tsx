import { ArrowLeft, Archive, Pencil, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
import { RecordTimeline } from "../../components/RecordTimeline";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  EmptyState,
  Field,
  Input,
  MetaList,
  RecordList,
  Section,
  Select
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

interface AssignmentDraft {
  selected: boolean;
  agreedPay: string;
  deadline: string;
  leadReviewerId: string;
}

export function JobDetailPage() {
  const { jobId } = useParams();
  const job = useProfessionalStore((state) =>
    state.jobs.find((item) => item.id === jobId)
  );
  const services = useProfessionalStore((state) => state.services);
  const assignments = useProfessionalStore((state) => state.assignments);
  const professionals = useProfessionalStore((state) => state.professionals);
  const activity = useProfessionalStore((state) => state.activity);
  const addAssignments = useProfessionalStore((state) => state.addAssignments);
  const archiveJob = useProfessionalStore((state) => state.archiveJob);
  const getJobStatus = useProfessionalStore(
    (state) => state.jobOperationalStatus
  );
  const getEligibleProfessionals = useProfessionalStore(
    (state) => state.eligibleProfessionals
  );
  const approvedServiceIdsFor = useProfessionalStore(
    (state) => state.approvedServiceIdsFor
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, AssignmentDraft>>({});
  const { success, error } = useToast();

  const jobAssignments = useMemo(
    () => assignments.filter((item) => item.jobId === jobId),
    [assignments, jobId]
  );

  if (!job) {
    return (
      <RouteShell
        title="Job not found"
        description="The requested Job record does not exist."
      />
    );
  }

  const service = services.find((item) => item.id === job.serviceId);
  const existingProfessionalIds = new Set(
    jobAssignments.map((item) => item.professionalId)
  );
  const eligible = getEligibleProfessionals(job.id).filter(
    (match) => !existingProfessionalIds.has(match.professional.id)
  );
  const qualifiedLeads = professionals.filter(
    (professional) =>
      professional.isLead &&
      professional.accountStatus === "active" &&
      approvedServiceIdsFor(professional.id).includes(job.serviceId)
  );
  const selectedCount = Object.values(drafts).filter(
    (draft) => draft.selected
  ).length;

  const submitAssignments = () => {
    const inputs = Object.entries(drafts)
      .filter(([, draft]) => draft.selected)
      .map(([professionalId, draft]) => ({
        professionalId,
        agreedPay: Number(draft.agreedPay),
        deadline: draft.deadline
          ? new Date(draft.deadline).toISOString()
          : job.deadline,
        leadReviewerId: draft.leadReviewerId || undefined
      }));
    if (
      inputs.length === 0 ||
      inputs.some((input) => !input.agreedPay || !input.deadline)
    ) {
      error("Set pay and deadline for every selected Professional");
      return;
    }
    addAssignments(job.id, inputs);
    setDrawerOpen(false);
    setDrafts({});
    success(
      `${inputs.length} Assignment${inputs.length === 1 ? "" : "s"} created`
    );
  };

  const confirmArchive = () => {
    archiveJob(job.id);
    setArchiveOpen(false);
    success("Job archived");
  };

  return (
    <div>
      <PageHeader
        title={job.title || "Untitled Job"}
        description={`${service?.name ?? "Unknown Service"} - ${job.publicationState === "draft" ? "Draft brief" : "Structured work brief"}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/jobs"
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
            >
              <ArrowLeft size={16} aria-hidden />
              Back to Jobs
            </Link>
            {job.publicationState !== "archived" && (
              <Link
                to={`/admin/jobs/${job.id}/edit`}
                className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
              >
                <Pencil size={16} aria-hidden />
                Edit brief
              </Link>
            )}
            {job.publicationState !== "archived" && (
              <Button variant="secondary" onClick={() => setArchiveOpen(true)}>
                <Archive size={16} aria-hidden />
                Archive
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-6 grid gap-5">
        <Section title="Job overview">
          <MetaList
            items={[
              {
                label: "Status",
                value: <StatusBadge status={getJobStatus(job.id)} />
              },
              { label: "Service", value: service?.name ?? "Unknown Service" },
              {
                label: "Deadline",
                value: job.deadline ? formatDate(job.deadline) : "Not set"
              },
              {
                label: "Publication",
                value:
                  job.publicationState[0].toUpperCase() +
                  job.publicationState.slice(1)
              }
            ]}
          />
        </Section>

        <Section title="Objective">
          <p className="max-w-[72ch] text-base leading-7 text-[var(--ink)]">
            {job.objective || "No objective added yet."}
          </p>
        </Section>

        {job.clientContext && (
          <Section title="Client context">
            <p className="max-w-[72ch] whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
              {job.clientContext}
            </p>
          </Section>
        )}

        <Section title="Full description">
          <p className="max-w-[72ch] whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
            {job.description || "No description added yet."}
          </p>
        </Section>

        <div className="grid gap-5 lg:grid-cols-3">
          <OrderedList title="Execution steps" items={job.steps} />
          <OrderedList title="Deliverables" items={job.deliverables} />
          <OrderedList title="Acceptance criteria" items={job.acceptanceCriteria} />
        </div>

        <Section title="References">
          {job.references.length === 0 ? (
            <p className="text-base text-[var(--muted)]">
              No reference material was attached.
            </p>
          ) : (
            <RecordList>
              {job.references.map((reference) => (
                <div
                  key={reference.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {reference.label}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {reference.kind === "link"
                        ? reference.url
                        : reference.fileName}
                    </p>
                  </div>
                  {reference.url && (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[var(--blue)]"
                    >
                      Open link
                    </a>
                  )}
                </div>
              ))}
            </RecordList>
          )}
        </Section>

        <Section
          title="Assignments"
          description="Every Professional has separate pay, deadline, reviewer, submissions, and completion."
          action={
            <Button
              onClick={() => setDrawerOpen(true)}
              disabled={job.publicationState !== "open"}
              title={
                job.publicationState === "draft"
                  ? "Publish the Job before assigning Professionals"
                  : undefined
              }
            >
              <Plus size={16} aria-hidden />
              Add professionals
            </Button>
          }
        >
          {jobAssignments.length === 0 ? (
            <EmptyState
              title="No Professionals assigned"
              description="Add approved Professionals when this brief is ready to distribute."
            />
          ) : (
            <RecordList>
              {jobAssignments.map((assignment) => {
                const professional = professionals.find(
                  (item) => item.id === assignment.professionalId
                );
                const reviewer = professionals.find(
                  (item) => item.id === assignment.leadReviewerId
                );
                return (
                  <Link
                    key={assignment.id}
                    to={`/admin/assignments/${assignment.id}`}
                    className="grid gap-3 px-4 py-4 transition hover:bg-[var(--surface-subtle)] sm:grid-cols-[minmax(12rem,1fr)_auto_auto_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        {professional?.name ?? "Unknown Professional"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {reviewer ? `Lead: ${reviewer.name}` : "Direct to Admin"}
                      </p>
                    </div>
                    <StatusBadge status={assignment.status} />
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      {formatCurrency(assignment.agreedPay)}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      Due {formatDate(assignment.deadline)}
                    </span>
                  </Link>
                );
              })}
            </RecordList>
          )}
        </Section>

        <Section title="Activity">
          <RecordTimeline
            items={activity
              .filter((item) => item.subject.includes(job.title))
              .map((item) => ({
                id: item.id,
                title: `${item.actor} ${item.action}`,
                description: item.subject,
                timestamp: item.createdAt
              }))}
          />
        </Section>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add professionals"
        description="Choose eligible people, then set each Assignment independently."
        width="wide"
      >
        {eligible.length === 0 ? (
          <EmptyState
            title="No eligible Professionals"
            description="Approve Service readiness or remove existing Assignments before trying again."
          />
        ) : (
          <div className="space-y-4">
            {eligible.map((match) => {
              const professional = match.professional;
              const draft = drafts[professional.id] ?? {
                selected: false,
                agreedPay: "",
                deadline: toLocalDateTime(job.deadline),
                leadReviewerId: ""
              };
              return (
                <div
                  key={professional.id}
                  className="rounded-xl border border-[var(--border)] p-4"
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={draft.selected}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [professional.id]: {
                            ...draft,
                            selected: event.target.checked
                          }
                        }))
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-base text-[var(--ink)]">
                          {professional.name}
                        </strong>
                        {professional.isLead && (
                          <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                            Lead
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        {match.reasons.join(" - ")}
                      </span>
                    </span>
                  </label>
                  {draft.selected && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <Field label="Agreed pay">
                        <Input
                          type="number"
                          min="1"
                          value={draft.agreedPay}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [professional.id]: {
                                ...draft,
                                agreedPay: event.target.value
                              }
                            }))
                          }
                        />
                      </Field>
                      <Field label="Assignment deadline">
                        <Input
                          type="datetime-local"
                          value={draft.deadline}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [professional.id]: {
                                ...draft,
                                deadline: event.target.value
                              }
                            }))
                          }
                        />
                      </Field>
                      <Field
                        label="Lead reviewer"
                        hint={
                          professional.isLead
                            ? "Leave empty to route this Lead's own work to Admin."
                            : "Leave empty for direct Admin review."
                        }
                      >
                        <Select
                          value={draft.leadReviewerId}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [professional.id]: {
                                ...draft,
                                leadReviewerId: event.target.value
                              }
                            }))
                          }
                        >
                          <option value="">Direct to Admin</option>
                          {qualifiedLeads
                            .filter((lead) => lead.id !== professional.id)
                            .map((lead) => (
                              <option key={lead.id} value={lead.id}>
                                {lead.name}
                              </option>
                            ))}
                        </Select>
                      </Field>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[var(--border)] bg-white pt-4">
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitAssignments} disabled={selectedCount === 0}>
                <Users size={16} aria-hidden />
                Create {selectedCount || ""} Assignment
                {selectedCount === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={confirmArchive}
        title="Archive Job?"
        description="The brief remains visible, but no new Assignments can be added."
        confirmLabel="Archive Job"
        tone="danger"
      />
    </div>
  );
}

function OrderedList({ title, items }: { title: string; items: string[] }) {
  return (
    <Section title={title}>
      {items.length === 0 ? (
        <p className="text-base text-[var(--muted)]">Nothing added yet.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                {index + 1}
              </span>
              <span className="text-base leading-6 text-[var(--muted)]">
                {item}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function toLocalDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
