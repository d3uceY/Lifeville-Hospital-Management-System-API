ALTER TABLE "patient_visits" ADD COLUMN "visit_type" text DEFAULT 'outpatient' NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "check_in_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "check_out_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "admission_id" integer;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "public"."inpatient_admissions"("id") ON DELETE set null ON UPDATE no action;