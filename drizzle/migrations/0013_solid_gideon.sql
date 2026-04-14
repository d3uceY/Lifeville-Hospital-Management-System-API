CREATE TYPE "public"."media_type_enum" AS ENUM('local', 'cloud');--> statement-breakpoint
CREATE TABLE "media_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(500) NOT NULL,
	"url" text NOT NULL,
	"metadata" jsonb,
	"type" "media_type_enum" DEFAULT 'cloud' NOT NULL,
	"content_type" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_email" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"smtp_host" varchar(255),
	"smtp_port" integer DEFAULT 587,
	"smtp_secure" boolean DEFAULT true NOT NULL,
	"smtp_user" varchar(255),
	"smtp_pass" text,
	"smtp_from" varchar(255),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_storage" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"provider" varchar(50) DEFAULT 'cloudinary' NOT NULL,
	"cloud_name" varchar(255),
	"api_key" varchar(255),
	"api_secret" text,
	"folder_name" varchar(255),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "media_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "media_id" integer;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media_content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media_content"("id") ON DELETE set null ON UPDATE no action;