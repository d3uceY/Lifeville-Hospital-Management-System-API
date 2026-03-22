CREATE TABLE "settings_billing" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"currency_code" varchar(10) DEFAULT 'NGN' NOT NULL,
	"currency_symbol_position" varchar(10) DEFAULT 'before' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_contact" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"address" text,
	"city" varchar(100),
	"country" varchar(100) DEFAULT 'Nigeria',
	"phone" varchar(30),
	"email" varchar(255),
	"website" varchar(255),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_documents" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"lab_report_footer" text,
	"print_footer_text" text,
	"show_hospital_header" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_hospital_info" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"hospital_name" varchar(255) DEFAULT 'Lifeville Specialist Hospital' NOT NULL,
	"hospital_short_name" varchar(100) DEFAULT 'Lifeville',
	"license_number" varchar(100),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_prefixes" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"bill_number_prefix" varchar(20) DEFAULT 'BILL-' NOT NULL,
	"patient_id_prefix" varchar(20) DEFAULT 'PAT-' NOT NULL,
	"lab_id_prefix" varchar(20) DEFAULT 'LAB-' NOT NULL,
	"admission_id_prefix" varchar(20) DEFAULT 'ADM-' NOT NULL,
	"birth_id_prefix" varchar(20) DEFAULT 'BIRTH-' NOT NULL,
	"death_id_prefix" varchar(20) DEFAULT 'DEATH-' NOT NULL,
	"appointment_id_prefix" varchar(20) DEFAULT 'APT-' NOT NULL,
	"invoice_id_prefix" varchar(20) DEFAULT 'INV-' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
