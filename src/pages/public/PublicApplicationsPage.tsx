import { ArrowRight, BriefcaseBusiness, Check, Clock3, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button, EmptyState } from "../../components/ui";
import { publicListingsRepository, type JobApplicationStatus, type PublicApplication, type PublicListingsRepository } from "../../lib/publicListings";
import { useProfessionalStore } from "../../store/professionalStore";
import { PublicFooter, PublicHeader } from "./PublicLayout";
import "./public.css";

const statusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Applied", under_review: "Reviewing", shortlisted: "Shortlisted", rejected: "Not selected", withdrawn: "Withdrawn", converted: "Assignment received"
};

const statusDescriptions: Record<JobApplicationStatus, string> = {
  submitted: "Your application is in the queue.",
  under_review: "The team is reviewing your application.",
  shortlisted: "You are on the shortlist. The next step will appear here.",
  rejected: "This role was not the right match this time.",
  withdrawn: "You withdrew this application.",
  converted: "Your Assignment is ready. Open it to see the brief and next steps."
};

function applicationDescription(application: PublicApplication) {
  if (application.status !== "shortlisted") return statusDescriptions[application.status];
  if (application.readyForAssignment === true || application.readinessStatus === "approved") {
    return "You are cleared for the next step. We will share your Assignment here when the team confirms the details.";
  }
  if (application.readinessStatus === "changes_requested") {
    return "A reviewer requested changes. Update your readiness evidence to continue.";
  }
  if (application.readinessStatus === "paused") {
    return "Your readiness path is paused. We will let you know when it resumes.";
  }
  if (application.readinessStatus === "in_progress" || application.readinessStatus === "not_started") {
    return "Complete the readiness steps for this Service to keep moving.";
  }
  return statusDescriptions.shortlisted;
}

function progressClass(application: PublicApplication, stage: "applied" | "review" | "shortlisted" | "assignment") {
  const rank = application.status === "converted"
    ? 4
    : application.status === "shortlisted"
      ? 3
      : application.status === "under_review"
        ? 2
        : 1;
  const stageRank = { applied: 1, review: 2, shortlisted: 3, assignment: 4 }[stage];
  return rank >= stageRank ? "is-complete" : "";
}

