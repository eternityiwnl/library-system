import Link from "next/link";
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, loans, user } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { containsPattern } from "@/lib/catalog";
import { normalizeInventoryNumber, selectLoans, TODAY } from "@/lib/circulation";
import { normalizePhone } from "@/lib/phone";
import { requireRole } from "@/lib/session";
import { LoansTable } from "./loans-table";

const PAGE_SIZE = 30;

const TABS = {
  active: { label: "Идэвхтэй", where: isNull(loans.returnedAt) },
  overdue: { label: "Хугацаа хэтэрсэн", where: and(isNull(loans.returnedAt), lt(loans.dueDate, TODAY)) },
  returned: { label: "Буцаасан", where: isNotNull(loans.returnedAt) },
  all: { label: "Бүгд", where: undefined },
} as const;
type Tab = keyof typeof TABS;

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireRole("admin", "librarian");
  const params = await searchParams;
  const tab: Tab = params.status && params.status in TABS ? (params.status as Tab) : "active";
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const pattern = containsPattern(query);
  const where = and(
    TABS[tab].where,
    query
      ? or(
          ilike(books.title, pattern),
          ilike(user.name, pattern),
          eq(user.phone, normalizePhone(query) ?? query),
          eq(bookCopies.inventoryNumber, normalizeInventoryNumber(query)),
        )
      : undefined,
  );

  // Идэвхтэй/хэтэрсэн: хамгийн яаралтай нь эхэнд; буцаасан/бүгд: сүүлийнх нь эхэнд
  const order = tab === "active" || tab === "overdue" ? asc(loans.dueDate) : desc(loans.issuedAt);
  const [rows, [{ total }]] = await Promise.all([
    selectLoans()
      .where(where)
      .orderBy(order, desc(loans.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(loans)
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .innerJoin(books, eq(books.id, bookCopies.bookId))
      .innerJoin(user, eq(user.id, loans.readerId))
      .where(where),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (next: { status?: Tab; page?: number }) =>
    `/staff/loans?${new URLSearchParams({
      status: next.status ?? tab,
      ...(query && { q: query }),
      ...(next.page && next.page > 1 && { page: String(next.page) }),
    })}`;

  return (
    <>
      <PageHeader title="Зээлүүд" />

      <nav className="mb-4 flex flex-wrap gap-1 text-sm" aria-label="Шүүлтүүр">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <Link
            key={key}
            href={href({ status: key })}
            aria-current={key === tab ? "page" : undefined}
            className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:aria-[current=page]:bg-zinc-100 dark:aria-[current=page]:text-zinc-900"
          >
            {TABS[key].label}
          </Link>
        ))}
      </nav>

      <form className="mb-4 flex gap-2" role="search">
        <input type="hidden" name="status" value={tab} />
        <input
          name="q"
          defaultValue={query}
          placeholder="Ном, уншигч, утас, бүртгэлийн №"
          aria-label="Зээл хайх"
          className="h-10 w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Хайх
        </button>
      </form>

      <Card className="p-0">
        <LoansTable rows={rows} empty={query ? "Илэрц олдсонгүй" : "Зээл алга"} />
      </Card>

      {pages > 1 && (
        <nav className="mt-4 flex items-center gap-3 text-sm" aria-label="Хуудаслалт">
          {page > 1 && <Link href={href({ page: page - 1 })} className="hover:underline">← Өмнөх</Link>}
          <span className="text-zinc-500">
            {page} / {pages} хуудас · нийт {total}
          </span>
          {page < pages && <Link href={href({ page: page + 1 })} className="hover:underline">Дараах →</Link>}
        </nav>
      )}
    </>
  );
}
