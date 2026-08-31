import Link from "next/link";
import { Icon } from "@/components/icons";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Icon name="logo" size={15} />
          </span>
          Bookly
        </div>
        <p>© {new Date().getFullYear()} Bookly. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link href="/services" className="hover:text-slate-900">
            Services
          </Link>
          <Link href="/login" className="hover:text-slate-900">
            Log in
          </Link>
          <Link href="/register" className="hover:text-slate-900">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
