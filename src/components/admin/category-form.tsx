"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  createCategoryAction,
  updateCategoryAction,
  type AdminActionResult,
} from "@/server/actions/admin";

type CategoryFormData = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
};

export function CategoryFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: CategoryFormData;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!initial?.id;
  const [state, action, pending] = useActionState<AdminActionResult, FormData>(
    isEdit ? updateCategoryAction : createCategoryAction,
    { ok: false, errors: {} },
  );

  const handled = useRef<AdminActionResult>(null);
  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    if (state.ok) {
      handled.current = state;
      toast.success(isEdit ? "Category updated" : "Category created", state.message);
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose, isEdit]);

  const error = state && !state.ok ? state.errors : {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit category" : "New category"}
      description={isEdit ? "Update the category details." : "Create a new category."}
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

        <Field label="Description" htmlFor="description">
          <Textarea id="description" name="description" rows={2} defaultValue={initial?.description} />
        </Field>

        <Field label="Icon" htmlFor="icon">
          <Input id="icon" name="icon" defaultValue={initial?.icon} placeholder="e.g. sparkles" error={error.icon} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
          Active
        </label>

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
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
