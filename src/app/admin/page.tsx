import { db } from "@/db";
import {
  bookings,
  services,
  users,
  roles,
} from "@/db/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    totalBookings,
    pendingCount,
    confirmedCount,
    completedCount,
    totalServices,
    totalUsers,
    recentBookings,
  ] = await Promise.all([
    db.select({ count: count() }).from(bookings),
    db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.status, "PENDING")),
    db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.status, "CONFIRMED")),
    db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.status, "COMPLETED")),
    db.select({ count: count() }).from(services),
    db
      .select({ count: count() })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(roles.name, "CUSTOMER")),
    db
      .select({
        id: bookings.id,
        referenceId: bookings.referenceId,
        status: bookings.status,
        bookingDate: bookings.bookingDate,
        startTime: bookings.startTime,
        price: bookings.price,
        serviceId: bookings.serviceId,
        customerName: bookings.customerName,
      })
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(8),
  ]);

  const serviceNames = recentBookings.length
    ? await db
        .select({ id: services.id, name: services.name })
        .from(services)
        .where(inArray(services.id, recentBookings.map((b) => b.serviceId)))
    : [];
  const nameById = new Map(serviceNames.map((s) => [s.id, s.name]));

  const stats: { label: string; value: number; icon: IconName; accent: string }[] = [
    { label: "Total Bookings", value: totalBookings[0].count, icon: "calendar", accent: "bg-teal-50 text-teal-600" },
    { label: "Pending", value: pendingCount[0].count, icon: "clock", accent: "bg-amber-50 text-amber-600" },
    { label: "Confirmed", value: confirmedCount[0].count, icon: "checkCircle", accent: "bg-sky-50 text-sky-600" },
    { label: "Completed", value: completedCount[0].count, icon: "check", accent: "bg-emerald-50 text-emerald-600" },
    { label: "Services", value: totalServices[0].count, icon: "service", accent: "bg-teal-50 text-teal-600" },
    { label: "Customers", value: totalUsers[0].count, icon: "users", accent: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your booking platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.accent}`}>
                <Icon name={s.icon} size={22} />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent bookings</CardTitle>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View all <Icon name="arrowRight" size={15} />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentBookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No bookings yet.</p>
            ) : (
              recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {nameById.get(b.serviceId) ?? "Service"}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {b.referenceId} Â· {b.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(b.bookingDate)} Â· {formatTime(b.startTime)}
                    </p>
                    <Badge variant="primary">{formatCurrency(b.price)}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
