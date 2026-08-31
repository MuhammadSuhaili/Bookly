import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div>
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border bg-white px-3.5 pr-9 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                : "border-slate-300 focus:border-teal-400",
              className,
            )}
            aria-invalid={!!error}
            {...props}
          >
            {children}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <Icon name="chevronDown" size={18} />
          </span>
        </div>
        {error && (
          <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
