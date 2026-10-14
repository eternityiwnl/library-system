import Link from "next/link";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { listCategories, searchBooks } from "@/lib/catalog";
import { requireRole } from "@/lib/session";

const PAGE_SIZE = 25;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  await requireRole("admin", "librarian");
  const { q = "", category = "", page: pageParam } = await searchParams;
  const query = q.trim();
  const categoryId = Number(category) || null;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ rows, total, pages }, allCategories] = await Promise.all([
    searchBooks({ query, categoryId, page, pageSize: PAGE_SIZE }),
    listCategories(),
  ]);

  const pageHref = (p: number) =>
    `/staff/books?${new URLSearchParams({ ...(query && { q: query }), ...(categoryId && { category: String(categoryId) }), page: String(p) })}`;
  const filtered = Boolean(query || categoryId);

  return (
    <>
      <PageHeader title="Номууд" actions={<LinkButton href="/staff/books/new">Шинэ ном</LinkButton>} />

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input
          name="q"
          defaultValue={query}
          placeholder="Нэр, зохиогч, ISBN-ээр хайх"
          aria-label="Ном хайх"
          className="h-10 w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        />
        <select
          name="category"
          defaultValue={categoryId ?? ""}
          aria-label="Ангилал"
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        >
          <option value="">Бүх ангилал</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Хайх
        </button>
        {filtered && (
          <Link href="/staff/books" className="self-center px-2 text-sm text-zinc-500 hover:underline">
            Цэвэрлэх
          </Link>
        )}
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Номын нэр</th>
              <th className="px-4 py-3 font-medium">Зохиогч</th>
              <th className="px-4 py-3 font-medium">Ангилал</th>
              <th className="px-4 py-3 font-medium">Он</th>
              <th className="px-4 py-3 text-right font-medium" title="Олгох боломжтой / нийт">Байгаа / нийт</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <Link href={`/staff/books/${b.id}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                    {b.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{b.author}</td>
                <td className="px-4 py-3 whitespace-nowrap">{b.category}</td>
                <td className="px-4 py-3 tabular-nums">{b.year ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap" title="Олгох боломжтой / нийт">
                  {b.available} / {b.copies}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  {filtered ? "Илэрц олдсонгүй" : allCategories.length === 0 ? (
                    <>
                      Эхлээд{" "}
                      <Link href="/staff/categories" className="text-emerald-700 hover:underline dark:text-emerald-400">
                        ангилал нэмнэ үү
                      </Link>
                    </>
                  ) : (
                    "Одоогоор ном бүртгээгүй байна"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {pages > 1 && (
        <nav className="mt-4 flex items-center gap-3 text-sm" aria-label="Хуудаслалт">
          {page > 1 && <Link href={pageHref(page - 1)} className="hover:underline">← Өмнөх</Link>}
          <span className="text-zinc-500">
            {page} / {pages} хуудас · нийт {total}
          </span>
          {page < pages && <Link href={pageHref(page + 1)} className="hover:underline">Дараах →</Link>}
        </nav>
      )}
    </>
  );
}
