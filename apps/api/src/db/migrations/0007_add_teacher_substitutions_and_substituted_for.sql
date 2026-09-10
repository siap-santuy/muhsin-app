CREATE TABLE IF NOT EXISTS "teacher_substitutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"absent_teacher_id" uuid NOT NULL,
	"substitute_teacher_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"date_start" timestamp NOT NULL,
	"date_end" timestamp NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "setoran_entries" ADD COLUMN "substituted_for_teacher_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teacher_substitutions" ADD CONSTRAINT "teacher_substitutions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teacher_substitutions" ADD CONSTRAINT "teacher_substitutions_absent_teacher_id_users_id_fk" FOREIGN KEY ("absent_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teacher_substitutions" ADD CONSTRAINT "teacher_substitutions_substitute_teacher_id_users_id_fk" FOREIGN KEY ("substitute_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teacher_substitutions" ADD CONSTRAINT "teacher_substitutions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "setoran_entries" ADD CONSTRAINT "setoran_entries_substituted_for_teacher_id_users_id_fk" FOREIGN KEY ("substituted_for_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
