import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { AccountNav } from "@/components/account/account-nav";
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon name="arrowLeft" size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <span className="text-lg font-semibold text-slate-900">My Account</span>
          </div>
          <span className="text-sm text-slate-500">
            {user.firstName} {user.lastName}
          </span>
        </div>
        <nav className="mx-auto max-w-5xl px-4 sm:px-6">
          <AccountNav />
        </nav>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
