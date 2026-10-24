import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { LoanActions } from "../circulation/forms";

export type LoanRow = {
  id: number;
  title: string;
  bookId: number;
  inventoryNumber: string;
  readerId?: string;
  readerName?: string;
  readerPhone?: string | null;
  issuedAt: Date;
  dueDate: string;
  returnedAt?: Date | null;
  renewalCount: number;
  daysOverdue: number;
};

export function DueBadge({ loan }: { loan: Pick<LoanRow, "dueDate" | "returnedAt" | "daysOverdue"> }) {
  if (loan.returnedAt) return <span>{formatDate(loan.dueDate)}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 whitespace-nowrap">
      {formatDate(loan.dueDate)}
      {loan.daysOverdue > 0 && <Badge tone="red">{loan.daysOverdue} хоног хэтэрсэн</Badge>}
    </span>
  );
}

/** Зээлийн хүснэгт — самбар, уншигчийн хуудас, зээлийн жагсаалтад нэг загвараар */
export function LoansTable({
  rows,
  showReader = true,
  empty,
}: {
  rows: LoanRow[];
  showReader?: boolean;
  empty: string;
}) {
  const hasReturned = rows.some((r) => r.returnedAt);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-3 font-medium">Ном</th>
            <th className="px-4 py-3 font-medium">Бүртгэлийн №</th>
            {showReader && <th className="px-4 py-3 font-medium">Уншигч</th>}
            <th className="px-4 py-3 font-medium">Олгосон</th>
            <th className="px-4 py-3 font-medium">Буцаах</th>
            {hasReturned && <th className="px-4 py-3 font-medium">Буцаасан</th>}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="min-w-32 px-4 py-3">
                <Link href={`/staff/books/${r.bookId}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                  {r.title}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">{r.inventoryNumber}</td>
              {showReader && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/staff/readers/${r.readerId}`} className="hover:underline">
                    {r.readerName}
                  </Link>
                  {r.readerPhone && <span className="block text-xs text-zinc-500 tabular-nums">{formatPhone(r.readerPhone)}</span>}
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.issuedAt)}</td>
              <td className="px-4 py-3">
                <DueBadge loan={r} />
                {r.renewalCount > 0 && <span className="block text-xs text-zinc-500">{r.renewalCount} удаа сунгасан</span>}
              </td>
              {hasReturned && <td className="px-4 py-3 whitespace-nowrap">{r.returnedAt ? formatDate(r.returnedAt) : "—"}</td>}
              <td className="px-4 py-3">
                {!r.returnedAt && <LoanActions loanId={r.id} inventoryNumber={r.inventoryNumber} />}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
