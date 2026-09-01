"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateProfileAction, type ProfileActionResult } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function ProfileForm({
  user,
}: {
  user: { firstName: string; lastName: string; phone: string; bio: string };
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    null,
  );
  const { success, error: toastError } = useToast();
  const handled = useRef<ProfileActionResult>(null);

  useEffect(() => {
    if (!state) return;
    if (handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      success("Profile Updated", state.message);
    } else if (state.errors?.form) {
      toastError("Update Failed", state.errors.form);
    }
  }, [state, success, toastError]);

  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name">
          <Input
            name="firstName"
            defaultValue={user.firstName}
            placeholder="First name"
            error={errors?.firstName}
          />
        </Field>
        <Field label="Last Name">
          <Input
            name="lastName"
            defaultValue={user.lastName}
            placeholder="Last name"
            error={errors?.lastName}
          />
        </Field>
      </div>

      <Field label="Phone" hint="Format: 0812-3456-7890">
        <Input
          name="phone"
          leadingIcon="phone"
          defaultValue={user.phone}
          placeholder="Phone number"
          error={errors?.phone}
        />
      </Field>

      <Field label="Bio" hint="A short introduction about yourself (optional)">
        <Textarea
          name="bio"
          rows={4}
          defaultValue={user.bio}
          placeholder="Tell us a little about yourself"
          error={errors?.bio}
        />
      </Field>

      {errors?.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {errors.form}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending} icon="check">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
