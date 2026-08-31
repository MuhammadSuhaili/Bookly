"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to manage your bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </div>
        )}
        <form action={action} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              leadingIcon="mail"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              leadingIcon="lock"
              autoComplete="current-password"
              required
            />
          </Field>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" className="w-full" loading={pending}>
            Log in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-teal-600 hover:text-teal-700">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
