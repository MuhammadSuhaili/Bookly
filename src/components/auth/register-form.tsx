"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { registerAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state && "success" in state) {
      router.push("/account");
    }
  }, [state, router]);

  const errors = state && "error" in state ? state.error : {};

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join Bookly to book services in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        {errors.form && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.form}
          </div>
        )}
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" htmlFor="firstName">
              <Input id="firstName" name="firstName" placeholder="Budi" error={errors.firstName} required />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <Input id="lastName" name="lastName" placeholder="Santoso" error={errors.lastName} required />
            </Field>
          </div>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              leadingIcon="mail"
              error={errors.email}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              placeholder="+1 555 0100"
              leadingIcon="phone"
              error={errors.phone}
            />
          </Field>
          <Field label="Password" htmlFor="password" hint="Minimum 8 chars with upper, lower, and number.">
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              leadingIcon="lock"
              error={errors.password}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword">
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              leadingIcon="lock"
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
            />
          </Field>
          <Button type="submit" className="w-full" loading={pending}>
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
