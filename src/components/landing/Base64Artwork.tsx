import { useEffect, useState } from "react";

type Base64ArtworkProps = {
  base64Url: string;
  alt: string;
  className?: string;
};

export function Base64Artwork({ base64Url, alt, className }: Base64ArtworkProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(base64Url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load artwork: ${response.status}`);
        }
        return response.text();
      })
      .then((base64) => {
        if (!cancelled) {
          setSrc(`data:image/webp;base64,${base64.trim()}`);
        }
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [base64Url]);

  if (!src) {
    return <div className={className} aria-hidden="true" />;
  }

  return <img src={src} alt={alt} className={className} />;
}
