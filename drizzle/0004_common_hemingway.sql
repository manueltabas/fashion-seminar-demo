CREATE TABLE "pdp_fetches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pdp_id" uuid NOT NULL,
	"url" text NOT NULL,
	"final_url" text,
	"status_code" integer,
	"ok" boolean DEFAULT false NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"block_reason" text,
	"content_type" text,
	"byte_size" integer DEFAULT 0 NOT NULL,
	"html_length" integer DEFAULT 0 NOT NULL,
	"raw_html" text,
	"error" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pdp_fetches" ADD CONSTRAINT "pdp_fetches_pdp_id_pdps_id_fk" FOREIGN KEY ("pdp_id") REFERENCES "public"."pdps"("id") ON DELETE cascade ON UPDATE no action;