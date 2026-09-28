ALTER TABLE "evaluations" ADD COLUMN "normalization_id" uuid;--> statement-breakpoint
ALTER TABLE "model_evaluations" ADD COLUMN "shopper_assessment" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_normalization_id_pdp_normalizations_id_fk" FOREIGN KEY ("normalization_id") REFERENCES "public"."pdp_normalizations"("id") ON DELETE set null ON UPDATE no action;