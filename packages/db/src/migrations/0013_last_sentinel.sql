ALTER TABLE "post" ADD COLUMN "creator_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "creator_link" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN "author_content";