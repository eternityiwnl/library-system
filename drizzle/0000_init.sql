CREATE TYPE "public"."copy_status" AS ENUM('active', 'damaged', 'lost', 'withdrawn');--> statement-breakpoint
CREATE TABLE "book_copies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "book_copies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"book_id" integer NOT NULL,
	"inventory_number" text NOT NULL,
	"status" "copy_status" DEFAULT 'active' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "books_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"author" text NOT NULL,
	"isbn" text,
	"category_id" integer NOT NULL,
	"publisher" text,
	"published_year" smallint,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"loan_period_days" smallint DEFAULT 14 NOT NULL,
	"max_active_loans" smallint DEFAULT 3 NOT NULL,
	"max_renewals" smallint DEFAULT 1 NOT NULL,
	"renewal_days" smallint DEFAULT 14 NOT NULL,
	"fine_per_day" integer DEFAULT 500 NOT NULL,
	"max_unpaid_fine" integer DEFAULT 5000 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("settings"."id" = 1),
	CONSTRAINT "settings_positive" CHECK ("settings"."loan_period_days" > 0 AND "settings"."max_active_loans" > 0 AND "settings"."max_renewals" >= 0
        AND "settings"."renewal_days" > 0 AND "settings"."fine_per_day" >= 0 AND "settings"."max_unpaid_fine" >= 0)
);
--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "book_copies_inventory_number_idx" ON "book_copies" USING btree ("inventory_number");--> statement-breakpoint
CREATE INDEX "book_copies_book_idx" ON "book_copies" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "books_category_idx" ON "books" USING btree ("category_id");--> statement-breakpoint
INSERT INTO "settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
