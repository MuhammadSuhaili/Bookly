import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type UserRole } from "@/db/schema";
import { getSession, type SessionPayload } from "./session";

/**
 * Get the current user's session payload (cached per-request).
 * Returns null when unauthenticated.
 */
export const getCurrentUser = cache(async (): Promise<SessionPayload | null> => {
  return getSession();
});

/** Require authentication; redirect to login if absent. */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?next=" + encodeURIComponent(currentPath()));
  }
  return session;
}

/** Require an ADMIN role; redirect non-admins away. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}

function currentPath(): string {
  return "/";
}

/** Load a full user row from DB by id (fresh, not from session claims). */
export async function loadUserRow(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  return row ?? null;
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}
