import {
  ArrowRight,
  BriefcaseBusiness,
  Laptop2,
  PlaneTakeoff,
  Stamp
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";

const services = [
  {
    title: "Travel",
    description: "Practical guidance to help you plan and move with confidence.",
    icon: PlaneTakeoff
  },
  {
    title: "Visa Services",
    description: "Clear support through requirements, applications, and next steps.",
    icon: Stamp
  },
  {
    title: "Recruitment",
    description: "Dependable people matched to the needs of growing businesses.",
    icon: BriefcaseBusiness
  },
  {
    title: "Remote Jobs",
    description: "Training and flexible opportunities for capable professionals.",
    icon: Laptop2
  }
];

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F6F1] text-[#15202B]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(21,32,43,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(21,32,43,0.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px"
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 top-44 h-64 w-64 rounded-full bg-[#F2762E]/10 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:h-24 sm:px-8">
        <BrandMark />
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-full border border-[#15202B]/15 bg-white/70 px-5 text-sm font-semibold text-[#15202B] backdrop-blur transition hover:border-[#168CC6] hover:text-[#087DB6]"
        >
          Sign in
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl px-5 pb-10 pt-8 sm:px-8 sm:pb-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12 lg:pt-0">
        <div className="page-enter max-w-3xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#168CC6]/20 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#087DB6] shadow-sm shadow-[#168CC6]/5 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#F2762E]" />
            Travel · Visas · People · Remote work
          </div>

          <h1 className="mt-7 max-w-[13ch] text-[clamp(3.25rem,6.4vw,6.4rem)] font-semibold leading-[0.94] tracking-[-0.065em]">
            Practical support for people and businesses{" "}
            <span className="text-[#088FC9]">on the move.</span>
          </h1>
          <p className="mt-7 max-w-[60ch] text-lg leading-8 text-[#52606D] sm:text-xl">
            Blithob Pro helps people take their next step and helps businesses
            find capable support, across travel, visa services, recruitment,
            and remote work opportunities.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#services"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#088FC9] px-6 text-sm font-bold text-white shadow-lg shadow-[#088FC9]/20 transition hover:-translate-y-0.5 hover:bg-[#077FB3]"
            >
              Explore our services
              <ArrowRight size={17} />
            </a>
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center rounded-full border border-[#15202B]/15 bg-white px-6 text-sm font-bold text-[#15202B] transition hover:-translate-y-0.5 hover:border-[#F2762E] hover:text-[#C85A17]"
            >
              Apply as a remote professional
            </Link>
          </div>
        </div>

        <div className="page-enter relative mt-14 min-h-[430px] lg:mt-0 lg:min-h-[560px]">
          <div
            className="absolute left-[8%] top-[4%] h-[84%] w-[84%] rounded-[44%_56%_60%_40%/46%_38%_62%_54%] bg-[#078CC5]"
            aria-hidden="true"
          />
          <div
            className="absolute -right-10 top-5 h-36 w-36 rounded-full border-[28px] border-[#F2762E]"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-8 left-0 h-24 w-24 rounded-full bg-[#15202B]"
            aria-hidden="true"
          />
          <div className="absolute inset-[13%_8%_15%_16%] rotate-[-3deg] rounded-[2rem] border border-white/50 bg-white/[0.94] p-6 shadow-[0_32px_80px_rgba(16,54,72,0.24)] backdrop-blur sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <img
                src="/brand/blithob-mark.png"
                alt=""
                className="h-20 w-20 rounded-2xl object-contain sm:h-24 sm:w-24"
              />
              <span className="rounded-full bg-[#EAF7FC] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#087DB6]">
                Blithob Pro
              </span>
            </div>
            <p className="mt-10 max-w-[12ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#15202B] sm:text-4xl">
              One company. Four ways forward.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-2.5">
              {services.map(({ title, icon: Icon }) => (
                <div
                  key={title}
                  className="flex items-center gap-2 rounded-xl border border-[#15202B]/10 bg-[#F7F6F1] px-3 py-3 text-sm font-semibold"
                >
                  <Icon size={17} className="shrink-0 text-[#F2762E]" />
                  {title}
                </div>
              ))}
            </div>
            <div className="mt-6 h-1.5 w-20 rounded-full bg-[#F2762E]" />
          </div>
        </div>

        <div
          id="services"
          className="relative z-10 mt-8 grid border-y border-[#15202B]/12 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4"
        >
          {services.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="group flex gap-3 border-b border-[#15202B]/10 py-5 sm:px-5 lg:border-b-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0"
            >
              <Icon
                size={20}
                className="mt-0.5 shrink-0 text-[#F2762E] transition group-hover:-translate-y-0.5"
              />
              <div>
                <h2 className="text-sm font-bold text-[#15202B]">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-[#65727E]">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
