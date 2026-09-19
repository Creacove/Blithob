import { ArrowRight, BriefcaseBusiness, Laptop, LayoutGrid, MapPin, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/ui";
import { CustomDropdown } from "../../components/CustomDropdown";
import {
  publicListingsRepository,
  type PublicCategory,
  type PublicJobSummary,
  type PublicListingsRepository,
  type PublicService
} from "../../lib/publicListings";
import { usePublicAccountNavigation } from "../../lib/accountNavigation";
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
        <span className="public-job-card-cta">
          View role <ArrowRight size={12} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function PublicJobsPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const account = usePublicAccountNavigation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") ?? searchParams.get("query") ?? "");
  const [serviceSlug, setServiceSlug] = useState(searchParams.get("service") ?? "");
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") ?? "");
  const [workMode, setWorkMode] = useState(searchParams.get("workMode") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [countryCode, setCountryCode] = useState(searchParams.get("country") ?? "");
  const [employmentType, setEmploymentType] = useState(searchParams.get("employmentType") ?? "");
  const [minRate, setMinRate] = useState(searchParams.get("minRate") ?? "");
  const [maxRate, setMaxRate] = useState(searchParams.get("maxRate") ?? "");
  const [offset, setOffset] = useState(Number(searchParams.get("offset") ?? 0) || 0);
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
      repository.listJobs({ query, serviceSlug, categorySlug, workMode, location, countryCode, employmentType,
        minRateMinor: Number.isFinite(Number(minRate)) && minRate ? Number(minRate) * 100 : undefined,
        maxRateMinor: Number.isFinite(Number(maxRate)) && maxRate ? Number(maxRate) * 100 : undefined,
        limit: 24, offset })
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
  }, [repository, query, serviceSlug, categorySlug, workMode, location, countryCode, employmentType, minRate, maxRate, offset]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (serviceSlug) next.set("service", serviceSlug);
    if (categorySlug) next.set("category", categorySlug);
    if (workMode) next.set("workMode", workMode);
    if (location.trim()) next.set("location", location.trim());
    if (countryCode) next.set("country", countryCode);
    if (employmentType) next.set("employmentType", employmentType);
    if (minRate && Number.isFinite(Number(minRate))) next.set("minRate", minRate);
    if (maxRate && Number.isFinite(Number(maxRate))) next.set("maxRate", maxRate);
    setOffset(0);
    navigate(`/jobs${next.toString() ? `?${next.toString()}` : ""}`);
  };

  return (
    <main className="public-page">
      <PublicHeader />
      <section className="public-shell public-directory-hero">
        <h1>Find work that <em>fits.</em></h1>
        <p className="public-lede">Useful details up front, a clearer application path, and roles selected for people who want to do good work.</p>
        <form className="public-filter-bar" onSubmit={submit}>
          {/* Role search */}
          <label>
            <span>Role or keyword</span>
            <div className="public-filter-zone">
              <Search size={17} className="public-filter-zone-icon" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Job title, skills, or company…'
                aria-label="Search by role or keyword"
              />
            </div>
          </label>

          <div className="public-filter-divider" aria-hidden="true" />

          {/* Category */}
          <label>
            <span>Category</span>
            <div className="public-filter-dropdown-wrap">
              <CustomDropdown
                value={categorySlug}
                onChange={setCategorySlug}
                placeholder="Category"
                ariaLabel="Filter by category"
                icon={<LayoutGrid size={16} />}
                options={[
                  { value: "", label: "All categories" },
                  ...categories.map((category) => ({ value: category.slug, label: category.name }))
                ]}
              />
            </div>
          </label>

          <div className="public-filter-divider" aria-hidden="true" />

          {/* Service */}
          <label>
            <span>Service</span>
            <div className="public-filter-dropdown-wrap">
              <CustomDropdown
                value={serviceSlug}
                onChange={setServiceSlug}
                placeholder="Service"
                ariaLabel="Filter by service"
                icon={<BriefcaseBusiness size={16} />}
                options={[
                  { value: "", label: "All services" },
                  ...services.map((service) => ({ value: service.slug, label: service.label }))
                ]}
              />
            </div>
          </label>

          <div className="public-filter-divider" aria-hidden="true" />

          {/* Work mode */}
          <label>
            <span>Work mode</span>
            <div className="public-filter-dropdown-wrap">
              <CustomDropdown
                value={workMode}
                onChange={setWorkMode}
                placeholder="Work mode"
                ariaLabel="Filter by work mode"
                icon={<Laptop size={16} />}
                options={[
                  { value: "", label: "Any mode" },
                  { value: "Remote", label: "Remote" },
                  { value: "Hybrid", label: "Hybrid" },
                  { value: "On-site", label: "On-site" }
                ]}
              />
            </div>
          </label>

          <div className="public-filter-divider" aria-hidden="true" />

          {/* Location */}
          <label>
            <span>Location</span>
            <div className="public-filter-zone">
              <MapPin size={17} className="public-filter-zone-icon" aria-hidden="true" />
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location or Remote"
                aria-label="Search by location"
              />
            </div>
          </label>

          {/* Submit */}
          <button type="submit" className="public-filter-submit">
            <Search size={16} aria-hidden="true" />
            Search
          </button>
          <label><span>Country</span><input value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase().slice(0, 2))} placeholder="NG" aria-label="Filter by country" /></label>
          <label><span>Employment</span><select value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} aria-label="Filter by employment type"><option value="">Any type</option><option>Full-time</option><option>Part-time</option><option>Contract</option></select></label>
          <label><span>Minimum rate (₦)</span><input type="number" min="0" value={minRate} onChange={(event) => setMinRate(event.target.value)} aria-label="Minimum rate" /></label>
          <label><span>Maximum rate (₦)</span><input type="number" min="0" value={maxRate} onChange={(event) => setMaxRate(event.target.value)} aria-label="Maximum rate" /></label>
        </form>
      </section>

      <section className="public-shell public-directory-results" aria-label="Open jobs">
        <div className="public-results-heading"><div><h2>{loading ? "Finding the right roles…" : `${total} ${total === 1 ? "role" : "roles"} worth a look`}</h2></div><Link to={account.status === "signedIn" ? account.workspacePath : "/login"} className="public-inline-link">{account.status === "signedIn" ? account.primaryLabel : "Create a profile"} <ArrowRight size={15} aria-hidden /></Link></div>
        {error ? <div role="alert" className="public-alert">{error}</div> : loading ? <div className="public-loading" role="status">Loading published roles…</div> : jobs.length === 0 ? <EmptyState title="No published roles match yet" description="Try another search, or check back as new opportunities are approved." /> : <><div className="public-job-grid">{jobs.map((job) => <JobCard job={job} key={job.id} />)}</div><div className="mt-6 flex justify-between gap-3"><button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 24))}>Previous</button><button type="button" disabled={offset + jobs.length >= total} onClick={() => setOffset(offset + 24)}>Next</button></div></>}
      </section>
      <PublicFooter />
    </main>
  );
}
