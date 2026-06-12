import { Link } from "react-router-dom";

export function BrandMark({
  inverse = false,
  compact = false
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      to="/"
      className={`inline-flex shrink-0 items-center justify-center no-underline ${
        inverse ? "rounded-xl bg-white p-1 shadow-sm shadow-black/10" : ""
      }`}
      aria-label="Blithob Professionals home"
    >
      <img
        src={
          compact
            ? "/brand/blithob-mark.png"
            : "/brand/blithob-pro-lockup.png"
        }
        alt="Blithob Pro"
        width={compact ? 512 : 360}
        height={compact ? 512 : 302}
        className={
          compact
            ? "h-10 w-10 object-contain"
            : "h-12 w-auto object-contain sm:h-14"
        }
      />
    </Link>
  );
}
