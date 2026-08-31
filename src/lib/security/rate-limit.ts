import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();
const WINDOW_MS = 60_000; // 1 minute window
const MAX_ENTRIES = 10_000;

type RateLimitConfig = {
  limit: number;
  windowMs?: number;
};

/**
 * Very simple in-memory sliding-window rate limiter, keyed by IP + scope.
 * Suitable for a single Node instance. For multi-instance deployments,
 * swap this for a shared store (e.g. Upstash Redis).
 */
export async function rateLimit(scope: string, config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";
  const windowMs = config.windowMs ?? WINDOW_MS;
  const key = `${scope}:${ip}`;
  const now = Date.now();

  // Opportunistic cleanup to avoid unbounded memory growth.
  if (store.size > MAX_ENTRIES) {
    for (const [k, b] of store) {
      if (b.resetAt < now) store.delete(k);
    }
  }

  const current = store.get(key);
  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.limit - 1 };
  }

  if (current.count >= config.limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: config.limit - current.count };
}
