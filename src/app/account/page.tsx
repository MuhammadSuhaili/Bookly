import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings, services, notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/icons";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function AccountDashboardPage() {
  const user = await requireAuth();

  const [userBookings, unreadCount] = await Promise.all([
    db
      .select({
        booking: bookings,
        serviceName: services.name,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.userId, user.sub))
      .orderBy(desc(bookings.createdAt))
      .limit(5),
    db
      .select({ count: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, user.sub)),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <Icon name="user" size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Icon name="calendar" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {userBookings.length}
                </p>
                <p className="text-sm text-slate-500">Recent Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Icon name="bell" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {unreadCount.length}
                </p>
                <p className="text-sm text-slate-500">Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {userBookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No bookings yet.{" "}
              <Link href="/services" className="text-teal-600 hover:underline">
                Browse services
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {userBookings.map(({ booking, serviceName }) => (
                <Link
                  key={booking.id}
                  href={`/account/bookings/${booking.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-slate-50 -mx-5 px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {serviceName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(booking.bookingDate)} &middot;{" "}
                      {booking.referenceId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {formatCurrency(booking.price)}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
