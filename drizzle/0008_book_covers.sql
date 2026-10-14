CREATE TABLE "book_covers" (
	"book_id" integer PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "cover_version" integer;--> statement-breakpoint
ALTER TABLE "book_covers" ADD CONSTRAINT "book_covers_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;