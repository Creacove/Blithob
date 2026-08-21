import {
  ArrowRight,
  Check,
  Compass,
  Globe2,
  ShieldCheck,
  Sparkles,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import {
  CategoryFolders,
  FinalWorkspace,
  HeroWorkspace,
  JobCard,
  NotebookSteps,
  SearchPanel
} from "../components/landing/LandingArtwork";

const jobs = [
  {
    title: "Frontend Developer",
    rate: "£1,500 / project",
    type: "Contract",
    location: "Remote",
    accent: "#178FC8"
  },
  {
    title: "Social Media Manager",
    rate: "£900 / month",
    type: "Part-time",
    location: "Remote",
    accent: "#FFD85A"
  },
  {
    title: "Customer Support Rep",
    rate: "£750 / month",
    type: "Full-time",
    location: "Remote",
    accent: "#BDEBD6"
  }
];

const reasons = [
  ["Clear job requirements", "Know what is expected before you apply."],
  ["Straightforward applications", "No ridiculous twenty-step process."],
  ["Remote-friendly opportunities", "Roles you can realistically access."],
  ["Real support", "Know what happens next at every stage."]
];

export function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#F8F4EA] text-[#15202B]">
      <style>{`
        @keyframes blithob-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes blithob-float {
          0%,100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .blithob-marquee { animation: blithob-marquee 28s linear infinite; }
        .blithob-float { animation: blithob-float 7s ease-in-out infinite; }
        .blithob-grid {
          background-image:
            linear-gradient(rgba(23,143,200,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,143,200,.055) 1px, transparent 1px);
          background-size: 42px 42px;
        }
        @media (prefers-reduced-motion: reduce) {
          .blithob-marquee,.blithob-float { animation: none; }
        }
      `}</style>

      <div className="relative overflow-hidden border-b border-[#D6E6EC] bg-[#0F2634] py-2.5 text-white">
        <div className="blithob-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-7 pr-7 text-[10px] font-extrabold uppercase tracking-[0.22em] sm:text-xs">
              <span>New opportunities</span>
              <Sparkles size={13} className="text-[#FFD85A]" />
              <span>Remote work</span>
              <Sparkles size={13} className="text-[#BDEBD6]" />
              <span>Creative</span>
              <Sparkles size={13} className="text-[#FFD85A]" />
              <span>Tech</span>
              <Sparkles size={13} className="text-[#BDEBD6]" />
              <span>Operations</span>
              <Sparkles size={13} className="text-[#FFD85A]" />
            </div>
          ))}
        </div>
      </div>

      <section className="blithob-grid relative">
        <header className="relative z-20 mx-auto flex max-w-[1380px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <BrandMark />
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#jobs"
              className="hidden rounded-full px-4 py-2.5 text-sm font-extrabold text-[#32424C] transition hover:bg-white/70 sm:inline-flex"
            >
              Browse jobs
            </a>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#0D6D9B]/20 bg-white px-5 text-sm font-extrabold text-[#0D6D9B] shadow-sm transition hover:-translate-y-0.5 hover:border-[#178FC8]"
            >
              Sign in
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1380px] gap-8 px-5 pb-14 pt-5 sm:px-8 sm:pb-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-10 lg:px-10 lg:pb-24 lg:pt-8">
          <div className="relative z-10 max-w-[700px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#178FC8]/20 bg-[#EAF7FC] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#0B6F9E] sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-[#FFD85A]" />
              Curated remote opportunities
            </div>
            <h1 className="mt-6 max-w-[10ch] text-[clamp(3.15rem,7.2vw,7.4rem)] font-black leading-[0.88] tracking-[-0.075em] text-[#142430]">
              Your next opportunity is closer than you think.
            </h1>
            <p className="mt-6 max-w-[58ch] text-base font-medium leading-7 text-[#5C6A73] sm:text-lg">
              Discover clear, practical opportunities and apply without the noise.
              Good work should feel easier to find.
            </p>

            <div className="mt-7 max-w-[710px]">
              <SearchPanel />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-[#66747D]">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#178FC8]" /> No long forms</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#178FC8]" /> Remote-friendly roles</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#178FC8]" /> Clear pay details</span>
            </div>
          </div>

          <div className="blithob-float relative lg:translate-x-[2%]">
            <HeroWorkspace />
          </div>
        </div>
      </section>

      <section id="jobs" className="relative bg-[#FFFDF7] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#178FC8]">Fresh opportunities</div>
              <h2 className="mt-4 max-w-[10ch] text-[clamp(2.7rem,5.6vw,5.8rem)] font-black leading-[0.92] tracking-[-0.065em]">
                Jobs worth checking out.
              </h2>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-[56ch] text-base leading-7 text-[#68757E] sm:text-lg">
                Real roles with the details you actually need: what the work is, how it works, and what it pays.
              </p>
              <a href="#categories" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0B6F9E]">
                View all jobs <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {jobs.map((job) => <JobCard key={job.title} {...job} />)}
          </div>
        </div>
      </section>

      <section id="categories" className="relative overflow-hidden bg-[#DDF4FF] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-white/35" />
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto max-w-[820px] text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#0B6F9E]">Find your lane</div>
            <h2 className="mt-4 text-[clamp(2.7rem,5.2vw,5.4rem)] font-black leading-[0.94] tracking-[-0.06em]">
              Whatever you’re good at, start there.
            </h2>
            <p className="mx-auto mt-5 max-w-[58ch] text-base leading-7 text-[#55717F] sm:text-lg">
              Explore work by the skills you already have, then build from there.
            </p>
          </div>
          <div className="mt-10">
            <CategoryFolders />
          </div>
        </div>
      </section>

      <section className="bg-[#F8F4EA] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-12 max-w-[760px]">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#178FC8]">Simple by design</div>
            <h2 className="mt-4 text-[clamp(2.65rem,5vw,5rem)] font-black leading-[0.94] tracking-[-0.06em]">
              Getting hired shouldn’t be complicated.
            </h2>
          </div>
          <NotebookSteps />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0E6D98] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-[#BDEBD6]/15" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FFD85A]/12" />
        <div className="relative mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#C6ECFA]">Why Blithob Pro</div>
            <h2 className="mt-4 max-w-[8ch] text-[clamp(3rem,6vw,6rem)] font-black leading-[0.9] tracking-[-0.07em]">
              Good jobs. Clear details. No noise.
            </h2>
            <p className="mt-6 max-w-[48ch] text-base leading-7 text-[#D8EEF7] sm:text-lg">
              The platform is built around the candidate, not around making simple things feel difficult.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {reasons.map(([title, copy], index) => (
              <article
                key={title}
                className={`rounded-[1.7rem] p-6 shadow-[0_18px_40px_rgba(0,0,0,.08)] ${
                  index === 1 ? "bg-[#FFD85A] text-[#2C2A22]" :
                  index === 2 ? "bg-[#BDEBD6] text-[#173A2D]" :
                  "bg-white text-[#15202B]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black/5">
                    {index === 0 ? <ShieldCheck size={20} /> : index === 1 ? <Compass size={20} /> : index === 2 ? <Globe2 size={20} /> : <Sparkles size={20} />}
                  </div>
                  <span className="text-xs font-black opacity-45">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-xl font-black tracking-[-0.04em]">{title}</h3>
                <p className="mt-2 text-sm leading-6 opacity-75">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FFFDF7] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#178FC8]">Human proof</div>
              <h2 className="mt-4 text-[clamp(2.8rem,5.4vw,5.5rem)] font-black leading-[0.92] tracking-[-0.065em]">
                People finding their next move.
              </h2>
              <p className="mt-5 max-w-[44ch] text-base leading-7 text-[#69767E]">
                When real success stories are available, they live here. Until then, we keep this section honest.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-3 -top-4 rotate-[-7deg] rounded-xl bg-[#FFD85A] px-4 py-3 font-[cursive] text-sm font-bold text-[#5E4A00] shadow-md">
                real stories only
              </div>
              <article className="overflow-hidden rounded-[2.2rem] border border-[#DCE5E8] bg-[#DDF4FF] p-6 sm:p-8">
                <div className="grid gap-7 sm:grid-cols-[160px_1fr] sm:items-center">
                  <div className="relative mx-auto aspect-square w-full max-w-[170px] overflow-hidden rounded-[2rem] bg-[#178FC8]">
                    <div className="absolute inset-[13%] rounded-[1.4rem] bg-[#FFF7E8]">
                      <div className="absolute left-1/2 top-[18%] h-[29%] w-[29%] -translate-x-1/2 rounded-full bg-[#8E5A3A]" />
                      <div className="absolute bottom-[14%] left-1/2 h-[38%] w-[55%] -translate-x-1/2 rounded-t-[45%] bg-[#FFD85A]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex gap-1 text-[#F4B02E]">
                      {[0,1,2,3,4].map((s) => <Star key={s} size={16} fill="currentColor" />)}
                    </div>
                    <blockquote className="mt-5 text-2xl font-black leading-tight tracking-[-0.04em] text-[#15202B] sm:text-3xl">
                      “The application felt clear from the first click.”
                    </blockquote>
                    <div className="mt-5 text-sm font-extrabold text-[#0B6F9E]">Sample layout — awaiting verified testimonial</div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-5 pt-8 sm:px-8 sm:pb-8 lg:px-10">
        <div className="relative mx-auto grid max-w-[1380px] overflow-hidden rounded-[2.4rem] bg-[#DDF4FF] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#0B6F9E]">Ready?</div>
            <h2 className="mt-4 max-w-[8ch] text-[clamp(3rem,5.7vw,5.8rem)] font-black leading-[0.9] tracking-[-0.07em]">
              Your next opportunity could be here.
            </h2>
            <p className="mt-5 max-w-[46ch] text-base leading-7 text-[#55717F] sm:text-lg">
              Take a look. Finding the right role should not feel like a second job.
            </p>
            <div className="mt-7">
              <a
                href="#jobs"
                className="inline-flex min-h-13 items-center gap-2 rounded-full bg-[#178FC8] px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(23,143,200,.24)] transition hover:-translate-y-1 hover:bg-[#0B6F9E]"
              >
                Browse open jobs <ArrowRight size={17} />
              </a>
            </div>
          </div>
          <FinalWorkspace />
        </div>
      </section>

      <footer className="bg-[#F8F4EA] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-5 border-t border-[#D9E2E5] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-[#6B7880]">
            <a href="#jobs" className="hover:text-[#178FC8]">Jobs</a>
            <Link to="/login" className="hover:text-[#178FC8]">Sign in</Link>
            <span>© 2026 Blithob Pro</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
