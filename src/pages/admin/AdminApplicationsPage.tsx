import { Check, FileText, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, EmptyState, Field, Input, Select, Textarea } from "../../components/ui";
import { PageHeader } from "../../components/PageHeader";
import { publicListingsRepository, type JobApplicationStatus, type PublicApplication, type PublicListingsRepository } from "../../lib/publicListings";

const reviewStatuses: Array<Extract<JobApplicationStatus, "under_review" | "shortlisted" | "rejected">> = ["under_review", "shortlisted", "rejected"];
const statusLabel: Record<JobApplicationStatus, string> = { submitted: "Submitted", under_review: "Under review", shortlisted: "Shortlisted", rejected: "Not selected", withdrawn: "Withdrawn", converted: "Moved forward" };

export function AdminApplicationsPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const [applications, setApplications] = useState<PublicApplication[]>([]);
  const [status, setStatus] = useState<"all" | JobApplicationStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pay, setPay] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    repository.listAdminApplications({ status: status === "all" ? undefined : status }).then(setApplications).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Applications could not be loaded.")).finally(() => setLoading(false));
  };
  useEffect(() => {
    let active = true;
    repository
      .listAdminApplications({ status: status === "all" ? undefined : status })
      .then((rows) => {
        if (active) {
          setApplications(rows);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Applications could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, status]);

  const review = async (application: PublicApplication, nextStatus: Extract<JobApplicationStatus, "under_review" | "shortlisted" | "rejected">) => {
    setWorkingId(application.id); setError(null);
    try { await repository.reviewApplication({ applicationId: application.id, status: nextStatus, adminNote: notes[application.id] }); load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Review could not be saved."); } finally { setWorkingId(null); }
  };
  const convert = async (application: PublicApplication) => {
    const amount = Number(pay[application.id]);
    if (!amount || amount <= 0) { setError("Enter an agreed pay amount in naira before converting."); return; }
    setWorkingId(application.id); setError(null);
    try { await repository.convertApplication({ applicationId: application.id, agreedPay: Math.round(amount) }); load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Assignment could not be created."); } finally { setWorkingId(null); }
  };

  return <div><PageHeader eyebrow="Candidate pipeline" title="Applications" description="Review real candidate interest, keep the next step visible, and convert the right fit into the existing Assignment workflow" actions={<Button type="button" variant="secondary" onClick={load}><RefreshCw size={15} aria-hidden /> Refresh</Button>} /><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--muted)]">{loading ? "Loading…" : `${applications.length} application${applications.length === 1 ? "" : "s"}`}</p><Select aria-label="Filter applications by status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="w-auto min-w-44"><option value="all">All statuses</option>{Object.keys(statusLabel).map((item) => <option key={item} value={item}>{statusLabel[item as JobApplicationStatus]}</option>)}</Select></div>{error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}{loading ? <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">Loading application queue…</div> : applications.length === 0 ? <div className="mt-4"><EmptyState title="No applications in this view" description="Published roles will send candidate interest here as people apply." /></div> : <div className="mt-4 grid gap-4">{applications.map((application) => <article key={application.id} className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.13em] text-[var(--blue)]">{application.companyName}</p><h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">{application.jobTitle}</h2><p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]"><UserRound size={14} aria-hidden />{application.applicantName || "Applicant"} · {application.applicantEmail || "No email"}</p></div><span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-bold text-[var(--ink)]">{statusLabel[application.status]}</span></div><div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(250px,.7fr)]"><div><div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><FileText size={15} aria-hidden /> Cover note</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{application.coverNote}</p>{application.portfolioUrl && <a href={application.portfolioUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[var(--blue)]">Open portfolio</a>}</div>{application.status === "converted" ? <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">This application is connected to an Assignment.</div> : <div className="grid gap-3"><Field label="Admin note"><Textarea value={notes[application.id] ?? application.adminNote ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))} placeholder="What should the candidate know next?" className="min-h-20" /></Field><div className="flex flex-wrap gap-2">{reviewStatuses.map((nextStatus) => <Button key={nextStatus} type="button" variant={nextStatus === "rejected" ? "danger" : nextStatus === "shortlisted" ? "primary" : "secondary"} disabled={workingId === application.id} onClick={() => review(application, nextStatus)}><Check size={14} aria-hidden />{statusLabel[nextStatus]}</Button>)}</div>{application.status === "shortlisted" && <div className="grid gap-2 border-t border-[var(--border)] pt-3"><Field label="Agreed pay (₦)"><Input type="number" min="1" value={pay[application.id] ?? ""} onChange={(event) => setPay((current) => ({ ...current, [application.id]: event.target.value }))} placeholder="450000" /></Field><Button type="button" disabled={workingId === application.id} onClick={() => convert(application)}>Create Assignment</Button></div>}</div>}</div></article>)}</div>}</div>;
}
