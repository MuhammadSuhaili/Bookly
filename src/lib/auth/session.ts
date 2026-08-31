import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/db/schema";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

/** Create a signed session token for a user. */
export async function createSessionToken(user: {
  id: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  return new SignJWT({
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/** Verify and decode a session token, or return null if invalid/expired. */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Read the session cookie. Requires a request context (Server Component/Action). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Set the session cookie (Server Action or Route Handler only). */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.APP_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Clear the session cookie (Server Action or Route Handler only). */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
