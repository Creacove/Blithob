import clsx from "clsx";
import type {
  ButtonHTMLAttributes,
  ForwardedRef,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { forwardRef } from "react";

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
  className
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="max-w-[66ch]">
          <h2 className="text-xl font-semibold text-[var(--ink)]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
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
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-6 py-10 text-center">
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
        "flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-3 sm:flex-row sm:items-center",
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
    <dl className={clsx("grid gap-x-6 gap-y-3 sm:grid-cols-2", className)}>
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
