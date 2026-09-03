import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  Headphones,
  House,
  Menu,
  ShieldCheck,
  SearchCheck,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { HeroAvatarStack } from "../components/landing/HeroAvatarStack";
import {
  CategoryFolders,
  FinalWorkspace,
  LiveJobsBoard,
  NotebookSteps,
  SearchPanel
} from "../components/landing/LandingArtwork";
import type { LandingJob } from "../components/landing/LandingArtwork";
import {
  publicListingsRepository,
  demoPublicCategories,
  demoPublicJobs,
  type PublicCategory,
  type PublicJobSummary,
  type PublicListingsRepository
} from "../lib/publicListings";
import { usePublicAccountNavigation } from "../lib/accountNavigation";
import { isDemoMode } from "../lib/supabase";
import "./LandingPage.css";

const reasons = [
  {
    title: "Clear job requirements",
    copy: "Every listing gives you the role, must-have skills, and what success looks like, up front.",
    stamp: "No surprises",
    icon: SearchCheck
  },
  {
    title: "Straightforward applications",
    copy: "Quick, simple, and respectful. Apply with only the information that actually matters.",
    stamp: "Apply in minutes",
    icon: FileCheck2
  },
  {
    title: "Remote-friendly opportunities",
    copy: "From anywhere roles to hybrid flexibility, find work that fits your life, not the other way around.",
    stamp: "Work your way",
    icon: House
  },
  {
    title: "Real support, real people",
    copy: "Get career resources, useful guidance, and a human path forward whenever you need it.",
    stamp: "We’ve got your back",
    icon: Headphones
  }
];

const whyProof = [
  { label: "Verified details", copy: "Role expectations up front", icon: BadgeCheck },
  { label: "Clear timing", copy: "No hidden application maze", icon: Zap },
  { label: "Human support", copy: "Real next-step guidance", icon: ShieldCheck }
];

const jobAccents = ["#0B86D7", "#70C7ED", "#CFE8D2", "#F2AA2B", "#7A8CF0"];

