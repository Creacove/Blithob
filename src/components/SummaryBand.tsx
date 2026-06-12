import clsx from "clsx";
import { useEffect, useState } from "react";

export interface SummaryItem {
  label: string;
  value: string | number;
  note?: string;
  tone?: "default" | "attention" | "positive";
  mobilePriority?: "primary" | "secondary";
}

export function SummaryBand({
  items,
  className
}: {
  items: SummaryItem[];
  className?: string;
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" || typeof window.matchMedia !== "function"
      ? false
      : window.matchMedia("(max-width: 767px)").matches
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const primaryItems = items.filter(
    (item, index) =>
      item.mobilePriority === "primary" ||
      (!item.mobilePriority && index < 3)
  );
  const secondaryItems = items.filter(
    (item, index) =>
      item.mobilePriority === "secondary" ||
      (!item.mobilePriority && index >= 3)
  );
  const visibleItems =
    isMobile && !expanded ? primaryItems : [...primaryItems, ...secondaryItems];

  return (
    <section
      aria-label="Workspace summary"
      data-count={visibleItems.length}
      className={clsx(
        "overflow-hidden rounded-2xl border border-[var(--border)] bg-white",
        className
      )}
    >
      <div className="summary-band" data-count={visibleItems.length}>
        {visibleItems.map((item) => (
          <div key={item.label} className="summary-cell p-4">
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
      </div>
      {isMobile && secondaryItems.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex min-h-11 w-full items-center justify-center border-t border-[var(--border)] px-4 text-sm font-semibold text-[var(--blue)]"
          aria-expanded={expanded}
        >
          {expanded ? "Show fewer metrics" : "Show all metrics"}
        </button>
      )}
    </section>
  );
}
