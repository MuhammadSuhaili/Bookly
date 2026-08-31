"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { BookingStatusForm } from "@/components/admin/booking-status-form";
import { cancelBookingAction, type ActionResult } from "@/server/actions/booking";
import { type BookingStatus } from "@/db/schema";

export function BookingRowActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [statusOpen, setStatusOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    cancelBookingAction,
    { ok: false, errors: {} },
  );

  const handled = useRef<ActionResult>(null);
  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    if (state.ok) {
      handled.current = state;
      toast.success("Booking cancelled", state.message);
      router.refresh();
      setTimeout(() => setCancelOpen(false), 0);
    }
  }, [state, router, toast]);

  const canChange = status !== "COMPLETED" && status !== "CANCELLED" && status !== "REJECTED";
  const canCancel = status === "PENDING" || status === "CONFIRMED";

  return (
    <>
      <div className="flex justify-end gap-2">
        {canChange && (
          <Button
            size="sm"
            variant="outline"
            icon="edit"
            onClick={() => setStatusOpen(true)}
          >
            Change
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            onClick={() => setCancelOpen(true)}
          >
            Cancel
          </Button>
        )}
      </div>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Change booking status"
        description="Move this booking to a new state."
      >
        <BookingStatusForm
          key={String(statusOpen)}
          bookingId={bookingId}
          currentStatus={status}
          onClose={() => setStatusOpen(false)}
        />
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel booking"
        description="This will cancel the booking and notify the customer."
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <Field label="Reason (optional)" htmlFor="reason">
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="Reason for cancellation…"
            />
          </Field>
          {state && !state.ok && state.errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.errors.form}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Keep booking
            </Button>
            <Button type="submit" variant="danger" loading={pending}>
              Cancel booking
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
