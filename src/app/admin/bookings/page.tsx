import { db } from "@/db";
import { bookings, services, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingStatusFilter } from "@/components/admin/booking-status-filter";
import { BookingRowActions } from "@/components/admin/booking-row-actions";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { type BookingStatus } from "@/db/schema";

export const metadata = { title: "Bookings" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const filter = status && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"].includes(status)
    ? status as BookingStatus
    : null;

  const rows = await db
    .select({
      id: bookings.id,
      referenceId: bookings.referenceId,
      status: bookings.status,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      price: bookings.price,
      serviceName: services.name,
      customerName: users.firstName,
      customerEmail: users.email,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(filter ? and(eq(bookings.status, filter)) : sql`TRUE`)
    .orderBy(desc(bookings.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and update booking statuses.
          </p>
        </div>
        <BookingStatusFilter />
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No bookings found"
              description={filter ? `No ${filter.toLowerCase()} bookings match your filter.` : "There are no bookings yet."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{b.referenceId}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{b.customerName}</p>
                        <p className="text-xs text-slate-500">{b.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{b.serviceName}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(b.bookingDate)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatTime(b.startTime)}</td>
                      <td className="px-5 py-3 text-slate-900">{formatCurrency(b.price)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-3">
                        <BookingRowActions bookingId={b.id} status={b.status} />
                      </td>
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
