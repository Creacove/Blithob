import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
  Users
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import type { DemoPersona } from "../domain/model";
import { useProfessionalStore } from "../store/professionalStore";

const personas = [
  {
    persona: "admin" as const,
    title: "Admin",
    name: "Ayo Admin",
    description: "Manage people, services, jobs, reviews, and payments.",
    detail: "See the full operational system and final approval queues.",
    icon: ShieldCheck
  },
  {
    persona: "lead" as const,
    title: "Lead",
    name: "Nneka Eze",
    description: "Deliver your own work while supervising other Professionals.",
    detail: "Includes Team and Reviews inside the Professional workspace.",
    icon: Users
  },
  {
    persona: "professional" as const,
    title: "Professional",
    name: "Amara Okafor",
    description: "Complete readiness, deliver Assignments, and track payments.",
    detail: "Shows the focused individual delivery experience.",
    icon: BriefcaseBusiness
  }
];

export function LoginPage() {
  const session = useProfessionalStore((state) => state.session);
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const signIn = useProfessionalStore((state) => state.signIn);
  const navigate = useNavigate();

  if (session && currentUser) {
    return (
      <Navigate
        to={
          session.persona === "admin"
            ? "/admin/today"
            : "/professional/today"
        }
        replace
      />
    );
  }

  const enter = (persona: DemoPersona) => {
    signIn(persona);
    navigate(
      persona === "admin" ? "/admin/today" : "/professional/today"
    );
  };

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-5 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex h-14 items-center justify-between">
          <BrandMark />
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Link>
        </div>

        <section className="py-8 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--blue)]">
              Interactive demo
            </p>
            <h1 className="mt-3 text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] text-[var(--ink)]">
              Choose a workspace
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-[var(--muted)]">
              Admin and Professional are account types. Lead is an added
              capability inside the Professional workspace.
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-white sm:mt-10">
            {personas.map(
              (
                { persona, title, name, description, detail, icon: Icon },
                index
              ) => (
                <button
                  key={persona}
                  type="button"
                  onClick={() => enter(persona)}
                  className={`group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left transition hover:bg-blue-50/50 sm:gap-4 sm:p-6 ${
                    index ? "border-t border-[var(--border)]" : ""
                  }`}
                  aria-label={`Continue as ${title}`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-[var(--surface-subtle)] text-[var(--ink)] transition group-hover:bg-[var(--blue)] group-hover:text-white">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <strong className="text-lg font-semibold text-[var(--ink)]">
                        {title}
                      </strong>
                      <span className="text-sm text-[var(--muted)]">
                        {name}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--ink)] sm:text-base">
                      {description}
                    </span>
                    <span className="mt-1 hidden text-sm text-[var(--muted)] sm:block">
                      {detail}
                    </span>
                  </span>
                  <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--blue)]">
                    <span className="sr-only sm:not-sr-only">Open workspace</span>
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
