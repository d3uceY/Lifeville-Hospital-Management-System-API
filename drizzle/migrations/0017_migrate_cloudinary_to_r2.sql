CREATE TABLE "lab_test_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"lab_test_id" integer NOT NULL,
	"media_content_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lab_test_files_lab_test_id_media_content_id_key" UNIQUE("lab_test_id","media_content_id")
);
--> statement-breakpoint
ALTER TABLE "settings_storage" RENAME COLUMN "cloud_name" TO "account_id";--> statement-breakpoint
ALTER TABLE "settings_storage" RENAME COLUMN "api_key" TO "access_key_id";--> statement-breakpoint
ALTER TABLE "settings_storage" RENAME COLUMN "api_secret" TO "secret_access_key";--> statement-breakpoint
ALTER TABLE "media_content" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "settings_storage" ALTER COLUMN "provider" SET DEFAULT 'r2';--> statement-breakpoint
ALTER TABLE "settings_storage" ADD COLUMN "bucket" varchar(255);--> statement-breakpoint
ALTER TABLE "lab_test_files" ADD CONSTRAINT "lab_test_files_lab_test_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "public"."lab_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_test_files" ADD CONSTRAINT "lab_test_files_media_content_id_fkey" FOREIGN KEY ("media_content_id") REFERENCES "public"."media_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_tests" DROP COLUMN "images";