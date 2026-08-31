"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, services, schedules, timeSlots } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/security/rate-limit";
import { parseOrErrors } from "@/lib/validation/errors";
import {
  categorySchema,
  serviceSchema,
  scheduleSchema,
  timeSlotSchema,
} from "@/lib/validation";
import { audit } from "@/lib/security/audit";

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; errors: Record<string, string> }
  | null;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(base: string, existing: string[]): string {
  const clean = slugify(base) || "item";
  if (!existing.includes(clean)) return clean;
  let n = 2;
  while (existing.includes(`${clean}-${n}`)) n += 1;
  return `${clean}-${n}`;
}

function isUniqueViolation(err: unknown): boolean {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  ) {
    return true;
  }
  return false;
}

export async function createCategoryAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-category-create", { limit: 60 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const parsed = parseOrErrors(categorySchema, {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || "",
    icon: formData.get("icon") || "",
    isActive: formData.get("isActive") === "on",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    const existingSlugs = (await db.select({ slug: categories.slug }).from(categories)).map((r) => r.slug);
    const slug = parsed.data.slug || uniqueSlug(parsed.data.name, existingSlugs);
    await db.insert(categories).values({
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      icon: parsed.data.icon || null,
      isActive: parsed.data.isActive ?? true,
    });
    await audit({ userId: session.sub, action: "CATEGORY_CREATE", entityType: "category", details: { name: parsed.data.name } });
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    return { ok: true, message: "Category created." };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "A category with this slug already exists." } };
    }
    console.error("createCategory failed", err);
    return { ok: false, errors: { form: "Unable to create category." } };
  }
}

export async function updateCategoryAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-category-update", { limit: 60 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, errors: { form: "Missing category id." } };
  }
  const parsed = parseOrErrors(categorySchema, {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || "",
    icon: formData.get("icon") || "",
    isActive: formData.get("isActive") === "on",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    const existingSlugs = (await db.select({ slug: categories.slug, id: categories.id }).from(categories))
      .filter((r) => r.id !== id)
      .map((r) => r.slug);
    const slug = parsed.data.slug || uniqueSlug(parsed.data.name, existingSlugs);
    await db
      .update(categories)
      .set({
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        icon: parsed.data.icon || null,
        isActive: parsed.data.isActive ?? true,
        updatedAt: sql`NOW()`,
      })
      .where(sql`${categories.id} = ${id}`);
    await audit({ userId: session.sub, action: "CATEGORY_UPDATE", entityType: "category", entityId: id });
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    return { ok: true, message: "Category updated." };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "A category with this slug already exists." } };
    }
    console.error("updateCategory failed", err);
    return { ok: false, errors: { form: "Unable to update category." } };
  }
}

export async function deleteCategoryAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-category-delete", { limit: 30 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, errors: { form: "Missing category id." } };
  }

  try {
    await db.delete(categories).where(sql`${categories.id} = ${id}`);
    await audit({ userId: session.sub, action: "CATEGORY_DELETE", entityType: "category", entityId: id });
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    return { ok: true, message: "Category deleted." };
  } catch {
    return { ok: false, errors: { form: "Unable to delete category. It may be in use by services." } };
  }
}

export async function createServiceAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-service-create", { limit: 60 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const parsed = parseOrErrors(serviceSchema, {
    name: formData.get("name"),
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || "",
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location") || "",
    isOnline: formData.get("isOnline") === "on",
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isPopular: formData.get("isPopular") === "on",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    const existingSlugs = (await db.select({ slug: services.slug }).from(services)).map((r) => r.slug);
    const slug = parsed.data.slug || uniqueSlug(parsed.data.name, existingSlugs);
    await db.insert(services).values({
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription || null,
      location: parsed.data.location || null,
      price: String(parsed.data.price),
      durationMinutes: parsed.data.durationMinutes,
      isOnline: parsed.data.isOnline ?? false,
      isActive: parsed.data.isActive ?? true,
      isFeatured: parsed.data.isFeatured ?? false,
      isPopular: parsed.data.isPopular ?? false,
    });
    await audit({ userId: session.sub, action: "SERVICE_CREATE", entityType: "service", details: { name: parsed.data.name } });
    revalidatePath("/admin/services");
    revalidatePath("/admin");
    revalidatePath("/services");
    return { ok: true, message: "Service created." };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "A service with this slug already exists." } };
    }
    console.error("createService failed", err);
    return { ok: false, errors: { form: "Unable to create service." } };
  }
}

export async function updateServiceAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-service-update", { limit: 60 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, errors: { form: "Missing service id." } };
  }
  const parsed = parseOrErrors(serviceSchema, {
    name: formData.get("name"),
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || "",
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location") || "",
    isOnline: formData.get("isOnline") === "on",
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isPopular: formData.get("isPopular") === "on",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    const existingSlugs = (await db.select({ slug: services.slug, id: services.id }).from(services))
      .filter((r) => r.id !== id)
      .map((r) => r.slug);
    const slug = parsed.data.slug || uniqueSlug(parsed.data.name, existingSlugs);
    await db
      .update(services)
      .set({
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        shortDescription: parsed.data.shortDescription || null,
        location: parsed.data.location || null,
        price: String(parsed.data.price),
        durationMinutes: parsed.data.durationMinutes,
        isOnline: parsed.data.isOnline ?? false,
        isActive: parsed.data.isActive ?? true,
        isFeatured: parsed.data.isFeatured ?? false,
        isPopular: parsed.data.isPopular ?? false,
        updatedAt: sql`NOW()`,
      })
      .where(sql`${services.id} = ${id}`);
    await audit({ userId: session.sub, action: "SERVICE_UPDATE", entityType: "service", entityId: id });
    revalidatePath("/admin/services");
    revalidatePath("/admin");
    revalidatePath("/services");
    return { ok: true, message: "Service updated." };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "A service with this slug already exists." } };
    }
    console.error("updateService failed", err);
    return { ok: false, errors: { form: "Unable to update service." } };
  }
}

