import { cn } from "@/lib/utils";

export function Spinner({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600",
        className,
      )}
      {...props}
    />
  );
}
