"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  deleteScheduleAction,
  type AdminActionResult,
} from "@/server/actions/admin";

export function DeleteScheduleButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionResult, FormData>(
    deleteScheduleAction,
    { ok: false, errors: {} },
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Schedule deleted", state.message);
      router.refresh();
      setTimeout(() => setOpen(false), 0);
    }
  }, [state, router, toast]);

  return (
    <>
      <Button size="sm" variant="ghost" icon="trash" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete schedule"
        description="This will remove the schedule and its time slots."
        size="sm"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={scheduleId} />
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this schedule?
          </p>
          {state && !state.ok && state.errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.errors.form}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" icon="trash" loading={pending}>
              Delete
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
