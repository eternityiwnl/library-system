import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { BookOpen, CalendarClock, CircleCheck, KeyRound, Phone } from "lucide-react";
import { db } from "@/db";
import { bookCopies, books, fines, loans } from "@/db/schema";
import { Badge, Card, Notice } from "@/components/ui";
import { activeLoansOf, getSettings, selectLoans } from "@/lib/circulation";
import { formatDate, formatMoney } from "@/lib/format";
import { BookCover } from "@/components/book-cover";
import { formatPhone } from "@/lib/phone";
import { requireRole } from "@/lib/session";
import { RenewButton } from "./renew-button";

export const metadata: Metadata = { title: "Миний ном — Хүрээ Номын сан" };

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
    <div className="flex flex-col gap-9">
      <div className="relative overflow-hidden rounded-2xl bg-forest-900 p-6 text-forest-200 shadow-raised sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,rgb(212_169_90/0.18),transparent_60%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brass-500/20 font-serif text-2xl font-semibold text-brass-400 ring-1 ring-brass-400/30">
            {reader.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl leading-tight font-semibold tracking-tight text-white sm:text-3xl">
              Сайн байна уу, {reader.name}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-forest-300">
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" aria-hidden />
                <span className="text-white tabular-nums">{formatPhone(reader.phone)}</span>
              </span>
              <Link href="/password" className="flex items-center gap-1.5 transition-colors hover:text-white">
                <KeyRound className="size-3.5" aria-hidden /> Нууц үг солих
              </Link>
            </p>
          </div>
          <div className="w-full sm:w-auto sm:text-right">
            <p className="font-serif text-3xl font-semibold text-white tabular-nums">
              {current.length}
              <span className="text-lg text-forest-300"> / {rules.maxActiveLoans}</span>
            </p>
            <div className="mt-2 flex gap-1 sm:justify-end" aria-hidden>
              {Array.from({ length: rules.maxActiveLoans }, (_, i) => (
                <span key={i} className={`h-1.5 w-6 rounded-full ${i < current.length ? "bg-brass-400" : "bg-white/15"}`} />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-forest-300">зээлсэн ном</p>
          </div>
        </div>
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
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <h2 className="font-serif text-xl font-semibold">Зээлж буй ном</h2>
          {canBorrow && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
              <CircleCheck className="size-4" aria-hidden /> Дахин зээлэх боломжтой
            </p>
          )}
        </div>
        {current.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700">
            <BookOpen className="size-8 text-zinc-400" aria-hidden />
            <p>Одоогоор зээлсэн ном алга.</p>
            <Link href="/catalog" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Ном хайх
            </Link>
          </div>
        ) : (
          current.map((loan) => {
            const renewalsLeft = rules.maxRenewals - loan.renewalCount;
            return (
              <Card
                key={loan.id}
                className={`flex items-center gap-4 ${loan.daysOverdue > 0 ? "border-l-4 border-l-red-500" : ""}`}
              >
                <Link href={`/catalog/${loan.bookId}`} tabIndex={-1} aria-hidden className="shrink-0">
                  <BookCover book={{ id: loan.bookId, title: loan.title, author: loan.author, coverVersion: loan.coverVersion }} size="sm" className="w-14 sm:w-16" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/catalog/${loan.bookId}`} className="font-serif text-lg leading-snug font-semibold hover:underline">
                    {loan.title}
                  </Link>
                  <p className="text-sm text-zinc-500">{loan.author}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <CalendarClock className="size-4" aria-hidden />
                    Буцаах: <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(loan.dueDate)}</span>
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
          <h2 className="border-b border-zinc-200 pb-3 font-serif text-xl font-semibold dark:border-zinc-800">Төлөгдөөгүй торгууль</h2>
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
          <h2 className="border-b border-zinc-200 pb-3 font-serif text-xl font-semibold dark:border-zinc-800">Өмнө зээлсэн</h2>
          <Card className="p-0">
            <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-5 py-2.5">
                  <BookCover book={{ id: h.bookId, title: h.title, coverVersion: h.coverVersion }} size="xs" className="w-7" />
                  <Link href={`/catalog/${h.bookId}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                    {h.title}
                  </Link>
                  <span className="shrink-0 text-zinc-500 tabular-nums">
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
