import Link from "next/link";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, categories, loans } from "@/db/schema";
import { BookTile } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { searchBooks } from "@/lib/catalog";

export default async function Home() {
  const [{ rows: newest }, [titles], [copies], categoryList, popularIds] = await Promise.all([
    searchBooks({ query: "", categoryId: null, page: 1, pageSize: 6, order: "newest" }),
    db.select({ n: count() }).from(books),
    db.select({ n: count() }).from(bookCopies).where(eq(bookCopies.status, "active")),
    db
      .select({ id: categories.id, name: categories.name, n: count(books.id) })
      .from(categories)
      .leftJoin(books, eq(books.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(desc(count(books.id)), categories.name),
    // Сүүлийн 90 хоногт хамгийн их зээлсэн
    db
      .select({ id: books.id })
      .from(loans)
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .innerJoin(books, eq(books.id, bookCopies.bookId))
      .where(gte(loans.issuedAt, sql`now() - interval '90 days'`))
      .groupBy(books.id)
      .orderBy(desc(count()))
      .limit(6),
  ]);

  // Их уншигдсан номын картын мэдээлэл (хүртээмжтэй хамт)
  const popular =
    popularIds.length > 0
      ? (await searchBooks({ query: "", categoryId: null, page: 1, pageSize: 6, ids: popularIds.map((p) => p.id) })).rows.sort((a, b) => popularIds.findIndex((p) => p.id === a.id) - popularIds.findIndex((p) => p.id === b.id))
      : [];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-zinc-200 bg-gradient-to-b from-emerald-50 to-white dark:border-zinc-800 dark:from-emerald-950/30 dark:to-zinc-950">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-14 sm:py-20">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Унших номоо хайж олоорой
            </h1>
            <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
              Номын санд байгаа эсэхийг эндээс шалгаарай. Уншигч бол утасны дугаараараа нэвтэрч зээлсэн номоо харж,
              хугацааг сунгах боломжтой.
            </p>
            <form action="/catalog" className="flex max-w-xl gap-2" role="search">
              <input
                name="q"
                placeholder="Номын нэр, зохиогч эсвэл ISBN"
                aria-label="Ном хайх"
                className="h-12 w-full rounded-md border border-zinc-300 bg-white px-4 text-base shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button type="submit" className="h-12 rounded-md bg-emerald-700 px-6 font-medium text-white hover:bg-emerald-800">
                Хайх
              </button>
            </form>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{titles.n.toLocaleString("mn-MN")}</span> ном
              {" · "}
              <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{copies.n.toLocaleString("mn-MN")}</span> хувь
              {" · "}
              <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{categoryList.length}</span> ангилал
            </p>
          </div>
        </section>

        <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-12">
          {categoryList.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold tracking-tight">Ангилал</h2>
              <div className="flex flex-wrap gap-2">
                {categoryList.map((c) => (
                  <Link
                    key={c.id}
                    href={`/catalog?category=${c.id}`}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:border-emerald-600 hover:text-emerald-700 dark:border-zinc-700 dark:hover:text-emerald-400"
                  >
                    {c.name} <span className="text-zinc-400 tabular-nums">{c.n}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {popular.length > 0 && <Shelf title="Их уншигдаж байна" books={popular} href="/catalog" />}
          {newest.length > 0 && <Shelf title="Шинээр нэмэгдсэн" books={newest} href="/catalog" />}
        </div>
      </main>
    </>
  );
}

function Shelf({ title, books, href }: { title: string; books: Parameters<typeof BookTile>[0]["book"][]; href: string }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Link href={href} className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          Бүх ном →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {books.map((b) => (
          <BookTile key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}
