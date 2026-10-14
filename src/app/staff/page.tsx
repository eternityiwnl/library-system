import Link from "next/link";
import { and, asc, count, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, fines, loans, user } from "@/db/schema";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { selectLoans, TODAY } from "@/lib/circulation";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { LoansTable } from "./loans/loans-table";

export default async function StaffDashboard() {
  await requireRole("admin", "librarian");

  const overdueWhere = and(isNull(loans.returnedAt), lt(loans.dueDate, TODAY));
  const [[readers], [titles], [copies], [active], [overdue], [unpaid], overdueRows] = await Promise.all([
    db.select({ n: count() }).from(user).where(eq(user.role, "reader")),
    db.select({ n: count() }).from(books),
    db.select({ n: count() }).from(bookCopies),
    db.select({ n: count() }).from(loans).where(isNull(loans.returnedAt)),
    db.select({ n: count() }).from(loans).where(overdueWhere),
    db
      .select({ n: sql<number>`coalesce(sum(${fines.amount}), 0)`.mapWith(Number) })
      .from(fines)
      .where(eq(fines.status, "unpaid")),
    selectLoans().where(overdueWhere).orderBy(asc(loans.dueDate)).limit(5),
  ]);

  const stats = [
    { label: "Зээлэгдсэн ном", value: active.n.toLocaleString("mn-MN"), href: "/staff/loans" },
    { label: "Хугацаа хэтэрсэн", value: overdue.n.toLocaleString("mn-MN"), href: "/staff/loans?status=overdue", alert: overdue.n > 0 },
    { label: "Төлөгдөөгүй торгууль", value: formatMoney(unpaid.n), href: "/staff/fines", alert: unpaid.n > 0 },
    { label: "Уншигч", value: readers.n.toLocaleString("mn-MN"), href: "/staff/readers" },
    { label: "Номын нэр", value: titles.n.toLocaleString("mn-MN"), href: "/staff/books" },
    { label: "Номын хувь", value: copies.n.toLocaleString("mn-MN"), href: "/staff/books" },
  ];

  return (
    <>
      <PageHeader title="Хяналтын самбар" actions={<LinkButton href="/staff/circulation">Олголт / буцаалт</LinkButton>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="h-full transition-colors group-hover:border-zinc-300 dark:group-hover:border-zinc-700">
              <p className="text-sm text-zinc-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums sm:text-3xl ${s.alert ? "text-red-600 dark:text-red-400" : ""}`}>
                {s.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {overdueRows.length > 0 && (
        <Card className="mt-6 p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-semibold">Хугацаа хамгийн их хэтэрсэн</h2>
            <Link href="/staff/loans?status=overdue" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
              Бүгдийг харах
            </Link>
          </div>
          <LoansTable rows={overdueRows} empty="" />
        </Card>
      )}
    </>
  );
}
