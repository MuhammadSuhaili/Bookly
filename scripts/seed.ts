import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import {
  roles,
  users,
  categories,
  services,
  schedules,
  timeSlots,
  bookings,
  notifications,
  auditLogs,
} from "../src/db/schema";
import * as schema from "../src/db/schema";

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=800&q=70&auto=format&fit=crop`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Clearing existing data...");
  await db.delete(bookings);
  await db.delete(notifications);
  await db.delete(auditLogs);
  await db.delete(timeSlots);
  await db.delete(schedules);
  await db.delete(services);
  await db.delete(categories);
  await db.delete(users);
  await db.delete(roles);
  await db.execute(sql`TRUNCATE TABLE roles RESTART IDENTITY CASCADE`);

  /* ---------- Roles ---------- */
  const [customerRole] = await db
    .insert(roles)
    .values({ name: "CUSTOMER", description: "Regular platform customer" })
    .onConflictDoNothing({ target: roles.name })
    .returning();
  const [adminRole] = await db
    .insert(roles)
    .values({ name: "ADMIN", description: "Administrator with full access" })
    .onConflictDoNothing({ target: roles.name })
    .returning();
  const customerRoleId = customerRole?.id ?? (await db.query.roles.findFirst({ where: (r) => sql`${r.name} = 'CUSTOMER'` }))?.id;
  if (!customerRoleId) throw new Error("Could not resolve CUSTOMER role id");
  const adminRoleId = adminRole?.id ?? (await db.query.roles.findFirst({ where: (r) => sql`${r.name} = 'ADMIN'` }))?.id;
  if (!adminRoleId) throw new Error("Could not resolve ADMIN role id");

  /* ---------- Password ---------- */
  const pw = await bcrypt.hash("Password123!", 12);

  /* ---------- Users ---------- */
  const adminUser = await db
    .insert(users)
    .values({
      roleId: adminRoleId,
      email: "admin@booking.app",
      passwordHash: pw,
      firstName: "Aisha",
      lastName: "Admin",
      phone: "+1 555 0100",
      emailVerified: true,
      isActive: true,
    })
    .returning();
  const adminId = adminUser[0].id;

  const customers = [
    { email: "customer@booking.app", firstName: "Budi", lastName: "Santoso", phone: "+1 555 0101" },
    { email: "siti@booking.app", firstName: "Siti", lastName: "Rahayu", phone: "+1 555 0102" },
    { email: "agus@booking.app", firstName: "Agus", lastName: "Wijaya", phone: "+1 555 0103" },
    { email: "dewi@booking.app", firstName: "Dewi", lastName: "Lestari", phone: "+1 555 0104" },
  ];
  const customerIds: string[] = [];
  for (const c of customers) {
    const ins = await db
      .insert(users)
      .values({
        roleId: customerRoleId,
        email: c.email,
        passwordHash: pw,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        emailVerified: true,
        isActive: true,
      })
      .returning();
    customerIds.push(ins[0].id);
  }
  const [cust1, cust2, cust3, cust4] = customerIds;

  /* ---------- Categories ---------- */
  const catData = [
    { name: "Beauty & Wellness", slug: "beauty-wellness", icon: "sparkles", desc: "Spa, skincare and relaxation treatments.", h1: 320, h2: 280 },
    { name: "Health & Fitness", slug: "health-fitness", icon: "activity", desc: "Personal training and wellness coaching.", h1: 140, h2: 90 },
    { name: "Home Services", slug: "home-services", icon: "home", desc: "Professional home maintenance and cleaning.", h1: 220, h2: 160 },
    { name: "Consulting", slug: "consulting", icon: "briefcase", desc: "Expert advisory sessions with specialists.", h1: 210, h2: 250 },
    { name: "Automotive", slug: "automotive", icon: "car", desc: "Car care, detailing and maintenance.", h1: 200, h2: 40 },
  ];
  const catIds: Record<string, string> = {};
  for (const c of catData) {
    const ins = await db.insert(categories).values({ name: c.name, slug: c.slug, icon: c.icon, description: c.desc }).returning();
    catIds[c.slug] = ins[0].id;
  }

  /* ---------- Services ---------- */
  const svcData = [
    { cat: "beauty-wellness", name: "Signature Facial", slug: "signature-facial", price: "250000", dur: 60, online: false, feat: true, pop: true, loc: "Downtown Studio", img: "photo-1570172619644-dfd03ed5d881", rating: "4.8", rc: 128 },
    { cat: "beauty-wellness", name: "Full Body Massage", slug: "full-body-massage", price: "300000", dur: 90, online: false, feat: true, pop: true, loc: "City Spa Lounge", img: "photo-1544161515-4ab6ce6db874", rating: "4.9", rc: 214 },
    { cat: "beauty-wellness", name: "Hair Styling & Cut", slug: "hair-styling-cut", price: "150000", dur: 60, online: false, feat: false, pop: true, loc: "Westside Salon", img: "photo-1521590832167-7bcbfaa6381f", rating: "4.6", rc: 96 },
    { cat: "health-fitness", name: "Personal Training Session", slug: "personal-training", price: "200000", dur: 60, online: false, feat: true, pop: true, loc: "FitHub Gym", img: "photo-1534438327276-14e5300c3a48", rating: "4.7", rc: 77 },
    { cat: "health-fitness", name: "Nutrition Consultation", slug: "nutrition-consultation", price: "250000", dur: 45, online: true, feat: false, pop: false, loc: "Online", img: "photo-1490645935967-10de6ba17061", rating: "4.5", rc: 41 },
    { cat: "health-fitness", name: "Yoga Private Class", slug: "yoga-private-class", price: "180000", dur: 60, online: true, feat: false, pop: false, loc: "Online", img: "photo-1544367567-0f2fcb009e0b", rating: "4.8", rc: 59 },
    { cat: "home-services", name: "Deep Home Cleaning", slug: "deep-home-cleaning", price: "400000", dur: 180, online: false, feat: true, pop: true, loc: "Customer Home", img: "photo-1581578731548-c64695cc6952", rating: "4.7", rc: 310 },
    { cat: "home-services", name: "AC Servicing & Maintenance", slug: "ac-servicing", price: "350000", dur: 120, online: false, feat: false, pop: false, loc: "Customer Home", img: "photo-1581092918056-0c4c3acd3789", rating: "4.6", rc: 88 },
    { cat: "home-services", name: "Plumbing Repair", slug: "plumbing-repair", price: "250000", dur: 90, online: false, feat: false, pop: false, loc: "Customer Home", img: "photo-1504328345606-18bbc8c9d7d1", rating: "4.4", rc: 66 },
    { cat: "consulting", name: "Business Strategy Session", slug: "business-strategy", price: "750000", dur: 60, online: true, feat: true, pop: false, loc: "Online", img: "photo-1552664730-d307ca884978", rating: "4.9", rc: 45 },
    { cat: "consulting", name: "Financial Planning", slug: "financial-planning", price: "600000", dur: 60, online: true, feat: false, pop: false, loc: "Online", img: "photo-1554224155-6726b3ff858f", rating: "4.7", rc: 33 },
    { cat: "automotive", name: "Premium Car Detailing", slug: "premium-car-detailing", price: "500000", dur: 240, online: false, feat: true, pop: true, loc: "Mobile Detailing", img: "photo-1503376780353-7e6692767b70", rating: "4.9", rc: 172 },
  ];
  const serviceRows: Record<string, { id: string; dur: number; price: string }> = {};
  for (const s of svcData) {
    const ins = await db
      .insert(services)
      .values({
        categoryId: catIds[s.cat],
        name: s.name,
        slug: s.slug,
        description: `${s.name} is a professionally delivered service tailored to your needs. Our certified specialists ensure a premium experience with flexible scheduling and transparent pricing.`,
        shortDescription: `Book ${s.name.toLowerCase()} at a time that suits you.`,
        imageUrl: unsplash(s.img),
        price: s.price,
        durationMinutes: s.dur,
        location: s.loc,
        isOnline: s.online,
        rating: s.rating,
        ratingCount: s.rc,
        isActive: true,
        isFeatured: s.feat,
        isPopular: s.pop,
      })
      .returning();
    serviceRows[s.slug] = { id: ins[0].id, dur: s.dur, price: s.price };
  }

  /* ---------- Schedules + Time Slots (next 10 days) ---------- */
  const slotTimes: Array<[string, string]> = [
    ["09:00", "10:00"],
    ["10:00", "11:00"],
    ["11:00", "12:00"],
    ["13:00", "14:00"],
    ["14:00", "15:00"],
    ["15:00", "16:00"],
    ["16:00", "17:00"],
    ["17:00", "18:00"],
  ];

  const scheduleRows: string[] = [];
  const timeSlotRows: Record<string, string> = {}; // `${scheduleId}:${start}` -> slotId

  for (const s of Object.values(serviceRows)) {
    for (let d = 0; d < 12; d++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + d);
      if (date.getDay() === 0) continue; // skip Sundays
      const dateStr = date.toISOString().slice(0, 10);
      const [sch] = await db
        .insert(schedules)
        .values({ serviceId: s.id, date: dateStr, isOpen: true })
        .returning();
      scheduleRows.push(sch.id);
      const slotCount = d % 3 === 0 ? 8 : 5;
      for (let i = 0; i < slotCount; i++) {
        const [start, end] = slotTimes[i];
        const [ts] = await db
          .insert(timeSlots)
          .values({ scheduleId: sch.id, startTime: start, endTime: end, capacity: 1, isActive: true })
          .returning();
        timeSlotRows[`${sch.id}:${start}`] = ts.id;
      }
    }
  }

  /* ---------- Bookings (various statuses) ---------- */
  const now = new Date();
  const dateOffset = (n: number) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  let bookingCounter = 0;
  const mkRef = () => `BK-${Date.now().toString(36).toUpperCase().slice(-6)}${bookingCounter++}`;

  // Simplify: precompute schedules per (serviceId, date) by re-querying
  const allSchedules = await db.select().from(schedules);
  const allSlots = await db.select().from(timeSlots);
  const allServices = await db.select().from(services);

  const scheduleBySvcDate = new Map<string, string>();
  for (const s of allSchedules) {
    scheduleBySvcDate.set(`${s.serviceId}:${s.date}`, s.id);
  }
  const slotsBySchedule = new Map<string, string[]>();
  for (const t of allSlots) {
    if (!slotsBySchedule.has(t.scheduleId)) slotsBySchedule.set(t.scheduleId, []);
    slotsBySchedule.get(t.scheduleId)!.push(t.id);
  }

  const svcId = (slug: string) => serviceRows[slug].id;

  const bookingData: Array<{
    user: string;
    slug: string;
    dayOffset: number;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
    notes?: string;
  }> = [
    { user: cust1, slug: "signature-facial", dayOffset: 1, status: "PENDING" },
    { user: cust2, slug: "full-body-massage", dayOffset: 2, status: "CONFIRMED" },
    { user: cust1, slug: "personal-training", dayOffset: -3, status: "COMPLETED" },
    { user: cust3, slug: "deep-home-cleaning", dayOffset: -5, status: "COMPLETED" },
    { user: cust4, slug: "premium-car-detailing", dayOffset: 4, status: "CONFIRMED" },
    { user: cust2, slug: "nutrition-consultation", dayOffset: -1, status: "CANCELLED", notes: "Scheduling conflict" },
    { user: cust3, slug: "business-strategy", dayOffset: -2, status: "REJECTED", notes: "Slot unavailable" },
    { user: cust4, slug: "yoga-private-class", dayOffset: 6, status: "PENDING" },
    { user: cust1, slug: "hair-styling-cut", dayOffset: -6, status: "COMPLETED" },
    { user: cust2, slug: "ac-servicing", dayOffset: 8, status: "CONFIRMED" },
    { user: cust3, slug: "financial-planning", dayOffset: -4, status: "COMPLETED" },
    { user: cust4, slug: "plumbing-repair", dayOffset: 10, status: "PENDING" },
  ];

  for (const b of bookingData) {
    const date = dateOffset(b.dayOffset);
    const sid = svcId(b.slug);
    const scheduleId = scheduleBySvcDate.get(`${sid}:${date}`);
    if (!scheduleId) continue;
    const slotIds = slotsBySchedule.get(scheduleId) ?? [];
    if (slotIds.length === 0) continue;
    const timeSlotId = slotIds[0];
    const slot = allSlots.find((s) => s.id === timeSlotId)!;
    const svc = allServices.find((s) => s.id === sid)!;
    const user = (await db.select().from(users).where((u) => sql`${u.id} = ${b.user}`))[0];

    const [booking] = await db
      .insert(bookings)
      .values({
        referenceId: mkRef(),
        userId: b.user,
        serviceId: sid,
        scheduleId,
        timeSlotId,
        status: b.status,
        bookingDate: date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        price: svc.price,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        customerPhone: user.phone ?? "",
        notes: b.notes,
        cancelledAt: b.status === "CANCELLED" ? new Date() : null,
        cancellationReason: b.status === "CANCELLED" ? b.notes : null,
      })
      .returning();

    await db.insert(notifications).values({
      userId: b.user,
      type: "BOOKING",
      title: "Booking created",
      message: `Your booking ${booking.referenceId} for ${svc.name} on ${date} is ${b.status.toLowerCase()}.`,
      link: `/account/bookings/${booking.id}`,
    });
  }

  /* ---------- Notifications for admin ---------- */
  await db.insert(notifications).values({
    userId: adminId,
    type: "STATUS",
    title: "New pending booking",
    message: "One or more bookings are waiting for your confirmation.",
    link: "/admin/bookings",
  });

  /* ---------- Audit logs ---------- */
  await db.insert(auditLogs).values([
    { userId: adminId, action: "SEED", entityType: "system", details: { message: "Database seeded successfully" } },
    { userId: adminId, action: "BOOKING_STATUS_CHANGE", entityType: "booking", details: { from: "PENDING", to: "CONFIRMED" }, ipAddress: "127.0.0.1" },
  ]);

  console.log("Seed complete.");
  console.log("-------------------------------------------");
  console.log("Admin login:  admin@booking.app / Password123!");
  console.log("Customer login: customer@booking.app / Password123!");
  console.log("-------------------------------------------");

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:");
  console.error(err);
  process.exit(1);
});
