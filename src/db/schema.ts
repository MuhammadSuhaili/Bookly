import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  index,
  uniqueIndex,
  pgEnum,
  date as pgDate,
  time as pgTime,
  check,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* --------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------ */

export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "ADMIN"]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "BOOKING",
  "STATUS",
  "SYSTEM",
]);

/* --------------------------------------------------------------------------
 * roles (lookup table for role-based authorization references)
 * ------------------------------------------------------------------------ */

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("roles_name_unique").on(t.name)],
);

/* --------------------------------------------------------------------------
 * users
 * ------------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    index("users_role_id_idx").on(t.roleId),
  ],
);

/* --------------------------------------------------------------------------
 * categories
 * ------------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("categories_slug_unique").on(t.slug)],
);

/* --------------------------------------------------------------------------
 * services
 * ------------------------------------------------------------------------ */

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description").notNull(),
    shortDescription: varchar("short_description", { length: 280 }),
    imageUrl: text("image_url"),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    location: varchar("location", { length: 200 }),
    isOnline: boolean("is_online").default(false).notNull(),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    ratingCount: integer("rating_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isPopular: boolean("is_popular").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("services_slug_unique").on(t.slug),
    index("services_category_id_idx").on(t.categoryId),
    index("services_price_idx").on(t.price),
  ],
);

/* --------------------------------------------------------------------------
 * schedules (a bookable day for a service)
 * ------------------------------------------------------------------------ */

export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    date: pgDate("date").notNull(),
    isOpen: boolean("is_open").default(true).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("schedules_service_date_unique").on(t.serviceId, t.date),
    index("schedules_date_idx").on(t.date),
  ],
);

/* --------------------------------------------------------------------------
 * time_slots (a specific start time within a schedule)
 * ------------------------------------------------------------------------ */

export const timeSlots = pgTable(
  "time_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),
    startTime: pgTime("start_time", { withTimezone: false }).notNull(),
    endTime: pgTime("end_time", { withTimezone: false }).notNull(),
    capacity: integer("capacity").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("time_slots_schedule_id_idx").on(t.scheduleId),
    uniqueIndex("time_slots_schedule_start_unique").on(
      t.scheduleId,
      t.startTime,
    ),
  ],
);

/* --------------------------------------------------------------------------
 * bookings
 * ------------------------------------------------------------------------ */

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceId: varchar("reference_id", { length: 16 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedules.id, { onDelete: "restrict" }),
    timeSlotId: uuid("time_slot_id")
      .notNull()
      .references(() => timeSlots.id, { onDelete: "restrict" }),
    status: bookingStatusEnum("status").default("PENDING").notNull(),
    bookingDate: pgDate("booking_date").notNull(),
    startTime: pgTime("start_time", { withTimezone: false }).notNull(),
    endTime: pgTime("end_time", { withTimezone: false }).notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    customerName: varchar("customer_name", { length: 200 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
    notes: text("notes"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("bookings_reference_id_unique").on(t.referenceId),
    index("bookings_user_id_idx").on(t.userId),
    index("bookings_service_id_idx").on(t.serviceId),
    index("bookings_schedule_id_idx").on(t.scheduleId),
    index("bookings_time_slot_id_idx").on(t.timeSlotId),
    index("bookings_status_idx").on(t.status),
    index("bookings_booking_date_idx").on(t.bookingDate),
    // DB-level guarantee against double booking: only ONE active (pending or
    // confirmed) booking may exist for a given time slot on a given date.
    // The partial unique index rejects concurrent duplicate inserts at the
    // database layer, catching any race conditions that slip past app logic.
    uniqueIndex("bookings_active_slot_unique")
      .on(t.timeSlotId, t.bookingDate)
      .where(sql`${t.status} IN ('PENDING', 'CONFIRMED')`),
    check(
      "bookings_times_check",
      sql`${t.endTime} > ${t.startTime}`,
    ),
  ],
);

/* --------------------------------------------------------------------------
 * notifications
 * ------------------------------------------------------------------------ */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").default("SYSTEM").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message").notNull(),
    link: text("link"),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_user_read_idx").on(t.userId, t.isRead),
  ],
);

/* --------------------------------------------------------------------------
 * audit_logs
 * ------------------------------------------------------------------------ */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }),
    entityId: varchar("entity_id", { length: 60 }),
    details: jsonb("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ],
);

/* --------------------------------------------------------------------------
 * Relations
 * ------------------------------------------------------------------------ */

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  bookings: many(bookings),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  schedules: many(schedules),
  bookings: many(bookings),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  service: one(services, {
    fields: [schedules.serviceId],
    references: [services.id],
  }),
  timeSlots: many(timeSlots),
  bookings: many(bookings),
}));

export const timeSlotsRelations = relations(timeSlots, ({ one, many }) => ({
  schedule: one(schedules, {
    fields: [timeSlots.scheduleId],
    references: [schedules.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  schedule: one(schedules, {
    fields: [bookings.scheduleId],
    references: [schedules.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

/* --------------------------------------------------------------------------
 * Type exports
 * ------------------------------------------------------------------------ */

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type NewTimeSlot = typeof timeSlots.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";
export type UserRole = "CUSTOMER" | "ADMIN";
export type NotificationType = "BOOKING" | "STATUS" | "SYSTEM";
