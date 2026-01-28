CREATE TABLE "chronos_page" (
	"id" text PRIMARY KEY NOT NULL,
	"sticky_image_key" text,
	"carousel_image_keys" jsonb,
	"markdown_content" text DEFAULT '' NOT NULL,
	"markdown_image_keys" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
