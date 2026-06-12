import clsx from "clsx";
import type {
  ButtonHTMLAttributes,
  ForwardedRef,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { forwardRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const Button = forwardRef(function Button(
  {
    variant = "primary",
    className,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "quiet" | "danger";
  },
  ref: ForwardedRef<HTMLButtonElement>
) {
  const styles = {
    primary:
      "bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)]",
    secondary:
      "border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--surface-subtle)]",
    quiet: "bg-[var(--surface-subtle)] text-[var(--ink)] hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700"
  }[variant];
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        styles,
        className
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  error,
  hint,
  children
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--ink)]">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm font-medium text-[var(--critical)]">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm leading-5 text-[var(--muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const control =
  "min-h-12 w-full rounded-[10px] border border-[var(--border)] bg-white px-3.5 text-base text-[var(--ink)] outline-none transition placeholder:text-slate-400 focus:border-[var(--blue)] focus:ring-4 focus:ring-blue-500/10";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(control, props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(control, props.className)} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(control, "min-h-28 resize-y py-3", props.className)}
      {...props}
    />
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className,
  mobileDisclosure = "static"
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  mobileDisclosure?: "static" | "expanded" | "collapsed";
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" || typeof window.matchMedia !== "function"
      ? false
      : window.matchMedia("(max-width: 767px)").matches
  );
  const [open, setOpen] = useState(mobileDisclosure !== "collapsed");

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const disclosure = mobileDisclosure !== "static" && isMobile;
  const contentVisible = !disclosure || open;

  return (
    <section
      className={clsx(
        "mobile-section rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-6",
        className
      )}
    >
      <div
        className={clsx(
          "flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4",
          contentVisible && "mb-4"
        )}
      >
        <div className="max-w-[66ch]">
          <h2 className="text-xl font-semibold text-[var(--ink)]">{title}</h2>
          {description && (
            <p className="mobile-supporting-copy mt-1 text-sm leading-5 text-[var(--muted)]">
              {description}
            </p>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:shrink-0 md:flex-nowrap">
          {(!disclosure || contentVisible) && action}
          {disclosure && (
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--blue)] hover:bg-blue-50"
              aria-expanded={open}
            >
              {open ? `Hide ${title}` : `Show ${title}`}
            </button>
          )}
        </div>
      </div>
      {contentVisible && children}
    </section>
  );
}

export function ResponsiveRecord({
  title,
  subtitle,
  status,
  facts = [],
  details,
  action,
  className,
  to,
  ariaLabel
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  facts?: Array<{ label: string; value: ReactNode }>;
  details?: ReactNode;
  action?: ReactNode;
  className?: string;
  to?: string;
  ariaLabel?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const content = (
    <>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h3 className="min-w-0 overflow-hidden text-ellipsis text-base font-semibold leading-6 text-[var(--ink)]">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
              {subtitle}
            </p>
          )}
        </div>
        {status}
      </div>
      {facts.length > 0 && (
        <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3">
          {facts.slice(0, 2).map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="text-xs font-medium text-[var(--muted)]">
                {fact.label}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-[var(--ink)]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {(details || action) && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
          {details ? (
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--blue)]"
              aria-expanded={detailsOpen}
            >
              {detailsOpen ? "Hide details" : "Show details"}
            </button>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {detailsOpen && (
        <div className="mt-3 border-t border-[var(--border)] pt-3 text-sm leading-6 text-[var(--muted)]">
          {details}
        </div>
      )}
    </>
  );

  const recordClassName = clsx(
    "responsive-record block min-w-0 max-w-full overflow-hidden rounded-xl border border-[var(--border)] bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30",
    className
  );

  return to && !details && !action ? (
    <Link to={to} aria-label={ariaLabel} className={recordClassName}>
      {content}
    </Link>
  ) : (
    <article className={recordClassName}>{content}</article>
  );
}

export function StickyActionBar({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Page actions"
      className={clsx(
        "sticky-action-bar sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-xl md:border md:px-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-8 text-center sm:px-6 sm:py-10">
      <h3 className="text-base font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-base leading-6 text-[var(--muted)]">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Toolbar({
  label = "Page controls",
  children,
  className
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={clsx(
        "mobile-toolbar flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-3 sm:flex-row sm:items-center",
        className
      )}
    >
      {children}
    </div>
  );
}

export function RecordList({
  children,
  className,
  label
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      className={clsx(
        "divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MetaList({
  items,
  className
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}) {
  return (
    <dl className={clsx("meta-list grid gap-x-6 gap-y-3 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[minmax(7rem,0.45fr)_1fr] gap-3"
        >
          <dt className="text-sm font-medium text-[var(--muted)]">
            {item.label}
          </dt>
          <dd className="min-w-0 text-sm font-semibold text-[var(--ink)]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false
}: {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
}) {
  const safeMax = max > 0 ? max : 1;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);

  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-[var(--blue)] transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          {safeValue} of {safeMax}
        </p>
      )}
    </div>
  );
}
