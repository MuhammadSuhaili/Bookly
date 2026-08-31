"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cancelBookingAction } from "@/server/actions/booking";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/server/actions/booking";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const { success, error: toastError } = useToast();
  const [state, formAction, isPending] = useActionState(
    cancelBookingAction,
    null,
  );
  const handled = useRef<ActionResult>(null);

  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      setOpen(false);
      success("Booking Cancelled", state.message);
    } else if (state.errors?.form) {
      toastError("Cancellation Failed", state.errors.form);
    }
  }, [state, success, toastError]);

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Cancel
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Cancel Booking"
        description="Please provide a reason for cancelling this booking."
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <Field label="Reason (optional)">
            <Textarea
              name="reason"
              placeholder="Why are you cancelling?"
              rows={3}
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Keep Booking
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isPending}
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
