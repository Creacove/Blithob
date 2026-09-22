import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button, EmptyState } from "../../components/ui";
import {
  publicListingsRepository,
  type PublicApplication,
  type PublicListingsRepository
} from "../../lib/publicListings";

function visibleState(application: PublicApplication) {
  if (application.status === "converted") return "Hired";
  if (application.status === "rejected") return "Not selected";
  if (application.status === "withdrawn") return "Withdrawn";
  if (
    application.status === "shortlisted" &&
    application.readinessEnrolmentId &&
    application.readyForAssignment !== true &&
    application.readinessStatus !== "approved"
  ) return "Action required";
  if (application.status === "shortlisted") return "Shortlisted";
  if (application.status === "submitted") return "Applied";
  return "Waiting for decision";
}

function stateTone(state: string) {
  if (state === "Hired") return "bg-emerald-50 text-emerald-800";
  if (state === "Action required") return "bg-amber-50 text-amber-900";
  if (state === "Not selected" || state === "Withdrawn") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-blue-800";
}

export function JobsPage({
  repository = publicListingsRepository
}: {
  repository?: PublicListingsRepository;
}) {
  const [applications, setApplications] = useState<PublicApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [workingId, setWorkingId] = useState<string>();

  const load = () => {
    setLoading(true);
    repository.listMyApplications()
      .then((rows) => {
        setApplications(rows);
        setError(undefined);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Applications could not be loaded.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    repository.listMyApplications()
      .then((rows) => {
        if (cancelled) return;
        setApplications(rows);
        setError(undefined);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Applications could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const withdraw = async (id: string) => {
    setWorkingId(id);
    try {
      await repository.withdrawApplication(id);
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Application could not be withdrawn.");
    } finally {
      setWorkingId(undefined);
    }
  };

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Your applications and next steps, all in one place."
        actions={
          <Link
            to="/jobs"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--blue)] px-4 text-sm font-semibold text-white"
          >
            Browse jobs <ArrowRight size={16} aria-hidden />
          </Link>
        }
      />

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--ink)]">My applications</h2>
        {!loading && <span className="text-sm text-[var(--muted)]">{applications.length}</span>}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {loading ? (
        <p role="status" className="mt-5 text-sm text-[var(--muted)]">Loading applications…</p>
      ) : applications.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No applications yet"
            description="Choose a job that fits and apply when you are ready."
            action={<Link to="/jobs" className="font-semibold text-[var(--blue)]">Browse jobs</Link>}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3" aria-label="My applications">
          {applications.map((application) => {
            const state = visibleState(application);
            const needsQualification = state === "Action required";
            const isShortlistedPending =
              application.status === "shortlisted" && state === "Shortlisted";
            return (
              <article key={application.id} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[var(--blue)]">
                      <BriefcaseBusiness size={18} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[var(--ink)]">{application.jobTitle}</h3>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{application.companyName}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${stateTone(state)}`}>{state}</span>
                </div>

                {needsQualification && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div>
                      <p className="font-semibold text-amber-950">Complete the steps for this type of job</p>
                      {application.readinessRequirementCount !== undefined && (
                        <p className="mt-1 text-sm text-amber-800">
                          {application.readinessCompletedCount ?? 0} of {application.readinessRequirementCount} complete
                        </p>
                      )}
                    </div>
                    {application.readinessEnrolmentId ? (
                      <Link
                        to={`/professional/training/${application.readinessEnrolmentId}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-900 px-3 text-sm font-semibold text-white"
                      >
                        Complete qualification <ArrowRight size={15} aria-hidden />
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-amber-900">We’ll notify you when the steps are ready.</span>
                    )}
                  </div>
                )}

                {isShortlistedPending && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="font-semibold text-blue-950">You’re shortlisted</p>
                    <p className="mt-1 text-sm text-blue-800">
                      Nothing is needed from you yet. We’ll show the next step here when the team is ready.
                    </p>
                  </div>
                )}

                {state === "Hired" && application.assignmentId && (
                  <Link to={`/professional/work/${application.assignmentId}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--blue)]">
                    <CheckCircle2 size={15} aria-hidden /> Open work
                  </Link>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <Clock3 size={13} aria-hidden /> Applied {new Date(application.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link to={`/jobs/${application.jobSlug}`} className="text-sm font-semibold text-[var(--blue)]">View job</Link>
                    {["submitted", "under_review", "shortlisted"].includes(application.status) && (
                      <Button variant="secondary" disabled={workingId === application.id} onClick={() => void withdraw(application.id)}>
                        {workingId === application.id ? "Withdrawing…" : "Withdraw"}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
