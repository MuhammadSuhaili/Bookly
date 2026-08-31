"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  createServiceAction,
  updateServiceAction,
  type AdminActionResult,
} from "@/server/actions/admin";

type ServiceFormData = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  price: string;
  durationMinutes: string;
  location: string;
  isOnline: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isPopular: boolean;
};

type CategoryOption = { id: string; name: string };

export function ServiceFormModal({
  open,
  onClose,
  categories,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  initial?: ServiceFormData;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!initial?.id;
  const [state, action, pending] = useActionState<AdminActionResult, FormData>(
    isEdit ? updateServiceAction : createServiceAction,
    { ok: false, errors: {} },
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(isEdit ? "Service updated" : "Service created", state.message);
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose, isEdit]);

  const error = state && !state.ok ? state.errors : {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit service" : "New service"}
      description={isEdit ? "Update the service details." : "Create a new service for customers."}
      size="lg"
    >
      <form action={action} className="space-y-4">
        {initial?.id && <input type="hidden" name="id" value={initial.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <Input id="name" name="name" defaultValue={initial?.name} error={error.name} required />
          </Field>
          <Field label="Slug" htmlFor="slug">
            <Input id="slug" name="slug" defaultValue={initial?.slug} placeholder="auto-generated" error={error.slug} />
          </Field>
        </div>

        <Field label="Category" htmlFor="categoryId">
          <Select id="categoryId" name="categoryId" defaultValue={initial?.categoryId} required>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description" htmlFor="description">
          <Textarea id="description" name="description" rows={3} defaultValue={initial?.description} error={error.description} required />
        </Field>
        <Field label="Short description" htmlFor="shortDescription">
          <Textarea id="shortDescription" name="shortDescription" rows={2} defaultValue={initial?.shortDescription} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Harga (IDR)" htmlFor="price">
            <Input id="price" name="price" type="number" step="1000" defaultValue={initial?.price} error={error.price} required />
          </Field>
          <Field label="Duration (min)" htmlFor="durationMinutes">
            <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={initial?.durationMinutes} error={error.durationMinutes} required />
          </Field>
        </div>

        <Field label="Location" htmlFor="location">
          <Input id="location" name="location" defaultValue={initial?.location} error={error.location} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isOnline" defaultChecked={initial?.isOnline} />
            Online service
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isPopular" defaultChecked={initial?.isPopular} />
            Popular
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
            Active
          </label>
        </div>

        {!isEdit && (
          <Field label="Active on creation" htmlFor="activeOnCreate">
            <p className="text-xs text-slate-400">New services are active by default unless unchecked above.</p>
          </Field>
        )}

        {error.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.form}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isEdit ? "Save changes" : "Create service"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
