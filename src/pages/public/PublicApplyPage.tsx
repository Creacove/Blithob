import { ArrowLeft, ArrowRight, Check, Clock3, Link2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, Field, Input, Textarea } from "../../components/ui";
import {
  publicListingsRepository,
  type JobApplicationStatus,
  type PublicApplication,
  type PublicJob,
  type PublicListingsRepository
} from "../../lib/publicListings";
import { useProfessionalStore } from "../../store/professionalStore";
import { PublicFooter, PublicHeader } from "./PublicLayout";
import "./public.css";

const statusCopy: Record<JobApplicationStatus, { label: string; body: string }> = {
  submitted: { label: "Submitted", body: "Your application is in the queue. We’ll keep the next step clear." },
  under_review: { label: "Under review", body: "The team is reviewing your application." },
  shortlisted: { label: "Shortlisted", body: "You’re through to the next stage. We’ll be in touch with the details." },
  rejected: { label: "Not selected", body: "This role wasn’t the right match this time. Keep your profile ready for the next one." },
  withdrawn: { label: "Withdrawn", body: "You withdrew this application." },
  converted: { label: "Moved forward", body: "This application became an active Blithob assignment." }
};

export function PublicApplyPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const session = useProfessionalStore((state) => state.session);
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const currentProfessional = useProfessionalStore((state) => state.currentProfessional());
  const [job, setJob] = useState<PublicJob | null>(null);
  const [application, setApplication] = useState<PublicApplication | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = `/jobs/${slug}/apply`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const onboardingHref = `/onboarding?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    repository.getJob(slug).then(async (result) => {
      if (!active) return;
      setJob(result);
      if (result && currentProfessional) {
        const applications = await repository.listMyApplications();
        if (active) setApplication(applications.find((item) => item.jobId === result.id) ?? null);
      }
    }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Application could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [repository, slug, currentProfessional]);

  const status = application ? statusCopy[application.status] : undefined;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!job) return;
    setSaving(true); setError(null);
    try {
      await repository.submitApplication({ jobId: job.id, coverNote, portfolioUrl });
      const applications = await repository.listMyApplications();
      setApplication(applications.find((item) => item.jobId === job.id) ?? { id: "pending", jobId: job.id, jobSlug: job.slug, jobTitle: job.title, companyName: job.companyName, status: "submitted", coverNote, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your application could not be submitted.");
    } finally { setSaving(false); }
  };

  if (!session) {
    return <main className="public-page"><PublicHeader /><section className="public-shell public-apply-page"><Link to={`/jobs/${slug}`} className="public-back-link"><ArrowLeft size={16} aria-hidden /> Back to role</Link>{loading ? <div className="public-loading" role="status">Loading this role…</div> : !job ? <div role="alert" className="public-alert">This role is no longer available.</div> : <div className="public-apply-gate"><p className="public-eyebrow">{job.categoryName || job.serviceName}</p><h1>Apply for <em>{job.title}.</em></h1><p className="public-lede">Create a free professional account so your application has a clear place to go and you can track what happens next.</p><Link to={loginHref} className="public-detail-apply">Sign in to apply <ArrowRight size={17} aria-hidden /></Link><p className="public-apply-note">New to Blithob? You can create your account on the next screen.</p></div>}</section><PublicFooter /></main>;
  }

  if (!currentUser) return <Navigate to={loginHref} replace />;
  if (!currentProfessional) return <Navigate to={onboardingHref} replace />;

  return (
    <main className="public-page"><PublicHeader /><section className="public-shell public-apply-page"><Link to={`/jobs/${slug}`} className="public-back-link"><ArrowLeft size={16} aria-hidden /> Back to role</Link>{loading ? <div className="public-loading" role="status">Loading this role…</div> : !job ? <div role="alert" className="public-alert">This role is no longer available.</div> : <><div className="public-apply-heading"><div><p className="public-eyebrow">Application</p><h1>Apply for <em>{job.title}.</em></h1><p>{job.companyName} · {job.locationLabel}</p></div><Link to={`/jobs/${slug}`} className="public-inline-link">Read full role <ArrowRight size={15} aria-hidden /></Link></div>{application && status ? <div className="public-application-status"><div className="public-status-icon"><Check size={20} aria-hidden /></div><div><p className="public-eyebrow">{status.label}</p><h2>Application received.</h2><p>{status.body}</p></div><Link to="/professional/applications" className="public-inline-link">View my applications <ArrowRight size={15} aria-hidden /></Link></div> : <form className="public-application-form" onSubmit={submit}><div><p className="public-eyebrow">A short, useful note</p><h2>Tell the team why this role fits.</h2><p className="public-form-copy">Keep it specific: the relevant work you’ve done, how you’d approach this brief, and when you can start.</p></div><Field label="Cover note" hint="20–4,000 characters"><Textarea value={coverNote} onChange={(event) => setCoverNote(event.target.value)} minLength={20} maxLength={4000} required placeholder="I’m a strong fit because…" /></Field><Field label="Portfolio or relevant link (optional)"><div className="public-input-with-icon"><Link2 size={17} aria-hidden /><Input type="url" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://…" /></div></Field>{error && <p role="alert" className="public-alert">{error}</p>}<Button type="submit" disabled={saving}>{saving ? "Sending application…" : "Submit application"}<ArrowRight size={16} aria-hidden /></Button><p className="public-application-footnote"><Clock3 size={14} aria-hidden /> You’ll receive updates in your Blithob account.</p></form>}</>}</section><PublicFooter /></main>
  );
}
