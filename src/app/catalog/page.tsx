import type { Metadata } from "next";
import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { Pagination } from "@/components/ui";
import { listCategories, searchBooks } from "@/lib/catalog";

export const metadata: Metadata = { title: "Ном хайх — Номын сан" };

const PAGE_SIZE = 24;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const categoryId = Number(params.category) || null;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total, pages }, categories] = await Promise.all([
    searchBooks({ query, categoryId, page, pageSize: PAGE_SIZE, order: query ? "title" : "newest" }),
    listCategories(),
  ]);

  const href = (next: { category?: number | null; page?: number }) => {
    const category = next.category === undefined ? categoryId : next.category;
    const p = new URLSearchParams({
      ...(query && { q: query }),
      ...(category && { category: String(category) }),
      ...(next.page && next.page > 1 && { page: String(next.page) }),
    });
    return `/catalog${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Ном хайх</h1>

      <form className="mb-4 flex gap-2" role="search">
        {categoryId && <input type="hidden" name="category" value={categoryId} />}
        <input
          name="q"
          defaultValue={query}
          placeholder="Номын нэр, зохиогч эсвэл ISBN"
          aria-label="Ном хайх"
          className="h-11 w-full rounded-md border border-zinc-300 bg-white px-4 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button type="submit" className="h-11 rounded-md bg-emerald-700 px-5 font-medium text-white hover:bg-emerald-800">
          Хайх
        </button>
      </form>

      {categories.length > 0 && (
        <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Ангилал">
          <Link
            href={href({ category: null })}
            aria-current={!categoryId ? "page" : undefined}
            className="rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-100 aria-[current=page]:border-emerald-700 aria-[current=page]:bg-emerald-700 aria-[current=page]:text-white dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Бүгд
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={href({ category: c.id })}
              aria-current={categoryId === c.id ? "page" : undefined}
              className="rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-100 aria-[current=page]:border-emerald-700 aria-[current=page]:bg-emerald-700 aria-[current=page]:text-white dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {(query || categoryId) && (
        <p className="mb-4 text-sm text-zinc-500">
          {total} ном олдлоо
          {query && (
            <>
              {" "}
              ·{" "}
              <Link href={categoryId ? `/catalog?category=${categoryId}` : "/catalog"} className="hover:underline">
                хайлт цэвэрлэх
              </Link>
            </>
          )}
        </p>
      )}

      {rows.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-zinc-500">{query || categoryId ? "Ном олдсонгүй" : "Одоогоор ном бүртгээгүй байна"}</p>
      )}

      <Pagination page={page} pages={pages} href={(p) => href({ page: p })} />
    </>
  );
}
