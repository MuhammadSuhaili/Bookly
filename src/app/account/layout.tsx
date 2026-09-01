import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { AccountNav } from "@/components/account/account-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Icon } from "@/components/icons";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon name="arrowLeft" size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <span className="mx-1 text-slate-300">/</span>
            <span className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-900">
              <Icon name="user" size={16} className="text-teal-600" />
              My Account
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/account/profile"
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 transition-colors hover:border-teal-300 hover:bg-teal-50 sm:flex"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="max-w-[8rem] truncate text-sm font-medium text-slate-700">
                {user.firstName}
              </span>
              <Icon name="edit" size={14} className="text-slate-400" />
            </Link>
            <div className="hidden sm:block">
              <LogoutButton />
            </div>
          </div>
        </div>
        <nav className="mx-auto max-w-5xl px-4 sm:px-6">
          <AccountNav />
        </nav>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
