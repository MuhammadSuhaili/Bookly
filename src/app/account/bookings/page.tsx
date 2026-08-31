import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { requireAuth } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CancelBookingButton } from "@/components/account/cancel-booking-button";
import { Icon } from "@/components/icons";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default async function AccountBookingsPage() {
  const user = await requireAuth();

  const userBookings = await db
    .select({
      booking: bookings,
      serviceName: services.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.userId, user.sub))
    .orderBy(desc(bookings.createdAt));

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {userBookings.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No bookings yet"
            description="You haven't made any bookings. Browse our services to get started."
            action={
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                <Icon name="service" size={16} />
                Browse Services
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium uppercase text-slate-500">
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Price</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userBookings.map(({ booking, serviceName }) => {
                  const canCancel =
                    booking.status === "PENDING" ||
                    booking.status === "CONFIRMED";
                  return (
                    <tr key={booking.id} className="group">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-slate-600">
                          {booking.referenceId}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {serviceName}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatDate(booking.bookingDate)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatTime(booking.startTime)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-700">
                        {formatCurrency(booking.price)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/account/bookings/${booking.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Icon name="eye" size={14} />
                            View
                          </Link>
                          {canCancel && (
                            <CancelBookingButton bookingId={booking.id} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
