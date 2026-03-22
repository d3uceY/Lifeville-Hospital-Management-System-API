CREATE TYPE "public"."bill_category_enum" AS ENUM('lab', 'drug', 'service', 'ward', 'food', 'consultation', 'daily_charge');--> statement-breakpoint
CREATE TYPE "public"."billing_type_enum" AS ENUM('credit', 'pay_now');--> statement-breakpoint
CREATE TABLE "billing_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id" integer,
	"visit_id" integer,
	"patient_id" integer,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "invoices_invoice_number_key" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'service' NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_variable_price" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "bill_items" ALTER COLUMN "bill_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "invoice_id" integer;--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "service_id" integer;--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "category" text DEFAULT 'service' NOT NULL;--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "billing_type" text DEFAULT 'credit' NOT NULL;--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "created_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "service_id" integer;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "unit_price" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "prescription_items" ADD COLUMN "service_id" integer;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD COLUMN "unit_price" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "public"."inpatient_admissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;