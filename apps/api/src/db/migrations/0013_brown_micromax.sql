ALTER TABLE "munaqosah_periods" ADD COLUMN "is_result_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "munaqosah_requests" ADD COLUMN "period_id" uuid;--> statement-breakpoint
ALTER TABLE "munaqosah_requests" ADD COLUMN "juz_list" jsonb;--> statement-breakpoint
ALTER TABLE "munaqosah_requests" ADD CONSTRAINT "munaqosah_requests_period_id_munaqosah_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."munaqosah_periods"("id") ON DELETE no action ON UPDATE no action;