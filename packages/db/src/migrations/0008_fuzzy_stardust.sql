CREATE TYPE "public"."featured_position" AS ENUM('main', 'secondary');--> statement-breakpoint
CREATE TABLE "featured_post" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"position" "featured_position" NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "featured_post" ADD CONSTRAINT "featured_post_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "featured_post_post_id_idx" ON "featured_post" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "featured_post_position_idx" ON "featured_post" USING btree ("position");