function formatPublicRate(job: PublicJobSummary) {
  if (job.rateMinMinor === undefined && job.rateMaxMinor === undefined) return "Pay shared on the role";
  const format = (value: number | undefined) => {
    if (value === undefined) return "";
    const amount = value / 100;
    if ((job.currency || "NGN") === "NGN" && amount >= 1000) {
      const thousands = amount / 1000;
      return `₦${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
    }
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: job.currency || "NGN", maximumFractionDigits: 0 }).format(amount);
  };
  if (job.rateMinMinor !== undefined && job.rateMaxMinor !== undefined) return `${format(job.rateMinMinor)} - ${format(job.rateMaxMinor)}`;
  return format(job.rateMinMinor ?? job.rateMaxMinor);
}

function toLandingJob(job: PublicJobSummary, index: number): LandingJob {
  return {
    id: job.id,
    href: `/jobs/${job.slug}`,
    title: job.title,
    company: job.companyName,
    rate: formatPublicRate(job),
    type: job.employmentType || job.workMode || "Opportunity",
    location: job.locationLabel || "Location shared on role",
    description: job.summary,
    accent: jobAccents[index % jobAccents.length]
  };
}

export function LandingPage({ repository = publicListingsRepository }: { repository?: PublicListingsRepository }) {
  const account = usePublicAccountNavigation();
  const [featuredJobs, setFeaturedJobs] = useState<PublicJobSummary[]>(() => isDemoMode ? demoPublicJobs : []);
  const [categories, setCategories] = useState<PublicCategory[]>(() => isDemoMode ? demoPublicCategories : []);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      repository.listJobs({ featuredOnly: true, limit: 5 }),
      repository.listCategories()
    ]).then(([jobsResult, categoryRows]) => {
      if (!active) return;
      setFeaturedJobs(jobsResult.jobs);
      setCategories(categoryRows);
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Jobs could not be loaded.");
    });
    return () => { active = false; };
  }, [repository]);

  const jobs = useMemo(() => featuredJobs.map(toLandingJob), [featuredJobs]);

  return (
    <main className="marketing-page overflow-hidden">
      <section className="lp-hero">
        <div className="lp-hero-media">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/landing/hero-mobile.webp"
              width={1440}
              height={960}
            />
            <img
              src="/landing/hero-desktop.webp"
              alt="Blithob Pro workspace with a laptop showing an opportunity"
              className="lp-hero-media-image"
              width={1440}
              height={960}
              fetchPriority="high"
            />
          </picture>
        </div>

        <header className="lp-header lp-shell">
          <Link to="/" className="lp-brand" aria-label="Blithob Professionals home">
            <img className="lp-brand-symbol" src="/brand/blithob-mark.png" alt="" width={512} height={512} />
            <img className="lp-brand-wordmark" src="/brand/blithob-wordmark.png" alt="" width={333} height={60} />
          </Link>

          <nav className="lp-nav" aria-label="Marketing navigation">
            <Link to="/jobs">Find Jobs</Link>
            <a href="#categories">Categories</a>
            <a href="#process">How It Works</a>
            <a href="#why">Why Blithob Pro</a>
          </nav>

          <div className="lp-header-actions">
            {account.status === "loading" && (
              <span className="lp-header-account-status hidden sm:inline-flex">Loading account…</span>
            )}
            {account.status === "signedOut" && <>
              <Link className="lp-btn lp-btn-pill lp-btn-secondary hidden sm:inline-flex" to="/login">
                Log in
              </Link>
              <Link className="lp-btn lp-btn-pill lp-btn-primary hidden sm:inline-flex" to="/login">
                Get Started
              </Link>
            </>}
            {account.status === "signedIn" && <>
              {account.applicationsPath && (
                <Link className="lp-btn lp-btn-pill lp-btn-secondary hidden sm:inline-flex" to={account.applicationsPath}>
                  My applications
                </Link>
              )}
              <Link className="lp-btn lp-btn-pill lp-btn-primary hidden sm:inline-flex" to={account.workspacePath}>
                {account.primaryLabel} <ArrowRight size={16} aria-hidden />
              </Link>
            </>}
            <details className="relative sm:hidden">
              <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-[#D8E3E8] bg-white" aria-label="Open navigation">
                <Menu size={20} />
              </summary>
              <div className="absolute right-0 top-14 z-30 grid min-w-48 gap-1 rounded-2xl border border-[#DDE5E8] bg-white p-2 text-sm font-bold shadow-xl">
                <Link to="/jobs" className="rounded-xl px-3 py-2">Find Jobs</Link>
                <a href="#categories" className="rounded-xl px-3 py-2">Categories</a>
                <a href="#process" className="rounded-xl px-3 py-2">How It Works</a>
                <a href="#why" className="rounded-xl px-3 py-2">Why Blithob Pro</a>
                {account.status === "loading" && <span className="rounded-xl bg-[#F3F7F9] px-3 py-2 text-[#6C7A82]">Loading account…</span>}
                {account.status === "signedOut" && <Link to="/login" className="rounded-xl bg-[#E7F5FC] px-3 py-2 text-[#0B6F9E]">Log in</Link>}
                {account.status === "signedIn" && <>
                  {account.applicationsPath && <Link to={account.applicationsPath} className="rounded-xl bg-[#E7F5FC] px-3 py-2 text-[#0B6F9E]">My applications</Link>}
                  <Link to={account.workspacePath} className="rounded-xl bg-[#0B86D7] px-3 py-2 text-white">{account.primaryLabel}</Link>
                </>}
              </div>
            </details>
          </div>
        </header>

        <div className="lp-hero-grid lp-shell">
          <div className="lp-hero-copy-wrap">
            <div className="lp-kicker">
              <span className="lp-kicker-dot">✳</span>
              Curated jobs. Real opportunities.
            </div>

            <h1 className="lp-serif">
              <span className="lp-headline-line">Your next</span><br className="lp-headline-break" />{" "}
              <span className="lp-headline-line"><em className="lp-hero-emphasis">opportunity</em> is</span><br className="lp-headline-break" />{" "}
              <span className="lp-headline-line">
                <span className="lp-underline-word">
                  <em className="lp-hero-emphasis">closer</em>
                  <svg className="lp-underline-squiggle" viewBox="0 0 220 22" fill="none" aria-hidden="true" preserveAspectRatio="none">
                    <path d="M4 16C48 7 96 5 140 8c26 2 50 6 76 4" stroke="var(--lp-blue)" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                than you think
              </span>
            </h1>

            <p className="lp-hero-copy">
              Discover handpicked jobs from top companies
              and find the role that fits your future.
            </p>

            <div className="lp-search-wrap">
            <SearchPanel categories={categories} />
            </div>

            <div className="lp-hero-proof">
              <HeroAvatarStack />
              <p className="lp-hero-proof-copy">
                <strong>Join 150K+ job seekers</strong>
                <span>finding better opportunities</span>
              </p>
            </div>
          </div>
        </div>

      </section>

      <section id="jobs" className="lp-section lp-section-white">
        <div className="lp-shell">
          <div className="lp-jobs-head">
            <div>
              <div className="lp-kicker"><span className="lp-kicker-dot">✳</span> Fresh opportunities, handpicked for you.</div>
              <h2 className="lp-display lp-serif">Jobs worth <em>checking out</em></h2>
            </div>
            <div>
              <p className="lp-section-copy max-w-[560px]">
                Explore opportunities with the useful details up front: what the work is,
                how it works, where it can be done, and what it pays.
              </p>
              <Link to="/jobs" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0B6F9E]">
                View all jobs <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {loadError ? (
            <p role="status" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">{loadError}</p>
          ) : (
            <LiveJobsBoard jobs={jobs} />
          )}
        </div>
      </section>

      <section id="categories" className="lp-section lp-section-blue">
        <div className="lp-shell">
          <div className="mx-auto max-w-[900px] text-center">
            <div className="lp-kicker"><span className="lp-kicker-dot">✳</span> Find your lane</div>
            <h2 className="lp-display lp-serif">Whatever you’re good at, <em>start there.</em></h2>
            <p className="lp-section-copy mx-auto mt-5 max-w-[620px]">
              Explore the kinds of work that match the skills you already have, then keep growing from there.
            </p>
          </div>
          <div className="lp-folder-stage">
            <CategoryFolders categories={categories} />
          </div>
        </div>
      </section>

      <section id="process" className="lp-process-section">
        <NotebookSteps />
      </section>

      <section id="why" className="lp-section lp-why-section">
        <div className="lp-shell lp-why-grid" role="region" aria-label="Why Blithob Pro">
          <div className="lp-why-copy">
            <div className="lp-kicker"><span className="lp-kicker-dot">✳</span> Why Blithob Pro?</div>
            <h2 className="lp-display lp-serif">
              Good jobs. <br />Clear details. <br /><strong>No bullshit.</strong>
            </h2>
            <p className="lp-section-copy mt-6 max-w-[480px]">
              Blithob Pro cuts through the noise so you can focus on opportunities that actually fit.
            </p>
            <ul className="lp-why-proof" aria-label="Blithob Pro commitments">
              {whyProof.map(({ label, copy, icon: Icon }) => (
                <li key={label}>
                  <span className="lp-why-proof-icon"><Icon size={18} aria-hidden /></span>
                  <span><strong>{label}</strong><small>{copy}</small></span>
                </li>
              ))}
            </ul>
            <div className="lp-script mt-9 max-w-[340px] rotate-[-2deg] text-2xl text-[#0B86D7]">
              ♡ Built for real people who want real opportunities.
            </div>
          </div>

          <div className="lp-reasons">
            {reasons.map(({ title, copy, stamp, icon: Icon }, index) => (
              <article className="lp-reason" key={title}>
                <span className="lp-reason-index" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                <div className="lp-reason-icon"><Icon size={24} /></div>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
                <div className="lp-stamp">{stamp}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="lp-section lp-section-cream lp-story-section">
        <div className="lp-shell lp-proof-grid">
          <div className="lp-proof-intro">
            <div className="lp-kicker"><span className="lp-kicker-dot">✳</span> Success stories</div>
            <h2 className="lp-display lp-serif">People finding their <em>next move.</em></h2>
            <p className="lp-section-copy mt-5 max-w-[450px]">
              Verified candidate stories are coming as Blithob Pro places more professionals into new opportunities.
            </p>
          </div>

          <article className="lp-proof-card" aria-label="Success story preview">
            <div className="lp-proof-card-media">
              <span className="lp-proof-card-tape" aria-hidden="true" />
              <img
                src="/landing/success-story.webp"
                alt="Professional working at a laptop"
                className="block h-auto w-full object-cover"
                width={1254}
                height={1254}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="lp-proof-card-copy">
              <div className="lp-eyebrow">Your story could be next</div>
              <blockquote className="lp-serif">
                Find work that moves your career forward, with a clearer path from opportunity to application.
              </blockquote>
              <Link to={account.status === "signedIn" ? account.workspacePath : "/login"} className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0B6F9E]">
                {account.status === "signedIn" ? account.primaryLabel : "Create your profile"} <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="lp-final-section py-4 sm:py-7">
        <div className="lp-final-wrap">
          <div className="lp-final-grid">
            <div className="lp-final-copy">
              <div className="lp-kicker w-fit"><span className="lp-kicker-dot">✳</span> Your future starts now</div>
              <h2 className="lp-display lp-serif">Your next <em>opportunity</em> could be here.</h2>
              <p className="lp-section-copy mt-5 max-w-[470px]">
                Take a look. Finding and applying for the right role should not feel like a second job.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/jobs" className="lp-btn lp-btn-primary">Browse open jobs <ArrowRight size={16} /></Link>
                <Link to={account.status === "signedIn" ? account.workspacePath : "/login"} className="lp-btn lp-btn-secondary">{account.status === "signedIn" ? account.primaryLabel : "Create your profile"} <ArrowRight size={16} /></Link>
              </div>
            </div>
            <div className="lp-final-art" role="img" aria-label="Sunlit workspace with a laptop, notebooks, and a plant">
              <FinalWorkspace />
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer-grid">
            <div>
              <BrandMark />
              <p className="mt-4 max-w-[280px] text-sm leading-6 text-[#6C7A82]">
                Connecting capable professionals with clearer opportunities and a better path forward.
              </p>
            </div>
            <div>
              <div className="lp-footer-title">For job seekers</div>
              <div className="lp-footer-links">
                <a href="#jobs">Find Jobs</a>
                <a href="#categories">Browse Categories</a>
                <a href="#process">How It Works</a>
              </div>
            </div>
            <div>
              <div className="lp-footer-title">Blithob Pro</div>
              <div className="lp-footer-links">
                <a href="#why">Why Blithob Pro</a>
                <a href="#stories">Success Stories</a>
              </div>
            </div>
            <div>
              <div className="lp-footer-title">Get started</div>
              <div className="lp-footer-links">
                {account.status === "loading" && <span>Loading account…</span>}
                {account.status === "signedOut" && <>
                  <Link to="/login">Create your profile</Link>
                  <Link to="/login">Sign in</Link>
                </>}
                {account.status === "signedIn" && <>
                  {account.applicationsPath && <Link to={account.applicationsPath}>My applications</Link>}
                  <Link to={account.workspacePath}>{account.primaryLabel}</Link>
                </>}
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 Blithob Pro. All rights reserved.</span>
            <span>Clear opportunities. Better next steps.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
