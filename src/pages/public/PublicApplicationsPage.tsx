import { ArrowRight, BriefcaseBusiness, Check, Clock3, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button, EmptyState } from "../../components/ui";
import { publicListingsRepository, type JobApplicationStatus, type PublicApplication, type PublicListingsRepository } from "../../lib/publicListings";
import { useProfessionalStore } from "../../store/professionalStore";
import { PublicFooter, PublicHeader } from "./PublicLayout";
import "./public.css";

const statusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Submitted", under_review: "Under review", shortlisted: "Shortlisted", rejected: "Not selected", withdrawn: "Withdrawn", converted: "Moved forward"
};

export function PublicApplicationsPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const session = useProfessionalStore((state) => state.session);
  const isBootstrapping = useProfessionalStore((state) => state.isBootstrapping);
  const currentProfessional = useProfessionalStore((state) => state.currentProfessional());
  const [applications, setApplications] = useState<PublicApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
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
    try { await repository.withdrawApplication(applicationId); reload(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Application could not be withdrawn."); }
  };

  return <main className="public-page"><PublicHeader /><section className="public-shell public-apply-page"><div className="public-apply-heading"><div><p className="public-eyebrow">Your path forward</p><h1>My <em>applications.</em></h1><p>One place to see what’s moving, what needs you, and what comes next.</p></div><Link to="/jobs" className="public-detail-apply">Find another role <ArrowRight size={16} aria-hidden /></Link></div>{error && <div role="alert" className="public-alert">{error}</div>}{loading ? <div className="public-loading" role="status">Loading your applications…</div> : applications.length === 0 ? <EmptyState title="No applications yet" description="When a role feels right, your application and every update will live here." action={<Link to="/jobs" className="public-detail-apply">Browse open jobs <ArrowRight size={16} aria-hidden /></Link>} /> : <div className="public-application-list">{applications.map((application) => <article key={application.id} className="public-application-card"><div className="public-application-card-icon"><BriefcaseBusiness size={19} aria-hidden /></div><div className="public-application-card-main"><div className="public-application-card-heading"><div><p className="public-eyebrow">{application.companyName}</p><h2>{application.jobTitle}</h2></div><span className={`public-application-badge public-application-badge-${application.status}`}><Check size={13} aria-hidden /> {statusLabels[application.status]}</span></div><p className="public-application-card-date"><Clock3 size={14} aria-hidden /> Applied {new Date(application.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>{application.adminNote && <p className="public-application-admin-note">{application.adminNote}</p>}<div className="public-application-card-actions"><Link to={`/jobs/${application.jobSlug}`} className="public-inline-link">View role <ArrowRight size={15} aria-hidden /></Link>{["submitted", "under_review", "shortlisted"].includes(application.status) && <Button type="button" variant="secondary" onClick={() => withdraw(application.id)}><RotateCcw size={14} aria-hidden /> Withdraw</Button>}</div></div></article>)}</div>}</section><PublicFooter /></main>;
}
