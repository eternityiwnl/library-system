import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, loans, reminderLog, user } from "@/db/schema";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { reminderConfig } from "@/lib/reminders";
import { requireRole } from "@/lib/session";
import { SendRemindersButton } from "./send-button";

export default async function RemindersPage() {
  await requireRole("admin");
  const config = reminderConfig();
  const log = await db
    .select({
      id: reminderLog.id,
      kind: reminderLog.kind,
      sentOn: reminderLog.sentOn,
      recipient: reminderLog.recipient,
      error: reminderLog.error,
      createdAt: reminderLog.createdAt,
      reader: user.name,
      title: books.title,
    })
    .from(reminderLog)
    .innerJoin(loans, eq(loans.id, reminderLog.loanId))
    .innerJoin(user, eq(user.id, loans.readerId))
    .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
    .innerJoin(books, eq(books.id, bookCopies.bookId))
    .orderBy(desc(reminderLog.createdAt))
    .limit(100);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader title="Имэйл сануулга" actions={<SendRemindersButton disabled={!config.apiKey} />} />

      <Card className="flex flex-col gap-3 text-sm">
        <p>
          Өдөр бүр Улаанбаатарын цагаар <strong>09:00</strong>-д автоматаар илгээнэ: маргааш буцаах номтой, мөн хугацаа
          хэтэрсэн (1 дэх өдөр, дараа нь 7 хоног тутам) уншигчдад. Имэйлгүй уншигчдыг алгасна.
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt className="text-zinc-500">Resend</dt>
          <dd>{config.apiKey ? <Badge tone="green">Холбогдсон</Badge> : <Badge tone="red">RESEND_API_KEY алга</Badge>}</dd>
          <dt className="text-zinc-500">Илгээгч</dt>
          <dd>{config.from}</dd>
          <dt className="text-zinc-500">Горим</dt>
          <dd>
            {config.redirectTo ? (
              <>
                Демо — бүх имэйл <strong>{config.redirectTo}</strong> руу очно
              </>
            ) : (
              "Уншигчдын жинхэнэ хаяг руу"
            )}
          </dd>
        </dl>
        {!config.apiKey && (
          <Notice tone="warning">
            Vercel-ийн Environment Variables хэсэгт RESEND_API_KEY болон EMAIL_REDIRECT_TO-г нэмсний дараа идэвхжинэ.
          </Notice>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <h2 className="px-5 pt-5 pb-3 font-semibold">Илгээсэн түүх</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-y border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Огноо</th>
              <th className="px-4 py-3 font-medium">Уншигч</th>
              <th className="px-4 py-3 font-medium">Ном</th>
              <th className="px-4 py-3 font-medium">Төрөл</th>
              <th className="px-4 py-3 font-medium">Хаяг</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {log.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500" title={formatDateTime(r.createdAt)}>
                  {formatDate(r.sentOn)}
                </td>
                <td className="px-4 py-2.5">{r.reader}</td>
                <td className="px-4 py-2.5">{r.title}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {r.kind === "overdue" ? <Badge tone="red">Хэтэрсэн</Badge> : <Badge tone="gray">Маргааш дуусна</Badge>}
                </td>
                <td className="px-4 py-2.5">
                  {r.recipient}
                  {r.error && <p className="mt-1 text-xs text-red-600">{r.error}</p>}
                </td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  Одоогоор илгээгээгүй
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
