import { z } from "zod";

/* --------------------------------------------------------------------------
 * Shared primitives
 * ------------------------------------------------------------------------ */

export const emailSchema = z.email("Please enter a valid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");
export const uuidSchema = z.uuid("Invalid identifier");
export const phoneSchema = z
  .string()
  .max(30)
  .regex(/^[0-9+()\-\s]*$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));
export const nameSchema = z
  .string()
  .min(1, "Required")
  .max(100, "Too long")
  .regex(/^[a-zA-Z\s'.-]+$/, "Invalid characters in name");
export const requiredText = (max: number, label: string) =>
  z.string().min(1, `${label} is required`).max(max, `${label} is too long`);

/* --------------------------------------------------------------------------
 * Auth
 * ------------------------------------------------------------------------ */

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* --------------------------------------------------------------------------
 * Profile
 * ------------------------------------------------------------------------ */

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  bio: z.string().max(500).optional().or(z.literal("")),
});

export const notificationPrefsSchema = z.object({
  bookingUpdates: z.boolean(),
  statusChanges: z.boolean(),
});

/* --------------------------------------------------------------------------
 * Booking
 * ------------------------------------------------------------------------ */

export const bookingInputSchema = z.object({
  serviceId: uuidSchema,
  scheduleId: uuidSchema,
  timeSlotId: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  customerName: z
    .string()
    .min(1, "Name is required")
    .max(200)
    .regex(/^[a-zA-Z\s'.-]+$/, "Invalid characters in name"),
  customerEmail: emailSchema,
  customerPhone: z
    .string()
    .min(1, "Phone is required")
    .max(30)
    .regex(/^[0-9+()\-\s]*$/, "Invalid phone number"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const bookingCancelSchema = z.object({
  bookingId: uuidSchema,
  reason: z.string().max(500).optional().or(z.literal("")),
});

/* --------------------------------------------------------------------------
 * Admin: categories
 * ------------------------------------------------------------------------ */

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  description: z.string().max(500).optional().or(z.literal("")),
  icon: z.string().max(100).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

/* --------------------------------------------------------------------------
 * Admin: services
 * ------------------------------------------------------------------------ */

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  categoryId: uuidSchema,
  description: z.string().min(1, "Description is required").max(5000),
  shortDescription: z.string().max(280).optional().or(z.literal("")),
  price: z.coerce.number().positive("Price must be positive").max(100_000_000),
  durationMinutes: z.coerce
    .number()
    .int()
    .positive("Duration must be positive")
    .max(1440),
  location: z.string().max(200).optional().or(z.literal("")),
  isOnline: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
});

/* --------------------------------------------------------------------------
 * Admin: schedules / time slots
 * ------------------------------------------------------------------------ */

export const scheduleSchema = z.object({
  serviceId: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  isOpen: z.boolean().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const timeSlotSchema = z.object({
  scheduleId: uuidSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
  capacity: z.coerce.number().int().positive("Capacity must be positive").max(100),
  isActive: z.boolean().optional(),
});

/* --------------------------------------------------------------------------
 * Admin: booking status
 * ------------------------------------------------------------------------ */

export const adminBookingStatusSchema = z.object({
  bookingId: uuidSchema,
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"]),
});

/* --------------------------------------------------------------------------
 * Admin: settings
 * ------------------------------------------------------------------------ */

export const settingsSchema = z.object({
  appName: z.string().min(1).max(100),
  supportEmail: emailSchema,
  currency: z.string().min(1).max(10),
});
