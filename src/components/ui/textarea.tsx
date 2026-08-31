import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <textarea
          ref={ref}
          className={cn(
            "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-400"
              : "border-slate-300 focus:border-teal-400",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
