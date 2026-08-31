import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { LogoutButton } from "./logout-button";
import { MobileNav } from "./mobile-nav";

export async function PublicNav() {
  const session = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Icon name="logo" size={18} />
          </span>
          <span>Bookly</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Home
          </Link>
          <Link
            href="/services"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Services
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href={session.role === "ADMIN" ? "/admin" : "/account"} className="hidden sm:inline-flex">
                <Button variant="outline" size="sm" icon="user">
                  {session.role === "ADMIN" ? "Admin Panel" : "My account"}
                </Button>
              </Link>
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
          <div className="md:hidden">
            <MobileNav
              user={
                session
                  ? { firstName: session.firstName, role: session.role }
                  : null
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
