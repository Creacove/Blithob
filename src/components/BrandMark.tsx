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
        src="/brand/blithob-mark.png"
        alt="Blithob Pro"
        width={512}
        height={512}
        className="h-10 w-10 object-contain"
      />
    </Link>
  );
}
