import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  width = "default"
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  width?: "default" | "wide";
}) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      data-drawer-root
      className="fixed inset-0 z-[100]"
      aria-hidden={false}
    >
      <button
        type="button"
        className="drawer-backdrop absolute inset-0 cursor-default bg-slate-950/35"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`drawer-enter absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl ${
          width === "wide" ? "sm:max-w-[640px]" : "sm:max-w-[560px]"
        }`}
      >
        <header className="flex items-start justify-between gap-6 border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold text-[var(--ink)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 max-w-[58ch] text-base leading-6 text-[var(--muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-[var(--muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}
