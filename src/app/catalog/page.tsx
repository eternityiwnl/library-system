import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
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
      <h1 className="mb-5 font-serif text-3xl font-semibold tracking-tight">Ном хайх</h1>

      <form
        role="search"
        className="mb-5 flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white p-1.5 pl-4 shadow-card transition focus-within:border-emerald-600 focus-within:ring-[3px] focus-within:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {categoryId && <input type="hidden" name="category" value={categoryId} />}
        <Search className="size-5 shrink-0 text-zinc-400" aria-hidden />
        <input
          name="q"
          defaultValue={query}
          placeholder="Номын нэр, зохиогч эсвэл ISBN"
          aria-label="Ном хайх"
          className="h-10 w-full min-w-0 bg-transparent text-base outline-none"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-xl bg-emerald-700 px-5 font-medium text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Хайх
        </button>
      </form>

      {categories.length > 0 && (
        <nav className="mb-7 flex flex-wrap gap-2 text-sm" aria-label="Ангилал">
          {[{ id: null, name: "Бүгд" }, ...categories].map((c) => (
            <Link
              key={c.id ?? "all"}
              href={href({ category: c.id })}
              aria-current={(c.id === null ? !categoryId : categoryId === c.id) ? "page" : undefined}
              className="rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 shadow-card transition hover:border-zinc-400 aria-[current=page]:border-forest-900 aria-[current=page]:bg-forest-900 aria-[current=page]:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:aria-[current=page]:border-emerald-600 dark:aria-[current=page]:bg-emerald-700"
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
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-16 text-center text-zinc-500 dark:border-zinc-700">
          <SearchX className="size-8 text-zinc-400" aria-hidden />
          <p>{query || categoryId ? "Ном олдсонгүй" : "Одоогоор ном бүртгээгүй байна"}</p>
        </div>
      )}

      <Pagination page={page} pages={pages} href={(p) => href({ page: p })} />
    </>
  );
}
