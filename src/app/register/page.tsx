import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Icon } from "@/components/icons";

export const metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Icon name="logo" size={18} />
            </span>
            Bookly
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <RegisterForm />
      </main>
    </div>
  );
}
