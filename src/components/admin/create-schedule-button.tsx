"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  createScheduleAction,
  type AdminActionResult,
} from "@/server/actions/admin";

type ServiceOption = { id: string; name: string };

export function CreateScheduleButton({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionResult, FormData>(
    createScheduleAction,
    { ok: false, errors: {} },
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Schedule created", state.message);
      router.refresh();
      setTimeout(() => setOpen(false), 0);
    }
  }, [state, router, toast]);

  const error = state && !state.ok ? state.errors : {};

  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)}>
        New schedule
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New schedule"
        description="Add a bookable day for a service."
      >
        <form action={action} className="space-y-4">
          <Field label="Service" htmlFor="serviceId">
            <Select id="serviceId" name="serviceId" required>
              <option value="" disabled>
                Select a service
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="date">
            <Input id="date" name="date" type="date" error={error.date} required />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Input id="notes" name="notes" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isOpen" defaultChecked onChange={() => {}} />
            Open for bookings
          </label>
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
              Create schedule
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
