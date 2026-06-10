import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-2 text-sm font-medium text-[var(--blue)]">
            {eyebrow}
          </p>
        )}
        <h1 className="m-0 text-[clamp(1.75rem,3vw,2rem)] font-semibold leading-[1.2] text-[var(--ink)]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[66ch] text-base leading-6 text-[var(--muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </header>
  );
}
