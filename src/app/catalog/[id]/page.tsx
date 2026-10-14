import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, categories, loans } from "@/db/schema";
import { AvailabilityBadge } from "@/components/book-card";
import { Card } from "@/components/ui";
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
  return { title: book ? `${book.title} — Номын сан` : "Номын сан" };
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

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href={`/catalog?category=${book.categoryId}`} className="text-sm text-zinc-500 hover:underline">
        ← {book.category}
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{book.title}</h1>
        <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">{book.author}</p>
      </div>

      <Card className="flex flex-col gap-2">
        <AvailabilityBadge available={stock.available} copies={stock.copies} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {stock.available > 0
            ? "Номын санд ирж, картаа үзүүлэн зээлж авна уу."
            : nextReturn?.dueDate
              ? `Хамгийн эрт ${formatDate(nextReturn.dueDate)}-нд буцаагдах төлөвтэй.`
              : stock.copies > 0
                ? "Бүх хувь зээлэгдсэн байна."
                : "Одоогоор зээлэх боломжгүй."}
        </p>
      </Card>

      {book.description && <p className="leading-relaxed whitespace-pre-line">{book.description}</p>}

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {details.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
