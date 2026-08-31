"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";

export function MobileNav({
  user,
  onLogout,
}: {
  user: { firstName?: string; role?: string } | null;
  onLogout?: { label: string; onClick: () => void };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
      >
        <Icon name={open ? "close" : "menu"} size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-64 border-l border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Home
              </Link>
              <Link
                href="/services"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Services
              </Link>

              <div className="my-2 border-t border-slate-100" />

              {user ? (
                <>
                  <Link
                    href={user.role === "ADMIN" ? "/admin" : "/account"}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {user.role === "ADMIN" ? "Admin Panel" : "My account"}
                  </Link>
                  {onLogout?.onClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onLogout?.onClick();
                      }}
                      className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {onLogout.label}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
