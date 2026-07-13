CREATE TABLE "insurance_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "insurance_plans_provider_id_name_key" UNIQUE("provider_id","name")
);
--> statement-breakpoint
CREATE TABLE "insurance_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"phone" varchar(20),
	"email" varchar(150),
	"address" text,
	"website" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "insurance_providers_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "patient_insurance" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"plan_id" integer,
	"member_number" varchar(100) NOT NULL,
	"policy_number" varchar(100),
	"is_primary" boolean DEFAULT true,
	"status" varchar(20) DEFAULT 'Active',
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "patient_insurance_status_check" CHECK ((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying, 'Expired'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "insurance_plans" ADD CONSTRAINT "insurance_plans_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."insurance_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance" ADD CONSTRAINT "patient_insurance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance" ADD CONSTRAINT "patient_insurance_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."insurance_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance" ADD CONSTRAINT "patient_insurance_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."insurance_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_insurance_plans_provider_id" ON "insurance_plans" USING btree ("provider_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_providers_name_trgm" ON "insurance_providers" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_patient_insurance_patient_id" ON "patient_insurance" USING btree ("patient_id" int4_ops);