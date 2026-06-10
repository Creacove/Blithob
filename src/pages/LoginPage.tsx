import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
  Users
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import type { Role } from "../domain/types";
import { useAppStore } from "../store/appStore";

const roles = [
  {
    role: "admin" as const,
    title: "Admin",
    name: "Ayo Blithob",
    description: "Run people, jobs, reviews, and payments.",
    detail: "Best for seeing the full operational system.",
    icon: ShieldCheck
  },
  {
    role: "trainer" as const,
    title: "Lead",
    name: "Nneka Okafor",
    description: "Certify worker readiness and review submitted work.",
    detail: "Best for quality gatekeeping and training supervision.",
    icon: Users
  },
  {
    role: "worker" as const,
    title: "Worker",
    name: "Amara Okoye",
    description: "Complete training, deliver work, and track payments.",
    detail: "Best for the mobile-first delivery experience.",
    icon: BriefcaseBusiness
  }
];

export function LoginPage() {
  const session = useAppStore((state) => state.session);
  const signIn = useAppStore((state) => state.signIn);
  const navigate = useNavigate();

  if (session) return <Navigate to={`/${session.role}/dashboard`} replace />;

  const enter = (role: Role) => {
    signIn(role);
    navigate(`/${role}/dashboard`);
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
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>

        <section className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--blue)]">
              Interactive demo
            </p>
            <h1 className="mt-3 text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] text-[var(--ink)]">
              Choose a workspace
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-[var(--muted)]">
              Each role uses the same shared scenario. Changes made in one
              workspace appear in the others.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            {roles.map(
              ({ role, title, name, description, detail, icon: Icon }, index) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => enter(role)}
                  className={`group grid w-full gap-4 p-5 text-left transition hover:bg-blue-50/50 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6 ${
                    index ? "border-t border-[var(--border)]" : ""
                  }`}
                  aria-label={`Continue as ${title}`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-[var(--surface-subtle)] text-[var(--ink)] transition group-hover:bg-[var(--blue)] group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <strong className="text-lg font-semibold text-[var(--ink)]">
                        {title}
                      </strong>
                      <span className="text-sm text-[var(--muted)]">{name}</span>
                    </span>
                    <span className="mt-1 block text-base text-[var(--ink)]">
                      {description}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      {detail}
                    </span>
                  </span>
                  <span className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--blue)]">
                    Open workspace
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
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
