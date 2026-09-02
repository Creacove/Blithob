import { ArrowRight, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState, Input, Select } from "../../components/ui";
import {
  publicListingsRepository,
  type PublicCategory,
  type PublicJobSummary,
  type PublicListingsRepository,
  type PublicService
} from "../../lib/publicListings";
import { PublicFooter, PublicHeader } from "./PublicLayout";
import "./public.css";

function formatRate(job: PublicJobSummary) {
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

function JobCard({ job }: { job: PublicJobSummary }) {
  return (
    <Link to={`/jobs/${job.slug}`} className="public-job-card">
      <div className="public-job-card-top">
        <span className="public-job-card-service">{job.categoryName || job.serviceName}</span>
        <ArrowRight size={17} aria-hidden />
      </div>
      <h2>{job.title}</h2>
      <p className="public-job-card-company">{job.companyName}</p>
      <p className="public-job-card-summary">{job.summary}</p>
      <div className="public-job-card-meta">
        <span>{job.workMode || "Flexible"}</span>
        <span>{job.locationLabel}</span>
        <span>{job.employmentType || "Role"}</span>
      </div>
      <div className="public-job-card-foot">
        <strong>{formatRate(job)}</strong>
        <span>View role</span>
      </div>
    </Link>
  );
}

export function PublicJobsPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [serviceSlug, setServiceSlug] = useState(searchParams.get("service") ?? "");
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") ?? "");
  const [workMode, setWorkMode] = useState(searchParams.get("workMode") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [services, setServices] = useState<PublicService[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      repository.listServices(),
      repository.listCategories(),
      repository.listJobs({ query, serviceSlug, categorySlug, workMode, location, limit: 24 })
    ]).then(([serviceRows, categoryRows, result]) => {
      if (!active) return;
      setServices(serviceRows);
      setCategories(categoryRows);
      setJobs(result.jobs);
      setTotal(result.total);
      setError(null);
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : "Jobs could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [repository, query, serviceSlug, categorySlug, workMode, location]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("query", query.trim());
    if (serviceSlug) next.set("service", serviceSlug);
    if (categorySlug) next.set("category", categorySlug);
    if (workMode) next.set("workMode", workMode);
    if (location.trim()) next.set("location", location.trim());
    navigate(`/jobs${next.toString() ? `?${next.toString()}` : ""}`);
  };

  return (
    <main className="public-page">
      <PublicHeader />
      <section className="public-shell public-directory-hero">
        <p className="public-eyebrow">Open opportunities</p>
        <h1>Find work that <em>fits.</em></h1>
        <p className="public-lede">Useful details up front, a clearer application path, and roles selected for people who want to do good work.</p>
        <form className="public-filter-bar" onSubmit={submit}>
          <label><span>Role or keyword</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “designer”" /></label>
          <label><span>Category</span><Select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</Select></label>
          <label><span>Service</span><Select value={serviceSlug} onChange={(event) => setServiceSlug(event.target.value)}><option value="">All services</option>{services.map((service) => <option key={service.slug} value={service.slug}>{service.label}</option>)}</Select></label>
          <label><span>Work mode</span><Select value={workMode} onChange={(event) => setWorkMode(event.target.value)}><option value="">Any mode</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option></Select></label>
          <label><span>Location</span><Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Anywhere" /></label>
          <button type="submit" className="public-filter-submit"><Search size={17} aria-hidden /> Search</button>
        </form>
      </section>

      <section className="public-shell public-directory-results" aria-label="Open jobs">
        <div className="public-results-heading"><div><p className="public-eyebrow">The directory</p><h2>{loading ? "Finding the right roles…" : `${total} ${total === 1 ? "role" : "roles"} worth a look`}</h2></div><Link to="/login" className="public-inline-link">Create a profile <ArrowRight size={15} aria-hidden /></Link></div>
        {error ? <div role="alert" className="public-alert">{error}</div> : loading ? <div className="public-loading" role="status">Loading published roles…</div> : jobs.length === 0 ? <EmptyState title="No published roles match yet" description="Try another search, or check back as new opportunities are approved." /> : <div className="public-job-grid">{jobs.map((job) => <JobCard job={job} key={job.id} />)}</div>}
      </section>
      <PublicFooter />
    </main>
  );
}
