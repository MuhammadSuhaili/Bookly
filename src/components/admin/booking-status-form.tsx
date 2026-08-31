"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import {
  adminChangeBookingStatusAction,
  type ActionResult,
} from "@/server/actions/booking";
import { type BookingStatus } from "@/db/schema";

const ALL_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

const labelMap: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export function BookingStatusForm({
  bookingId,
  currentStatus,
  onClose,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const allowed = ALL_STATUSES.filter((s) => s !== currentStatus && canTransition(currentStatus, s));

  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    adminChangeBookingStatusAction,
    null,
  );

  const handled = useRef<ActionResult | null>(null);
  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      toast.success("Status updated", state.message);
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose]);

  const error = state && !state.ok ? state.errors : {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Field label="New status" htmlFor="status">
        <Select id="status" name="status" required defaultValue="">
          <option value="" disabled>
            Select a status
          </option>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {labelMap[s]}
            </option>
          ))}
        </Select>
      </Field>

      {error.form && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.form}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={pending} disabled={allowed.length === 0}>
          Update status
        </Button>
      </div>
    </form>
  );
}
