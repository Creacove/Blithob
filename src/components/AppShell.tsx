import {
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  LogOut,
  Menu,
  RotateCcw,
  Settings2,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Role } from "../domain/types";
import { initials } from "../lib/format";
import { useAppStore } from "../store/appStore";
import { BrandMark } from "./BrandMark";

const nav = {
  admin: [
    { to: "/admin/dashboard", label: "Today", icon: Gauge },
    { to: "/admin/workers", label: "People", icon: Users },
    { to: "/admin/opportunities", label: "Jobs", icon: BriefcaseBusiness },
    { to: "/admin/reviews", label: "Reviews", icon: ClipboardCheck },
    { to: "/admin/payouts", label: "Payments", icon: WalletCards }
  ],
  trainer: [
    { to: "/trainer/dashboard", label: "Today", icon: Gauge },
    { to: "/trainer/trainees", label: "My Team", icon: GraduationCap },
    { to: "/trainer/reviews", label: "Job Reviews", icon: ClipboardCheck },
    { to: "/trainer/jobs", label: "My work", icon: BriefcaseBusiness }
  ],
  worker: [
    { to: "/worker/dashboard", label: "Today", icon: Gauge },
    { to: "/worker/training", label: "Training", icon: BookOpenCheck },
    { to: "/worker/jobs", label: "Work", icon: BriefcaseBusiness },
    { to: "/worker/payouts", label: "Payments", icon: WalletCards },
    { to: "/worker/profile", label: "Profile", icon: Settings2 }
  ]
} satisfies Record<Role, Array<{ to: string; label: string; icon: typeof Gauge }>>;

export function AppShell({ role }: { role: Role }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser());
  const signOut = useAppStore((state) => state.signOut);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const notifications = useAppStore((state) => state.notifications);
  const unread = notifications.filter(
    (item) =>
      !item.read &&
      item.recipientRole === role &&
      (!item.recipientId || item.recipientId === currentUser?.workerId)
  );
  const items = nav[role];
  const title =
    items.find((item) => location.pathname.startsWith(item.to))?.label ??
    (location.pathname === "/admin/training" ? "People" : undefined) ??
    (location.pathname.includes("notifications") ? "Updates" : "Workspace");

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const doSignOut = () => {
    signOut();
    navigate("/login");
  };

  const doReset = () => {
    if (window.confirm("Reset all prototype changes and restore the demo data?")) {
      resetDemo();
      setUserMenuOpen(false);
    }
  };

  const navigation = (
    <>
      <div className="flex h-16 items-center border-b border-[var(--border)] px-5">
        <BrandMark />
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label={`${role} navigation`}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `relative flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-[var(--blue)] before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              }`
            }
          >
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] p-3">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex min-h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left transition hover:bg-[var(--surface-subtle)]"
            aria-expanded={userMenuOpen}
            aria-label="Open user menu"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--ink)] text-xs font-semibold text-white">
              {initials(currentUser?.name ?? "")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                {currentUser?.name}
              </span>
              <span className="block truncate text-xs capitalize text-[var(--muted)]">
                {role === "trainer" ? "Lead" : role} workspace
              </span>
            </span>
            <ChevronDown size={15} className="text-[var(--muted)]" />
          </button>
          {userMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={doReset}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              >
                <RotateCcw size={15} />
                Reset demo data
              </button>
              <button
                type="button"
                onClick={doSignOut}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="app-grid">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-[var(--border)] bg-white lg:flex">
        {navigation}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="page-enter relative flex h-full w-[min(84vw,280px)] flex-col bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-[10px] text-[var(--muted)] hover:bg-[var(--surface-subtle)]"
              aria-label="Close navigation menu"
            >
              <X size={19} />
            </button>
            {navigation}
          </aside>
        </div>
      )}

      <div className={role === "worker" ? "min-w-0 pb-20 lg:pb-0" : "min-w-0"}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[color:rgba(245,245,242,0.92)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-[10px] border border-[var(--border)] bg-white text-[var(--ink)] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
          </div>
          <NavLink
            to={`/${role}/notifications`}
            className="relative grid h-11 w-11 place-items-center rounded-[10px] border border-[var(--border)] bg-white text-[var(--muted)] transition hover:text-[var(--blue)]"
            aria-label={`${unread.length} unread notifications`}
          >
            <Bell size={18} />
            {unread.length > 0 && (
              <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--attention)] px-1 text-[9px] font-semibold text-white ring-2 ring-white">
                {unread.length}
              </span>
            )}
          </NavLink>
        </header>
        <main className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:p-8">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {role === "worker" && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--border)] bg-white px-1 pb-[max(4px,env(safe-area-inset-bottom))] pt-1 lg:hidden"
          aria-label="Worker mobile navigation"
        >
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-[var(--blue)]"
                    : "text-slate-500 hover:text-[var(--ink)]"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
