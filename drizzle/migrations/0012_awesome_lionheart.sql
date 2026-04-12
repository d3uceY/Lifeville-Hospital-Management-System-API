ALTER TABLE "users" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" timestamp;--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_roles" ON "notifications" USING gin ("recipient_roles");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_name_key" UNIQUE("name");