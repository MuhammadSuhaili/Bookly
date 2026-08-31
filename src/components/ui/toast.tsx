"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const config: Record<
  ToastType,
  { icon: IconName; iconClass: string; bar: string }
> = {
  success: { icon: "checkCircle", iconClass: "text-emerald-600", bar: "bg-emerald-500" },
  error: { icon: "xCircle", iconClass: "text-red-600", bar: "bg-red-500" },
  info: { icon: "info", iconClass: "text-sky-600", bar: "bg-sky-500" },
  warning: { icon: "alert", iconClass: "text-amber-600", bar: "bg-amber-500" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (t, m) => push("success", t, m),
      error: (t, m) => push("error", t, m),
      info: (t, m) => push("info", t, m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const c = config[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-lg",
                "animate-[toast-in_0.2s_ease-out]",
              )}
            >
              <span className={cn("absolute inset-y-0 left-0 w-1", c.bar)} />
              <Icon name={c.icon} size={20} className={cn("mt-0.5", c.iconClass)} />
              <div className="flex-1 pr-6">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.message && (
                  <p className="mt-0.5 text-xs text-slate-500">{t.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="absolute right-2 top-2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                aria-label="Dismiss"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
