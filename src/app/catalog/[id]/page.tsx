import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, categories, loans } from "@/db/schema";
import { AvailabilityBadge, BookTile } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { Card } from "@/components/ui";
import { searchBooks } from "@/lib/catalog";
import { TODAY } from "@/lib/circulation";
import { formatDate } from "@/lib/format";

async function getBook(id: number) {
  const [book] = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      isbn: books.isbn,
      publisher: books.publisher,
      year: books.publishedYear,
      description: books.description,
      coverVersion: books.coverVersion,
      categoryId: books.categoryId,
      category: categories.name,
    })
    .from(books)
    .innerJoin(categories, eq(categories.id, books.categoryId))
    .where(eq(books.id, id));
  return book;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = Number((await params).id);
  const book = Number.isInteger(id) ? await getBook(id) : undefined;
  return { title: book ? `${book.title} — Хүрээ Номын сан` : "Хүрээ Номын сан" };
}

export default async function CatalogBookPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [book, [stock], [nextReturn]] = await Promise.all([
    getBook(id),
    db
      .select({
        copies: count(bookCopies.id),
        available: sql<number>`count(*) filter (where ${bookCopies.status} = 'active' and ${loans.id} is null)`.mapWith(Number),
      })
      .from(bookCopies)
      .leftJoin(loans, and(eq(loans.copyId, bookCopies.id), isNull(loans.returnedAt)))
      .where(eq(bookCopies.bookId, id)),
    // Бүх хувь зээлэгдсэн бол хамгийн эрт буцаах огноог харуулна (хэтэрсэн огноог биш)
    db
      .select({ dueDate: sql<string | null>`(min(${loans.dueDate}) filter (where ${loans.dueDate} >= ${TODAY}))::text` })
      .from(loans)
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .where(and(eq(bookCopies.bookId, id), isNull(loans.returnedAt))),
  ]);
  if (!book) notFound();

  const details = [
    ["Зохиогч", book.author],
    ["Ангилал", book.category],
    ["Хэвлэгдсэн он", book.year],
    ["Хэвлэлийн газар", book.publisher],
    ["ISBN", book.isbn],
  ].filter(([, v]) => v) as [string, string | number][];

  const { rows: related } = await searchBooks({ query: "", categoryId: book.categoryId, page: 1, pageSize: 7, order: "newest" });
  const others = related.filter((b) => b.id !== book.id).slice(0, 6);

  return (
    <div className="flex flex-col gap-12">
      <Link
        href={`/catalog?category=${book.categoryId}`}
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" aria-hidden /> {book.category}
      </Link>

      <div className="grid gap-8 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-12">
        <div className="mx-auto w-48 sm:mx-0 sm:w-full">
          <BookCover book={book} size="lg" className="shadow-raised" />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase dark:text-emerald-400">
              {book.category}
            </p>
            <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight text-balance">{book.title}</h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{book.author}</p>
          </div>

          <Card className="flex flex-col items-start gap-2 border-l-4 border-l-emerald-600">
            <AvailabilityBadge available={stock.available} copies={stock.copies} />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {stock.available > 0
                ? "Номын санд ирж зээлж авна уу."
                : nextReturn?.dueDate
                  ? `Хамгийн эрт ${formatDate(nextReturn.dueDate)}-нд буцаагдах төлөвтэй.`
                  : stock.copies > 0
                    ? "Бүх хувь зээлэгдсэн байна."
                    : "Одоогоор зээлэх боломжгүй."}
            </p>
          </Card>

          {book.description && (
            <section>
              <h2 className="mb-2 font-serif text-lg font-semibold">Тайлбар</h2>
              <p className="max-w-prose font-serif text-[1.05rem] leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                {book.description}
              </p>
            </section>
          )}

          <dl className="grid grid-cols-[auto_1fr] border-t border-zinc-200 text-sm dark:border-zinc-800">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="border-b border-zinc-200 py-2.5 pr-8 text-zinc-500 dark:border-zinc-800">{label}</dt>
                <dd className="border-b border-zinc-200 py-2.5 dark:border-zinc-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {others.length > 0 && (
        <section>
          <h2 className="mb-5 border-b border-zinc-200 pb-3 font-serif text-2xl font-semibold tracking-tight dark:border-zinc-800">
            {book.category} ангиллын бусад ном
          </h2>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6">
            {others.map((b) => (
              <BookTile key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
