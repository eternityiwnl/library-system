CREATE TYPE "public"."fine_status" AS ENUM('unpaid', 'paid', 'waived');--> statement-breakpoint
CREATE TABLE "fines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"loan_id" integer NOT NULL,
	"reader_id" text NOT NULL,
	"days_late" smallint NOT NULL,
	"amount" integer NOT NULL,
	"status" "fine_status" DEFAULT 'unpaid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	CONSTRAINT "fines_loan_id_unique" UNIQUE("loan_id"),
	CONSTRAINT "fines_positive" CHECK ("fines"."amount" > 0 AND "fines"."days_late" > 0)
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "loans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"copy_id" integer NOT NULL,
	"reader_id" text NOT NULL,
	"issued_by" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" date NOT NULL,
	"renewal_count" smallint DEFAULT 0 NOT NULL,
	"returned_at" timestamp with time zone,
	"returned_to" text
);
--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_reader_id_user_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_book_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."book_copies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_reader_id_user_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_issued_by_user_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_to_user_id_fk" FOREIGN KEY ("returned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fines_reader_idx" ON "fines" USING btree ("reader_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loans_one_active_per_copy_idx" ON "loans" USING btree ("copy_id") WHERE "loans"."returned_at" IS NULL;--> statement-breakpoint
CREATE INDEX "loans_reader_idx" ON "loans" USING btree ("reader_id");--> statement-breakpoint
CREATE INDEX "loans_active_due_idx" ON "loans" USING btree ("due_date") WHERE "loans"."returned_at" IS NULL;