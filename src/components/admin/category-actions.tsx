"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  deleteCategoryAction,
  type AdminActionResult,
} from "@/server/actions/admin";
import { CategoryFormModal } from "./category-form";

type CategoryForAction = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
};

export function CategoryActions({ category }: { category: CategoryForAction }) {
  const router = useRouter();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [state, action, pending] = useActionState<AdminActionResult, FormData>(
    deleteCategoryAction,
    { ok: false, errors: {} },
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Category deleted", state.message);
      router.refresh();
      setTimeout(() => setDeleteOpen(false), 0);
    }
  }, [state, router, toast]);

  const initial = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    icon: category.icon ?? "",
    isActive: category.isActive,
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" icon="edit" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" icon="trash" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      <CategoryFormModal open={editOpen} onClose={() => setEditOpen(false)} initial={initial} />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete category"
        description="This action cannot be undone."
        size="sm"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">{category.name}</span>? Services in
            this category can block deletion.
          </p>
          {state && !state.ok && state.errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.errors.form}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
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
