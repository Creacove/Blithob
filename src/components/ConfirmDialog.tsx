import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  onConfirm,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/35 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="page-enter w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <h2 id={titleId} className="text-xl font-semibold text-[var(--ink)]">
          {title}
        </h2>
        <p className="mt-2 text-base leading-6 text-[var(--muted)]">
          {description}
        </p>
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button ref={closeRef} variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>,
    document.body
  );
}
