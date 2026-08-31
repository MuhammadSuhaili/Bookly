"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";
import { logoutAction } from "@/server/actions/auth";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/services", label: "Services", icon: "service" },
  { href: "/admin/categories", label: "Categories", icon: "category" },
  { href: "/admin/schedules", label: "Schedules", icon: "schedule" },
  { href: "/admin/reports", label: "Reports", icon: "report" },
  { href: "/admin/audit", label: "Audit Log", icon: "activity" },
];

function SidebarContent({
  pathname,
  dark,
}: {
  pathname: string;
  dark?: boolean;
}) {
  const [, action, pending] = useActionState(logoutAction, null);

  const brand = dark
    ? { logo: "bg-teal-500 text-white", title: "text-white", sub: "text-teal-300" }
    : { logo: "bg-teal-100 text-teal-600", title: "text-slate-900", sub: "text-slate-500" };
  const link = dark
    ? {
        base: "text-teal-200 hover:bg-teal-900 hover:text-white",
        active: "bg-teal-500 text-white",
      }
    : {
        base: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        active: "bg-teal-600 text-white",
      };
  const divider = dark ? "border-teal-900" : "border-slate-200";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${brand.logo}`}>
          <Icon name="logo" size={18} />
        </span>
        <div>
          <p className={`text-sm font-semibold ${brand.title}`}>Bookly</p>
          <p className={`text-xs ${brand.sub}`}>Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? link.active : link.base,
              )}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t p-3 ${divider}`}>
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${link.base}`}
        >
          <Icon name="home" size={18} />
          View site
        </Link>
        <form action={action}>
          <button
            type="submit"
            disabled={pending}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${link.base} disabled:opacity-50`}
          >
            <Icon name="logout" size={18} />
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-teal-950 px-4 text-teal-100 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white">
            <Icon name="logo" size={16} />
          </span>
          <span className="text-sm font-semibold text-white">Bookly Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-teal-100 transition-colors hover:bg-teal-900"
        >
          <Icon name="menu" size={20} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-teal-950 text-teal-100 lg:flex">
        <SidebarContent pathname={pathname} dark />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-white text-slate-800 shadow-xl">
            <SidebarContent pathname={pathname} dark={false} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            >
              <Icon name="close" size={20} />
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
