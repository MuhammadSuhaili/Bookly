import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditOptions = {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Write a row to the audit log. Intended for important/protected actions
 * (e.g. admin mutations, status changes, sign-ins). Best-effort: failures are
 * swallowed so auditing never breaks the primary flow.
 */
export async function audit(options: AuditOptions): Promise<void> {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null;
    const userAgent = headersList.get("user-agent") || null;
    // Cap details to a reasonable size to protect the database.
    const details = options.details ?? null;

    await db.insert(auditLogs).values({
      userId: options.userId ?? null,
      action: options.action,
      entityType: options.entityType ?? null,
      entityId: options.entityId ?? null,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      ipAddress: ip,
      userAgent,
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}
