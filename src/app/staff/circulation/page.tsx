import Link from "next/link";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { containsPattern } from "@/lib/catalog";
import { activeLoansOf, getSettings, unpaidFineTotal } from "@/lib/circulation";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { LoansTable } from "../loans/loans-table";
import { LendForm, ReturnForm } from "./forms";

const inputClass =
  "h-10 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm";

export default async function CirculationPage({ searchParams }: { searchParams: Promise<{ reader?: string }> }) {
  await requireRole("admin", "librarian");
  const query = ((await searchParams).reader ?? "").trim();

  return (
    <>
      <PageHeader title="Олголт / буцаалт" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold">Ном олгох</h2>
          <form className="flex gap-2" role="search">
            <input
              name="reader"
              defaultValue={query}
              placeholder="Картын дугаар, нэр эсвэл утас"
              aria-label="Уншигч хайх"
              autoFocus={!query}
              autoComplete="off"
              className={inputClass}
            />
            <button
              type="submit"
              className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Хайх
            </button>
          </form>
          {query && <ReaderLookup query={query} />}
        </Card>

        <Card className="flex flex-col gap-4 self-start">
          <h2 className="font-semibold">Ном буцаах</h2>
          <ReturnForm />
        </Card>
      </div>
    </>
  );
}

async function ReaderLookup({ query }: { query: string }) {
  // Эхлээд картын дугаараар яг таарахыг, олдохгүй бол нэр/утсаар хайна
  const [exact] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "reader"), eq(user.username, query.toLowerCase())))
    .limit(1);
  if (exact) return <ReaderPanel readerId={exact.id} />;

  const pattern = containsPattern(query);
  const matches = await db
    .select({ id: user.id, name: user.name, username: user.username, phone: user.phone })
    .from(user)
    .where(and(eq(user.role, "reader"), or(ilike(user.name, pattern), ilike(user.phone, pattern), ilike(user.username, pattern))))
    .limit(10);

  if (matches.length === 1) return <ReaderPanel readerId={matches[0].id} />;
  if (matches.length === 0) return <Notice tone="error">Уншигч олдсонгүй</Notice>;
  return (
    <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/staff/circulation?reader=${encodeURIComponent(m.username ?? "")}`}
            className="flex justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <span>{m.name}</span>
            <span className="font-mono text-zinc-500">{(m.username ?? "").toUpperCase()}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function ReaderPanel({ readerId }: { readerId: string }) {
  const [[reader], loans, unpaid, rules] = await Promise.all([
    db
      .select({ id: user.id, name: user.name, username: user.username, phone: user.phone, banned: user.banned })
      .from(user)
      .where(eq(user.id, readerId)),
    activeLoansOf(readerId),
    unpaidFineTotal(readerId),
    getSettings(),
  ]);
  const overdue = loans.filter((l) => l.daysOverdue > 0).length;
  const blockedByFine = unpaid > 0 && unpaid >= rules.maxUnpaidFine;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
        <div>
          <Link href={`/staff/readers/${reader.id}`} className="text-lg font-semibold hover:underline">
            {reader.name}
          </Link>
          <p className="font-mono text-sm text-zinc-500">
            {(reader.username ?? "").toUpperCase()}
            {reader.phone && <span className="ml-3 font-sans">{reader.phone}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reader.banned && <Badge tone="red">Идэвхгүй</Badge>}
          <Badge tone={loans.length >= rules.maxActiveLoans ? "red" : "gray"}>
            {loans.length} / {rules.maxActiveLoans} ном
          </Badge>
          {overdue > 0 && <Badge tone="red">{overdue} хэтэрсэн</Badge>}
          {unpaid > 0 && <Badge tone={blockedByFine ? "red" : "gray"}>Торгууль {formatMoney(unpaid)}</Badge>}
        </div>
      </div>

      <LendForm readerId={reader.id} />

      {loans.length > 0 && (
        <div className="-mx-5">
          <LoansTable rows={loans} showReader={false} empty="" />
        </div>
      )}
    </div>
  );
}
