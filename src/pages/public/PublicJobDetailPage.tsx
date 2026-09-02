import { ArrowLeft, ArrowRight, CalendarDays, Check, ExternalLink, MapPin, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicListingsRepository, type PublicJob, type PublicListingsRepository } from "../../lib/publicListings";
import { PublicFooter, PublicHeader } from "./PublicLayout";
import "./public.css";

function formatRate(job: PublicJob) {
  const format = (value?: number) => {
    if (value === undefined) return "";
    const amount = value / 100;
    if (job.currency === "NGN" && amount >= 1000) {
      const thousands = amount / 1000;
      return `₦${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
    }
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: job.currency || "NGN", maximumFractionDigits: 0 }).format(amount);
  };
  if (job.rateMinMinor === undefined && job.rateMaxMinor === undefined) return "Rate shared on the role";
  if (job.rateMinMinor !== undefined && job.rateMaxMinor !== undefined) return `${format(job.rateMinMinor)} – ${format(job.rateMaxMinor)}`;
  return format(job.rateMinMinor ?? job.rateMaxMinor);
}

export function PublicJobDetailPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const { slug = "" } = useParams();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    repository.getJob(slug).then((result) => {
      if (active) setJob(result);
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : "This role could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [repository, slug]);

  return (
    <main className="public-page">
      <PublicHeader />
      <section className="public-shell public-detail-page">
        <Link to="/jobs" className="public-back-link"><ArrowLeft size={16} aria-hidden /> Back to jobs</Link>
        {loading ? <div className="public-loading" role="status">Loading this role…</div> : error ? <div role="alert" className="public-alert">{error}</div> : !job ? <div className="public-empty-detail"><h1>This role has moved on.</h1><p>It may have closed or been unpublished. Browse the current directory for another good fit.</p><Link to="/jobs" className="public-header-cta">Browse jobs <ArrowRight size={15} aria-hidden /></Link></div> : (
          <>
            <div className="public-detail-heading">
              <div><p className="public-eyebrow">{job.categoryName || job.serviceName}</p><h1>{job.title}</h1><p className="public-detail-company">{job.companyName}</p></div>
              <Link to={`/jobs/${job.slug}/apply`} className="public-detail-apply">Apply for this role <ArrowRight size={17} aria-hidden /></Link>
            </div>
            <div className="public-detail-meta">
              <span><MapPin size={16} aria-hidden /> {job.locationLabel}</span>
              <span><Wallet size={16} aria-hidden /> {formatRate(job)}{job.ratePeriod ? ` / ${job.ratePeriod}` : ""}</span>
              <span>{job.workMode || "Flexible"}</span>
              <span>{job.employmentType || "Opportunity"}</span>
              {job.applicationDeadline && <span><CalendarDays size={16} aria-hidden /> Apply by {new Date(job.applicationDeadline).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>}
            </div>
            <div className="public-detail-grid">
              <article className="public-detail-main">
                <p className="public-detail-summary">{job.summary}</p>
                <section><h2>About the role</h2><p>{job.description || job.summary}</p></section>
                <section><h2>What you’ll deliver</h2>{job.deliverables.length ? <ul>{job.deliverables.map((item) => <li key={item}><Check size={17} aria-hidden />{item}</li>)}</ul> : <p>Deliverables will be agreed with the selected professional.</p>}</section>
                {job.references.length > 0 && <section><h2>Helpful context</h2><div className="public-detail-references">{job.references.map((reference) => <a key={`${reference.label}-${reference.url}`} href={reference.url} target="_blank" rel="noreferrer"><span>{reference.label}</span><ExternalLink size={15} aria-hidden /></a>)}</div></section>}
              </article>
              <aside className="public-detail-aside"><p className="public-eyebrow">Ready when you are</p><h2>A clearer path starts with one good application.</h2><p>Your profile and cover note are all you need to take the next step.</p><Link to={`/jobs/${job.slug}/apply`} className="public-header-cta">Start application <ArrowRight size={15} aria-hidden /></Link></aside>
            </div>
          </>
        )}
      </section>
      <PublicFooter />
    </main>
  );
}
