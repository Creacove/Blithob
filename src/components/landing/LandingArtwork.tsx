import type { CSSProperties } from "react";
import { useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, ChevronDown, LayoutGrid, MapPin, Search, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { PublicCategory } from "../../lib/publicListings";

const blue = "#178FC8";
const blueDeep = "#0B5F8A";

export function HeroWorkspace() {
  return (
    <div className="relative mx-auto aspect-[1.08/1] w-full max-w-[620px]">
      <div className="absolute inset-[4%_2%_2%_8%] overflow-hidden rounded-[2.2rem] bg-[#CDEEFF] shadow-[0_34px_80px_rgba(14,95,138,0.16)]">
        <div className="absolute inset-x-0 top-0 h-[44%] bg-[#DFF5FF]" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[#E8D2B6]" />
        <div className="absolute left-[6%] top-[8%] h-[30%] w-[28%] rounded-[1.4rem] border-[10px] border-white/80 bg-[#BFE6F7]">
          <div className="absolute inset-x-[8%] top-1/2 h-2 bg-white/70" />
          <div className="absolute inset-y-[8%] left-1/2 w-2 bg-white/70" />
        </div>

        <div className="absolute right-[7%] top-[11%] h-[20%] w-[27%] rotate-3 rounded-[1.1rem] bg-white shadow-md">
          <div className="absolute left-[9%] top-[13%] h-2 w-[46%] rounded bg-[#A3D9EE]" />
          <div className="absolute left-[9%] top-[28%] h-2 w-[70%] rounded bg-[#D8E8ED]" />
          <div className="absolute left-[9%] top-[43%] h-2 w-[58%] rounded bg-[#D8E8ED]" />
          <div className="absolute bottom-[13%] right-[10%] h-6 w-6 rounded-full bg-[#FFD85A]" />
        </div>

        <div className="absolute bottom-[12%] left-[5%] h-[29%] w-[17%]">
          <div className="absolute bottom-0 left-[20%] h-[34%] w-[58%] rounded-b-[1rem] rounded-t-[0.35rem] bg-[#E8F2F2]" />
          <div className="absolute bottom-[26%] left-[45%] h-[55%] w-[10%] rounded-full bg-[#3C7A5D]" />
          <div className="absolute bottom-[39%] left-[5%] h-[24%] w-[50%] -rotate-[28deg] rounded-[100%_0] bg-[#65B77D]" />
          <div className="absolute bottom-[53%] right-[3%] h-[22%] w-[45%] rotate-[28deg] rounded-[0_100%] bg-[#65B77D]" />
          <div className="absolute bottom-[66%] left-[22%] h-[21%] w-[45%] -rotate-[12deg] rounded-[100%_0] bg-[#80C98F]" />
        </div>

        <div className="absolute bottom-[7%] left-[18%] right-[7%] h-[15%] rounded-[1.2rem] bg-[#C79E72] shadow-[0_10px_25px_rgba(92,66,36,0.18)]" />
        <div className="absolute bottom-[10%] left-[25%] h-[6%] w-[15%] rounded-full bg-[#F8F4EA]" />
        <div className="absolute bottom-[11.5%] left-[29%] h-[3%] w-[8%] rounded-full border-2 border-[#B9A184]" />

        <div className="absolute bottom-[20%] right-[10%] h-[55%] w-[58%] rotate-[-1.5deg] rounded-[1.4rem] border-[9px] border-[#116D9A] bg-[#178FC8] shadow-[0_24px_45px_rgba(14,95,138,0.28)]">
          <div className="absolute inset-[5%] overflow-hidden rounded-[0.75rem] bg-white">
            <div className="flex h-[13%] items-center gap-2 border-b border-[#D7E8EF] px-[5%]">
              <span className="h-2 w-2 rounded-full bg-[#F28B67]" />
              <span className="h-2 w-2 rounded-full bg-[#FFD85A]" />
              <span className="h-2 w-2 rounded-full bg-[#79CFA4]" />
            </div>
            <div className="p-[7%]">
              <div className="text-[clamp(10px,1.1vw,14px)] font-extrabold tracking-[-0.04em] text-[#15202B]">
                Product Designer
              </div>
              <div className="mt-[4%] flex gap-1.5">
                <span className="rounded-full bg-[#E4F5FD] px-2 py-1 text-[8px] font-bold text-[#0B6F9E]">Remote</span>
                <span className="rounded-full bg-[#FFF2C4] px-2 py-1 text-[8px] font-bold text-[#775E00]">Contract</span>
              </div>
              <div className="mt-[7%] h-2 w-[80%] rounded bg-[#E7EEF1]" />
              <div className="mt-[3%] h-2 w-[58%] rounded bg-[#E7EEF1]" />
              <div className="mt-[8%] flex items-center justify-between rounded-lg bg-[#F5F8FA] p-[5%]">
                <span className="text-[8px] font-semibold text-[#5D6A74]">₦450K – ₦650K</span>
                <span className="rounded-full bg-[#178FC8] px-3 py-1.5 text-[8px] font-extrabold text-white">Apply</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-[11%] left-[-9%] right-[-9%] h-[13%] rounded-[0.7rem_0.7rem_1.7rem_1.7rem] bg-[#D8E2E6] shadow-[0_10px_18px_rgba(21,32,43,0.16)]">
            <div className="mx-auto mt-[3%] h-[28%] w-[18%] rounded-b-xl bg-[#AAB8BF]" />
          </div>
        </div>

        <div className="absolute right-[2%] top-[36%] rotate-6 rounded-xl bg-[#FFD85A] px-3 py-2 font-[cursive] text-[11px] font-bold text-[#5E4A00] shadow-md">
          dream job?
        </div>
        <div className="absolute left-[28%] top-[13%] -rotate-3 rounded-lg bg-white px-3 py-2 font-[cursive] text-[10px] font-bold text-[#0B5F8A] shadow-sm">
          you’ve got this!
        </div>
      </div>
      <div className="absolute -left-[2%] top-[22%] hidden rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_16px_35px_rgba(21,32,43,0.14)] backdrop-blur sm:block">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#15202B]">
          <Sparkles size={14} className="text-[#F5A623]" />
          New roles daily
        </div>
      </div>
    </div>
  );
}
export function NotebookSteps() {
  const steps = [
    { number: "01", title: "Find", copy: "Discover curated job opportunities that match your skills, goals, and what matters most to you.", action: "Done ✓" },
    { number: "02", title: "Apply", copy: "Apply in minutes with a smarter, streamlined process that helps you stand out.", action: "Sent ↗" },
    { number: "03", title: "Move forward", copy: "Track your applications, get real-time updates, and take the next step with clarity and confidence.", action: "Next move →" }
  ];

  return (
    <div className="lp-process-notebook" role="region" aria-label="How Blithob Pro works">
      <picture className="lp-process-picture">
        <source media="(max-width: 1100px)" srcSet="/landing/process-mobile.webp" width={941} height={1672} />
        <img src="/landing/process-desktop.webp" alt="Blank notebook on a warm desk" width={1672} height={941} loading="lazy" decoding="async" />
      </picture>
      <div className="lp-process-overlay">
        <div className="lp-process-heading">
          <div className="lp-process-kicker">How it works</div>
          <h2 className="lp-display lp-serif">Getting hired <br />shouldn’t be <em>complicated.</em></h2>
          <p className="lp-section-copy">Blithob Pro makes it simple to find the right opportunities, apply with confidence, and move your career forward.</p>
        </div>
        <div className="lp-process-note lp-process-note-blue">Progress<br />over<br />perfection<br />♡</div>
        <div className="lp-process-note lp-process-note-yellow">New skills<br />New doors<br />☆</div>
        <div className="lp-process-steps">
          {steps.map((step) => (
            <article className="lp-process-step" key={step.title}>
              <div className="lp-process-step-number">{step.number}</div>
              <h3 className="lp-serif">{step.title}</h3>
              <div className="lp-process-step-rule" aria-hidden />
              <p>{step.copy}</p>
              <span className="lp-process-step-action">{step.action}</span>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
export function CategoryFolders({ categories = [] }: { categories?: PublicCategory[] }) {
  const tones = ["#168FC8", "#BFEAF8", "#FFD85A", "#0B5F8A", "#BDEBD6"];
  const folders = categories.map((category, index) => ({
    label: category.name.toUpperCase(),
    slug: category.slug,
    tone: tones[index % tones.length],
    x: `${Math.min(index * 20, 80)}%`,
    y: index % 2 ? "1%" : "10%",
    r: index % 2 ? "3deg" : "-5deg",
    dx: `${Math.min(index * 20, 80)}%`,
    dy: index % 2 ? "4%" : "13%",
    dr: index % 2 ? "-3deg" : "-7deg",
    z: index + 1
  }));

  return (
    <div className="lp-category-folders" role="region" aria-label="Job categories">
      {folders.length === 0 ? (
        <p className="col-span-full rounded-2xl border border-dashed border-white/60 bg-white/30 px-6 py-10 text-center text-sm font-semibold text-[#0B5F8A]">
          New categories will appear here as opportunities are published.
        </p>
      ) : folders.map((folder) => (
        <article
          key={folder.label}
          className={`lp-category-folder${folder.tone === blueDeep ? " lp-category-folder-dark" : ""}`}
          style={{
            "--folder-tone": folder.tone,
            "--folder-x": folder.x,
            "--folder-y": folder.y,
            "--folder-r": folder.r,
            "--folder-desktop-x": folder.dx,
            "--folder-desktop-y": folder.dy,
            "--folder-desktop-r": folder.dr,
            "--folder-z": folder.z
          } as CSSProperties}
        >
          <div className="lp-category-folder-paper">
            <div className="lp-category-folder-tab" />
            <div className="lp-category-folder-body">
              <div className="lp-category-folder-label">{folder.label}</div>
              <div className="lp-category-folder-copy">Browse open roles</div>
              <div className="lp-category-folder-line lp-category-folder-line-long" />
              <div className="lp-category-folder-line lp-category-folder-line-short" />
              <div className="lp-category-folder-icon">
                <Link to={`/jobs?category=${folder.slug}`} aria-label={`Browse ${folder.label} jobs`}><BriefcaseBusiness size={17} aria-hidden /></Link>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
export function FinalWorkspace() {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[2.2rem] bg-[#CDEEFF]">
      <div className="absolute inset-x-0 top-0 h-[44%] bg-[#E0F5FF]" />
      <div className="absolute inset-x-0 bottom-0 h-[36%] bg-[#DDBF98]" />
      <div className="absolute right-[6%] top-[7%] h-[31%] w-[30%] rounded-2xl border-[8px] border-white/80 bg-[#B9E2F4]">
        <div className="absolute left-1/2 top-0 h-full w-2 bg-white/70" />
        <div className="absolute left-0 top-1/2 h-2 w-full bg-white/70" />
      </div>
      <div className="absolute bottom-[9%] left-[6%] right-[6%] h-[16%] rounded-2xl bg-[#B98D62]" />
      <div className="absolute bottom-[19%] left-[34%] h-[51%] w-[45%] rotate-[-2deg] rounded-[1.2rem] border-[8px] border-[#0B5F8A] bg-[#178FC8] shadow-[0_20px_35px_rgba(11,95,138,0.28)]">
        <div className="absolute inset-[6%] rounded-lg bg-white p-[6%]">
          <div className="text-[11px] font-black tracking-tight text-[#15202B]">Open opportunities</div>
          <div className="mt-[7%] space-y-2">
            <div className="rounded-lg bg-[#F1F7F9] p-2">
              <div className="h-2 w-[70%] rounded bg-[#9ED7EB]" />
              <div className="mt-2 h-1.5 w-[42%] rounded bg-[#D8E5E9]" />
            </div>
            <div className="rounded-lg bg-[#F1F7F9] p-2">
              <div className="h-2 w-[58%] rounded bg-[#9ED7EB]" />
              <div className="mt-2 h-1.5 w-[48%] rounded bg-[#D8E5E9]" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[16%] left-[9%] h-[42%] w-[18%]">
        <div className="absolute bottom-0 left-[18%] h-[35%] w-[63%] rounded-xl bg-[#EEF6F4]" />
        <div className="absolute bottom-[25%] left-[46%] h-[58%] w-[9%] rounded-full bg-[#3F7D5F]" />
        <div className="absolute bottom-[42%] left-[4%] h-[24%] w-[48%] -rotate-[28deg] rounded-[100%_0] bg-[#72BE7C]" />
        <div className="absolute bottom-[58%] right-[2%] h-[20%] w-[46%] rotate-[25deg] rounded-[0_100%] bg-[#72BE7C]" />
      </div>
      <div className="absolute left-[12%] top-[13%] -rotate-3 rounded-xl bg-[#FFD85A] px-4 py-3 font-[cursive] text-sm font-bold text-[#604B00] shadow-md">
        next move →
      </div>
    </div>
  );
}

export type LandingJob = {
  id?: string;
  href?: string;
  title: string;
  company: string;
  rate: string;
  type: string;
  location: string;
  description: string;
  accent?: string;
};

export function LiveJobsBoard({ jobs }: { jobs: LandingJob[] }) {
  const navigate = useNavigate();
  return (
    <div className="lp-job-board-live" role="region" aria-label="Featured job opportunities">
      <picture className="lp-job-board-picture">
        <source
          media="(max-width: 1100px)"
          srcSet="/landing/jobs-board-mobile.webp"
          width={864}
          height={1821}
        />
        <img
          src="/landing/jobs-board-desktop.webp"
          alt="Blank job clips on a workspace board"
          width={1672}
          height={941}
          loading="lazy"
          decoding="async"
        />
      </picture>

      <div className="lp-job-overlay-layer" aria-label="Featured jobs">
        {jobs.length === 0 ? (
          <div className="lp-job-overlay-empty">
            <strong>New roles are being prepared.</strong>
            <span>Check back soon or browse the full job directory.</span>
            <Link to="/jobs" className="lp-job-overlay-action">Browse all jobs <ArrowUpRight size={12} aria-hidden /></Link>
          </div>
        ) : jobs.slice(0, 5).map((job, index) => (
          <article
            className={`lp-job-overlay lp-job-overlay-${index + 1}`}
            key={job.id ?? `${job.title}-${index}`}
            style={{ "--job-accent": job.accent ?? blue } as CSSProperties}
          >
            <div className="lp-job-overlay-inner">
              <span className="lp-job-overlay-eyebrow">Featured role</span>
              <h3>{job.title}</h3>
              <p className="lp-job-overlay-company">{job.company}</p>
              <div className="lp-job-overlay-meta">
                <span>{job.type}</span>
                <span>{job.location}</span>
              </div>
              <p className="lp-job-overlay-description">{job.description}</p>
              <div className="lp-job-overlay-foot">
                <strong>{job.rate}</strong>
                <button type="button" className="lp-job-overlay-action" aria-label={`View ${job.title} job`} onClick={() => navigate(job.href ?? "/jobs")}>
                  <span className="lp-job-action-full">View job</span>
                  <span className="lp-job-action-short">View</span>
                  <ArrowUpRight size={12} aria-hidden />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SearchPanel({ categories = [] }: { categories?: PublicCategory[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [location, setLocation] = useState("");
  return (
    <form className="lp-search-panel" onSubmit={(event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (categorySlug) params.set("category", categorySlug);
      if (location.trim()) params.set("location", location.trim());
      navigate(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
    }}>
      <label className="lp-search-field">
        <BriefcaseBusiness size={18} className="lp-search-field-icon" aria-hidden />
        <span className="lp-search-field-text">
          <span className="lp-search-field-label">Role</span>
          <input aria-label="Search by role" className="lp-search-field-value bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Product Designer" />
        </span>
      </label>
      <label className="lp-search-field">
        <LayoutGrid size={18} className="lp-search-field-icon" aria-hidden />
        <span className="lp-search-field-text">
          <span className="lp-search-field-label">Category</span>
          <select aria-label="Search by category" className="lp-search-field-value appearance-none bg-transparent outline-none" value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </span>
        <ChevronDown size={16} className="lp-search-field-chevron" aria-hidden />
      </label>
      <label className="lp-search-field">
        <MapPin size={18} className="lp-search-field-icon" aria-hidden />
        <span className="lp-search-field-text">
          <span className="lp-search-field-label">Location</span>
          <input aria-label="Search by location" className="lp-search-field-value bg-transparent outline-none" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Anywhere" />
        </span>
      </label>
      <button type="submit" className="lp-search-submit">
        Search Jobs
        <Search size={16} aria-hidden />
      </button>
    </form>
  );
}

