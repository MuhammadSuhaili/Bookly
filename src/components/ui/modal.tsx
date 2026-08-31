"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <dialog
      ref={ref}
      className={cn(
        "m-auto w-full rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm",
        sizes[size],
      )}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </dialog>
  );
}
