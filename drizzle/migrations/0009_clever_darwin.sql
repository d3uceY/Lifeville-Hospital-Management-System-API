ALTER TABLE "complaints" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "doctors_notes" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "lab_tests" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "nurses_notes" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "physical_examinations" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD COLUMN "visit_id" integer;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors_notes" ADD CONSTRAINT "doctors_notes_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurses_notes" ADD CONSTRAINT "nurses_notes_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_examinations" ADD CONSTRAINT "physical_examinations_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE set null ON UPDATE no action;