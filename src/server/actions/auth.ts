"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, roles, auditLogs } from "@/db/schema";
import { rateLimit } from "@/lib/security/rate-limit";
import { parseOrErrors } from "@/lib/validation/errors";
import {
  loginSchema,
  registerSchema,
} from "@/lib/validation";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";

export async function loginAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const { allowed } = await rateLimit("login", { limit: 10 });
  if (!allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const parsed = parseOrErrors(loginSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (parsed.error) {
    return { error: Object.values(parsed.error)[0] ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      firstName: users.firstName,
      lastName: users.lastName,
      role: roles.name,
      isActive: users.isActive,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email.toLowerCase()));

  if (!user || !user.isActive) {
    return { error: "Invalid email or password." };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  await db
    .update(users)
    .set({ lastLoginAt: sql`NOW()` })
    .where(eq(users.id, user.id));

  const token = await createSessionToken({
    id: user.id,
    role: user.role as "CUSTOMER" | "ADMIN",
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  await setSessionCookie(token);

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "LOGIN",
    entityType: "user",
    entityId: user.id,
    details: { email: user.email },
  });

  redirect(user.role === "ADMIN" ? "/admin" : "/account");
}

export async function registerAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: Record<string, string> } | { success: string }> {
  const { allowed } = await rateLimit("register", { limit: 10 });
  if (!allowed) {
    return {
      error: { form: "Too many registration attempts. Please try again later." },
    };
  }

  const parsed = parseOrErrors(registerSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || "",
  });
  if (parsed.error) {
    return { error: parsed.error };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existing.length > 0) {
    return { error: { email: "An account with this email already exists." } };
  }

  const [customerRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "CUSTOMER"));

  if (!customerRole) {
    return { error: { form: "Registration is currently unavailable." } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      roleId: customerRole.id,
      email,
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      emailVerified: true,
      isActive: true,
    })
    .returning();

  const token = await createSessionToken({
    id: user.id,
    role: "CUSTOMER",
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  await setSessionCookie(token);

  return { success: "Account created successfully." };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
