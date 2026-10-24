import "server-only";
import { and, eq, inArray, isNotNull, isNull, notLike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, loans, reminderLog, user } from "@/db/schema";
import { audit, type Actor } from "./audit";
import { TODAY } from "./circulation";
import { formatDate } from "./format";

/**
 * Тохиргоо (орчны хувьсагч):
 *   RESEND_API_KEY     — Resend-ийн түлхүүр (заавал)
 *   EMAIL_FROM         — илгээгч. Өөрийн домэйнгүй бол onboarding@resend.dev
 *   EMAIL_REDIRECT_TO  — демо горим: бүх имэйл энэ хаяг руу очно. Resend өөрийн домэйнгүйд
 *                        зөвхөн бүртгэлтэй хаяг руу илгээдэг тул тэр хаягийг энд тавина.
 */
export function reminderConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM || "Хүрээ Номын сан <onboarding@resend.dev>",
    redirectTo: process.env.EMAIL_REDIRECT_TO || null,
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Item = { loanId: number; title: string; dueDate: string; daysOverdue: number };

function composeEmail(name: string, items: Item[], catalogUrl: string) {
  const overdue = items.filter((i) => i.daysOverdue > 0);
  const subject =
    overdue.length > 0 ? `Номын хугацаа хэтэрсэн байна (${overdue.length})` : "Номын буцаах хугацаа маргааш дуусна";
  const lines = items.map((i) =>
    i.daysOverdue > 0
      ? `«${i.title}» — ${formatDate(i.dueDate)}-нд буцаах байсан, ${i.daysOverdue} хоног хэтэрсэн`
      : `«${i.title}» — маргааш (${formatDate(i.dueDate)}) буцаана`,
  );
  const text = [
    `Сайн байна уу, ${name}!`,
    "",
    ...lines.map((l) => `• ${l}`),
    "",
    overdue.length > 0
      ? "Хугацаа хэтэрсэн хоног тутамд торгууль бодогдоно. Аль болох хурдан буцааж өгнө үү."
      : "Хэрэв дуусгаж амжаагүй бол хугацаагаа сунгах боломжтой.",
    `Зээлсэн номоо эндээс харна уу: ${catalogUrl}/me`,
    "",
    "Хүрээ Номын сан",
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#18181b">
<p>Сайн байна уу, ${escapeHtml(name)}!</p>
<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
<p>${
    overdue.length > 0
      ? "Хугацаа хэтэрсэн хоног тутамд торгууль бодогдоно. Аль болох хурдан буцааж өгнө үү."
      : "Хэрэв дуусгаж амжаагүй бол хугацаагаа сунгах боломжтой."
  }</p>
<p><a href="${catalogUrl}/me" style="color:#047857">Миний ном</a></p>
<p style="color:#71717a">Хүрээ Номын сан</p></div>`;
  return { subject, text, html };
}

/**
 * Өнөөдрийн сануулгуудыг илгээнэ:
 *  - маргааш дуусах зээл (due_soon)
 *  - хугацаа хэтэрсэн зээл: 1 дэх өдөр, дараа нь 7 хоног тутам (overdue)
 * reminder_log-д эхлээд "эзэмшиж" бичдэг тул cron давхар ажилласан ч нэг л удаа явна.
 */
export async function sendReminders(actor: Actor | null, baseUrl: string) {
  const config = reminderConfig();
  if (!config.apiKey) return { ok: false as const, error: "RESEND_API_KEY тохируулаагүй байна" };

  const daysOverdue = sql<number>`(${TODAY} - ${loans.dueDate})`.mapWith(Number);
  const candidates = await db
    .select({
      loanId: loans.id,
      dueDate: loans.dueDate,
      daysOverdue,
      title: books.title,
      readerId: user.id,
      name: user.name,
      email: user.email,
    })
    .from(loans)
    .innerJoin(user, eq(user.id, loans.readerId))
    .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
    .innerJoin(books, eq(books.id, bookCopies.bookId))
    .where(
      and(
        isNull(loans.returnedAt),
        // Имэйлгүй уншигч (placeholder хаягтай)-ийг алгасна
        notLike(user.email, "%.invalid"),
        or(
          eq(loans.dueDate, sql`${TODAY} + 1`),
          and(sql`${loans.dueDate} < ${TODAY}`, sql`(${TODAY} - ${loans.dueDate}) % 7 = 1`),
        ),
      ),
    );

  // Энэ ажиллагаа "эзэмшсэн" зээлүүд л (өнөөдөр амжилттай илгээгээгүй)
  const claimed = new Set<number>();
  for (const c of candidates) {
    const [row] = await db
      .insert(reminderLog)
      .values({
        loanId: c.loanId,
        kind: c.daysOverdue > 0 ? "overdue" : "due_soon",
        sentOn: sql`${TODAY}`,
        recipient: config.redirectTo ?? c.email,
      })
      // Өмнөх оролдлого алдаатай байсан бол дахин илгээж болно
      .onConflictDoUpdate({
        target: [reminderLog.loanId, reminderLog.kind, reminderLog.sentOn],
        set: { error: null, recipient: config.redirectTo ?? c.email },
        setWhere: isNotNull(reminderLog.error),
      })
      .returning({ loanId: reminderLog.loanId });
    if (row) claimed.add(row.loanId);
  }

  // Уншигч тус бүрт нэг имэйл
  const byReader = new Map<string, { name: string; email: string; items: Item[] }>();
  for (const c of candidates.filter((c) => claimed.has(c.loanId))) {
    const entry = byReader.get(c.readerId) ?? { name: c.name, email: c.email, items: [] };
    entry.items.push({ loanId: c.loanId, title: c.title, dueDate: c.dueDate, daysOverdue: c.daysOverdue });
    byReader.set(c.readerId, entry);
  }
  if (byReader.size === 0) {
    return { ok: true as const, sent: 0, message: "Өнөөдөр илгээх сануулга алга" };
  }

  const recipients = [...byReader.values()];
  const emails = recipients.map((r) => {
    const { subject, text, html } = composeEmail(r.name, r.items, baseUrl);
    return {
      from: config.from,
      to: [config.redirectTo ?? r.email],
      // Демо горимд хэнд очих байсныг гарчигт харуулна
      subject: config.redirectTo ? `[Демо → ${r.name} <${r.email}>] ${subject}` : subject,
      text,
      html,
    };
  });

  let error: string | null = null;
  // Resend batch: нэг хүсэлтээр 100 хүртэл имэйл
  for (let i = 0; i < emails.length && !error; i += 100) {
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(emails.slice(i, i + 100)),
    });
    if (!response.ok) error = `Resend ${response.status}: ${(await response.text()).slice(0, 300)}`;
  }

  if (error) {
    const failed = recipients.flatMap((r) => r.items.map((i) => i.loanId));
    await db
      .update(reminderLog)
      .set({ error })
      .where(and(eq(reminderLog.sentOn, sql`${TODAY}`), inArray(reminderLog.loanId, failed)));
    return { ok: false as const, error };
  }

  await audit(
    actor,
    "reminders.send",
    `${recipients.length} уншигчид ${claimed.size} номын сануулга${config.redirectTo ? ` (демо: ${config.redirectTo} руу)` : ""}`,
  );
  return { ok: true as const, sent: recipients.length, message: `${recipients.length} уншигчид сануулга илгээлээ` };
}
