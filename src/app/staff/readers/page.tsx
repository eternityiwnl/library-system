import Link from "next/link";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { realEmail } from "@/lib/users";
import { containsPattern } from "@/lib/catalog";

const PAGE_SIZE = 25;

export default async function ReadersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireRole("admin", "librarian");
  const { q = "", page: pageParam } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(pageParam) || 1);

  const pattern = containsPattern(query);
  const where = and(
    eq(user.role, "reader"),
    query
      ? or(ilike(user.name, pattern), ilike(user.username, pattern), ilike(user.phone, pattern), ilike(user.email, pattern))
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        email: user.email,
        banned: user.banned,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(user).where(where),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => `/staff/readers?${new URLSearchParams({ ...(query && { q: query }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Уншигчид" actions={<LinkButton href="/staff/readers/new">Шинэ уншигч</LinkButton>} />

      <form className="mb-4 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={query}
          placeholder="Нэр, картын дугаар, утас, имэйлээр хайх"
          aria-label="Уншигч хайх"
          className="h-10 w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Хайх
        </button>
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Картын дугаар</th>
              <th className="px-4 py-3 font-medium">Овог нэр</th>
              <th className="px-4 py-3 font-medium">Утас</th>
              <th className="px-4 py-3 font-medium">Имэйл</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3 font-mono whitespace-nowrap">
                  <Link href={`/staff/readers/${r.id}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
                    {(r.username ?? "").toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.phone ?? "—"}</td>
                <td className="px-4 py-3">{realEmail(r.email) ?? "—"}</td>
                <td className="px-4 py-3">
                  {r.banned ? <Badge tone="red">Идэвхгүй</Badge> : <Badge tone="green">Идэвхтэй</Badge>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  {query ? "Илэрц олдсонгүй" : "Одоогоор уншигч бүртгээгүй байна"}
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
