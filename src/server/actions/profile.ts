"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";
import { parseOrErrors } from "@/lib/validation/errors";
import { profileSchema } from "@/lib/validation";

export type ProfileActionResult =
  | { ok: true; message: string }
  | { ok: false; errors: Record<string, string> }
  | null;

export async function updateProfileAction(
  prev: unknown,
  formData: FormData,
): Promise<ProfileActionResult> {
  const session = await requireAuth();

  const { allowed } = await rateLimit("profile-update", { limit: 10 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many attempts. Please try again later." } };
  }

  const parsed = parseOrErrors(profileSchema, {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || "",
    bio: formData.get("bio") || "",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    await db
      .update(users)
      .set({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || null,
        bio: parsed.data.bio || null,
      })
      .where(eq(users.id, session.sub));

    await audit({
      userId: session.sub,
      action: "PROFILE_UPDATE",
      entityType: "user",
      entityId: session.sub,
    });

    revalidatePath("/account");
    revalidatePath("/account/profile");
    return { ok: true, message: "Profile updated successfully." };
  } catch (err) {
    console.error("updateProfile failed", err);
    return { ok: false, errors: { form: "Something went wrong. Please try again." } };
  }
}
