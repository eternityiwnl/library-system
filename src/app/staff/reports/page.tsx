import Link from "next/link";
import { and, count, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, categories, fines, loans, user } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { TODAY } from "@/lib/circulation";
import { formatMoney } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { requireRole } from "@/lib/session";
import { MonthlyColumns, RankedBars } from "./charts";

const RANGES = { "30": "30 хоног", "90": "3 сар", "365": "1 жил", all: "Бүх хугацаа" } as const;
type Range = keyof typeof RANGES;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole("admin", "librarian");
  const param = (await searchParams).range;
  const range: Range = param && param in RANGES ? (param as Range) : "30";
  // Хугацааны эхлэл (Улаанбаатарын өдрөөр)
  const since = range === "all" ? null : sql`(${TODAY} - ${Number(range)}::integer)::timestamp AT TIME ZONE 'Asia/Ulaanbaatar'`;
  const issuedInRange = since ? gte(loans.issuedAt, since) : undefined;

  const [[issued], [returned], [overdueNow], [newReaders], [assessed], [collected], monthly, topBooks, topReaders, byCategory] =
    await Promise.all([
      db.select({ n: count() }).from(loans).where(issuedInRange),
      db.select({ n: count() }).from(loans).where(since ? gte(loans.returnedAt, since) : sql`${loans.returnedAt} is not null`),
      db.select({ n: count() }).from(loans).where(and(isNull(loans.returnedAt), lt(loans.dueDate, TODAY))),
      db
        .select({ n: count() })
        .from(user)
        .where(and(eq(user.role, "reader"), since ? gte(user.createdAt, since) : undefined)),
      db
        .select({ n: sql<number>`coalesce(sum(${fines.amount}), 0)`.mapWith(Number) })
        .from(fines)
        .where(since ? gte(fines.createdAt, since) : undefined),
      db
        .select({ n: sql<number>`coalesce(sum(${fines.amount}), 0)`.mapWith(Number) })
        .from(fines)
        .where(and(eq(fines.status, "paid"), since ? gte(fines.resolvedAt, since) : undefined)),
      // Сүүлийн 12 сар, хоосон сар ч 0-ээр гарна
      db.execute<{ month: string; n: number }>(sql`
        select to_char(m, 'YYYY-MM') as month, count(${loans.id})::int as n
        from generate_series(
          date_trunc('month', ${TODAY}::timestamp) - interval '11 months',
          date_trunc('month', ${TODAY}::timestamp),
          interval '1 month'
        ) as m
        left join ${loans}
          on date_trunc('month', ${loans.issuedAt} at time zone 'Asia/Ulaanbaatar') = m
        group by m order by m`),
      db
        .select({ id: books.id, title: books.title, author: books.author, n: count() })
        .from(loans)
        .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
        .innerJoin(books, eq(books.id, bookCopies.bookId))
        .where(issuedInRange)
        .groupBy(books.id)
        .orderBy(desc(count()), books.title)
        .limit(10),
      db
        .select({ id: user.id, name: user.name, phone: user.phone, n: count() })
        .from(loans)
        .innerJoin(user, eq(user.id, loans.readerId))
        .where(issuedInRange)
        .groupBy(user.id)
        .orderBy(desc(count()), user.name)
        .limit(10),
      db
        .select({ name: categories.name, n: count() })
        .from(loans)
        .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
        .innerJoin(books, eq(books.id, bookCopies.bookId))
        .innerJoin(categories, eq(categories.id, books.categoryId))
        .where(issuedInRange)
        .groupBy(categories.id)
        .orderBy(desc(count())),
    ]);

  const tiles = [
    { label: "Олгосон ном", value: issued.n.toLocaleString("mn-MN") },
    { label: "Буцаасан ном", value: returned.n.toLocaleString("mn-MN") },
    { label: "Одоо хугацаа хэтэрсэн", value: overdueNow.n.toLocaleString("mn-MN"), note: "өнөөдрийн байдлаар" },
    { label: "Шинэ уншигч", value: newReaders.n.toLocaleString("mn-MN") },
    { label: "Ногдуулсан торгууль", value: formatMoney(assessed.n) },
    { label: "Төлөгдсөн торгууль", value: formatMoney(collected.n) },
  ];

  return (
    <>
      <PageHeader title="Тайлан" />

      <nav className="mb-6 flex flex-wrap gap-1 text-sm" aria-label="Хугацаа">
        {(Object.keys(RANGES) as Range[]).map((key) => (
          <Link
            key={key}
            href={`/staff/reports?range=${key}`}
            aria-current={key === range ? "page" : undefined}
            className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:aria-[current=page]:bg-zinc-100 dark:aria-[current=page]:text-zinc-900"
          >
            {RANGES[key]}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="text-sm text-zinc-500">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold sm:text-3xl">{t.value}</p>
            {t.note && <p className="mt-1 text-xs text-zinc-500">{t.note}</p>}
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold">Сар бүрийн олголт</h2>
        <p className="mb-4 text-sm text-zinc-500">Сүүлийн 12 сар</p>
        <MonthlyColumns data={monthly.rows.map((r) => ({ label: r.month, value: Number(r.n) }))} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Их зээлсэн ном</h2>
          <RankedBars rows={topBooks.map((b) => ({ label: b.title, sublabel: b.author, value: b.n }))} unit="удаа" />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Идэвхтэй уншигч</h2>
          <RankedBars
            rows={topReaders.map((r) => ({ label: r.name, sublabel: formatPhone(r.phone), value: r.n }))}
            unit="ном"
          />
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Ангиллаар</h2>
        <RankedBars rows={byCategory.map((c) => ({ label: c.name, value: c.n }))} unit="олголт" />
      </Card>
    </>
  );
}
