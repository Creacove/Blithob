import { CheckCircle2, CircleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { createPortal } from "react-dom";

interface Toast {
  id: string;
  message: string;
  tone: "success" | "error";
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const add = useCallback((message: string, tone: Toast["tone"]) => {
    setToasts((current) => [
      ...current,
      {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        tone
      }
    ]);
  }, []);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismiss(toast.id), 3500)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dismiss, toasts]);

  const value = useMemo(
    () => ({
      success: (message: string) => add(message, "success"),
      error: (message: string) => add(message, "error")
    }),
    [add]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="pointer-events-none fixed inset-x-4 top-4 z-[120] ml-auto flex max-w-sm flex-col gap-2"
        >
          {toasts.map((toast) => {
            const Icon = toast.tone === "success" ? CheckCircle2 : CircleAlert;
            return (
              <div
                key={toast.id}
                className="page-enter pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--ink)] shadow-lg"
              >
                <Icon
                  size={18}
                  className={
                    toast.tone === "success"
                      ? "mt-0.5 shrink-0 text-emerald-600"
                      : "mt-0.5 shrink-0 text-red-600"
                  }
                  aria-hidden="true"
                />
                <p className="min-w-0 flex-1 text-sm font-medium leading-5">
                  {toast.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-subtle)]"
                  aria-label="Dismiss notification"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// The provider and its hook intentionally share one module as one public API.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
