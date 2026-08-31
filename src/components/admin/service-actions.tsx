"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  deleteServiceAction,
  toggleServiceActiveAction,
  type AdminActionResult,
} from "@/server/actions/admin";
import { ServiceFormModal } from "./service-form";

type ServiceForAction = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  shortDescription: string | null;
  price: string;
  durationMinutes: number;
  location: string | null;
  isOnline: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isPopular: boolean;
};

type CategoryOption = { id: string; name: string };

export function ServiceActions({
  service,
  categories,
}: {
  service: ServiceForAction;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [delState, delAction, delPending] = useActionState<AdminActionResult, FormData>(
    deleteServiceAction,
    { ok: false, errors: {} },
  );
  const [toggleState, toggleAction, togglePending] = useActionState<AdminActionResult, FormData>(
    toggleServiceActiveAction,
    { ok: false, errors: {} },
  );

  useEffect(() => {
    if (delState?.ok) {
      toast.success("Service deleted", delState.message);
      router.refresh();
      setTimeout(() => setDeleteOpen(false), 0);
    }
  }, [delState, router, toast]);

  useEffect(() => {
    if (toggleState?.ok) {
      toast.success("Service updated", toggleState.message);
      router.refresh();
    }
  }, [toggleState, router, toast]);

  const initial = {
    id: service.id,
    name: service.name,
    slug: service.slug,
    categoryId: service.categoryId,
    description: service.description,
    shortDescription: service.shortDescription ?? "",
    price: service.price,
    durationMinutes: String(service.durationMinutes),
    location: service.location ?? "",
    isOnline: service.isOnline,
    isActive: service.isActive,
    isFeatured: service.isFeatured,
    isPopular: service.isPopular,
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          icon="edit"
          onClick={() => setEditOpen(true)}
        >
          Edit
        </Button>
        <form action={toggleAction}>
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="active" value={String(!service.isActive)} />
          <Button
            size="sm"
            variant={service.isActive ? "secondary" : "success"}
            loading={togglePending}
          >
            {service.isActive ? "Deactivate" : "Activate"}
          </Button>
        </form>
        <Button
          size="sm"
          variant="ghost"
          icon="trash"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>

      <ServiceFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        categories={categories}
        initial={initial}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete service"
        description="This action cannot be undone."
        size="sm"
      >
        <form action={delAction} className="space-y-4">
          <input type="hidden" name="id" value={service.id} />
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">{service.name}</span>?
          </p>
          {delState && !delState.ok && delState.errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {delState.errors.form}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" icon="trash" loading={delPending}>
              Delete
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
