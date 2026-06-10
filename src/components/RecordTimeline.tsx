import { formatDate } from "../lib/format";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  actor?: string;
  timestamp: string;
  tone?: "neutral" | "positive" | "attention";
}

const toneStyles: Record<NonNullable<TimelineItem["tone"]>, string> = {
  neutral: "border-slate-300 bg-white",
  positive: "border-emerald-500 bg-emerald-50",
  attention: "border-orange-500 bg-orange-50"
};

export function RecordTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
      {items.map((item) => (
        <li key={item.id} className="relative py-4 pl-7">
          <span
            className={`absolute left-0 top-[22px] h-3 w-3 rounded-full border-2 ${
              toneStyles[item.tone ?? "neutral"]
            }`}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-[var(--ink)]">{item.title}</p>
            <time className="text-sm text-[var(--muted)]">
              {formatDate(item.timestamp)}
            </time>
          </div>
          {item.description && (
            <p className="mt-1 max-w-[66ch] text-base leading-6 text-[var(--muted)]">
              {item.description}
            </p>
          )}
          {item.actor && (
            <p className="mt-1 text-sm font-medium text-[var(--muted)]">
              {item.actor}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
