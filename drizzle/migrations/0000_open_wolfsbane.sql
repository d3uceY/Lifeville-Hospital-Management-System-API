-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."gender_enum" AS ENUM('Male', 'Female', 'Other');--> statement-breakpoint
CREATE TYPE "public"."patient_type_enum" AS ENUM('INPATIENT', 'OUTPATIENT', 'NULL');--> statement-breakpoint
CREATE TABLE "patients" (
	"patient_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patients_patient_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"hospital_number" integer NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"other_names" varchar(255),
	"sex" varchar(10) NOT NULL,
	"marital_status" varchar(50),
	"date_of_birth" date NOT NULL,
	"phone_number" varchar(20),
	"address" text,
	"occupation" varchar(255),
	"place_of_work_address" text,
	"religion" varchar(255),
	"nationality" varchar(255),
	"next_of_kin" varchar(255),
	"relationship" varchar(255),
	"next_of_kin_phone" varchar(20),
	"next_of_kin_address" text,
	"past_surgical_history" text,
	"family_history" text,
	"social_history" text,
	"drug_history" text,
	"allergies" text,
	"dietary_restrictions" text,
	"diet_allergies_to_drugs" text,
	"past_medical_history" text,
	"surname" varchar(255),
	"patient_type" "patient_type_enum",
	"is_inpatient" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unique_hospital_number" UNIQUE("hospital_number")
);
--> statement-breakpoint
CREATE TABLE "bill_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"description" text NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"line_total" numeric(12, 2) GENERATED ALWAYS AS ((unit_price * (quantity)::numeric)) STORED
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_number" text NOT NULL,
	"patient_id" integer NOT NULL,
	"issued_by" varchar(100) NOT NULL,
	"bill_date" timestamp DEFAULT now() NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"payment_method" varchar(20),
	"amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_date" timestamp,
	"notes" text,
	"updated_by" text,
	"updated_at" timestamp,
	CONSTRAINT "bills_bill_number_key" UNIQUE("bill_number")
);
--> statement-breakpoint
CREATE TABLE "lab_test_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "lab_test_types_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "conditions" (
	"condition_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "conditions_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "symptom_types" (
	"symptom_type_id" serial PRIMARY KEY NOT NULL,
	"symptom_text" text NOT NULL,
	CONSTRAINT "symptom_types_symptom_text_key" UNIQUE("symptom_text")
);
--> statement-breakpoint
CREATE TABLE "symptom_heads" (
	"symptom_head_id" serial PRIMARY KEY NOT NULL,
	"symptom_head" text NOT NULL,
	"symptom_type_id" integer NOT NULL,
	"symptom_description" text
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"appointment_id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"doctor_id" integer,
	"appointment_date" timestamp NOT NULL,
	"notes" text,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "appointments_status_check" CHECK ((status)::text = ANY ((ARRAY['scheduled'::character varying, 'confirmed'::character varying, 'pending'::character varying, 'canceled'::character varying, 'completed'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"doctor_id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"specialty" varchar(100),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'staff' NOT NULL,
	"refresh_token" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) DEFAULT 'Super Admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bed_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"type_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beds" (
	"id" serial PRIMARY KEY NOT NULL,
	"bed_type_id" integer NOT NULL,
	"bed_group_id" integer NOT NULL,
	"bed_name" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bed_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_id" integer,
	"recipient_role" varchar(50),
	"type" varchar(100) NOT NULL,
	"title" varchar(255),
	"message" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "procedures" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"recorded_by" text NOT NULL,
	"procedure_name" text NOT NULL,
	"comments" text,
	"performed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "doctors_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"note" text NOT NULL,
	"recorded_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"recorded_by" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "discharge_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"final_diagnosis" text NOT NULL,
	"diagnosis_details" text,
	"treatment_given" text,
	"outcome" text,
	"condition" text,
	"discharge_date_time" timestamp NOT NULL,
	"follow_up" text,
	"patient_id" integer NOT NULL,
	"admission_id" integer NOT NULL,
	"doctor_id" integer NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vital_signs" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"recorded_at" timestamp,
	"temperature" numeric,
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"weight" numeric,
	"pulse_rate" integer,
	"spo2" integer,
	"recorded_by" text,
	"created_at" timestamp,
	"height" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nurses_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"note" text NOT NULL,
	"recorded_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_reads_notification_id_user_id_key" UNIQUE("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "birth_records" (
	"birth_id" serial PRIMARY KEY NOT NULL,
	"child_name" varchar(150) NOT NULL,
	"gender" "gender_enum" NOT NULL,
	"birth_date" date NOT NULL,
	"mother_name" varchar(150) NOT NULL,
	"father_name" varchar(150),
	"weight" numeric(5, 2),
	"phone_number" varchar(20),
	"address" text,
	"report" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"prescribed_by" text,
	"test_type" text NOT NULL,
	"status" text DEFAULT 'to_do' NOT NULL,
	"comments" text,
	"results" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"images" text[]
);
--> statement-breakpoint
CREATE TABLE "death_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"death_date" timestamp NOT NULL,
	"guardian" varchar(100),
	"attachment" text,
	"report" text
);
--> statement-breakpoint
CREATE TABLE "inpatient_admissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"symptom_types" text[] NOT NULL,
	"symptom_description" text,
	"note" text,
	"previous_medical_issue" text,
	"admission_date" timestamp NOT NULL,
	"consultant_doctor_id" integer NOT NULL,
	"bed_group" varchar(50),
	"bed_number" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"discharge_condition" text DEFAULT 'on admission',
	"end_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"patient_id" integer NOT NULL,
	"complaint" text
);
--> statement-breakpoint
CREATE TABLE "physical_examinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"general_appearance" text,
	"heent" text,
	"cardiovascular" text,
	"respiration" text,
	"gastrointestinal" text,
	"gynecology_obstetrics" text,
	"musculoskeletal" text,
	"neurological" text,
	"skin" text,
	"findings" text,
	"genitourinary" text
);
--> statement-breakpoint
CREATE TABLE "diagnoses" (
	"diagnosis_id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"recorded_by" text NOT NULL,
	"diagnosis_date" timestamp DEFAULT now(),
	"condition" text NOT NULL,
	"notes" text,
	"updated_by" text,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"prescription_id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"prescribed_by" text NOT NULL,
	"prescription_date" timestamp DEFAULT now(),
	"notes" text,
	"status" text,
	"updated_by" text,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "inpatient_journal" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"admission_id" integer NOT NULL,
	"recorded_by" text NOT NULL,
	"updated_by" text,
	"comment" text,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"recorded_by" text NOT NULL,
	"purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "prescription_items" (
	"prescription_item_id" serial PRIMARY KEY NOT NULL,
	"prescription_id" integer NOT NULL,
	"drug_name" text NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"duration" text NOT NULL,
	"instructions" text
);
--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_heads" ADD CONSTRAINT "symptom_heads_symptom_type_id_fkey" FOREIGN KEY ("symptom_type_id") REFERENCES "public"."symptom_types"("symptom_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_bed_type_id_fkey" FOREIGN KEY ("bed_type_id") REFERENCES "public"."bed_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_bed_group_id_fkey" FOREIGN KEY ("bed_group_id") REFERENCES "public"."bed_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors_notes" ADD CONSTRAINT "doctors_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurses_notes" ADD CONSTRAINT "nurses_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "death_records" ADD CONSTRAINT "death_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inpatient_admissions" ADD CONSTRAINT "inpatient_admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_examinations" ADD CONSTRAINT "physical_examinations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inpatient_journal" ADD CONSTRAINT "fk_patient" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inpatient_journal" ADD CONSTRAINT "fk_admission" FOREIGN KEY ("admission_id") REFERENCES "public"."inpatient_admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("prescription_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_patients_hospital_number" ON "patients" USING btree ("hospital_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_patients_name" ON "patients" USING btree ("surname" text_ops,"first_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_patients_name_trgm" ON "patients" USING gin ("surname" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_created_at" ON "appointments" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_doctor_id" ON "appointments" USING btree ("doctor_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_patient_created_at" ON "appointments" USING btree ("patient_id" int4_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_patient_id" ON "appointments" USING btree ("patient_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_users_name" ON "users" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_name_trgm" ON "users" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role" text_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_id" ON "notifications" USING btree ("recipient_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_id_created_at" ON "notifications" USING btree ("recipient_id" int4_ops,"created_at" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_role" ON "notifications" USING btree ("recipient_role" text_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_role_created_at" ON "notifications" USING btree ("recipient_role" text_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_discharge_admission" ON "discharge_summary" USING btree ("admission_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_notification_reads_id" ON "notification_reads" USING btree ("notification_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_notification_reads_notification_user" ON "notification_reads" USING btree ("notification_id" int4_ops,"user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_notification_user" ON "notification_reads" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_inpatient_discharge_created_at" ON "inpatient_admissions" USING btree ("discharge_condition" text_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_inpatient_patient_created_at" ON "inpatient_admissions" USING btree ("patient_id" timestamp_ops,"created_at" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_inpatient_patient_discharge" ON "inpatient_admissions" USING btree ("patient_id" int4_ops,"discharge_condition" text_ops);
*/