import Link from "next/link";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, categories, loans } from "@/db/schema";
import { ArrowRight, Search } from "lucide-react";
import { BookTile } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { SiteFooter, SiteHeader } from "@/components/site-header";
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

  // Нүүрний чимэглэл: их уншигдсан (эсвэл шинэ) эхний 3 номын хавтас
  const fanned = (popular.length >= 3 ? popular : newest).slice(0, 3);
  const stats = [
    { value: titles.n.toLocaleString("mn-MN"), label: "ном" },
    { value: copies.n.toLocaleString("mn-MN"), label: "хувь" },
    { value: categoryList.length.toLocaleString("mn-MN"), label: "ангилал" },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
          {/* Зөөлөн ногоон туяа */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgb(31_112_80/0.12),transparent_70%)] dark:bg-[radial-gradient(60%_80%_at_85%_20%,rgb(82_163_123/0.12),transparent_70%)]"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-4 py-14 sm:py-20 md:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-6">
              <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:text-emerald-400">Хүрээ Номын сан</p>
              <h1 className="max-w-xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
                Унших номоо хайж олоорой
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Номын санд байгаа эсэхийг эндээс шалгаарай. Уншигч бол утасны дугаараараа нэвтэрч зээлсэн номоо харж,
                хугацааг сунгах боломжтой.
              </p>
              <form
                action="/catalog"
                role="search"
                className="flex max-w-xl items-center gap-2 rounded-2xl border border-zinc-300 bg-white p-1.5 pl-4 shadow-raised transition focus-within:border-emerald-600 focus-within:ring-[3px] focus-within:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <Search className="size-5 shrink-0 text-zinc-400" aria-hidden />
                <input
                  name="q"
                  placeholder="Номын нэр, зохиогч эсвэл ISBN"
                  aria-label="Ном хайх"
                  className="h-11 w-full min-w-0 bg-transparent text-base outline-none"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-xl bg-emerald-700 px-5 font-medium text-white transition-colors hover:bg-emerald-800 sm:px-6 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Хайх
                </button>
              </form>
              <dl className="flex gap-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-serif text-3xl font-semibold tabular-nums">{s.value}</dd>
                    <dd className="text-sm text-zinc-500">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {fanned.length === 3 && (
              <div className="relative mx-auto hidden h-80 w-72 md:block" aria-hidden>
                <div className="absolute top-8 left-0 w-40 -rotate-12">
                  <BookCover book={fanned[2]} size="md" />
                </div>
                <div className="absolute top-2 right-0 w-40 rotate-[10deg]">
                  <BookCover book={fanned[1]} size="md" />
                </div>
                <div className="absolute top-12 left-14 w-44 drop-shadow-xl">
                  <BookCover book={fanned[0]} size="md" />
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-14">
          {categoryList.length > 0 && (
            <section>
              <SectionTitle title="Ангилал" />
              <div className="flex flex-wrap gap-2">
                {categoryList.map((c) => (
                  <Link
                    key={c.id}
                    href={`/catalog?category=${c.id}`}
                    className="group flex items-center gap-2 rounded-full border border-zinc-300 bg-white py-2 pr-2 pl-4 text-sm shadow-card transition hover:border-emerald-600 hover:text-emerald-800 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-emerald-300"
                  >
                    {c.name}
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 tabular-nums transition group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-zinc-800 dark:group-hover:bg-emerald-950 dark:group-hover:text-emerald-300">
                      {c.n}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {popular.length > 0 && <Shelf title="Их уншигдаж байна" books={popular} href="/catalog" />}
          {newest.length > 0 && <Shelf title="Шинээр нэмэгдсэн" books={newest} href="/catalog" />}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      <h2 className="font-serif text-2xl font-semibold tracking-tight">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Бүх ном <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function Shelf({ title, books, href }: { title: string; books: Parameters<typeof BookTile>[0]["book"][]; href: string }) {
  return (
    <section>
      <SectionTitle title={title} href={href} />
      <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-6 sm:gap-x-5">
        {books.map((b) => (
          <BookTile key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}