export async function toggleServiceActiveAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-service-toggle", { limit: 60 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const id = formData.get("id");
  const active = formData.get("active");
  if (typeof id !== "string" || !id) {
    return { ok: false, errors: { form: "Missing service id." } };
  }

  try {
    await db
      .update(services)
      .set({ isActive: active === "true", updatedAt: sql`NOW()` })
      .where(sql`${services.id} = ${id}`);
    await audit({ userId: session.sub, action: "SERVICE_TOGGLE", entityType: "service", entityId: id, details: { active: active === "true" } });
    revalidatePath("/admin/services");
    revalidatePath("/services");
    return { ok: true, message: active === "true" ? "Service activated." : "Service deactivated." };
  } catch {
    return { ok: false, errors: { form: "Unable to update service." } };
  }
}

export async function deleteServiceAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-service-delete", { limit: 30 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, errors: { form: "Missing service id." } };
  }

  try {
    await db.delete(services).where(sql`${services.id} = ${id}`);
    await audit({ userId: session.sub, action: "SERVICE_DELETE", entityType: "service", entityId: id });
    revalidatePath("/admin/services");
    revalidatePath("/admin");
    revalidatePath("/services");
    return { ok: true, message: "Service deleted." };
  } catch {
    return { ok: false, errors: { form: "Unable to delete service. It may be in use by bookings." } };
  }
}

export async function createScheduleAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-schedule-create", { limit: 60 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const parsed = parseOrErrors(scheduleSchema, {
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    isOpen: formData.get("isOpen") === "on" || formData.get("isOpen") === null,
    notes: formData.get("notes") || "",
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    await db.insert(schedules).values({
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      isOpen: parsed.data.isOpen ?? true,
      notes: parsed.data.notes || null,
    });
    await audit({ userId: session.sub, action: "SCHEDULE_CREATE", entityType: "schedule", details: { serviceId: parsed.data.serviceId, date: parsed.data.date } });
    revalidatePath("/admin/schedules");
    return { ok: true, message: "Schedule created." };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { date: "A schedule already exists for this service and date." } };
    }
    console.error("createSchedule failed", err);
    return { ok: false, errors: { form: "Unable to create schedule." } };
  }
}

export async function deleteScheduleAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-schedule-delete", { limit: 30 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, errors: { form: "Missing schedule id." } };
  }

  try {
    await db.delete(schedules).where(sql`${schedules.id} = ${id}`);
    await audit({ userId: session.sub, action: "SCHEDULE_DELETE", entityType: "schedule", entityId: id });
    revalidatePath("/admin/schedules");
    return { ok: true, message: "Schedule deleted." };
  } catch {
    return { ok: false, errors: { form: "Unable to delete schedule. It may be in use by bookings." } };
  }
}

export async function createTimeSlotAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-timeslot-create", { limit: 60 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const parsed = parseOrErrors(timeSlotSchema, {
    scheduleId: formData.get("scheduleId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    capacity: formData.get("capacity"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === null,
  });
  if (parsed.error) {
    return { ok: false, errors: parsed.error };
  }

  try {
    await db.insert(timeSlots).values({
      scheduleId: parsed.data.scheduleId,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      capacity: parsed.data.capacity,
      isActive: parsed.data.isActive ?? true,
    });
    await audit({ userId: session.sub, action: "TIMESLOT_CREATE", entityType: "timeSlot", details: { scheduleId: parsed.data.scheduleId, startTime: parsed.data.startTime } });
    revalidatePath("/admin/schedules");
    return { ok: true, message: "Time slot added." };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { startTime: "A time slot with this start time already exists." } };
    }
    console.error("createTimeSlot failed", err);
    return { ok: false, errors: { form: "Unable to add time slot." } };
  }
}

export async function deleteTimeSlotAction(
  _prev: unknown,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const { allowed } = await rateLimit("admin-timeslot-delete", { limit: 30 });
  if (!allowed) {
    return { ok: false, errors: { form: "Too many requests. Please try again later." } };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, errors: { form: "Missing time slot id." } };
  }

  try {
    await db.delete(timeSlots).where(sql`${timeSlots.id} = ${id}`);
    await audit({ userId: session.sub, action: "TIMESLOT_DELETE", entityType: "timeSlot", entityId: id });
    revalidatePath("/admin/schedules");
    return { ok: true, message: "Time slot deleted." };
  } catch {
    return { ok: false, errors: { form: "Unable to delete time slot. It may be in use by bookings." } };
  }
}
