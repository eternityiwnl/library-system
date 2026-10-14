import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, categories } from "@/db/schema";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { searchBooks } from "@/lib/catalog";

export default async function Home() {
  const [{ rows: newest }, [titles], [copies], [cats]] = await Promise.all([
    searchBooks({ query: "", categoryId: null, page: 1, pageSize: 6, order: "newest" }),
    db.select({ n: count() }).from(books),
    db.select({ n: count() }).from(bookCopies).where(eq(bookCopies.status, "active")),
    db.select({ n: count() }).from(categories),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-zinc-200 bg-emerald-50/60 dark:border-zinc-800 dark:bg-emerald-950/20">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 sm:py-20">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Номын сангийн цахим каталог
            </h1>
            <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
              Хүссэн номоо хайж, номын санд байгаа эсэхийг шалгаарай. Уншигч бол утасны дугаараараа нэвтэрч зээлсэн
              номоо харж, хугацааг сунгах боломжтой.
            </p>
            <form action="/catalog" className="flex max-w-xl gap-2" role="search">
              <input
                name="q"
                placeholder="Номын нэр, зохиогч эсвэл ISBN"
                aria-label="Ном хайх"
                className="h-12 w-full rounded-md border border-zinc-300 bg-white px-4 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button type="submit" className="h-12 rounded-md bg-emerald-700 px-6 font-medium text-white hover:bg-emerald-800">
                Хайх
              </button>
            </form>
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div>
                <dt className="inline">Номын нэр: </dt>
                <dd className="inline font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{titles.n.toLocaleString("mn-MN")}</dd>
              </div>
              <div>
                <dt className="inline">Хувь: </dt>
                <dd className="inline font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{copies.n.toLocaleString("mn-MN")}</dd>
              </div>
              <div>
                <dt className="inline">Ангилал: </dt>
                <dd className="inline font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{cats.n.toLocaleString("mn-MN")}</dd>
              </div>
            </dl>
          </div>
        </section>

        {newest.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-12">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight">Шинээр нэмэгдсэн</h2>
              <Link href="/catalog" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
                Бүх ном →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newest.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
