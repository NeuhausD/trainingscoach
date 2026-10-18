CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sport_id" uuid,
	"equipment_id" uuid,
	"source" text NOT NULL,
	"external_id" text,
	"started_at" timestamp with time zone NOT NULL,
	"duration_s" integer NOT NULL,
	"distance_m" numeric,
	"elevation_gain_m" numeric,
	"avg_hr" integer,
	"max_hr" integer,
	"avg_power_w" integer,
	"training_load" numeric,
	"rpe" integer,
	"title" text,
	"notes" text,
	"raw_summary" jsonb,
	CONSTRAINT "activities_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "body_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_on" date NOT NULL,
	"weight_kg" numeric,
	"resting_hr" integer,
	"body_fat_pct" numeric,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_athlete_id" text,
	"access_token_enc" text,
	"refresh_token_enc" text,
	"expires_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"status" text DEFAULT 'connected' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"strava_gear_id" text,
	"retired" boolean DEFAULT false NOT NULL,
	"notes" text,
	CONSTRAINT "equipment_strava_gear_id_unique" UNIQUE("strava_gear_id")
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_on" date NOT NULL,
	"metric" text NOT NULL,
	"value" numeric NOT NULL,
	"unit" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sport_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sport_id" uuid NOT NULL,
	"season" text NOT NULL,
	"weight" integer DEFAULT 5 NOT NULL,
	"target_sessions_per_week" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"strava_types" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sport_id" uuid,
	"completed_activity_id" uuid,
	"planned_on" date NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"duration_min" integer NOT NULL,
	"intensity" text NOT NULL,
	"variants" jsonb,
	"status" text DEFAULT 'suggested' NOT NULL,
	"model" text,
	"context_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"entra_oid" text,
	"home_location" text,
	"home_lat" numeric,
	"home_lon" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_entra_oid_unique" UNIQUE("entra_oid")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_preferences" ADD CONSTRAINT "sport_preferences_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports" ADD CONSTRAINT "sports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_suggestions" ADD CONSTRAINT "training_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_suggestions" ADD CONSTRAINT "training_suggestions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_suggestions" ADD CONSTRAINT "training_suggestions_completed_activity_id_activities_id_fk" FOREIGN KEY ("completed_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_user_name_idx" ON "equipment" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "sport_preferences_sport_season_idx" ON "sport_preferences" USING btree ("sport_id","season");--> statement-breakpoint
CREATE UNIQUE INDEX "sports_user_name_idx" ON "sports" USING btree ("user_id","name");