import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, fines, loans } from "@/db/schema";
import { Badge, Card, Notice } from "@/components/ui";
import { activeLoansOf, getSettings, selectLoans } from "@/lib/circulation";
import { formatDate, formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { RenewButton } from "./renew-button";

export const metadata: Metadata = { title: "Миний ном — Номын сан" };

export default async function ReaderHome() {
  const reader = await requireRole("reader");

  const [current, history, unpaidFines, rules] = await Promise.all([
    activeLoansOf(reader.id),
    selectLoans()
      .where(and(eq(loans.readerId, reader.id), isNotNull(loans.returnedAt)))
      .orderBy(desc(loans.returnedAt))
      .limit(20),
    db
      .select({ id: fines.id, amount: fines.amount, daysLate: fines.daysLate, createdAt: fines.createdAt, title: books.title })
      .from(fines)
      .innerJoin(loans, eq(loans.id, fines.loanId))
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .innerJoin(books, eq(books.id, bookCopies.bookId))
      .where(and(eq(fines.readerId, reader.id), eq(fines.status, "unpaid")))
      .orderBy(desc(fines.createdAt)),
    getSettings(),
  ]);

  const overdue = current.filter((l) => l.daysOverdue > 0);
  const unpaidTotal = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
  const canBorrow = current.length < rules.maxActiveLoans && overdue.length === 0 && !(unpaidTotal > 0 && unpaidTotal >= rules.maxUnpaidFine);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Сайн байна уу, {reader.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Картын дугаар <span className="font-mono text-zinc-900 dark:text-zinc-100">{(reader.username ?? "").toUpperCase()}</span>
          {" · "}
          <Link href="/password" className="hover:underline">
            Нууц үг солих
          </Link>
        </p>
      </div>

      {overdue.length > 0 && (
        <Notice tone="error">
          {overdue.length} номын хугацаа хэтэрсэн байна. Аль болох хурдан буцааж өгнө үү — хоног тутам{" "}
          {formatMoney(rules.finePerDay)} торгууль бодогдоно.
        </Notice>
      )}
      {unpaidTotal > 0 && (
        <Notice tone="warning">
          Төлөгдөөгүй торгууль: <strong>{formatMoney(unpaidTotal)}</strong>. Номын санд төлнө үү.
        </Notice>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Зээлж буй ном</h2>
          <p className="text-sm text-zinc-500">
            {current.length} / {rules.maxActiveLoans}
            {canBorrow ? " · дахин зээлэх боломжтой" : ""}
          </p>
        </div>
        {current.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-500">
              Одоогоор зээлсэн ном алга.{" "}
              <Link href="/catalog" className="text-emerald-700 hover:underline dark:text-emerald-400">
                Ном хайх
              </Link>
            </p>
          </Card>
        ) : (
          current.map((loan) => {
            const renewalsLeft = rules.maxRenewals - loan.renewalCount;
            return (
              <Card key={loan.id} className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/catalog/${loan.bookId}`} className="font-medium hover:underline">
                    {loan.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    Буцаах: <span className="text-zinc-900 dark:text-zinc-100">{formatDate(loan.dueDate)}</span>
                    {loan.daysOverdue > 0 && <Badge tone="red">{loan.daysOverdue} хоног хэтэрсэн</Badge>}
                    {loan.renewalCount > 0 && <span>· {loan.renewalCount} удаа сунгасан</span>}
                  </p>
                </div>
                {loan.daysOverdue === 0 && renewalsLeft > 0 && <RenewButton loanId={loan.id} />}
              </Card>
            );
          })
        )}
        <p className="text-xs text-zinc-500">
          Зээлийн хугацаа {rules.loanPeriodDays} хоног.{" "}
          {rules.maxRenewals > 0
            ? `Хугацаа хэтрээгүй бол ${rules.maxRenewals} удаа, ${rules.renewalDays} хоногоор сунгаж болно.`
            : "Сунгалт хийх боломжгүй."}
        </p>
      </section>

      {unpaidFines.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Төлөгдөөгүй торгууль</h2>
          <Card className="p-0">
            <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
              {unpaidFines.map((f) => (
                <li key={f.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                  <span>
                    {f.title} <span className="text-zinc-500">· {f.daysLate} хоног хоцорсон · {formatDate(f.createdAt)}</span>
                  </span>
                  <span className="font-medium tabular-nums">{formatMoney(f.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Өмнө зээлсэн</h2>
          <Card className="p-0">
            <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                  <Link href={`/catalog/${h.bookId}`} className="hover:underline">
                    {h.title}
                  </Link>
                  <span className="text-zinc-500">
                    {formatDate(h.issuedAt)} – {formatDate(h.returnedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
