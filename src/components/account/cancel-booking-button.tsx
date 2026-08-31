"use client";

import { useActionState, useState } from "react";
import { cancelBookingAction } from "@/server/actions/booking";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const { success, error: toastError } = useToast();
  const [state, formAction, isPending] = useActionState(
    cancelBookingAction,
    null,
  );

  if (state?.ok === true) {
    setOpen(false);
    success("Booking Cancelled", state.message);
  }

  if (state?.ok === false && state.errors.form) {
    toastError("Cancellation Failed", state.errors.form);
  }

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
