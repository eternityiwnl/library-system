CREATE SEQUENCE "public"."inventory_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "book_copies" DROP CONSTRAINT "book_copies_book_id_books_id_fk";
--> statement-breakpoint
ALTER TABLE "book_copies" ALTER COLUMN "inventory_number" SET DEFAULT lpad(nextval('inventory_number_seq')::text, 6, '0');--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "books_title_trgm_idx" ON "books" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_author_trgm_idx" ON "books" USING gin ("author" gin_trgm_ops);