import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  History
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
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
  Textarea
} from "../../components/ui";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

export function AssignmentPage() {
  const { assignmentId } = useParams();
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const assignment = useProfessionalStore((state) =>
    state.assignments.find((item) => item.id === assignmentId)
  );
  const job = useProfessionalStore((state) =>
    state.jobs.find((item) => item.id === assignment?.jobId)
  );
  const service = useProfessionalStore((state) =>
    state.services.find((item) => item.id === job?.serviceId)
  );
  const reviewer = useProfessionalStore((state) =>
    state.professionals.find(
      (item) => item.id === assignment?.leadReviewerId
    )
  );
  const allSubmissions = useProfessionalStore((state) => state.submissions);
  const allReviews = useProfessionalStore((state) => state.assignmentReviews);
  const users = useProfessionalStore((state) => state.users);
  const startAssignment = useProfessionalStore(
    (state) => state.startAssignment
  );
  const submitAssignment = useProfessionalStore(
    (state) => state.submitAssignment
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState("");
  const [checkedCriteria, setCheckedCriteria] = useState<string[]>([]);
  const { success } = useToast();

  if (
    !professional ||
    !assignment ||
    assignment.professionalId !== professional.id ||
    !job ||
    !service
  ) {
    return (
      <RouteShell
        title="Assignment not found"
        description="This Assignment does not exist or does not belong to your account."
      />
    );
  }

  const submissions = allSubmissions
    .filter((item) => item.assignmentId === assignmentId)
    .sort((left, right) => right.version - left.version);
  const reviews = allReviews
    .filter((item) => item.assignmentId === assignmentId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const latestReview = reviews[0];
  const isRevision = [
    "changes_requested_by_lead",
    "changes_requested_by_admin"
  ].includes(assignment.status);
  const submitLabel = isRevision ? "Submit revision" : "Submit work";
  const canSubmit =
    notes.trim() &&
    (!job.submissionEvidenceRequired || link.trim() || fileName.trim());

  const start = () => {
    startAssignment(assignment.id);
    success("Assignment started");
  };

  const submit = () => {
    if (!canSubmit) return;
    submitAssignment(assignment.id, { notes, link, fileName });
    setDrawerOpen(false);
    setNotes("");
    setLink("");
    setFileName("");
    success("Work submitted for review");
  };

  return (
    <div>
      <PageHeader
        eyebrow={service.name}
        title={job.title}
        description="Use this brief as the source of truth for your independent Assignment."
        actions={
          <>
            <Link
              to="/professional/work"
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
            >
              <ArrowLeft size={16} aria-hidden />
              Back to Work
            </Link>
            {assignment.status === "assigned" && (
              <Button onClick={start}>Start assignment</Button>
            )}
            {canSubmitAssignment(assignment.status) && (
              <Button onClick={() => setDrawerOpen(true)}>
                {submitLabel}
              </Button>
            )}
          </>
        }
      />

      {isRevision && latestReview && (
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-semibold text-orange-900">
            Changes requested by{" "}
            {users.find((item) => item.id === latestReview.reviewerUserId)
              ?.name ?? "Reviewer"}
          </p>
          <p className="mt-1 text-base leading-6 text-orange-800">
            {latestReview.comment}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <div className="space-y-5">
          <Section title="Assignment overview">
            <MetaList
              items={[
                {
                  label: "Status",
                  value: <StatusBadge status={assignment.status} />
                },
                {
                  label: "Agreed pay",
                  value: formatCurrency(assignment.agreedPay)
                },
                {
                  label: "Deadline",
                  value: formatDate(assignment.deadline)
                },
                {
                  label: "Reviewer",
                  value: reviewer?.name ?? "Direct to Admin"
                }
              ]}
            />
          </Section>

          <Section title="Objective and context">
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-[var(--ink)]">Objective</h3>
                <p className="mt-1 max-w-[72ch] text-base leading-7 text-[var(--muted)]">
                  {job.objective}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)]">
                  Client context
                </h3>
                <p className="mt-1 max-w-[72ch] text-base leading-7 text-[var(--muted)]">
                  {job.clientContext || "No additional client context."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)]">
                  Full description
                </h3>
                <p className="mt-1 max-w-[72ch] whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
                  {job.description}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Steps">
            <ol className="space-y-3">
              {job.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-base leading-6">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-[var(--blue)]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-[var(--ink)]">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Deliverables">
            <ul className="space-y-3">
              {job.deliverables.map((deliverable) => (
                <li
                  key={deliverable}
                  className="flex gap-3 text-base leading-6 text-[var(--ink)]"
                >
                  <FileText
                    size={18}
                    className="mt-1 shrink-0 text-[var(--blue)]"
                    aria-hidden
                  />
                  {deliverable}
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Acceptance criteria"
            description="Use this private checklist before submitting. It does not change the Admin brief."
          >
            <div className="space-y-3">
              {job.acceptanceCriteria.map((criterion) => {
                const checked = checkedCriteria.includes(criterion);
                return (
                  <label
                    key={criterion}
                    className="flex cursor-pointer gap-3 rounded-lg border border-[var(--border)] p-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setCheckedCriteria((current) =>
                          checked
                            ? current.filter((item) => item !== criterion)
                            : [...current, criterion]
                        )
                      }
                      className="mt-1 h-4 w-4 accent-[var(--blue)]"
                    />
                    <span className="text-base leading-6 text-[var(--ink)]">
                      {criterion}
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>

          <Section title="References">
            {job.references.length === 0 ? (
              <EmptyState
                title="No reference files"
                description="Everything required is included in the brief."
              />
            ) : (
              <RecordList label="Assignment references">
                {job.references.map((reference) => (
                  <div
                    key={reference.id}
                    className="flex items-center justify-between gap-4 p-4"
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
                    {reference.kind === "link" && reference.url && (
                      <a
                        href={reference.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--blue)]"
                      >
                        Open
                        <ExternalLink size={15} aria-hidden />
                      </a>
                    )}
                  </div>
                ))}
              </RecordList>
            )}
          </Section>
        </div>

        <Section
          title="Submission timeline"
          description="Every version and review stays attached to this Assignment."
        >
          {submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Your first submitted version will appear here."
            />
          ) : (
            <div className="space-y-5">
              {submissions.map((submission) => {
                const submissionReviews = reviews.filter(
                  (item) => item.submissionId === submission.id
                );
                return (
                  <div
                    key={submission.id}
                    className="border-l-2 border-blue-100 pl-4"
                  >
                    <div className="flex items-center gap-2">
                      <History
                        size={16}
                        className="text-[var(--blue)]"
                        aria-hidden
                      />
                      <p className="font-semibold text-[var(--ink)]">
                        Version {submission.version}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(submission.submittedAt)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      {submission.notes}
                    </p>
                    {(submission.link || submission.fileName) && (
                      <p className="mt-2 text-sm font-medium text-[var(--ink)]">
                        {submission.link ?? submission.fileName}
                      </p>
                    )}
                    {submissionReviews.map((review) => (
                      <div
                        key={review.id}
                        className="mt-3 rounded-lg bg-[var(--surface-subtle)] p-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {review.decision.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-[var(--ink)]">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={submitLabel}
        description={
          latestReview && isRevision
            ? `Latest feedback: ${latestReview.comment}`
            : "Submit one version with clear notes and the required evidence."
        }
      >
        <div className="space-y-5">
          <Field label="Submission notes">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Summarize what is complete and where to focus the review."
            />
          </Field>
          <Field
            label="Submission link"
            hint={
              job.submissionEvidenceRequired
                ? "A link or file name is required."
                : "Optional."
            }
          >
            <Input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field
            label="Submission file name"
            hint="Prototype metadata only; no file is uploaded."
          >
            <Input
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="deliverable.pdf"
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!canSubmit} onClick={submit}>
              <CheckCircle2 size={16} aria-hidden />
              {submitLabel}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function canSubmitAssignment(status: string) {
  return [
    "in_progress",
    "changes_requested_by_lead",
    "changes_requested_by_admin"
  ].includes(status);
}
