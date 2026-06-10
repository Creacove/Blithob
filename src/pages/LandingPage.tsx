import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";

const capabilities = [
  {
    title: "Train with clear standards",
    description: "Turn service expectations into practical readiness tracks.",
    icon: GraduationCap
  },
  {
    title: "Match the right professional",
    description: "See readiness, workload, and delivery history before assigning work.",
    icon: Users
  },
  {
    title: "Review every delivery",
    description: "Keep feedback, revisions, approvals, and completion in one flow.",
    icon: ClipboardCheck
  }
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#101923] text-white">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <BrandMark inverse />
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-[10px] border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#101923]"
        >
          Sign in
        </Link>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl overflow-hidden px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:pb-16 lg:pt-8">
        <div className="page-enter relative z-10 max-w-3xl">
          <p className="text-sm font-medium text-[#8EADFF]">
            Workforce operations for remote delivery
          </p>
          <h1 className="mt-5 text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.065em]">
            Build a reliable remote team.
          </h1>
          <p className="mt-7 max-w-[58ch] text-lg leading-8 text-white/68">
            Train professionals, assign client work, review delivery, and keep
            every payment record clear from one focused workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center gap-2 rounded-[10px] bg-[#F2762E] px-5 text-sm font-semibold text-white transition hover:bg-[#D85F1C]"
            >
              Explore the workspace
              <ArrowRight size={17} />
            </Link>
            <span className="inline-flex min-h-12 items-center gap-2 px-2 text-sm text-white/60">
              <CheckCircle2 size={16} className="text-[#7BD7B2]" />
              Interactive product prototype
            </span>
          </div>
        </div>

        <div className="relative mt-14 lg:mt-0">
          <div
            className="absolute -right-36 -top-28 h-96 w-96 rounded-full border border-white/8"
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-white/12 bg-white/[0.055] p-3 backdrop-blur">
            <div className="rounded-xl border border-white/10 bg-[#172330] p-5 sm:p-6">
              <p className="text-sm font-medium text-white/55">
                Operations at a glance
              </p>
              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10">
                {[
                  ["2", "Decisions waiting"],
                  ["1", "Worker ready"],
                  ["1", "Active job"],
                  ["₦0", "Payment due"]
                ].map(([value, label]) => (
                  <div key={label} className="bg-[#172330] p-4">
                    <strong className="block text-2xl font-semibold">
                      {value}
                    </strong>
                    <span className="mt-1 block text-sm text-white/55">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-white p-4 text-[#15202B]">
                <p className="text-xs font-medium text-[#2457E6]">
                  NEXT DECISION
                </p>
                <p className="mt-2 text-base font-semibold">
                  Review quarterly newsletter pack
                </p>
                <p className="mt-1 text-sm text-[#5E6B78]">
                  Submission from Nneka · Due 11 June
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-16 grid border-t border-white/12 lg:col-span-2 lg:grid-cols-3">
          {capabilities.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="flex gap-3 border-b border-white/10 py-5 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <Icon size={19} className="mt-0.5 shrink-0 text-[#F2762E]" />
              <div>
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-white/50">
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
