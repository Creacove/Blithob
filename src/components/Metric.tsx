import type { LucideIcon } from "lucide-react";

export function Metric({
  label,
  value,
  note,
  icon: Icon,
  accent = "blue"
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  accent?: "blue" | "orange" | "navy" | "green";
}) {
  const color = {
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    navy: "bg-slate-100 text-[#102A43]",
    green: "bg-emerald-50 text-emerald-700"
  }[accent];
  return (
    <div className="group border-t border-slate-200 pt-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <p className="font-[Poppins] text-3xl font-semibold tracking-[-0.04em] text-[#102A43]">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}
