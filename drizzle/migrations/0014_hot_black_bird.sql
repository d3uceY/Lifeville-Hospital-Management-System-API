DROP INDEX "idx_inpatient_patient_created_at";--> statement-breakpoint
CREATE INDEX "idx_complaints_patient_created_at" ON "complaints" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_diagnoses_patient_diagnosis_date" ON "diagnoses" USING btree ("patient_id" int4_ops,"diagnosis_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_doctors_notes_patient_created_at" ON "doctors_notes" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_lab_tests_patient_created_at" ON "lab_tests" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_nurses_notes_patient_created_at" ON "nurses_notes" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_patient_visits_patient_check_in_time" ON "patient_visits" USING btree ("patient_id" int4_ops,"check_in_time" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_physical_examinations_patient_created_at" ON "physical_examinations" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_prescription_items_prescription_id" ON "prescription_items" USING btree ("prescription_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_prescriptions_patient_prescription_date" ON "prescriptions" USING btree ("patient_id" int4_ops,"prescription_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_procedures_patient_performed_at" ON "procedures" USING btree ("patient_id" int4_ops,"performed_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_vital_signs_patient_created_at" ON "vital_signs" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_inpatient_patient_created_at" ON "inpatient_admissions" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);