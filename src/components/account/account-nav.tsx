"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/account", label: "Dashboard", icon: "dashboard" as const },
  { href: "/account/bookings", label: "Bookings", icon: "calendar" as const },
  { href: "/account/profile", label: "Profile", icon: "settings" as const },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
