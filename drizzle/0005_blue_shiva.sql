CREATE TABLE "pdp_normalizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pdp_id" uuid NOT NULL,
	"fetch_id" uuid,
	"title" text,
	"content" text NOT NULL,
	"json_ld" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signals" jsonb DEFAULT '{"priceTexts":[],"availabilityTexts":[],"ctaTexts":[]}'::jsonb NOT NULL,
	"text_length" integer DEFAULT 0 NOT NULL,
	"truncated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pdp_normalizations" ADD CONSTRAINT "pdp_normalizations_pdp_id_pdps_id_fk" FOREIGN KEY ("pdp_id") REFERENCES "public"."pdps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdp_normalizations" ADD CONSTRAINT "pdp_normalizations_fetch_id_pdp_fetches_id_fk" FOREIGN KEY ("fetch_id") REFERENCES "public"."pdp_fetches"("id") ON DELETE set null ON UPDATE no action;