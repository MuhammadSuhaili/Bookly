"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceFormModal } from "./service-form";

type CategoryOption = { id: string; name: string };

export function CreateServiceButton({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)}>
        New service
      </Button>
      <ServiceFormModal open={open} onClose={() => setOpen(false)} categories={categories} />
    </>
  );
}