export function PublicApplicationsPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const session = useProfessionalStore((state) => state.session);
  const isBootstrapping = useProfessionalStore((state) => state.isBootstrapping);
  const currentProfessional = useProfessionalStore((state) => state.currentProfessional());
  const [applications, setApplications] = useState<PublicApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    repository.listMyApplications().then(setApplications).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Applications could not be loaded.")).finally(() => setLoading(false));
  };
  useEffect(() => {
    if (!session || !currentProfessional) return;
    let active = true;
    repository
      .listMyApplications()
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
  }, [repository, session, currentProfessional]);

  if (isBootstrapping) {
    return <main className="public-page"><PublicHeader /><section className="public-shell public-apply-page"><div className="public-loading" role="status">Loading your account…</div></section><PublicFooter /></main>;
  }

  if (!session) return <Navigate to="/login?next=%2Fprofessional%2Fapplications" replace />;
  if (!currentProfessional) return <Navigate to="/onboarding?next=%2Fprofessional%2Fapplications" replace />;

  const withdraw = async (applicationId: string) => {
    setWorkingId(applicationId);
    setError(null);
    try { await repository.withdrawApplication(applicationId); reload(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Application could not be withdrawn."); } finally { setWorkingId(null); }
  };

  return (
    <main className="public-page">
      <PublicHeader />
      <section className="public-shell public-apply-page">
        <div className="public-apply-heading">
          <div>
            <p className="public-eyebrow">Your path forward</p>
            <h1>My <em>applications.</em></h1>
            <p>One place to see what’s moving, what needs you, and what comes next.</p>
          </div>
          <Link to="/jobs" className="public-detail-apply">
            Find another role <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        {error && <div role="alert" className="public-alert">{error}</div>}

        {loading ? (
          <div className="public-loading" role="status">Loading your applications…</div>
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="When a role feels right, your application and every update will live here."
            action={<Link to="/jobs" className="public-detail-apply">Browse open jobs <ArrowRight size={16} aria-hidden /></Link>}
          />
        ) : (
          <div className="public-application-list">
            {applications.map((application) => {
              const readinessNeedsAction = application.status === "shortlisted"
                && application.readyForAssignment !== true
                && application.readinessStatus !== "approved";
              const canCompleteReadiness = readinessNeedsAction && Boolean(application.readinessEnrolmentId);

              return (
                <article key={application.id} className="public-application-card">
                  <div className="public-application-card-icon"><BriefcaseBusiness size={19} aria-hidden /></div>
                  <div className="public-application-card-main">
                    <div className="public-application-card-heading">
                      <div>
                        <p className="public-eyebrow">{application.companyName}</p>
                        <h2>{application.jobTitle}</h2>
                      </div>
                      <span className={`public-application-badge public-application-badge-${application.status}`}>
                        <Check size={13} aria-hidden /> {statusLabels[application.status]}
                      </span>
                    </div>

                    <p className="public-application-card-date">
                      <Clock3 size={14} aria-hidden /> Applied {new Date(application.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                    </p>

                    <div className="public-application-progress" aria-label="Application progress">
                      <span className={progressClass(application, "applied")}>Applied step</span>
                      <span className={progressClass(application, "review")}>Review step</span>
                      <span className={progressClass(application, "shortlisted")}>Shortlist step</span>
                      <span className={progressClass(application, "assignment")}>Assignment step</span>
                    </div>

                    <p className="public-application-status-copy">{applicationDescription(application)}</p>

                    {readinessNeedsAction && (
                      <div className="public-application-next-step">
                        <div>
                          <p className="public-eyebrow">Next step</p>
                          <p>{canCompleteReadiness ? "Complete your readiness checklist to stay in the running." : "Your readiness checklist is being prepared. Check back here soon."}</p>
                          {canCompleteReadiness && application.readinessCompletedCount !== undefined && application.readinessRequirementCount !== undefined && (
                            <small>{application.readinessCompletedCount} of {application.readinessRequirementCount} complete</small>
                          )}
                        </div>
                        {canCompleteReadiness && (
                          <Link to={`/professional/training/${application.readinessEnrolmentId}`} className="public-detail-apply">
                            Complete readiness <ArrowRight size={16} aria-hidden />
                          </Link>
                        )}
                      </div>
                    )}

                    {application.status === "shortlisted" && !readinessNeedsAction && (
                      <div className="public-application-next-step is-ready">
                        <div><p className="public-eyebrow">Next step</p><p>Ready for assignment</p></div>
                      </div>
                    )}

                    <div className="public-application-detail">
                      <p className="public-eyebrow">Your application note</p>
                      <p className="public-application-cover-note">{application.coverNote || "No cover note was added."}</p>
                      {application.portfolioUrl && <a href={application.portfolioUrl} target="_blank" rel="noreferrer" className="public-inline-link">Open portfolio <ArrowRight size={15} aria-hidden /></a>}
                    </div>

                    <div className="public-application-card-actions">
                      <div className="flex flex-wrap items-center gap-4">
                        <Link to={`/jobs/${application.jobSlug}`} className="public-inline-link">View role <ArrowRight size={15} aria-hidden /></Link>
                        {application.status === "converted" && application.assignmentId && (
                          <Link to={`/professional/work/${application.assignmentId}`} className="public-inline-link">Open Assignment <ArrowRight size={15} aria-hidden /></Link>
                        )}
                      </div>
                      {["submitted", "under_review", "shortlisted"].includes(application.status) && <Button type="button" variant="secondary" disabled={workingId === application.id} onClick={() => withdraw(application.id)}><RotateCcw size={14} aria-hidden /> {workingId === application.id ? "Withdrawing…" : "Withdraw"}</Button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <PublicFooter />
    </main>
  );
}
