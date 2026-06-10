import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  wide = false
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className={`page-enter max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--border)] bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-[var(--ink)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-base leading-6 text-[var(--muted)]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>,
    document.body
  );
}
