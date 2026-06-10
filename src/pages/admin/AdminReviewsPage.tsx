import { Check, ExternalLink, FileText, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button, EmptyState, Field, Textarea } from "../../components/ui";
import { formatDateTime } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

export function AdminReviewsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const opportunities = useAppStore((state) => state.opportunities);
  const submissions = useAppStore((state) => state.submissions);
  const reviews = useAppStore((state) => state.reviews);
  const workers = useAppStore((state) => state.workers);
  const reviewSubmission = useAppStore((state) => state.reviewSubmission);
  const completeOpportunity = useAppStore(
    (state) => state.completeOpportunity
  );
  const reviewable = opportunities.filter((job) =>
    ["submitted", "accepted", "needs_revision"].includes(job.status)
  );
  const selected = opportunities.find((job) => job.id === selectedId);
  const submission = submissions.find(
    (item) => item.opportunityId === selectedId
  );
  const worker = workers.find(
    (item) => item.id === selected?.assignedWorkerId
  );

  const decide = (decision: "accepted" | "needs_revision") => {
    if (!selected || !comment.trim()) return;
    reviewSubmission(selected.id, decision, comment);
    setComment("");
    setSelectedId(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${reviewable.length} item${reviewable.length === 1 ? "" : "s"} in the queue`}
        title="Reviews"
        description="Inspect delivery evidence, leave clear feedback, and complete approved work."
      />

      <div className="mt-7 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(16,42,67,0.05)]">
        {reviewable.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Review queue is clear"
              description="Submitted work will appear here for a quality decision."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviewable.map((job) => {
              const assigned = workers.find(
                (item) => item.id === job.assignedWorkerId
              );
              const jobSubmission = submissions.find(
                (item) => item.opportunityId === job.id
              );
              return (
                <article
                  key={job.id}
                  className="grid gap-4 p-5 lg:grid-cols-[1fr_0.55fr_0.55fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-[#102A43]">
                        {job.title}
                      </h2>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      {jobSubmission?.notes ??
                        "Work is awaiting worker resubmission."}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Worker
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#102A43]">
                      {assigned?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Last submission
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#102A43]">
                      {jobSubmission
                        ? formatDateTime(jobSubmission.submittedAt)
                        : "Pending"}
                    </p>
                  </div>
                  {job.status === "accepted" ? (
                    <Button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Complete this opportunity and create its pending payout?"
                          )
                        ) {
                          completeOpportunity(job.id);
                        }
                      }}
                      className="text-xs"
                    >
                      <Check size={16} /> Complete work
                    </Button>
                  ) : job.status === "submitted" ? (
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedId(job.id)}
                      className="text-xs"
                    >
                      Review submission
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-orange-700">
                      <RotateCcw size={15} /> Waiting for changes
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.title ?? "Submission"}
        description={`Submitted by ${worker?.name ?? "worker"}`}
        wide
      >
        {selected && submission && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#F7F8FA] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Submission notes
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {submission.notes}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {submission.fileName && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#102A43] shadow-sm">
                    <FileText size={15} /> {submission.fileName}
                  </span>
                )}
                {submission.link && (
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#2563EB] shadow-sm"
                  >
                    <ExternalLink size={15} /> Open submitted link
                  </a>
                )}
              </div>
            </div>
            <Field
              label="Review feedback"
              hint="Required for both approval and revision requests."
            >
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Explain what is strong or what must change."
              />
            </Field>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                disabled={!comment.trim()}
                onClick={() => decide("needs_revision")}
              >
                <RotateCcw size={16} /> Request changes
              </Button>
              <Button
                disabled={!comment.trim()}
                onClick={() => decide("accepted")}
              >
                <Check size={16} /> Approve work
              </Button>
            </div>
          </div>
        )}
        {selected && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Review history
            </p>
            <div className="mt-3 space-y-3">
              {reviews
                .filter((item) => item.opportunityId === selected.id)
                .map((review) => (
                  <div key={review.id} className="rounded-xl bg-slate-50 p-3">
                    <StatusBadge status={review.decision} />
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {review.comment}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
