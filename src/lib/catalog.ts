import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, categories, loans } from "@/db/schema";

export function listCategories() {
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name));
}

/** LIKE-ийн тусгай тэмдэгтийг escape хийсэн '%хайлт%' загвар */
export function containsPattern(query: string) {
  return `%${query.replace(/[\%_]/g, "\$&")}%`;
}

/** Номын хайлт — ажилтны жагсаалт болон нийтийн каталог хоёуланд */
export async function searchBooks(input: {
  query: string;
  categoryId: number | null;
  page: number;
  pageSize: number;
  order?: "newest" | "title";
}) {
  const pattern = containsPattern(input.query);
  const isbnQuery = input.query.replace(/[\s-]/g, "").toUpperCase();
  const where = and(
    input.query
      ? or(
          ilike(books.title, pattern),
          ilike(books.author, pattern),
          isbnQuery ? ilike(books.isbn, containsPattern(isbnQuery)) : undefined,
        )
      : undefined,
    input.categoryId ? eq(books.categoryId, input.categoryId) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        year: books.publishedYear,
        categoryId: books.categoryId,
        category: categories.name,
        copies: count(bookCopies.id),
        // Олгох боломжтой = хэвийн төлөвтэй, одоо зээлэгдээгүй
        available: sql<number>`count(${bookCopies.id}) filter (where ${bookCopies.status} = 'active' and not exists (
          select 1 from ${loans} where ${loans.copyId} = ${bookCopies.id} and ${loans.returnedAt} is null))`.mapWith(Number),
      })
      .from(books)
      .innerJoin(categories, eq(categories.id, books.categoryId))
      .leftJoin(bookCopies, eq(bookCopies.bookId, books.id))
      .where(where)
      .groupBy(books.id, categories.name)
      .orderBy(input.order === "title" ? asc(books.title) : desc(books.createdAt), desc(books.id))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ total: count() }).from(books).where(where),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / input.pageSize)) };
}
