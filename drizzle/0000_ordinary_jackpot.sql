CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('BOOKING', 'STATUS', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CUSTOMER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(60),
	"entity_id" varchar(60),
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" varchar(16) NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"time_slot_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"booking_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"customer_name" varchar(200) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(30) NOT NULL,
	"notes" text,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_times_check" CHECK ("bookings"."end_time" > "bookings"."start_time")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'SYSTEM' NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"date" date NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"short_description" varchar(280),
	"image_url" text,
	"price" numeric(12, 2) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"location" varchar(200),
	"is_online" boolean DEFAULT false NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(30),
	"avatar_url" text,
	"bio" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_time_slot_id_time_slots_id_fk" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_id_unique" ON "bookings" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_service_id_idx" ON "bookings" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "bookings_schedule_id_idx" ON "bookings" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "bookings_time_slot_id_idx" ON "bookings" USING btree ("time_slot_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_booking_date_idx" ON "bookings" USING btree ("booking_date");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_active_slot_unique" ON "bookings" USING btree ("time_slot_id","booking_date") WHERE "bookings"."status" IN ('PENDING', 'CONFIRMED');--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_unique" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "schedules_service_date_unique" ON "schedules" USING btree ("service_id","date");--> statement-breakpoint
CREATE INDEX "schedules_date_idx" ON "schedules" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_unique" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_category_id_idx" ON "services" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "services_price_idx" ON "services" USING btree ("price");--> statement-breakpoint
CREATE INDEX "time_slots_schedule_id_idx" ON "time_slots" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "time_slots_schedule_start_unique" ON "time_slots" USING btree ("schedule_id","start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");