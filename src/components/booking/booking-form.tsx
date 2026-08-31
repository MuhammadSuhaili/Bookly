"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  createBookingAction,
  getAvailableTimeSlotsAction,
  type ActionResult,
} from "@/server/actions/booking";
import { formatTime } from "@/lib/utils";

function toLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingForm({
  serviceId,
  serviceName,
  price,
  user,
}: {
  serviceId: string;
  serviceName: string;
  price: string;
  user: { firstName: string; lastName: string; email: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPendingSlots, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [slots, setSlots] = useState<
    { id: string; startTime: string; endTime: string }[]
  >([]);
  const [slotError, setSlotError] = useState("");
  const [timeSlotId, setTimeSlotId] = useState("");

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    createBookingAction,
    { ok: false, errors: {} },
  );

  const handled = useRef<ActionResult>(null);
  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    if (state.ok) {
      handled.current = state;
      toast.success("Booking created", state.message);
      router.push(`/account/bookings/${state.bookingId}`);
    }
  }, [state, router, toast]);

  function onDateChange(value: string) {
    setDate(value);
    setTimeSlotId("");
    setSlotError("");
    setScheduleId("");
    setSlots([]);
    if (!value) return;
    startTransition(async () => {
      const res = await getAvailableTimeSlotsAction(serviceId, value);
      if ("error" in res) {
        setSlotError(res.error);
      } else {
        setScheduleId(res.scheduleId);
        setSlots(res.slots);
        setSlotError(res.slots.length === 0 ? "No time slots available on this day." : "");
      }
    });
  }

  const minDate = toLocalDateInput(new Date());
  const defaultName = `${user.firstName} ${user.lastName}`.trim();
  const error = state && !state.ok ? state.errors : {};

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <input type="hidden" name="timeSlotId" value={timeSlotId} />
      <input type="hidden" name="date" value={date} />

      <Field label="Pick a date" htmlFor="date">
        <Input
          id="date"
          type="date"
          name="date"
          min={minDate}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
      </Field>

      <div>
        <p className="mb-1.5 block text-sm font-medium text-slate-700">Available time slots</p>
        {date === "" ? (
          <p className="text-sm text-slate-400">Select a date to see available times.</p>
        ) : isPendingSlots ? (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
            <Spinner className="h-4 w-4" /> Loading availability…
          </div>
        ) : slotError ? (
          <p className="text-sm text-red-600">{slotError}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTimeSlotId(s.id)}
                className={
                  timeSlotId === s.id
                    ? "rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:border-teal-400 hover:bg-teal-50"
                }
              >
                {formatTime(s.startTime)}
              </button>
            ))}
          </div>
        )}
        {!timeSlotId && !slotError && date !== "" && slots.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">Select a time slot to continue.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="customerName">
          <Input id="customerName" name="customerName" defaultValue={defaultName} error={error.customerName} required />
        </Field>
        <Field label="Email" htmlFor="customerEmail">
          <Input id="customerEmail" type="email" name="customerEmail" defaultValue={user.email} error={error.customerEmail} required />
        </Field>
      </div>
      <Field label="Phone" htmlFor="customerPhone">
        <Input id="customerPhone" name="customerPhone" placeholder="0812-3456-7890" leadingIcon="phone" error={error.customerPhone} required />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} placeholder="Any special requests…" />
      </Field>

      {error.form && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.form}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-sm text-slate-500">{serviceName}</p>
          <p className="text-lg font-semibold text-slate-900">{price}</p>
        </div>
        <Button
          type="submit"
          icon="calendar"
          loading={pending}
          disabled={!date || !timeSlotId}
        >
          Confirm booking
        </Button>
      </div>
    </form>
  );
}