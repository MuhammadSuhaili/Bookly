"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryFormModal } from "./category-form";

export function CreateCategoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)}>
        New category
      </Button>
      <CategoryFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
