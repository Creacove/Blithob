import {
  ArrowLeft,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  LogOut,
  MoreHorizontal,
  RotateCcw,
  Settings2,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { AccountRole } from "../domain/model";
import { initials } from "../lib/format";
import { useProfessionalStore } from "../store/professionalStore";
import { BrandMark } from "./BrandMark";
import { FilterSheet } from "./FilterSheet";

interface NavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const adminNav: NavigationItem[] = [
  { to: "/admin/today", label: "Today", icon: Gauge },
  { to: "/admin/people", label: "People", icon: Users },
  { to: "/admin/services", label: "Services", icon: Layers3 },
  { to: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { to: "/admin/applications", label: "Applications", icon: FileText },
  { to: "/admin/reviews", label: "Reviews", icon: ClipboardCheck },
  { to: "/admin/payments", label: "Payments", icon: WalletCards }
];

const professionalBase: NavigationItem[] = [
  { to: "/professional/today", label: "Today", icon: Gauge },
  { to: "/professional/work", label: "Work", icon: BriefcaseBusiness }
];

const professionalTail: NavigationItem[] = [
  { to: "/professional/training", label: "Training", icon: BookOpenCheck },
  { to: "/professional/payments", label: "Payments", icon: WalletCards },
  { to: "/professional/profile", label: "Profile", icon: Settings2 }
];

function desktopItems(role: AccountRole, isLead: boolean) {
  if (role === "admin") return adminNav;
  return [
    ...professionalBase,
    ...(isLead
      ? [
          { to: "/professional/team", label: "Team", icon: Users },
          {
            to: "/professional/reviews",
            label: "Reviews",
            icon: ClipboardCheck
          }
        ]
      : []),
    ...professionalTail
  ];
}

function phoneItems(role: AccountRole, isLead: boolean) {
  if (role === "admin") {
    return {
      primary: adminNav.filter((item) =>
        ["Today", "People", "Jobs", "Reviews"].includes(item.label)
      ),
      more: [
        adminNav.find((item) => item.label === "Services"),
        adminNav.find((item) => item.label === "Applications"),
        adminNav.find((item) => item.label === "Payments")
      ].filter(Boolean) as NavigationItem[]
    };
  }

  if (isLead) {
    return {
      primary: [
        ...professionalBase,
        { to: "/professional/team", label: "Team", icon: Users },
        {
          to: "/professional/reviews",
          label: "Reviews",
          icon: ClipboardCheck
        }
      ],
      more: professionalTail
    };
  }

  return {
    primary: [...professionalBase, ...professionalTail],
    more: [] as NavigationItem[]
  };
}

function detailBack(pathname: string, role: AccountRole) {
  const rules: Array<[RegExp, string]> = [
    [/^\/admin\/people\/[^/]+$/, "/admin/people"],
    [/^\/admin\/services\/[^/]+$/, "/admin/services"],
    [/^\/admin\/jobs\/new$/, "/admin/jobs"],
    [/^\/admin\/jobs\/[^/]+\/edit$/, pathname.replace(/\/edit$/, "")],
    [/^\/admin\/jobs\/[^/]+$/, "/admin/jobs"],
    [/^\/admin\/applications$/, "/admin/applications"],
    [/^\/admin\/assignments\/[^/]+$/, "/admin/jobs"],
    [/^\/admin\/payments\/[^/]+$/, "/admin/payments"],
    [/^\/professional\/work\/[^/]+$/, "/professional/work"],
    [/^\/professional\/training\/[^/]+$/, "/professional/training"],
    [/^\/professional\/team\/[^/]+$/, "/professional/team"],
    [/^\/professional\/payments\/[^/]+$/, "/professional/payments"]
  ];
  return (
    rules.find(([pattern]) => pattern.test(pathname))?.[1] ??
    (role === "admin" ? "/admin/today" : "/professional/today")
  );
}

function AccountMenu({
  compact,
  userName,
  workspaceLabel,
  showReset,
  onReset,
  onSignOut
}: {
  compact: boolean;
  userName: string;
  workspaceLabel: string;
  showReset: boolean;
  onReset: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const placement = compact ? "tablet" : "desktop";

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      className={`border-t border-[var(--border)] ${compact ? "p-2" : "p-3"}`}
    >
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex min-h-12 w-full items-center rounded-[10px] transition hover:bg-[var(--surface-subtle)] ${
            compact ? "justify-center px-2" : "gap-3 px-2 text-left"
          }`}
          aria-expanded={open}
          aria-label={`Open ${placement} user menu`}
          title={compact ? `${userName} · ${workspaceLabel}` : undefined}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--ink)] text-xs font-semibold text-white">
            {initials(userName)}
          </span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                  {userName}
                </span>
                <span className="block truncate text-xs text-[var(--muted)]">
                  {workspaceLabel}
                </span>
              </span>
              <ChevronDown size={15} className="text-[var(--muted)]" />
            </>
          )}
        </button>
        {open && (
          <div
            className={`absolute z-50 w-52 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-xl ${
              compact
                ? "bottom-0 left-[calc(100%+8px)]"
                : "bottom-[calc(100%+8px)] left-0 right-0 w-auto"
            }`}
          >
            {showReset && (
              <button
                type="button"
                onClick={onReset}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              >
                <RotateCcw size={15} aria-hidden />
                Reset demo data
              </button>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-[var(--critical)] hover:bg-red-50"
            >
              <LogOut size={15} aria-hidden />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SideNavigation({
  items,
  role,
  compact = false,
  userName,
  workspaceLabel,
  showReset,
  onReset,
  onSignOut
}: {
  items: NavigationItem[];
  role: AccountRole;
  compact?: boolean;
  userName: string;
  workspaceLabel: string;
  showReset: boolean;
  onReset: () => void;
  onSignOut: () => void;
}) {
  return (
    <>
      <div
        className={`flex h-16 items-center border-b border-[var(--border)] ${
          compact ? "justify-center px-2" : "px-5"
        }`}
      >
        <BrandMark compact={compact} />
      </div>
      <nav
        className={`flex-1 overflow-y-auto ${
          compact ? "space-y-2 p-2" : "space-y-1 p-3"
        }`}
        aria-label={`${role === "admin" ? "Admin" : "Professional"} navigation`}
      >
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={compact ? label : undefined}
            aria-label={compact ? `${label} tablet` : undefined}
            className={({ isActive }) =>
              `relative flex min-h-11 items-center rounded-[10px] text-sm font-medium transition ${
                compact ? "justify-center px-2" : "gap-3 px-3"
              } ${
                isActive
                  ? "bg-blue-50 text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              }`
            }
          >
            <Icon size={compact ? 19 : 17} aria-hidden />
            {!compact && <span>{label}</span>}
            {compact && <span className="sr-only">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <AccountMenu
        compact={compact}
        userName={userName}
        workspaceLabel={workspaceLabel}
        showReset={showReset}
        onReset={onReset}
        onSignOut={onSignOut}
      />
    </>
  );
}

export function AppShell({ role }: { role: AccountRole }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const signOut = useProfessionalStore((state) => state.signOut);
  const resetDemo = useProfessionalStore((state) => state.resetDemo);
  const backendMode = useProfessionalStore((state) => state.backendMode);
  const showReset = backendMode === "demo";
  const backendError = useProfessionalStore((state) => state.error);
  const clearError = useProfessionalStore((state) => state.clearError);
  const refreshRemote = useProfessionalStore((state) => state.refreshRemote);
  const notifications = useProfessionalStore((state) => state.notifications);
  const isLead = Boolean(professional?.isLead);
  const allItems = desktopItems(role, isLead);
  const phone = phoneItems(role, isLead);
  const unread = notifications.filter(
    (item) => !item.read && item.recipientUserId === currentUser?.id
  );
  const title = location.pathname.startsWith("/admin/assignments/")
    ? "Jobs"
    : (allItems.find((item) => location.pathname.startsWith(item.to))?.label ??
      (location.pathname.includes("notifications") ? "Updates" : "Workspace"));
  const isDetail = detailBack(location.pathname, role) !==
    (role === "admin" ? "/admin/today" : "/professional/today") ||
    /\/(people|services|jobs|applications|assignments|payments|work|training|team)\/[^/]+/.test(
      location.pathname
    );
  const mobileLabel = role === "admin" ? "Admin" : isLead ? "Lead" : "Professional";
  const workspaceLabel =
    role === "admin"
      ? "Admin workspace"
      : isLead
        ? "Lead Professional"
        : "Professional workspace";
  const updatesPath =
    role === "admin" ? "/admin/notifications" : "/professional/notifications";

  const doSignOut = () => {
    signOut();
    navigate("/login");
  };

  const doReset = () => {
    if (
      showReset &&
      window.confirm("Reset your demo workspace and return to its starting data?")
    ) {
      resetDemo();
      setMoreOpen(false);
      navigate(role === "admin" ? "/admin/today" : "/professional/today");
    }
  };

  return (
    <div className="app-grid">
      <aside className="desktop-sidebar sticky top-0 hidden h-screen flex-col border-r border-[var(--border)] bg-white lg:flex">
        <SideNavigation
          items={allItems}
          role={role}
          userName={currentUser?.name ?? mobileLabel}
          workspaceLabel={workspaceLabel}
          showReset={showReset}
          onReset={doReset}
          onSignOut={doSignOut}
        />
      </aside>

      <aside className="tablet-rail sticky top-0 hidden h-screen flex-col border-r border-[var(--border)] bg-white md:flex lg:hidden">
        <SideNavigation
          items={allItems}
          role={role}
          compact
          userName={currentUser?.name ?? mobileLabel}
          workspaceLabel={workspaceLabel}
          showReset={showReset}
          onReset={doReset}
          onSignOut={doSignOut}
        />
      </aside>

      <div className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="app-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[color:rgba(245,245,242,0.94)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {isDetail ? (
              <button
                type="button"
                onClick={() => navigate(detailBack(location.pathname, role))}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-[var(--border)] bg-white text-[var(--ink)] md:hidden"
                aria-label="Back"
              >
                <ArrowLeft size={20} aria-hidden />
              </button>
            ) : (
              <span className="md:hidden">
                <BrandMark compact />
              </span>
            )}
            <p className="truncate text-sm font-semibold text-[var(--ink)]">
              {title}
            </p>
          </div>
          <NavLink
            to={updatesPath}
            className="relative grid h-11 w-11 place-items-center rounded-[10px] border border-[var(--border)] bg-white text-[var(--muted)] transition hover:text-[var(--blue)]"
            aria-label={`${unread.length} unread notifications`}
          >
            <Bell size={18} aria-hidden />
            {unread.length > 0 && (
              <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--attention)] px-1 text-[9px] font-semibold text-white ring-2 ring-white">
                {unread.length}
              </span>
            )}
          </NavLink>
        </header>

        <main className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:p-8">
          {backendMode === "remote" && backendError && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              <p className="min-w-0 flex-1 leading-6">
                <strong className="font-semibold">Change not saved.</strong>{" "}
                {backendError} Review the form and try again.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-white px-3 py-2 font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-100"
                  onClick={() => void refreshRemote()}
                >
                  Refresh data
                </button>
                <button
                  type="button"
                  className="rounded-lg px-2 py-2 font-semibold text-red-700 hover:bg-red-100"
                  onClick={clearError}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 grid border-t border-[var(--border)] bg-white px-1 pt-1 md:hidden"
        style={{
          gridTemplateColumns: `repeat(${phone.primary.length + (phone.more.length ? 1 : 0)}, minmax(0, 1fr))`,
          paddingBottom: "max(4px, env(safe-area-inset-bottom))"
        }}
        aria-label={`${mobileLabel} mobile navigation`}
      >
        {phone.primary.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={`${label} mobile`}
            className={({ isActive }) =>
              `flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition ${
                isActive
                  ? "bg-blue-50 text-[var(--blue)]"
                  : "text-slate-500 hover:text-[var(--ink)]"
              }`
            }
          >
            <Icon size={18} aria-hidden />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
        {phone.more.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium text-slate-500"
            aria-label="More"
          >
            <MoreHorizontal size={19} aria-hidden />
            <span>More</span>
          </button>
        )}
      </nav>

      <FilterSheet
        open={moreOpen}
        title="More"
        description={`${mobileLabel} workspace destinations and account actions.`}
        onClose={() => setMoreOpen(false)}
      >
        <nav className="grid gap-2" aria-label={`${mobileLabel} more navigation`}>
          {phone.more.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
            >
              <Icon size={18} className="text-[var(--blue)]" aria-hidden />
              {label}
            </NavLink>
          ))}
          <NavLink
            to={updatesPath}
            onClick={() => setMoreOpen(false)}
            className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <Bell size={18} className="text-[var(--blue)]" aria-hidden />
            Updates
          </NavLink>
        </nav>
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <p className="mb-3 text-sm font-semibold text-[var(--ink)]">
            {currentUser?.name}
          </p>
          <div className="grid gap-2">
            {showReset && (
              <button
                type="button"
                onClick={doReset}
                className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-subtle)]"
              >
                <RotateCcw size={17} aria-hidden />
                Reset demo data
              </button>
            )}
            <button
              type="button"
              onClick={doSignOut}
              className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-left text-sm font-medium text-[var(--critical)] hover:bg-red-50"
            >
              <LogOut size={17} aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </FilterSheet>
    </div>
  );
}
