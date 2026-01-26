ALTER TABLE "patron" ALTER COLUMN "tier" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patron" ALTER COLUMN "tier" SET DEFAULT 'none';--> statement-breakpoint
DROP TYPE "public"."patron_tier";