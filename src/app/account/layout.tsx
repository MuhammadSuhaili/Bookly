import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { AccountNav } from "@/components/account/account-nav";

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
          <h1 className="text-lg font-semibold text-slate-900">My Account</h1>
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
