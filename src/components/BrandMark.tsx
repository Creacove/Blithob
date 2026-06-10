import { Link } from "react-router-dom";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 no-underline"
      aria-label="Blithob Professionals home"
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-[10px] text-base font-bold ${
          inverse
            ? "bg-white text-[#102A43]"
            : "bg-[var(--ink)] text-white"
        }`}
      >
        B
      </span>
      <span className={inverse ? "text-white" : "text-[#102A43]"}>
        <span className="block text-sm font-semibold leading-tight">
          Blithob
        </span>
        <span
          className={`block text-[10px] font-medium uppercase tracking-[0.16em] ${
            inverse ? "text-white/55" : "text-slate-400"
          }`}
        >
          Professionals
        </span>
      </span>
    </Link>
  );
}
