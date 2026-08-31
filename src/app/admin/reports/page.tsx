import { db } from "@/db";
import {
  bookings,
  services,
  schedules,
  timeSlots,
  categories,
  users,
} from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { type BookingStatus } from "@/db/schema";

export const metadata = { title: "Reports" };

const STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];

export default async function AdminReportsPage() {
  await requireAdmin();

  const [allBookings, countByStatus, revenueByStatus, totals, recentBookings] = await Promise.all([
    db.select({ price: bookings.price }).from(bookings),
    Promise.all(
      STATUSES.map(async (s) => {
        const [row] = await db.select({ n: count() }).from(bookings).where(eq(bookings.status, s));
        return { status: s, count: row.n };
      }),
    ),
    Promise.all(
      STATUSES.map(async (s) => {
        const [row] = await db
          .select({
            total: sql<number>`COALESCE(SUM(${bookings.price}), 0)`,
          })
          .from(bookings)
          .where(eq(bookings.status, s));
        return { status: s, revenue: Number(row.total) };
      }),
    ),
    Promise.all([
      db.select({ n: count() }).from(services),
      db.select({ n: count() }).from(categories),
      db.select({ n: count() }).from(schedules),
      db.select({ n: count() }).from(timeSlots),
      db.select({ n: count() }).from(users),
    ]).then((res) => res.map((r) => r[0].n)),
    db
      .select({
        id: bookings.id,
        referenceId: bookings.referenceId,
        status: bookings.status,
        price: bookings.price,
        createdAt: bookings.createdAt,
        customerName: bookings.customerName,
      })
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(10),
  ]);

  const totalRevenue = allBookings.reduce((sum, b) => sum + Number(b.price), 0);
  const [servicesC, categoriesC, schedulesC, timeSlotsC, usersC] = totals;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          A summary of platform activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
            <p className="mt-1 text-xs text-slate-400">{allBookings.length} bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Services</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{servicesC}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Categories</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{categoriesC}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Schedules</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{schedulesC}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Time slots</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{timeSlotsC}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total users</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{usersC}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings by status</CardTitle>
            <CardDescription>Distribution of bookings across statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {countByStatus.map(({ status, count: n }) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-sm font-medium text-slate-700">{n}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by status</CardTitle>
            <CardDescription>Revenue attributed to each booking status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueByStatus.map(({ status, revenue }) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-sm font-medium text-slate-700">{formatCurrency(revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The latest bookings recorded.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{b.customerName}</p>
                  <p className="text-xs text-slate-500">{b.referenceId} · {formatDateTime(b.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="primary">{formatCurrency(b.price)}</Badge>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No recent activity.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
