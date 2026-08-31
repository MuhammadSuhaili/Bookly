"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, getCurrentUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/security/rate-limit";
import { parseOrErrors } from "@/lib/validation/errors";
import {
  bookingInputSchema,
  bookingCancelSchema,
  adminBookingStatusSchema,
} from "@/lib/validation";
import {
  createBooking,
  cancelBooking,
  BookingError,
} from "@/lib/booking";
import { changeBookingStatus } from "@/lib/booking/admin";
import { audit } from "@/lib/security/audit";
import { getScheduleWithSlots } from "@/lib/services";

export type ActionResult =
  | { ok: true; message: string; bookingId?: string }
  | { ok: false; errors: Record<string, string> }
  | null;

export async function createBookingAction(prev: unknown, formData: FormData): Promise<ActionResult> {
  const session = await requireAuth();
  if (session.role !== "CUSTOMER") {
    return { ok: false, errors: { form: "Only customers can create bookings." } };
  }

  const { allowed } = await rateLimit("booking-create", { limit: 20 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many booking attempts. Please slow down." } };
  }

  const parsed = parseOrErrors(bookingInputSchema, {
    serviceId: formData.get("serviceId"),
    scheduleId: formData.get("scheduleId"),
    timeSlotId: formData.get("timeSlotId"),
    date: formData.get("date"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    notes: formData.get("notes") || "",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    const { booking } = await createBooking({
      ...parsed.data,
      userId: session.sub,
    });
    return { ok: true, message: "Booking created successfully.", bookingId: booking.id };
  } catch (err) {
    if (err instanceof BookingError) {
      return { ok: false, errors: { form: err.message } };
    }
    console.error("createBooking failed", err);
    return { ok: false, errors: { form: "Something went wrong. Please try again." } };
  }
}

export async function cancelBookingAction(prev: unknown, formData: FormData): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = parseOrErrors(bookingCancelSchema, {
    bookingId: formData.get("bookingId"),
    reason: formData.get("reason") || "",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  const { allowed } = await rateLimit("booking-cancel", { limit: 20 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  try {
    await cancelBooking({
      bookingId: parsed.data.bookingId,
      userId: session.sub,
      role: session.role as "CUSTOMER" | "ADMIN",
      reason: parsed.data.reason,
    });
    revalidatePath("/account/bookings");
    return { ok: true, message: "Booking cancelled successfully." };
  } catch (err) {
    if (err instanceof BookingError) {
      return { ok: false, errors: { form: err.message } };
    }
    return { ok: false, errors: { form: "Unable to cancel booking." } };
  }
}

export async function adminChangeBookingStatusAction(prev: unknown, formData: FormData): Promise<ActionResult> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    return { ok: false, errors: { form: "Unauthorized." } };
  }

  const parsed = parseOrErrors(adminBookingStatusSchema, {
    bookingId: formData.get("bookingId"),
    status: formData.get("status"),
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    const transition = await changeBookingStatus(
      parsed.data.bookingId,
      parsed.data.status,
    );
    await audit({
      userId: session.sub,
      action: "BOOKING_STATUS_CHANGE",
      entityType: "booking",
      entityId: parsed.data.bookingId,
      details: { from: transition.from, to: transition.to },
    });
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");
    return { ok: true, message: `Booking marked as ${parsed.data.status.toLowerCase()}.` };
  } catch (err) {
    if (err instanceof BookingError) {
      return { ok: false, errors: { form: err.message } };
    }
    return { ok: false, errors: { form: "Unable to update booking status." } };
  }
}

export async function getCurrentUserForLayout() {
  return getCurrentUser();
}

export type AvailableSlotResult =
  | { scheduleId: string; slots: { id: string; startTime: string; endTime: string }[] }
  | { error: string };

export async function getAvailableTimeSlotsAction(
  serviceId: string,
  date: string,
): Promise<AvailableSlotResult> {
  const session = await getCurrentUser();
  if (!session) {
    return { error: "Please log in to book." };
  }
  const result = await getScheduleWithSlots(serviceId, date);
  if (!result) {
    return { error: "No availability for the selected date." };
  }
  return {
    scheduleId: result.schedule.id,
    slots: result.slots.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  };
}


