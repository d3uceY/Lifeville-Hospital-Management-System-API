CREATE INDEX "idx_beds_bed_type_id" ON "beds" USING btree ("bed_type_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_beds_bed_group_id" ON "beds" USING btree ("bed_group_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_bill_items_invoice_id" ON "bill_items" USING btree ("invoice_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_billing_payments_invoice_id" ON "billing_payments" USING btree ("invoice_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_complaints_visit_id" ON "complaints" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_death_records_patient_id" ON "death_records" USING btree ("patient_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_diagnoses_visit_id" ON "diagnoses" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_doctors_notes_visit_id" ON "doctors_notes" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_inpatient_journal_admission_id" ON "inpatient_journal" USING btree ("admission_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_inpatient_journal_patient_id" ON "inpatient_journal" USING btree ("patient_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_admission_id" ON "invoices" USING btree ("admission_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_visit_id" ON "invoices" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_created_at" ON "invoices" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_lab_tests_visit_id" ON "lab_tests" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_nurses_notes_visit_id" ON "nurses_notes" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_patient_insurance_patient_primary_status" ON "patient_insurance" USING btree ("patient_id" int4_ops,"is_primary" bool_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_patient_visits_doctor_id" ON "patient_visits" USING btree ("doctor_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_physical_examinations_visit_id" ON "physical_examinations" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_prescriptions_visit_id" ON "prescriptions" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_procedures_visit_id" ON "procedures" USING btree ("visit_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_services_category" ON "services" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_vital_signs_visit_id" ON "vital_signs" USING btree ("visit_id" int4_ops);