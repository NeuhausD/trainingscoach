ALTER TABLE "connectors" ADD COLUMN "athlete_name" text;--> statement-breakpoint
ALTER TABLE "connectors" ADD COLUMN "last_error" text;--> statement-breakpoint
CREATE UNIQUE INDEX "connectors_user_provider_idx" ON "connectors" USING btree ("user_id","provider");