import { auditLogs as auditTable, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AuditActionFilter } from "@/components/admin/audit-action-filter";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit Log" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireAdmin();
  const { action } = await searchParams;

  const rows = await db
    .select({
      id: auditTable.id,
      action: auditTable.action,
      entityType: auditTable.entityType,
      entityId: auditTable.entityId,
      ipAddress: auditTable.ipAddress,
      createdAt: auditTable.createdAt,
      userEmail: users.email,
      userName: sql`${users.firstName} || ' ' || ${users.lastName}`,
    })
    .from(auditTable)
    .leftJoin(users, eq(auditTable.userId, users.id))
    .where(action && action !== "ALL" ? eq(auditTable.action, action) : sql`TRUE`)
    .orderBy(desc(auditTable.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track important actions taken on the platform.
          </p>
        </div>
        <AuditActionFilter />
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon="activity"
              title="No audit entries"
              description="No audit logs found for the selected filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">{formatDateTime(r.createdAt)}</td>
                      <td className="px-5 py-3">
                        <span className="text-slate-900">{r.userEmail ?? "System"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="primary">{r.action}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.entityType ? `${r.entityType}${r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ""}` : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
