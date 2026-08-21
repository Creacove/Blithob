import {
  ArrowRight,
  Check,
  Compass,
  Globe2,
  Menu,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import {
  CategoryFolders,
  FinalWorkspace,
  JobCard,
  NotebookSteps,
  SearchPanel
} from "../components/landing/LandingArtwork";
import { heroDesktopAssetFixed } from "../components/landing/heroDesktopAsset.fixed";
import { proofMainAssetFixed } from "../components/landing/proofMainAsset.fixed";
import "./LandingPage.css";

const jobs = [
  {
    title: "Frontend Developer",
    rate: "£1,500 / project",
    type: "Contract",
    location: "Remote",
    accent: "#0B86D7"
  },
  {
    title: "Social Media Manager",
    rate: "£900 / month",
    type: "Part-time",
    location: "Remote",
    accent: "#70C7ED"
  },
  {
    title: "Customer Support Rep",
    rate: "£750 / month",
    type: "Full-time",
    location: "Remote",
    accent: "#CFE8D2"
  }
];

const reasons = [
  {
    title: "Clear job requirements",
    copy: "Understand the role, expectations, and important details before you apply.",
    stamp: "No surprises",
    icon: ShieldCheck
  },
  {
    title: "Straightforward applications",
    copy: "A simple application experience focused on the information that matters.",
    stamp: "Apply simply",
    icon: Compass
  },
  {
    title: "Remote-friendly opportunities",
    copy: "Discover flexible roles that can fit how and where you work.",
    stamp: "Work your way",
    icon: Globe2
  },
  {
    title: "Real support, real people",
    copy: "Clear next steps and a human path forward when you need help.",
    stamp: "We’ve got you",
    icon: Sparkles
  }
];

export function LandingPage() {
  return (
    <main className="marketing-page overflow-hidden">
      <div className="lp-ticker" aria-hidden="true">
        <div className="lp-ticker-track">
          {[0, 1].map((copy) => (
            <div className="lp-ticker-row" key={copy}>
              <span>New opportunities</span><Sparkles size={12} />
              <span>Remote work</span><Sparkles size={12} />
              <span>Creative</span><Sparkles size={12} />
              <span>Tech</span><Sparkles size={12} />
              <span>Operations</span><Sparkles size={12} />
              <span>Career growth</span><Sparkles size={12} />
            </div>
          ))}
        </div>
      </div>

      <section className="lp-hero">
        <header className="lp-header lp-shell">
          <BrandMark />

          <nav className="lp-nav" aria-label="Marketing navigation">
            <a href="#jobs">Find Jobs</a>
            <a href="#categories">Browse Categories</a>
            <a href="#process">How It Works</a>
            <a href="#why">Why Blithob Pro</a>
          </nav>

          <div className="lp-header-actions">
            <Link className="lp-btn lp-btn-secondary hidden sm:inline-flex" to="/login">
              Sign in
            </Link>
            <Link className="lp-btn lp-btn-primary hidden sm:inline-flex" to="/login">
              Get Started
            </Link>
            <details className="relative sm:hidden">
              <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-[#D8E3E8] bg-white" aria-label="Open navigation">
                <Menu size={20} />
              </summary>
              <div className="absolute right-0 top-14 z-30 grid min-w-48 gap-1 rounded-2xl border border-[#DDE5E8] bg-white p-2 text-sm font-bold shadow-xl">
                <a href="#jobs" className="rounded-xl px-3 py-2">Find Jobs</a>
                <a href="#categories" className="rounded-xl px-3 py-2">Categories</a>
                <a href="#process" className="rounded-xl px-3 py-2">How It Works</a>
                <Link to="/login" className="rounded-xl bg-[#E7F5FC] px-3 py-2 text-[#0B6F9E]">Sign in</Link>
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
              Your next <em>opportunity</em> is <em>closer</em> than you think
            </h1>

            <p className="lp-hero-copy">
              Discover handpicked opportunities, understand what the work involves,
              and find the role that fits where you want to go next.
            </p>

            <div className="lp-search-wrap">
              <SearchPanel />
            </div>

            <div className="lp-hero-proof">
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#0B86D7]" /> Clear role details</span>
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#0B86D7]" /> Remote-friendly work</span>
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#0B86D7]" /> Straightforward applications</span>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-approved-hero-art">
              <img
                src={heroDesktopAssetFixed}
                alt="Blithob Pro workspace with a laptop showing an opportunity"
              />
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
              <a href="#categories" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0B6F9E]">
                View all jobs <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="lp-job-board">
            <div className="lp-job-grid">
              {jobs.map((job) => <JobCard key={job.title} {...job} />)}
            </div>
            <div className="lp-board-note lp-script">New skills<br />New doors<br />☆</div>
          </div>
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
            <CategoryFolders />
          </div>
        </div>
      </section>

      <section id="process" className="lp-section lp-section-cream">
        <div className="lp-shell">
          <div className="lp-process-head">
            <div className="lp-kicker"><span className="lp-kicker-dot">✳</span> How it works</div>
            <h2 className="lp-display lp-serif">Getting hired shouldn’t be <em>complicated.</em></h2>
            <p className="lp-section-copy mx-auto mt-5 max-w-[620px]">
              Find the right opportunity, apply clearly, and know what the next step is.
            </p>
          </div>
          <div className="lp-process-art">
            <NotebookSteps />
          </div>
        </div>
      </section>

      <section id="why" className="lp-section lp-section-white">
        <div className="lp-shell lp-why-grid">
          <div className="lp-why-copy">
            <div className="lp-kicker"><span className="lp-kicker-dot">✳</span> Why Blithob Pro?</div>
            <h2 className="lp-display lp-serif">
              Good jobs.<br />Clear details.<br /><strong>No noise.</strong>
            </h2>
            <p className="lp-section-copy mt-6 max-w-[480px]">
              Blithob Pro is designed to cut through unnecessary friction so you can focus on opportunities that actually fit.
            </p>
            <div className="lp-script mt-9 max-w-[340px] rotate-[-2deg] text-2xl text-[#0B86D7]">
              Built for real people who want real opportunities.
            </div>
          </div>

          <div className="lp-reasons">
            {reasons.map(({ title, copy, stamp, icon: Icon }) => (
              <article className="lp-reason" key={title}>
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

      <section id="stories" className="lp-section lp-section-cream">
        <div className="lp-shell lp-proof-grid">
          <div>
            <div className="lp-kicker"><span className="lp-kicker-dot">✳</span> Success stories</div>
            <h2 className="lp-display lp-serif">People finding their <em>next move.</em></h2>
            <p className="lp-section-copy mt-5 max-w-[450px]">
              This is where verified candidate stories will live as Blithob Pro places more professionals into new opportunities.
            </p>
            <div className="lp-proof-note">
              We are keeping this section intentionally honest: no invented placement numbers and no fake testimonials.
            </div>
          </div>

          <article className="lp-proof-card">
            <img src={proofMainAssetFixed} alt="Professional working at a laptop" />
            <div className="lp-proof-card-copy">
              <div className="lp-eyebrow">Your story could be next</div>
              <blockquote className="lp-serif">
                Find work that moves your career forward, with a clearer path from opportunity to application.
              </blockquote>
              <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0B6F9E]">
                Create your profile <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="py-4 sm:py-7">
        <div className="lp-final-wrap">
          <div className="lp-final-grid">
            <div className="lp-final-copy">
              <div className="lp-kicker w-fit"><span className="lp-kicker-dot">✳</span> Your future starts now</div>
              <h2 className="lp-display lp-serif">Your next <em>opportunity</em> could be here.</h2>
              <p className="lp-section-copy mt-5 max-w-[470px]">
                Take a look. Finding and applying for the right role should not feel like a second job.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#jobs" className="lp-btn lp-btn-primary">Browse open jobs <ArrowRight size={16} /></a>
                <Link to="/login" className="lp-btn lp-btn-secondary">Create your profile <ArrowRight size={16} /></Link>
              </div>
            </div>
            <div className="lp-final-art">
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
                <Link to="/login">Sign in</Link>
              </div>
            </div>
            <div>
              <div className="lp-footer-title">Blithob Pro</div>
              <div className="lp-footer-links">
                <a href="#why">Why Blithob Pro</a>
                <a href="#stories">Success Stories</a>
                <a href="#jobs">Open Opportunities</a>
              </div>
            </div>
            <div>
              <div className="lp-footer-title">Get started</div>
              <div className="lp-footer-links">
                <Link to="/login">Create your profile</Link>
                <Link to="/login">Sign in</Link>
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
