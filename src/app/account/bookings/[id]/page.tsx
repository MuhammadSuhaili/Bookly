import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelBookingButton } from "@/components/account/cancel-booking-button";
import { Icon } from "@/components/icons";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const [row] = await db
    .select({
      booking: bookings,
      serviceName: services.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, id));

  if (!row || row.booking.userId !== user.sub) {
    notFound();
  }

  const { booking, serviceName } = row;
  const canCancel =
    booking.status === "PENDING" || booking.status === "CONFIRMED";

  const detailRows: Array<{ icon: "calendar" | "clock" | "tag" | "user" | "mail" | "phone"; label: string; value: string }> = [
    { icon: "calendar", label: "Date", value: formatDate(booking.bookingDate) },
    { icon: "clock", label: "Time", value: `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}` },
    { icon: "tag", label: "Service", value: serviceName },
    { icon: "user", label: "Customer", value: booking.customerName },
    { icon: "mail", label: "Email", value: booking.customerEmail },
    { icon: "phone", label: "Phone", value: booking.customerPhone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          <Icon name="arrowLeft" size={15} />
          Back to my bookings
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Booking {booking.referenceId}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Booking details</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {detailRows.map((r) => (
              <div
                key={r.label}
                className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                  <Icon name={r.icon} size={16} />
                </span>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {r.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-900">
                    {r.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(booking.price)}
            </span>
          </div>

          {booking.notes && (
            <div className="mt-4 rounded-lg border border-slate-100 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Notes
              </p>
              <p className="mt-1 text-sm text-slate-700">{booking.notes}</p>
            </div>
          )}

          {booking.cancellationReason && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-red-500">
                Cancellation reason
              </p>
              <p className="mt-1 text-sm text-red-700">
                {booking.cancellationReason}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {canCancel ? (
              <CancelBookingButton bookingId={booking.id} />
            ) : (
              <p className="text-sm text-slate-400">
                This booking can no longer be cancelled.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
