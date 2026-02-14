CREATE TYPE "public"."emoji_type" AS ENUM('static', 'animated');--> statement-breakpoint
CREATE TABLE "emoji" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"type" "emoji_type" DEFAULT 'static' NOT NULL,
	"asset_key" text NOT NULL,
	"asset_format" text NOT NULL,
	"required_tier" text DEFAULT 'level1' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "emoji_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "static_page" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "static_page_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sticker" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"type" "emoji_type" DEFAULT 'static' NOT NULL,
	"asset_key" text NOT NULL,
	"asset_format" text NOT NULL,
	"required_tier" text DEFAULT 'level3' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sticker_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "emoji_name_idx" ON "emoji" USING btree ("name");--> statement-breakpoint
CREATE INDEX "emoji_required_tier_idx" ON "emoji" USING btree ("required_tier");--> statement-breakpoint
CREATE INDEX "static_page_slug_idx" ON "static_page" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sticker_name_idx" ON "sticker" USING btree ("name");--> statement-breakpoint
CREATE INDEX "sticker_required_tier_idx" ON "sticker" USING btree ("required_tier");