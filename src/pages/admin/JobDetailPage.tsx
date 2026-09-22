import {
  ArrowLeft,
  Archive,
  MoreHorizontal,
  Pencil,
  Plus,
  Users
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Drawer } from "../../components/Drawer";
import { FilterSheet } from "../../components/FilterSheet";
import { PageHeader } from "../../components/PageHeader";
import { RecordTimeline } from "../../components/RecordTimeline";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  DesktopRecordRow,
  EmptyState,
  Field,
  Input,
  MetaList,
  RecordList,
  Section,
  Select
} from "../../components/ui";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

interface AssignmentDraft {
  selected: boolean;
  agreedPay: string;
  deadline: string;
  leadReviewerId: string;
}

function assignmentActionLabel(
  status: Parameters<typeof StatusBadge>[0]["status"],
  hasSubmission: boolean
) {
  if (status === "waiting_for_admin" && hasSubmission) return "Review submission";
  if (status === "approved") return "Complete work";
  if (status === "changes_requested_by_admin") return "View changes";
  if (status === "waiting_for_lead") return "View review";
  return "Open work";
}

export function JobDetailPage() {
  const { jobId } = useParams();
  const job = useProfessionalStore((state) =>
    state.jobs.find((item) => item.id === jobId)
  );
  const services = useProfessionalStore((state) => state.services);
  const assignments = useProfessionalStore((state) => state.assignments);
  const professionals = useProfessionalStore((state) => state.professionals);
  const submissions = useProfessionalStore((state) => state.submissions);
  const assignmentReviews = useProfessionalStore((state) => state.assignmentReviews);
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
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
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

  const submitAssignments = async () => {
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
      error("Set pay and deadline for every selected person");
      return;
    }
    try {
      await addAssignments(job.id, inputs);
      setDrawerOpen(false);
      setDrafts({});
      success(
        `${inputs.length} ${inputs.length === 1 ? "person" : "people"} hired`
      );
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "People could not be hired");
    }
  };

  const confirmArchive = async () => {
    try {
      await archiveJob(job.id);
      setArchiveOpen(false);
      success("Job archived");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Job could not be archived");
    }
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
              className="mobile-header-back inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
            >
              <ArrowLeft size={16} aria-hidden />
              Back to Jobs
            </Link>
            <Link
              to={`/admin/applications?jobId=${job.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[var(--blue)] px-4 text-sm font-semibold text-white hover:bg-[var(--blue-hover)]"
            >
              <Users size={16} aria-hidden />
              View applicants
            </Link>
            {job.publicationState !== "archived" && (
              <Link
                to={`/admin/jobs/${job.id}/edit`}
                className="hidden min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] md:inline-flex"
              >
                <Pencil size={16} aria-hidden />
                Edit brief
              </Link>
            )}
            {job.publicationState !== "archived" && (
              <Button
                className="hidden md:inline-flex"
                variant="secondary"
                onClick={() => setArchiveOpen(true)}
              >
                <Archive size={16} aria-hidden />
                Archive
              </Button>
            )}
            {job.publicationState !== "archived" && (
              <Button
                className="md:hidden"
                variant="secondary"
                onClick={() => setMobileActionsOpen(true)}
              >
                <MoreHorizontal size={17} aria-hidden />
                More
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
          <Section title="Client context" mobileDisclosure="collapsed">
            <p className="max-w-[72ch] whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
              {job.clientContext}
            </p>
          </Section>
        )}

        <Section title="Full description" mobileDisclosure="collapsed">
          <p className="max-w-[72ch] whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
            {job.description || "No description added yet."}
          </p>
        </Section>

        <div className="grid gap-5 lg:grid-cols-3">
          <OrderedList title="Execution steps" items={job.steps} />
          <OrderedList title="Deliverables" items={job.deliverables} />
          <OrderedList title="Acceptance criteria" items={job.acceptanceCriteria} />
        </div>

        <Section title="References" mobileDisclosure="collapsed">
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
          title="Hired people"
          description="Each person has separate pay, deadline, feedback, and completion."
          action={
            <Button
              onClick={() => setDrawerOpen(true)}
              disabled={job.publicationState !== "open"}
              title={
                job.publicationState === "draft"
                  ? "Publish the job before hiring people"
                  : undefined
              }
            >
              <Plus size={16} aria-hidden />
              Hire qualified people
            </Button>
          }
        >
          {jobAssignments.length === 0 ? (
            <EmptyState
              title="No one hired yet"
              description="Review applicants or hire someone who is already qualified."
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
                const latestSubmission = submissions
                  .filter((submission) => submission.assignmentId === assignment.id)
                  .sort((left, right) => right.version - left.version)[0];
                const latestReview = assignmentReviews
                  .filter((review) => review.assignmentId === assignment.id)
                  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
                return (
                  <DesktopRecordRow
                    key={assignment.id}
                    columns="minmax(12rem,1fr) 10.5rem minmax(15rem,1.1fr) minmax(10rem,.75fr)"
                    layoutAt="lg"
                    className="gap-3"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/admin/assignments/${assignment.id}`}
                        className="block truncate font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
                      >
                        {professional?.name ?? "Unknown Professional"}
                      </Link>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        {reviewer ? `Lead: ${reviewer.name}` : "Direct to Admin"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <StatusBadge status={assignment.status} />
                    </div>
                    <div className="min-w-0 text-sm">
                      {latestSubmission ? (
                        <p className="font-semibold text-[var(--ink)]">
                          Version {latestSubmission.version} submitted
                        </p>
                      ) : (
                        <p className="font-semibold text-[var(--muted)]">
                          No submission yet
                        </p>
                      )}
                      <p className="mt-1 truncate text-[var(--muted)]">
                        {latestSubmission
                          ? formatDateTime(latestSubmission.submittedAt)
                          : "Waiting for the Professional"}
                        {latestReview?.decision === "changes_requested" && " · Changes requested"}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
                      <span>
                        <span className="block font-semibold text-[var(--ink)]">
                          {formatCurrency(assignment.agreedPay)}
                        </span>
                        <span className="mt-1 block whitespace-nowrap text-[var(--muted)]">
                          Due {formatDate(assignment.deadline)}
                        </span>
                      </span>
                      <Link
                        to={`/admin/assignments/${assignment.id}`}
                        className="font-semibold text-[var(--blue)] hover:underline"
                      >
                        {assignmentActionLabel(assignment.status, Boolean(latestSubmission))}
                      </Link>
                    </div>
                  </DesktopRecordRow>
                );
              })}
            </RecordList>
          )}
        </Section>

        <Section title="Activity" mobileDisclosure="collapsed">
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
        title="Hire qualified people"
        description="Choose people, then confirm each person’s pay and deadline."
        width="wide"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAssignments} disabled={selectedCount === 0}>
              <Users size={16} aria-hidden />
              Hire {selectedCount || ""}
              {selectedCount === 1 ? "" : "s"}
            </Button>
          </>
        }
      >
        {eligible.length === 0 ? (
          <EmptyState
            title="No qualified people available"
            description="Review applicants or approve a qualification first."
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
                      <Field label="Work deadline">
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
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={confirmArchive}
        title="Archive Job?"
        description="The brief remains visible, but no one new can be hired."
        confirmLabel="Archive Job"
        tone="danger"
      />

      <FilterSheet
        open={mobileActionsOpen}
        title="Job actions"
        onClose={() => setMobileActionsOpen(false)}
      >
        <div className="grid gap-2">
          <Link
            to={`/admin/jobs/${job.id}/edit`}
            onClick={() => setMobileActionsOpen(false)}
            className="inline-flex min-h-12 items-center gap-3 rounded-[10px] px-3 font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <Pencil size={17} aria-hidden />
            Edit brief
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileActionsOpen(false);
              setArchiveOpen(true);
            }}
            className="inline-flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-left font-semibold text-red-700 hover:bg-red-50"
          >
            <Archive size={17} aria-hidden />
            Archive Job
          </button>
        </div>
      </FilterSheet>
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
