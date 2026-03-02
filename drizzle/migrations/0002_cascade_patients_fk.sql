-- Migration: Update foreign key constraints to ON DELETE CASCADE for patients

ALTER TABLE "death_records"
DROP CONSTRAINT IF EXISTS "death_records_patient_id_fkey",
ADD CONSTRAINT "death_records_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE CASCADE;

ALTER TABLE "complaints"
DROP CONSTRAINT IF EXISTS "complaints_patient_id_fkey",
ADD CONSTRAINT "complaints_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE CASCADE;

ALTER TABLE "diagnoses"
DROP CONSTRAINT IF EXISTS "diagnoses_patient_id_fkey",
ADD CONSTRAINT "diagnoses_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE CASCADE;

ALTER TABLE "prescriptions"
DROP CONSTRAINT IF EXISTS "prescriptions_patient_id_fkey",
ADD CONSTRAINT "prescriptions_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE CASCADE;
