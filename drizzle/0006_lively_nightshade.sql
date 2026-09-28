CREATE TABLE "robots_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pdp_id" uuid NOT NULL,
	"robots_url" text NOT NULL,
	"status_code" integer,
	"present" boolean DEFAULT false NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL,
	"blocked_bots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "robots_reports" ADD CONSTRAINT "robots_reports_pdp_id_pdps_id_fk" FOREIGN KEY ("pdp_id") REFERENCES "public"."pdps"("id") ON DELETE cascade ON UPDATE no action;