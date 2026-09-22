import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Field, Select, Textarea } from "../../components/ui";
import type { JobApplicationStatus, PublicApplication } from "../../lib/publicListings";
import {
  applicationStatusLabel,
  primaryAction,
  readinessCopy,
  type ApplicationAction
} from "./applicationQueue";

function appliedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-NG", { dateStyle: "medium" });
}

const toneClasses = {
  neutral: "bg-slate-100 text-slate-700",
  attention: "bg-amber-50 text-amber-800",
  success: "bg-emerald-50 text-emerald-800"
} as const;

const actionLabels: Record<ApplicationAction, string> = {
  start_review: "Start review",
  shortlist: "Shortlist",
  view_readiness: "View readiness",
  create_assignment: "Create assignment",
  open_assignment: "Open assignment",
  view_application: "View application"
};

export function ApplicationCard({
  application,
  privateNote,
  working,
  onPrivateNoteChange,
  onPrimary,
  onStatusChange,
  onViewCv
}: {
  application: PublicApplication;
  privateNote: string;
  working: boolean;
  onPrivateNoteChange: (value: string) => void;
  onPrimary: (action: ApplicationAction) => void;
  onStatusChange: (
    status: Extract<JobApplicationStatus, "under_review" | "shortlisted" | "rejected">
  ) => void;
  onViewCv: () => void;
}) {
  const action = primaryAction(application);
  const readiness = readinessCopy(application);
  const canChangeStatus = !["converted", "withdrawn"].includes(application.status);

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)] sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[.13em] text-[var(--blue)]">
            {application.companyName || "Client team"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">
            {application.jobTitle}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <UserRound size={14} aria-hidden="true" />
            <span>{application.applicantName || "Applicant"}</span>
            <span aria-hidden="true">·</span>
            <span>{application.applicantEmail || "No email"}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-bold text-[var(--ink)]">
          {applicationStatusLabel(application.status)}
        </span>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[var(--border)] py-3 text-sm">
        <span>
          <span className="text-[var(--muted)]">Service </span>
          <span className="font-semibold text-[var(--ink)]">
            {application.serviceName || "Refreshing"}
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneClasses[readiness.tone]}`}>
            {readiness.label}
          </span>
          <span className="text-[var(--muted)]">{readiness.detail}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Clock3 size={13} aria-hidden="true" />
          Applied {appliedDate(application.createdAt)}
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <FileText size={15} aria-hidden="true" />
            Application
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
            {application.coverNote || "No cover note was added."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {application.cvDisplayName ? (
              <>
                <span className="text-sm font-semibold text-[var(--ink)]">
                  CV: {application.cvDisplayName}
                </span>
                <Button type="button" variant="secondary" disabled={working} onClick={onViewCv}>
                  <ExternalLink size={14} aria-hidden="true" />
                  View CV
                </Button>
              </>
            ) : (
              <span className="text-sm text-[var(--muted)]">No CV attached</span>
            )}
            {application.supportingDocumentCount ? (
              <span className="text-xs text-[var(--muted)]">
                {application.supportingDocumentCount} supporting document
                {application.supportingDocumentCount === 1 ? "" : "s"} available
              </span>
            ) : null}
          </div>

          {application.portfolioUrl ? (
            <a
              href={application.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue)]"
            >
              Open portfolio
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            {readiness.tone === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
            ) : (
              <ShieldCheck size={16} className="text-[var(--blue)]" aria-hidden="true" />
            )}
            Next step
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {action === "view_readiness"
              ? "Readiness must be approved before this candidate can receive an Assignment."
              : action === "create_assignment"
                ? "This candidate is ready. Confirm pay and deadline to create the Assignment."
                : action === "shortlist"
                  ? "Shortlisting starts the candidate’s Service-readiness path automatically."
                  : action === "start_review"
                    ? "Move this application into review when you are ready to assess it."
                    : action === "open_assignment"
                      ? "This application is connected to an Assignment."
                      : "This application is closed."}
          </p>

          {application.readinessEnrolmentId && action === "view_readiness" ? (
            <Link
              to={application.professionalId ? `/admin/people/${application.professionalId}` : "/admin/people"}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue)]"
            >
              Open readiness
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}

          <Button
            type="button"
            className="mt-4 w-full"
            variant={action === "view_application" ? "secondary" : "primary"}
            disabled={working}
            onClick={() => onPrimary(action)}
          >
            {working ? "Working…" : actionLabels[action]}
            {!working && <ArrowRight size={15} aria-hidden="true" />}
          </Button>

          {canChangeStatus ? (
            <Field label="Change status" className="mt-4">
              <Select
                aria-label={`Change status for ${application.applicantName || "applicant"}`}
                value=""
                onChange={(event) => {
                  const next = event.target.value as Extract<JobApplicationStatus, "under_review" | "shortlisted" | "rejected">;
                  if (next) onStatusChange(next);
                }}
              >
                <option value="">Choose a status…</option>
                <option value="under_review">Under review</option>
                <option value="shortlisted">Shortlist</option>
                <option value="rejected">Not selected</option>
              </Select>
            </Field>
          ) : null}

          {application.status !== "converted" ? (
            <Field label="Private Admin note" hint="Saved with the next status change.">
              <Textarea
                value={privateNote}
                onChange={(event) => onPrivateNoteChange(event.target.value)}
                placeholder="Keep an internal decision note."
                className="mt-3 min-h-24 bg-white"
              />
            </Field>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
