import { db, getClient, releaseClient } from "@/db";
import {
  bookings,
  services,
  timeSlots,
  notifications,
  type BookingStatus,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export class BookingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

/** Generate a short, unique, human-friendly booking reference. */
export function generateReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  const k = (len: number) =>
    Array.from({ length: len }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  return `BK-${k(5)}-${k(5)}`;
}

export type CreateBookingInput = {
  serviceId: string;
  scheduleId: string;
  timeSlotId: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  userId: string;
};

/**
 * Create a booking atomically.
 *
 * Double-booking protection strategy:
 *  1. Open an explicit transaction and take a row lock (`FOR UPDATE`) on the
 *     chosen time slot, serializing concurrent bookings of the same slot.
 *  2. Re-check (server-side) that no ACTIVE booking already occupies the slot
 *     on that date, taking capacity into account.
 *  3. Insert the booking. A DB-level partial unique index
 *     (`bookings_active_slot_unique`) enforces that only one ACTIVE booking may
 *     exist per (timeSlotId, date) — the ultimate backstop that rejects any
 *     race condition that slips past application logic.
 */
export async function createBooking(input: CreateBookingInput): Promise<{
  booking: { id: string; referenceId: string; status: BookingStatus };
}> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new BookingError("INVALID_DATE", "Invalid booking date.");
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    /* Lock the time slot row. */
    const slotRes = await client.query<{ id: string; capacity: number; schedule_id: string }>(
      `SELECT id, capacity, schedule_id FROM time_slots WHERE id = $1 FOR UPDATE`,
      [input.timeSlotId],
    );
    const slot = slotRes.rows[0];
    if (!slot) {
      await client.query("ROLLBACK");
      throw new BookingError("SLOT_NOT_FOUND", "The selected time slot no longer exists.");
    }
    if (slot.schedule_id !== input.scheduleId) {
      await client.query("ROLLBACK");
      throw new BookingError("INVALID_SLOT", "The time slot does not belong to the selected schedule.");
    }

    /* Verify the schedule belongs to the service and is open. */
    const scheduleRes = await client.query<{ service_id: string; date: string; is_open: boolean }>(
      `SELECT service_id, to_char(date, 'YYYY-MM-DD') AS date, is_open FROM schedules WHERE id = $1`,
      [input.scheduleId],
    );
    const schedule = scheduleRes.rows[0];
    if (!schedule || schedule.service_id !== input.serviceId) {
      await client.query("ROLLBACK");
      throw new BookingError("INVALID_SCHEDULE", "The schedule does not belong to this service.");
    }
    if (!schedule.is_open) {
      await client.query("ROLLBACK");
      throw new BookingError("SCHEDULE_CLOSED", "This day is not available for booking.");
    }
    if (schedule.date !== input.date) {
      await client.query("ROLLBACK");
      throw new BookingError("DATE_MISMATCH", "The date does not match the schedule.");
    }

    /* Count existing ACTIVE bookings for this slot+date. */
    const activeRes = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count
         FROM bookings
        WHERE time_slot_id = $1 AND booking_date = $2
          AND status IN ('PENDING','CONFIRMED')`,
      [input.timeSlotId, input.date],
    );
    const activeCount = parseInt(activeRes.rows[0].count, 10) || 0;
    if (activeCount >= slot.capacity) {
      await client.query("ROLLBACK");
      throw new BookingError("SLOT_FULL", "This time slot has just been booked by someone else.");
    }

    /* Load fresh service price (never trust the client). */
    const [service] = await db
      .select({ price: services.price, name: services.name })
      .from(services)
      .where(eq(services.id, input.serviceId));
    if (!service) {
      await client.query("ROLLBACK");
      throw new BookingError("SERVICE_NOT_FOUND", "The service does not exist.");
    }

    /* Fetch slot times. */
    const slotTimes = await db
      .select({ startTime: timeSlots.startTime, endTime: timeSlots.endTime })
      .from(timeSlots)
      .where(eq(timeSlots.id, input.timeSlotId));

    const referenceId = generateReference();

    /* Insert the booking. The partial unique index is the final guard. */
    let bookingId: string;
    try {
      const ins = await client.query<{ id: string }>(
        `INSERT INTO bookings
           (reference_id, user_id, service_id, schedule_id, time_slot_id,
            status, booking_date, start_time, end_time, price,
            customer_name, customer_email, customer_phone, notes,
            created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
         RETURNING id`,
        [
          referenceId,
          input.userId,
          input.serviceId,
          input.scheduleId,
          input.timeSlotId,
          input.date,
          slotTimes[0].startTime,
          slotTimes[0].endTime,
          service.price,
          input.customerName,
          input.customerEmail,
          input.customerPhone,
          input.notes || null,
        ],
      );
      bookingId = ins.rows[0].id;
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        await client.query("ROLLBACK");
        throw new BookingError(
          "SLOT_TAKEN",
          "Sorry, this time slot was just booked by another customer.",
        );
      }
      throw err;
    }

    /* Notification for the customer. */
    await client.query(
      `INSERT INTO notifications
         (user_id, type, title, message, link, is_read, created_at)
       VALUES ($1, 'BOOKING', $2, $3, $4, false, NOW())`,
      [
        input.userId,
        "Booking created",
        `Your booking ${referenceId} for ${service.name} is pending confirmation.`,
        `/account/bookings/${bookingId}`,
      ],
    );

    await client.query("COMMIT");

    return {
      booking: { id: bookingId, referenceId, status: "PENDING" },
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* already rolled back */
    }
    throw err;
  } finally {
    releaseClient(client);
  }
}

/**
 * Cancel a booking. Only the owner (customer) or an admin may cancel.
 * Allowed from PENDING and CONFIRMED states.
 */
export async function cancelBooking(args: {
  bookingId: string;
  userId: string;
  role: "CUSTOMER" | "ADMIN";
  reason?: string;
}): Promise<{ ok: boolean; message: string }> {
  const [existing] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, args.bookingId));

  if (!existing) {
    throw new BookingError("NOT_FOUND", "Booking not found.");
  }

  if (args.role !== "ADMIN" && existing.userId !== args.userId) {
    throw new BookingError("FORBIDDEN", "You can only cancel your own booking.");
  }

  if (existing.status !== "PENDING" && existing.status !== "CONFIRMED") {
    throw new BookingError(
      "INVALID_STATUS",
      "This booking cannot be cancelled in its current state.",
    );
  }

  await db
    .update(bookings)
    .set({
      status: "CANCELLED",
      cancelledAt: sql`NOW()`,
      cancellationReason: args.reason || null,
      updatedAt: sql`NOW()`,
    })
    .where(eq(bookings.id, args.bookingId));

  await db.insert(notifications).values({
    userId: existing.userId,
    type: "STATUS",
    title: "Booking cancelled",
    message: `Booking ${existing.referenceId} has been cancelled.`,
    link: `/account/bookings/${existing.id}`,
  });

  return { ok: true, message: "Booking cancelled successfully." };
}

function isUniqueViolation(err: unknown): boolean {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  ) {
    return true;
  }
  return false;
}
