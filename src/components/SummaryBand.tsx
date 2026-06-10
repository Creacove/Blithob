import clsx from "clsx";

export interface SummaryItem {
  label: string;
  value: string | number;
  note?: string;
  tone?: "default" | "attention" | "positive";
}

export function SummaryBand({
  items,
  className
}: {
  items: SummaryItem[];
  className?: string;
}) {
  return (
    <section
      aria-label="Workspace summary"
      data-count={items.length}
      className={clsx(
        "summary-band overflow-hidden rounded-2xl border border-[var(--border)] bg-white",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="summary-cell p-4"
        >
          <strong
            className={clsx(
              "block text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]",
              item.tone === "attention" && "text-[var(--attention)]",
              item.tone === "positive" && "text-[var(--positive)]"
            )}
          >
            {item.value}
          </strong>
          <span className="mt-1 block text-sm font-medium leading-5 text-[var(--ink)]">
            {item.label}
          </span>
          {item.note && (
            <small className="mt-1 block text-xs leading-4 text-[var(--muted)]">
              {item.note}
            </small>
          )}
        </div>
      ))}
    </section>
  );
}
