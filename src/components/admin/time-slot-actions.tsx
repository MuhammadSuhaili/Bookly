"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  createTimeSlotAction,
  deleteTimeSlotAction,
  type AdminActionResult,
} from "@/server/actions/admin";

export function CreateTimeSlotButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionResult, FormData>(
    createTimeSlotAction,
    { ok: false, errors: {} },
  );

  const handled = useRef<AdminActionResult>(null);
  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    if (state.ok) {
      handled.current = state;
      toast.success("Time slot added", state.message);
      router.refresh();
      setTimeout(() => setOpen(false), 0);
    }
  }, [state, router, toast]);

  const error = state && !state.ok ? state.errors : {};

  return (
    <>
      <Button size="sm" variant="outline" icon="plus" onClick={() => setOpen(true)}>
        Add slot
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add time slot"
        description="Add a start time for this schedule."
        size="sm"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="scheduleId" value={scheduleId} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" htmlFor="startTime">
              <Input id="startTime" name="startTime" type="time" error={error.startTime} required />
            </Field>
            <Field label="End" htmlFor="endTime">
              <Input id="endTime" name="endTime" type="time" error={error.endTime} required />
            </Field>
          </div>
          <Field label="Capacity" htmlFor="capacity">
            <Input id="capacity" name="capacity" type="number" min={1} defaultValue="1" error={error.capacity} required />
          </Field>
          {error.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error.form}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Add slot
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteTimeSlotButton({ slotId }: { slotId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, pending] = useActionState<AdminActionResult, FormData>(
    deleteTimeSlotAction,
    { ok: false, errors: {} },
  );

  const handled = useRef<AdminActionResult>(null);
  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    if (state?.ok) {
      handled.current = state;
      toast.success("Time slot deleted", state.message);
      router.refresh();
    }
  }, [state, router, toast]);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={slotId} />
      <Button size="sm" variant="ghost" icon="trash" loading={pending} />
    </form>
  );
}
