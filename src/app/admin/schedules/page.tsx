import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { schedules, services, timeSlots } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateScheduleButton } from "@/components/admin/create-schedule-button";
import { ScheduleFilters } from "@/components/admin/schedule-filters";
import { DeleteScheduleButton } from "@/components/admin/schedule-actions";
import { CreateTimeSlotButton, DeleteTimeSlotButton } from "@/components/admin/time-slot-actions";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata = { title: "Schedules" };

export default async function AdminSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceId?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const { serviceId, from, to } = await searchParams;

  const servicesAll = await db.select().from(services).orderBy(sql`name`);
  const serviceOptions = servicesAll.map((s) => ({ id: s.id, name: s.name }));

  const conditions = [];
  if (serviceId && servicesAll.some((s) => s.id === serviceId)) {
    conditions.push(eq(schedules.serviceId, serviceId));
  }
  if (from) conditions.push(gte(schedules.date, from));
  if (to) conditions.push(lte(schedules.date, to));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schedules.id,
      date: schedules.date,
      isOpen: schedules.isOpen,
      notes: schedules.notes,
      serviceId: schedules.serviceId,
      serviceName: services.name,
    })
    .from(schedules)
    .innerJoin(services, eq(schedules.serviceId, services.id))
    .where(where)
    .orderBy(sql`date`);

  const scheduleIds = rows.map((r) => r.id);
  const slots = scheduleIds.length
    ? await db
        .select({
          id: timeSlots.id,
          scheduleId: timeSlots.scheduleId,
          startTime: timeSlots.startTime,
          endTime: timeSlots.endTime,
          capacity: timeSlots.capacity,
          isActive: timeSlots.isActive,
        })
        .from(timeSlots)
        .where(inArray(timeSlots.scheduleId, scheduleIds))
        .orderBy(sql`start_time`)
    : [];
  const slotsBySchedule = new Map<string, typeof slots>();
  for (const s of slots) {
    if (!slotsBySchedule.has(s.scheduleId)) slotsBySchedule.set(s.scheduleId, []);
    slotsBySchedule.get(s.scheduleId)!.push(s);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedules</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage bookable days and time slots per service.
          </p>
        </div>
        <CreateScheduleButton services={serviceOptions} />
      </div>

      <ScheduleFilters services={serviceOptions} />

      {rows.length === 0 ? (
        <EmptyState
          icon="schedule"
          title="No schedules found"
          description="Adjust your filters or create a new schedule."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{s.serviceName}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {formatDate(s.date)}
                      {s.notes ? ` · ${s.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.isOpen ? (
                      <Badge variant="success">Open</Badge>
                    ) : (
                      <Badge variant="neutral">Closed</Badge>
                    )}
                    <DeleteScheduleButton scheduleId={s.id} />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Time slots
                    </p>
                    <CreateTimeSlotButton scheduleId={s.id} />
                  </div>
                  {!slotsBySchedule.has(s.id) ? (
                    <p className="text-sm text-slate-400">No time slots yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {slotsBySchedule.get(s.id)!.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                        >
                          <span className="text-sm text-slate-700">
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                              cap {slot.capacity}
                              {!slot.isActive && " · off"}
                            </span>
                            <DeleteTimeSlotButton slotId={slot.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
