import Link from "next/link";
import { and, asc, count, eq, isNull, lt, sql } from "drizzle-orm";
import { AlarmClock, ArrowLeftRight, ArrowRight, BookCopy, BookMarked, Library, Receipt, Users } from "lucide-react";
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
    { label: "Зээлэгдсэн ном", value: active.n.toLocaleString("mn-MN"), href: "/staff/loans", icon: BookMarked },
    { label: "Хугацаа хэтэрсэн", value: overdue.n.toLocaleString("mn-MN"), href: "/staff/loans?status=overdue", alert: overdue.n > 0, icon: AlarmClock },
    { label: "Төлөгдөөгүй торгууль", value: formatMoney(unpaid.n), href: "/staff/fines", alert: unpaid.n > 0, icon: Receipt },
    { label: "Уншигч", value: readers.n.toLocaleString("mn-MN"), href: "/staff/readers", icon: Users },
    { label: "Номын нэр", value: titles.n.toLocaleString("mn-MN"), href: "/staff/books", icon: Library },
    { label: "Номын хувь", value: copies.n.toLocaleString("mn-MN"), href: "/staff/books", icon: BookCopy },
  ];

  return (
    <>
      <PageHeader
        title="Хяналтын самбар"
        actions={
          <LinkButton href="/staff/circulation">
            <ArrowLeftRight aria-hidden /> Олголт / буцаалт
          </LinkButton>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="relative h-full overflow-hidden transition group-hover:-translate-y-0.5 group-hover:border-zinc-300 group-hover:shadow-raised dark:group-hover:border-zinc-700">
              {s.alert && <span className="absolute inset-x-0 top-0 h-1 bg-red-500" aria-hidden />}
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-zinc-500">{s.label}</p>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                    s.alert
                      ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  }`}
                >
                  <s.icon className="size-[18px]" aria-hidden />
                </span>
              </div>
              <p
                className={`mt-2 font-serif text-3xl font-semibold tabular-nums sm:text-4xl ${s.alert ? "text-red-600 dark:text-red-400" : ""}`}
              >
                {s.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {overdueRows.length > 0 && (
        <Card className="mt-8 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 pt-5 pb-4">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <AlarmClock className="size-5 text-red-600 dark:text-red-400" aria-hidden />
              Хугацаа хамгийн их хэтэрсэн
            </h2>
            <Link
              href="/staff/loans?status=overdue"
              className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Бүгдийг харах <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <LoansTable rows={overdueRows} empty="" />
        </Card>
      )}
    </>
  );
}
