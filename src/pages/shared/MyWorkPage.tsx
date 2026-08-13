import {
  ArrowRight,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileUp,
  Play,
  Send,
  Square
} from "lucide-react";
import { useState } from "react";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Textarea
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

function JobDetailSection({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function AcceptanceCriteriaList({
  criteria,
  jobId
}: {
  criteria: string[];
  jobId: string;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  if (!criteria || criteria.length === 0) return null;

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <ul className="space-y-2">
      {criteria.map((item, i) => {
        const key = `${jobId}-${i}`;
        const done = !!checked[key];
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                done
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {done ? (
                <CheckSquare2
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
              ) : (
                <Square
                  size={17}
                  className="mt-0.5 shrink-0 text-slate-300"
                />
              )}
              <span
                className={`text-sm leading-5 ${done ? "line-through opacity-70" : ""}`}
              >
                {item}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function StepsList({ steps }: { steps: string }) {
  if (!steps?.trim()) return null;
  const lines = steps
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <ol className="space-y-2">
      {lines.map((line, i) => {
        // Strip any leading "1." "2." etc that the admin may have typed
        const text = line.replace(/^\d+\.\s*/, "");
        return (
          <li key={i} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
              {i + 1}
            </span>
            <span className="text-sm leading-6 text-slate-600">{text}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function MyWorkPage({
  eyebrow = "Delivery",
  title = "Work",
  description = "Review assignments, update progress, and submit completed work."
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState("");
  const user = useAppStore((state) => state.currentUser());
  const opportunities = useAppStore((state) => state.opportunities);
  const services = useAppStore((state) => state.services);
  const submissions = useAppStore((state) => state.submissions);
  const reviews = useAppStore((state) => state.reviews);
  const startOpportunity = useAppStore((state) => state.startOpportunity);
  const submitOpportunity = useAppStore((state) => state.submitOpportunity);

  const jobs = opportunities.filter((job) =>
    job.assignedWorkerIds.includes(user?.workerId ?? "")
  );
  const selected = jobs.find((job) => job.id === selectedId);
  const selectedReview = reviews.find(
    (review) => review.opportunityId === selectedId
  );

  const toggleExpand = (jobId: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });

  const submit = () => {
    if (!selected || !user?.workerId || !notes.trim()) return;
    submitOpportunity(selected.id, user.workerId, {
      notes: notes.trim(),
      link: link.trim() || undefined,
      fileName: fileName || undefined
    });
    setNotes("");
    setLink("");
    setFileName("");
    setSelectedId(null);
  };

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-7 grid gap-5">
        {jobs.length === 0 ? (
          <EmptyState
            title="No work assigned"
            description="New opportunities assigned to this profile will appear here."
          />
        ) : (
          jobs.map((job) => {
            const service = services.find((item) => item.id === job.serviceId);
            const submission = submissions.find(
              (item) => item.opportunityId === job.id
            );
            const latestReview = reviews.find(
              (item) => item.opportunityId === job.id
            );
            const isExpanded = expandedIds.has(job.id);
            const hasDetails =
              job.steps?.trim() ||
              (job.acceptanceCriteria?.length ?? 0) > 0 ||
              job.description;

            return (
              <article
                key={job.id}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(16,42,67,0.05)]"
              >
                {/* ── Card header ── */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
                      {service?.name}
                    </p>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold text-[#102A43]">
                        {job.title}
                      </h2>
                      {!isExpanded && (
                        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-500">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-end sm:gap-2">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Due
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#102A43]">
                          <CalendarDays size={13} />
                          {formatDate(job.deadline)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Pay
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#102A43]">
                          {formatCurrency(job.payAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details toggle */}
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(job.id)}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-800"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={15} /> Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown size={15} /> View full brief
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* ── Expanded detail panel ── */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-5 sm:px-6">
                    <div className="grid gap-6">
                      {job.description && (
                        <JobDetailSection label="Overview">
                          <p className="text-sm leading-7 text-slate-600">
                            {job.description}
                          </p>
                        </JobDetailSection>
                      )}

                      {job.steps?.trim() && (
                        <JobDetailSection label="Steps">
                          <StepsList steps={job.steps} />
                        </JobDetailSection>
                      )}

                      {(job.acceptanceCriteria?.length ?? 0) > 0 && (
                        <JobDetailSection label="Acceptance criteria">
                          <p className="mb-3 text-xs text-slate-500">
                            Tick each criterion as you complete it — your
                            self-checklist before submitting.
                          </p>
                          <AcceptanceCriteriaList
                            criteria={job.acceptanceCriteria}
                            jobId={job.id}
                          />
                        </JobDetailSection>
                      )}

                      {job.expectedOutput && (
                        <JobDetailSection label="Expected output">
                          <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                            {job.expectedOutput}
                          </p>
                        </JobDetailSection>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Feedback / submission banners ── */}
                {(latestReview?.decision === "needs_revision" ||
                  (submission && job.status === "submitted")) && (
                  <div className="border-t border-slate-100 px-5 sm:px-6">
                    {latestReview?.decision === "needs_revision" && (
                      <div className="my-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                        <p className="text-xs font-bold text-orange-800">
                          Feedback from reviewer
                        </p>
                        <p className="mt-1 text-sm leading-6 text-orange-800/75">
                          {latestReview.comment}
                        </p>
                      </div>
                    )}
                    {submission && job.status === "submitted" && (
                      <div className="my-4 flex flex-wrap items-center gap-3 rounded-2xl bg-violet-50 p-4 text-xs font-semibold text-violet-700">
                        <Send size={15} />
                        Submission received — quality review is pending.
                        {submission.link && (
                          <a
                            href={submission.link}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto inline-flex items-center gap-1 underline"
                          >
                            View link <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── CTA footer ── */}
                <div className="flex items-center justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
                  {job.status === "assigned" && (
                    <Button onClick={() => startOpportunity(job.id)}>
                      <Play size={16} /> Start work
                    </Button>
                  )}
                  {["in_progress", "needs_revision"].includes(job.status) && (
                    <Button onClick={() => setSelectedId(job.id)}>
                      {job.status === "needs_revision"
                        ? "Submit revision"
                        : "Submit work"}
                      <ArrowRight size={16} />
                    </Button>
                  )}
                  {job.status === "accepted" && (
                    <p className="text-xs font-bold text-emerald-700">
                      Accepted — payout is being arranged.
                    </p>
                  )}
                  {job.status === "completed" && (
                    <p className="text-xs font-bold text-[#102A43]">
                      Completed and moved to payment history.
                    </p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ── Submit modal ── */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={
          selected?.status === "needs_revision"
            ? "Submit revision"
            : "Submit work"
        }
        description={selected?.title}
      >
        <div className="space-y-5">
          {selectedReview?.decision === "needs_revision" && (
            <div className="rounded-2xl bg-orange-50 p-4 text-sm leading-6 text-orange-800">
              {selectedReview.comment}
            </div>
          )}
          <Field label="Submission notes">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Summarise what you completed and any decisions the reviewer should know."
            />
          </Field>
          <Field label="Work link" hint="Optional — shared document or URL.">
            <Input
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field
            label="File name"
            hint="Optional. Record the name of a file shared with this submission."
          >
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
              <FileUp size={20} className="text-[#2563EB]" />
              <span className="mt-2 text-xs font-bold text-[#102A43]">
                {fileName || "Choose a file to record its name"}
              </span>
              <input
                type="file"
                className="sr-only"
                onChange={(event) =>
                  setFileName(event.target.files?.[0]?.name ?? "")
                }
              />
            </label>
          </Field>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSelectedId(null)}>
              Cancel
            </Button>
            <Button disabled={!notes.trim()} onClick={submit}>
              <Send size={16} /> Send for review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
