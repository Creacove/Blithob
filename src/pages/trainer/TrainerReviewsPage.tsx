import { Check, ExternalLink, FileText, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button, EmptyState, Field, Textarea } from "../../components/ui";
import { formatDateTime } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

export function TrainerReviewsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  
  const opportunities = useAppStore((state) => state.opportunities);
  const submissions = useAppStore((state) => state.submissions);
  const workers = useAppStore((state) => state.workers);
  const reviewSubmission = useAppStore((state) => state.reviewSubmission);
  const currentUser = useAppStore((state) => state.currentUser());

  // Only show submissions for opportunities where this user is the designated Lead reviewer
  const queue = opportunities.filter(
    (job) => job.status === "submitted" && job.leadId === currentUser?.workerId
  );

  const selected = opportunities.find((job) => job.id === selectedId);
  const submission = submissions.find(
    (item) => item.opportunityId === selectedId
  );
  const worker = workers.find(
    (item) => item.id === selected?.assignedWorkerId
  );

  const decide = (decision: "forwarded" | "needs_revision") => {
    if (!selected || !comment.trim()) return;
    reviewSubmission(selected.id, decision, comment.trim());
    setSelectedId(null);
    setComment("");
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${queue.length} submission${queue.length === 1 ? "" : "s"} waiting`}
        title="Job Reviews"
        description="Check delivery against the expected output, leave feedback, and forward approved work to the admin."
      />
      <div className="mt-7 grid gap-4">
        {queue.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="New worker submissions assigned to you will appear here."
          />
        ) : (
          queue.map((job) => {
            const jobSubmission = submissions.find(
              (item) => item.opportunityId === job.id
            );
            const assigned = workers.find(
              (item) => item.id === job.assignedWorkerId
            );
            return (
              <article
                key={job.id}
                className="grid gap-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(16,42,67,0.05)] sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-[#102A43]">
                      {job.title}
                    </h2>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {jobSubmission?.notes}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    {assigned?.name} ·{" "}
                    {jobSubmission && formatDateTime(jobSubmission.submittedAt)}
                  </p>
                </div>
                <Button onClick={() => setSelectedId(job.id)}>
                  Review delivery
                </Button>
              </article>
            );
          })
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.title ?? "Review submission"}
        description={`Submitted by ${worker?.name ?? "worker"}`}
        wide
      >
        {selected && submission && (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl bg-[#F7F8FA] p-5 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Worker notes
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {submission.notes}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {submission.fileName && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#102A43]">
                    <FileText size={15} /> {submission.fileName}
                  </span>
                )}
                {submission.link && (
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#2563EB]"
                  >
                    <ExternalLink size={15} /> Open work link
                  </a>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Expected output
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selected.expectedOutput}
              </p>
            </div>
            <Field label="Feedback">
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Be clear about the decision and any next action."
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
                onClick={() => decide("forwarded")}
              >
                <Check size={16} /> Forward to Admin
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
