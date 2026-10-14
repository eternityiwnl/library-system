import Link from "next/link";
import { alias } from "drizzle-orm/pg-core";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, fines, loans, user } from "@/db/schema";
import { Badge, Card, PageHeader } from "@/components/ui";
import { containsPattern } from "@/lib/catalog";
import { formatDate, formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { FineActions } from "./fine-actions";

const PAGE_SIZE = 30;
const TABS = {
  unpaid: "Төлөгдөөгүй",
  paid: "Төлсөн",
  waived: "Чөлөөлсөн",
  all: "Бүгд",
} as const;
type Tab = keyof typeof TABS;

export default async function FinesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const me = await requireRole("admin", "librarian");
  const params = await searchParams;
  const tab: Tab = params.status && params.status in TABS ? (params.status as Tab) : "unpaid";
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const reader = alias(user, "reader");
  const resolver = alias(user, "resolver");
  const pattern = containsPattern(query);
  const where = and(
    tab === "all" ? undefined : eq(fines.status, tab),
    query
      ? or(ilike(reader.name, pattern), eq(reader.username, query.toLowerCase()), ilike(books.title, pattern))
      : undefined,
  );
  const [rows, [{ total, sum }]] = await Promise.all([
    db
      .select({
        id: fines.id,
        amount: fines.amount,
        daysLate: fines.daysLate,
        status: fines.status,
        createdAt: fines.createdAt,
        resolvedAt: fines.resolvedAt,
        resolverName: resolver.name,
        readerId: reader.id,
        readerName: reader.name,
        cardNumber: reader.username,
        title: books.title,
      })
      .from(fines)
      .innerJoin(reader, eq(reader.id, fines.readerId))
      .innerJoin(loans, eq(loans.id, fines.loanId))
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .innerJoin(books, eq(books.id, bookCopies.bookId))
      .leftJoin(resolver, eq(resolver.id, fines.resolvedBy))
      .where(where)
      .orderBy(desc(fines.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: count(), sum: sql<number>`coalesce(sum(${fines.amount}), 0)`.mapWith(Number) })
      .from(fines)
      .innerJoin(reader, eq(reader.id, fines.readerId))
      .innerJoin(loans, eq(loans.id, fines.loanId))
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .innerJoin(books, eq(books.id, bookCopies.bookId))
      .where(where),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (next: { status?: Tab; page?: number }) =>
    `/staff/fines?${new URLSearchParams({
      status: next.status ?? tab,
      ...(query && { q: query }),
      ...(next.page && next.page > 1 && { page: String(next.page) }),
    })}`;

  return (
    <>
      <PageHeader title="Торгууль" />

      <nav className="mb-4 flex flex-wrap gap-1 text-sm" aria-label="Шүүлтүүр">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <Link
            key={key}
            href={href({ status: key })}
            aria-current={key === tab ? "page" : undefined}
            className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:aria-[current=page]:bg-zinc-100 dark:aria-[current=page]:text-zinc-900"
          >
            {TABS[key]}
          </Link>
        ))}
      </nav>

      <form className="mb-4 flex gap-2" role="search">
        <input type="hidden" name="status" value={tab} />
        <input
          name="q"
          defaultValue={query}
          placeholder="Уншигчийн нэр, картын дугаар, ном"
          aria-label="Торгууль хайх"
          className="h-10 w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Хайх
        </button>
      </form>

      <p className="mb-3 text-sm text-zinc-500">
        {total} торгууль · нийт <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatMoney(sum)}</span>
      </p>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Уншигч</th>
              <th className="px-4 py-3 font-medium">Ном</th>
              <th className="px-4 py-3 text-right font-medium">Хоцорсон</th>
              <th className="px-4 py-3 text-right font-medium">Дүн</th>
              <th className="px-4 py-3 font-medium">Огноо</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((f) => (
              <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <Link href={`/staff/readers/${f.readerId}`} className="hover:underline">
                    {f.readerName}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-zinc-500">{(f.cardNumber ?? "").toUpperCase()}</span>
                </td>
                <td className="px-4 py-3">{f.title}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{f.daysLate} хоног</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">{formatMoney(f.amount)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(f.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {f.status === "unpaid" ? (
                    <Badge tone="red">Төлөгдөөгүй</Badge>
                  ) : (
                    <span title={f.resolverName ? `Бүртгэсэн: ${f.resolverName}` : undefined}>
                      <Badge tone={f.status === "paid" ? "green" : "gray"}>{f.status === "paid" ? "Төлсөн" : "Чөлөөлсөн"}</Badge>
                      <span className="ml-2 text-xs text-zinc-500">{formatDate(f.resolvedAt)}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {f.status === "unpaid" && <FineActions fineId={f.id} amount={f.amount} canWaive={me.role === "admin"} />}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  {query ? "Илэрц олдсонгүй" : "Торгууль алга"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {pages > 1 && (
        <nav className="mt-4 flex items-center gap-3 text-sm" aria-label="Хуудаслалт">
          {page > 1 && <Link href={href({ page: page - 1 })} className="hover:underline">← Өмнөх</Link>}
          <span className="text-zinc-500">
            {page} / {pages} хуудас
          </span>
          {page < pages && <Link href={href({ page: page + 1 })} className="hover:underline">Дараах →</Link>}
        </nav>
      )}
    </>
  );
}
