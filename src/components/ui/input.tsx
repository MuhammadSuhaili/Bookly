import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leadingIcon?: IconName;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon name={leadingIcon} size={18} />
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50",
            leadingIcon && "pl-10",
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

Input.displayName = "Input";
