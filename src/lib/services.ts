import "server-only";
import { db } from "@/db";
import { categories, services, schedules, timeSlots } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export type ServiceCard = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  imageUrl: string | null;
  price: string;
  durationMinutes: number;
  location: string | null;
  isOnline: boolean;
  rating: string | null;
  ratingCount: number;
  category: { name: string; slug: string };
};

export async function getCategories() {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name));
}

export async function getFeaturedServices(): Promise<ServiceCard[]> {
  const rows = await db
    .select()
    .from(services)
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(and(eq(services.isActive, true), eq(services.isFeatured, true)))
    .orderBy(desc(services.rating))
    .limit(6);
  return rows.map(({ services: s, categories: c }) => toCard(s, c));
}

export async function getPopularServices(): Promise<ServiceCard[]> {
  const rows = await db
    .select()
    .from(services)
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(and(eq(services.isActive, true), eq(services.isPopular, true)))
    .orderBy(desc(services.rating))
    .limit(5);
  return rows.map(({ services: s, categories: c }) => toCard(s, c));
}

export async function getServicesByCategory(
  categorySlug?: string,
): Promise<ServiceCard[]> {
  const query = db
    .select()
    .from(services)
    .innerJoin(categories, eq(services.categoryId, categories.id));
  if (categorySlug) {
    return (await query.where(and(eq(services.isActive, true), eq(categories.slug, categorySlug))))
      .map(({ services: s, categories: c }) => toCard(s, c));
  }
  return (await query.where(eq(services.isActive, true)))
    .map(({ services: s, categories: c }) => toCard(s, c));
}

export async function getServiceBySlug(slug: string) {
  const rows = await db
    .select()
    .from(services)
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(and(eq(services.slug, slug), eq(services.isActive, true)));
  const row = rows[0];
  if (!row) return null;
  return {
    ...toCard(row.services, row.categories),
    categoryId: row.services.categoryId,
  };
}

export async function getScheduleWithSlots(serviceId: string, date: string) {
  const rows = await db
    .select()
    .from(schedules)
    .innerJoin(timeSlots, eq(timeSlots.scheduleId, schedules.id))
    .where(
      and(
        eq(schedules.serviceId, serviceId),
        eq(schedules.date, date),
        eq(schedules.isOpen, true),
      ),
    );
  if (rows.length === 0) return null;
  const schedule = rows[0].schedules;
  const slots = rows
    .map((r) => r.time_slots)
    .filter((s) => s.isActive)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  return { schedule, slots };
}

function toCard(s: typeof services.$inferSelect, c: typeof categories.$inferSelect): ServiceCard {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    description: s.description,
    imageUrl: s.imageUrl,
    price: s.price,
    durationMinutes: s.durationMinutes,
    location: s.location,
    isOnline: s.isOnline,
    rating: s.rating,
    ratingCount: s.ratingCount,
    category: { name: c.name, slug: c.slug },
  };
}
