import "server-only";
import { db } from "@/db";
import { bookings, notifications, type BookingStatus } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { BookingError } from "./index";

/** Allowed state transitions for bookings. */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Change a booking's status (admin action). Enforces the transition table and
 * records a notification for the owner.
 */
export async function changeBookingStatus(
  bookingId: string,
  toStatus: BookingStatus,
): Promise<{ from: BookingStatus; to: BookingStatus }> {
  const [existing] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!existing) {
    throw new BookingError("NOT_FOUND", "Booking not found.");
  }

  if (existing.status === toStatus) {
    return { from: existing.status, to: existing.status };
  }

  if (!canTransition(existing.status, toStatus)) {
    throw new BookingError(
      "INVALID_TRANSITION",
      `Cannot change booking from ${existing.status} to ${toStatus}.`,
    );
  }

  await db
    .update(bookings)
    .set({ status: toStatus, updatedAt: sql`NOW()` })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, existing.status)));

  await db.insert(notifications).values({
    userId: existing.userId,
    type: "STATUS",
    title: `Booking ${toStatus.toLowerCase()}`,
    message: `Your booking ${existing.referenceId} is now ${toStatus.toLowerCase()}.`,
    link: `/account/bookings/${existing.id}`,
  });

  return { from: existing.status, to: toStatus };
}
