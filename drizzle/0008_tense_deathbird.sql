CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pdp_id" uuid NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"reason" text,
	"rubric_version" text DEFAULT 'v0.1' NOT NULL,
	"model_profile_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"classification" jsonb,
	"deterministic_findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scores" jsonb,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_evaluations" ADD COLUMN "evaluation_id" uuid;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_pdp_id_pdps_id_fk" FOREIGN KEY ("pdp_id") REFERENCES "public"."pdps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_evaluations" ADD CONSTRAINT "model_evaluations_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;