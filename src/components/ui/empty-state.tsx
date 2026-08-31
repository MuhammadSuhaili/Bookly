import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon = "info",
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name={icon} size={24} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
