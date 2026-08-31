"use client";

import { useActionState } from "react";
import { logoutAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [, action, pending] = useActionState(logoutAction, null);

  return (
    <form action={action}>
      <Button type="submit" variant="ghost" size="sm" iconRight="logout" loading={pending}>
        Log out
      </Button>
    </form>
  );
}
