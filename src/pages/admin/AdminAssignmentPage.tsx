import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MoreHorizontal,
  XCircle
} from "lucide-react";
import { useState } from "react";
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
  EmptyState,
  Field,
  MetaList,
  RecordList,
  Section,
  Select,
  Textarea
} from "../../components/ui";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

export function AdminAssignmentPage() {
  const { assignmentId } = useParams();
  const assignment = useProfessionalStore((state) =>
    state.assignments.find((item) => item.id === assignmentId)
  );
  const job = useProfessionalStore((state) =>
    state.jobs.find((item) => item.id === assignment?.jobId)
  );
  const professional = useProfessionalStore((state) =>
    state.professionals.find(
      (item) => item.id === assignment?.professionalId
    )
  );
  const reviewer = useProfessionalStore((state) =>
    state.professionals.find(
      (item) => item.id === assignment?.leadReviewerId
    )
  );
  const submissions = useProfessionalStore((state) => state.submissions);
  const reviews = useProfessionalStore((state) => state.assignmentReviews);
  const users = useProfessionalStore((state) => state.users);
  const payment = useProfessionalStore((state) =>
    state.payments.find((item) => item.assignmentId === assignmentId)
  );
  const activity = useProfessionalStore((state) => state.activity);
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const reviewAssignment = useProfessionalStore(
    (state) => state.reviewAssignment
  );
  const completeAssignment = useProfessionalStore(
    (state) => state.completeAssignment
  );
  const cancelAssignment = useProfessionalStore(
    (state) => state.cancelAssignment
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [decision, setDecision] = useState<"approved" | "changes_requested">(
    "approved"
  );
  const [comment, setComment] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const { success, error } = useToast();

  if (!assignment || !job || !professional) {
    return (
      <RouteShell
        title="Assignment not found"
        description="The requested Assignment record does not exist."
      />
    );
  }

  const assignmentSubmissions = submissions
    .filter((item) => item.assignmentId === assignment.id)
    .sort((left, right) => right.version - left.version);
  const assignmentReviews = reviews
    .filter((item) => item.assignmentId === assignment.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const submitReview = async () => {
    if (!comment.trim() || !currentUser) {
      error("Add a clear review comment");
      return;
    }
    try {
      await reviewAssignment({
        assignmentId: assignment.id,
        reviewerUserId: currentUser.id,
        reviewerType: "admin",
        decision,
        comment
      });
      setReviewOpen(false);
      setComment("");
      success(decision === "approved" ? "Assignment approved" : "Changes requested");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Assignment review could not be saved");
    }
  };

  const confirmComplete = async () => {
    try {
      await completeAssignment(assignment.id);
      setCompleteOpen(false);
      success("Assignment completed and payment created");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Assignment could not be completed");
    }
  };

  const confirmCancel = async () => {
    if (!cancellationReason.trim()) {
      error("Add a short cancellation reason");
      return;
    }
    try {
      await cancelAssignment(assignment.id, cancellationReason);
      setCancelOpen(false);
      setCancellationReason("");
      success("Assignment cancelled");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Assignment could not be cancelled");
    }
  };

  return (
    <div>
      <PageHeader
        title={job.title}
        description={`Assignment for ${professional.name}`}
        actions={
          <Link
            to={`/admin/jobs/${job.id}`}
            className="mobile-header-back inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Job
          </Link>
        }
      />

      <div className="mt-6 grid gap-5">
        <Section
          title="Assignment overview"
          action={
            <div className="flex flex-wrap gap-2">
              {assignment.status === "waiting_for_admin" && (
                <Button onClick={() => setReviewOpen(true)}>
                  Review submission
                </Button>
              )}
              {assignment.status === "approved" && (
                <Button onClick={() => setCompleteOpen(true)}>
                  <CheckCircle2 size={16} aria-hidden />
                  Complete assignment
                </Button>
              )}
              <Button
                className="hidden md:inline-flex"
                variant="secondary"
                disabled={["completed", "cancelled"].includes(assignment.status)}
                onClick={() => setCancelOpen(true)}
              >
                <XCircle size={16} aria-hidden />
                Cancel assignment
              </Button>
              {!["completed", "cancelled"].includes(assignment.status) && (
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
        >
          <MetaList
            items={[
              { label: "Professional", value: professional.name },
              {
                label: "Status",
                value: <StatusBadge status={assignment.status} />
              },
              {
                label: "Agreed pay",
                value: formatCurrency(assignment.agreedPay)
              },
              { label: "Deadline", value: formatDate(assignment.deadline) },
              {
                label: "Reviewer",
                value: reviewer ? reviewer.name : "Direct to Admin"
              },
              {
                label: "Created",
                value: formatDate(assignment.createdAt)
              }
            ]}
          />
        </Section>

        <Section title="Inherited Job brief" mobileDisclosure="collapsed">
          <div className="grid gap-5">
            <BriefBlock label="Objective" value={job.objective} />
            {job.clientContext && (
              <BriefBlock label="Client context" value={job.clientContext} />
            )}
            <BriefBlock label="Full description" value={job.description} />
            <div className="grid gap-5 md:grid-cols-3">
              <BriefList label="Execution steps" items={job.steps} />
              <BriefList label="Deliverables" items={job.deliverables} />
              <BriefList
                label="Acceptance criteria"
                items={job.acceptanceCriteria}
              />
            </div>
          </div>
        </Section>

        <Section title="Submission versions">
          {assignmentSubmissions.length === 0 ? (
            <EmptyState
              title="No submissions"
              description="The Professional has not submitted this Assignment yet."
            />
          ) : (
            <RecordList>
              {assignmentSubmissions.map((submission) => (
                <div key={submission.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                      <FileText size={16} aria-hidden />
                      Version {submission.version}
                    </p>
                    <time className="text-sm text-[var(--muted)]">
                      {formatDateTime(submission.submittedAt)}
                    </time>
                  </div>
                  <p className="mt-2 max-w-[72ch] text-base leading-6 text-[var(--muted)]">
                    {submission.notes}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[var(--blue)]">
                    {submission.link && (
                      <a href={submission.link} target="_blank" rel="noreferrer">
                        Open submitted link
                      </a>
                    )}
                    {submission.fileName && <span>{submission.fileName}</span>}
                  </div>
                </div>
              ))}
            </RecordList>
          )}
        </Section>

        <Section title="Review decisions" mobileDisclosure="collapsed">
          {assignmentReviews.length === 0 ? (
            <p className="text-base text-[var(--muted)]">
              No review decisions have been recorded.
            </p>
          ) : (
            <RecordTimeline
              items={assignmentReviews.map((review) => ({
                id: review.id,
                title:
                  review.decision === "changes_requested"
                    ? "Changes requested"
                    : review.decision === "certified"
                      ? "Certified by Lead"
                      : "Approved by Admin",
                description: review.comment,
                actor:
                  users.find((item) => item.id === review.reviewerUserId)
                    ?.name ?? "Reviewer",
                timestamp: review.createdAt,
                tone:
                  review.decision === "changes_requested"
                    ? "attention"
                    : "positive"
              }))}
            />
          )}
        </Section>

        <Section title="Payment">
          {payment ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StatusBadge status={payment.status} />
                <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
              <Link
                to={`/admin/payments/${payment.id}`}
                className="text-sm font-semibold text-[var(--blue)]"
              >
                Open payment record
              </Link>
            </div>
          ) : (
            <p className="text-base text-[var(--muted)]">
              Payment is created only after Admin completes this Assignment.
            </p>
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
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Review submission"
        description="Approve this Professional's latest version or return it with specific changes."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview}>Record decision</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Decision">
            <Select
              value={decision}
              onChange={(event) =>
                setDecision(
                  event.target.value as "approved" | "changes_requested"
                )
              }
            >
              <option value="approved">Approve</option>
              <option value="changes_requested">Request changes</option>
            </Select>
          </Field>
          <Field label="Review comment">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Explain the decision clearly."
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={confirmComplete}
        title="Complete Assignment?"
        description="This completes only this Professional's Assignment and creates a payment record for the agreed amount."
        confirmLabel="Complete assignment"
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel Assignment?"
        description="The Professional will see the reason and this Assignment will stop progressing."
        confirmLabel="Cancel assignment"
        tone="danger"
      >
        <Field label="Cancellation reason">
          <Textarea
            value={cancellationReason}
            onChange={(event) => setCancellationReason(event.target.value)}
            className="min-h-24"
          />
        </Field>
      </ConfirmDialog>

      <FilterSheet
        open={mobileActionsOpen}
        title="Assignment actions"
        onClose={() => setMobileActionsOpen(false)}
      >
        <button
          type="button"
          onClick={() => {
            setMobileActionsOpen(false);
            setCancelOpen(true);
          }}
          className="inline-flex min-h-12 w-full items-center gap-3 rounded-[10px] px-3 text-left font-semibold text-red-700 hover:bg-red-50"
        >
          <XCircle size={17} aria-hidden />
          Cancel assignment
        </button>
      </FilterSheet>
    </div>
  );
}

function BriefBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--ink)]">{label}</h3>
      <p className="mt-1 max-w-[72ch] whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
        {value || "Not provided."}
      </p>
    </div>
  );
}

function BriefList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--ink)]">{label}</h3>
      <ol className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">{index + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}
