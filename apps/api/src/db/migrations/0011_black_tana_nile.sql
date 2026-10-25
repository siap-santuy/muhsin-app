CREATE TABLE "yaumiyah_access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_note" text,
	"expires_at" timestamp with time zone,
	"is_direct_grant" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "yaumiyah_access_requests" ADD CONSTRAINT "yaumiyah_access_requests_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaumiyah_access_requests" ADD CONSTRAINT "yaumiyah_access_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaumiyah_access_requests" ADD CONSTRAINT "yaumiyah_access_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "yaumiyah_access_req_school_student_idx" ON "yaumiyah_access_requests" USING btree ("school_id","student_id");--> statement-breakpoint
CREATE INDEX "yaumiyah_access_req_school_status_idx" ON "yaumiyah_access_requests" USING btree ("school_id","status");