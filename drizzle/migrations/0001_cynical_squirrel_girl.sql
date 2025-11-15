CREATE TABLE "notification_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now()
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
CREATE TABLE "patient_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"recorded_by" text NOT NULL,
	"purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inpatient_admissions" DROP CONSTRAINT "inpatient_admissions_consultant_doctor_id_fkey";
--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "hospital_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "lab_tests" ADD COLUMN "images" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_patient_id_patients_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_notification_user" ON "notification_reads" USING btree ("notification_id","user_id");--> statement-breakpoint
ALTER TABLE "inpatient_admissions" ADD CONSTRAINT "inpatient_admissions_consultant_doctor_id_fkey" FOREIGN KEY ("consultant_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;