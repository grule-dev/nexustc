CREATE TYPE "public"."patron_tier" AS ENUM('none', 'level1', 'level3', 'level5', 'level8', 'level12', 'level69');--> statement-breakpoint
CREATE TABLE "patron" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"patreon_user_id" text NOT NULL,
	"tier" "patron_tier" DEFAULT 'none' NOT NULL,
	"pledge_amount_cents" integer DEFAULT 0 NOT NULL,
	"is_active_patron" boolean DEFAULT false NOT NULL,
	"patron_since" timestamp with time zone,
	"last_sync_at" timestamp with time zone NOT NULL,
	"last_webhook_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "patron_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "patron_patreon_user_id_unique" UNIQUE("patreon_user_id")
);
--> statement-breakpoint
ALTER TABLE "patron" ADD CONSTRAINT "patron_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patron_user_id_idx" ON "patron" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "patron_patreon_user_id_idx" ON "patron" USING btree ("patreon_user_id");--> statement-breakpoint
CREATE INDEX "patron_tier_idx" ON "patron" USING btree ("tier");