CREATE TYPE "public"."document_status" AS ENUM('publish', 'pending', 'draft', 'trash');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('post', 'comic');--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "type" SET DEFAULT 'post'::"public"."post_type";--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "type" SET DATA TYPE "public"."post_type" USING "type"::"public"."post_type";--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."document_status";--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "status" SET DATA TYPE "public"."document_status" USING "status"::"public"."document_status";