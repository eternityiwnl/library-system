import "server-only";
import { and, asc, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, fines, loans, settings, user } from "@/db/schema";
import { isUniqueViolation } from "./db-errors";
import { audit, type Actor } from "./audit";
import { formatDate, formatMoney } from "./format";
import { formatPhone } from "./phone";
import { COPY_STATUS_LABELS } from "./labels";

// Бүх огнооны тооцоог DB дээр Улаанбаатарын цагаар хийнэ (Vercel сервер UTC дээр ажилладаг)
export const TODAY = sql`(now() AT TIME ZONE 'Asia/Ulaanbaatar')::date`;

/** Хэрэглэгчид харуулах дүрмийн алдаа (лимит, төлөв г.м.) */
export class CirculationError extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getSettings(tx: Tx | typeof db = db) {
  const [row] = await tx.select().from(settings).where(eq(settings.id, 1));
  return row;
}

/** "12" → "000012" — номын санч тэгүүдийг бичихгүй байж болно */
export function normalizeInventoryNumber(value: string) {
  const v = value.trim();
  return /^\d{1,6}$/.test(v) ? v.padStart(6, "0") : v;
}


const ALREADY_ON_LOAN = "Энэ хувь өөр уншигчид олгогдсон байна";

export async function lend(input: { readerId: string; inventoryNumber: string; actor: Actor }) {
  try {
    return await db.transaction(async (tx) => {
      // Уншигчийн мөрийг түгжинэ: нэг уншигчид зэрэг олгоход лимит давахгүй
      const [reader] = await tx
        .select({ id: user.id, role: user.role, banned: user.banned, name: user.name, phone: user.phone })
        .from(user)
        .where(eq(user.id, input.readerId))
        .for("update");
      if (!reader || reader.role !== "reader") throw new CirculationError("Уншигч олдсонгүй");
      if (reader.banned) throw new CirculationError("Уншигчийн эрх идэвхгүй байна");

      const rules = await getSettings(tx);
      const [{ active, overdue }] = await tx
        .select({
          active: count(),
          overdue: sql<number>`count(*) filter (where ${loans.dueDate} < ${TODAY})`.mapWith(Number),
        })
        .from(loans)
        .where(and(eq(loans.readerId, reader.id), isNull(loans.returnedAt)));
      if (overdue > 0) throw new CirculationError(`Хугацаа хэтэрсэн ${overdue} ном буцаагаагүй байна`);
      if (active >= rules.maxActiveLoans) {
        throw new CirculationError(`Нэг уншигч зэрэг ${rules.maxActiveLoans} хүртэл ном зээлнэ`);
      }

      const unpaid = await unpaidFineTotal(reader.id, tx);
      if (unpaid > 0 && unpaid >= rules.maxUnpaidFine) {
        throw new CirculationError(`Төлөгдөөгүй торгууль ${formatMoney(unpaid)} байна`);
      }

      const [copy] = await tx
        .select({ id: bookCopies.id, status: bookCopies.status, title: books.title, inventoryNumber: bookCopies.inventoryNumber })
        .from(bookCopies)
        .innerJoin(books, eq(books.id, bookCopies.bookId))
        .where(eq(bookCopies.inventoryNumber, normalizeInventoryNumber(input.inventoryNumber)));
      if (!copy) throw new CirculationError("Ийм бүртгэлийн дугаартай хувь олдсонгүй");
      if (copy.status !== "active") {
        throw new CirculationError(`Энэ хувь "${COPY_STATUS_LABELS[copy.status]}" төлөвтэй тул олгох боломжгүй`);
      }

      const [onLoan] = await tx
        .select({ id: loans.id })
        .from(loans)
        .where(and(eq(loans.copyId, copy.id), isNull(loans.returnedAt)));
      if (onLoan) throw new CirculationError(ALREADY_ON_LOAN);

      const [loan] = await tx
        .insert(loans)
        .values({
          copyId: copy.id,
          readerId: reader.id,
          issuedBy: input.actor.id,
          dueDate: sql`${TODAY} + ${rules.loanPeriodDays}::integer`,
        })
        .returning({ id: loans.id, dueDate: loans.dueDate });
      await audit(
        input.actor,
        "loan.issue",
        `«${copy.title}» (${copy.inventoryNumber}) → ${reader.name} (${formatPhone(reader.phone)}), ${formatDate(loan.dueDate)} хүртэл`,
        tx,
      );
      return { loanId: loan.id, dueDate: loan.dueDate, title: copy.title };
    });
  } catch (error) {
    // Шалгалтын дараа өөр хүн зэрэг олгосон тохиолдолд partial unique index барина
    if (isUniqueViolation(error)) throw new CirculationError(ALREADY_ON_LOAN);
    throw error;
  }
}

export async function returnCopy(input: { inventoryNumber: string; actor: Actor }) {
  return db.transaction(async (tx) => {
    const [active] = await tx
      .select({
        loanId: loans.id,
        readerId: loans.readerId,
        readerName: user.name,
        title: books.title,
        inventoryNumber: bookCopies.inventoryNumber,
      })
      .from(loans)
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .innerJoin(books, eq(books.id, bookCopies.bookId))
      .innerJoin(user, eq(user.id, loans.readerId))
      .where(
        and(eq(bookCopies.inventoryNumber, normalizeInventoryNumber(input.inventoryNumber)), isNull(loans.returnedAt)),
      )
      .for("update", { of: loans });
    if (!active) throw new CirculationError("Энэ дугаартай олгогдсон хувь олдсонгүй");

    const [closed] = await tx
      .update(loans)
      .set({ returnedAt: sql`now()`, returnedTo: input.actor.id })
      .where(eq(loans.id, active.loanId))
      .returning({ daysLate: sql<number>`greatest(${TODAY} - ${loans.dueDate}, 0)`.mapWith(Number) });

    const rules = await getSettings(tx);
    const fine = closed.daysLate * rules.finePerDay;
    if (fine > 0) {
      await tx.insert(fines).values({
        loanId: active.loanId,
        readerId: active.readerId,
        daysLate: closed.daysLate,
        amount: fine,
      });
    }
    await audit(
      input.actor,
      "loan.return",
      `«${active.title}» (${active.inventoryNumber}) ← ${active.readerName}` +
        (closed.daysLate > 0 ? `, ${closed.daysLate} хоног хоцорсон${fine > 0 ? `, торгууль ${formatMoney(fine)}` : ""}` : ""),
      tx,
    );
    return { title: active.title, readerName: active.readerName, readerId: active.readerId, daysLate: closed.daysLate, fine };
  });
}

/** readerId өгвөл зөвхөн тухайн уншигчийн зээлийг сунгана (уншигч өөрөө сунгах үед) */
export async function renew(input: { loanId: number; actor: Actor; readerId?: string }) {
  return db.transaction(async (tx) => {
    const [loan] = await tx
      .select({
        readerId: loans.readerId,
        readerName: user.name,
        title: books.title,
        inventoryNumber: bookCopies.inventoryNumber,
        returnedAt: loans.returnedAt,
        renewalCount: loans.renewalCount,
        overdue: sql<boolean>`${loans.dueDate} < ${TODAY}`,
      })
      .from(loans)
      .innerJoin(user, eq(user.id, loans.readerId))
      .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
      .innerJoin(books, eq(books.id, bookCopies.bookId))
      .where(eq(loans.id, input.loanId))
      .for("update", { of: loans });
    if (!loan || (input.readerId && loan.readerId !== input.readerId)) throw new CirculationError("Зээл олдсонгүй");
    if (loan.returnedAt) throw new CirculationError("Энэ ном аль хэдийн буцаагдсан");
    if (loan.overdue) throw new CirculationError("Хугацаа хэтэрсэн номыг сунгах боломжгүй — эхлээд буцаана уу");

    const rules = await getSettings(tx);
    if (loan.renewalCount >= rules.maxRenewals) {
      throw new CirculationError(
        rules.maxRenewals === 0 ? "Сунгалт хийх боломжгүй" : `Дээд тал нь ${rules.maxRenewals} удаа сунгана`,
      );
    }
    const [updated] = await tx
      .update(loans)
      .set({
        dueDate: sql`${loans.dueDate} + ${rules.renewalDays}::integer`,
        renewalCount: sql`${loans.renewalCount} + 1`,
      })
      .where(eq(loans.id, input.loanId))
      .returning({ dueDate: loans.dueDate });
    await audit(
      input.actor,
      "loan.renew",
      `«${loan.title}» (${loan.inventoryNumber}) — ${loan.readerName}, шинэ хугацаа ${formatDate(updated.dueDate)}`,
      tx,
    );
    return { dueDate: updated.dueDate };
  });
}

export async function unpaidFineTotal(readerId: string, tx: Tx | typeof db = db) {
  const [{ total }] = await tx
    .select({ total: sql<number>`coalesce(sum(${fines.amount}), 0)`.mapWith(Number) })
    .from(fines)
    .where(and(eq(fines.readerId, readerId), eq(fines.status, "unpaid")));
  return total;
}

/** Зээлийн жагсаалтын суурь query (LoansTable-ийн LoanRow хэлбэртэй) — where/order/limit-ийг дуудагч нэмнэ */
export function selectLoans() {
  return db
    .select({
      id: loans.id,
      title: books.title,
      bookId: books.id,
      author: books.author,
      coverVersion: books.coverVersion,
      inventoryNumber: bookCopies.inventoryNumber,
      readerId: loans.readerId,
      readerName: user.name,
      readerPhone: user.phone,
      issuedAt: loans.issuedAt,
      dueDate: loans.dueDate,
      returnedAt: loans.returnedAt,
      renewalCount: loans.renewalCount,
      // Буцаагдсан бол хэтэрсэн хоног 0 (харуулахгүй)
      daysOverdue: sql<number>`case when ${loans.returnedAt} is null then greatest(${TODAY} - ${loans.dueDate}, 0) else 0 end`.mapWith(Number),
    })
    .from(loans)
    .innerJoin(bookCopies, eq(bookCopies.id, loans.copyId))
    .innerJoin(books, eq(books.id, bookCopies.bookId))
    .innerJoin(user, eq(user.id, loans.readerId))
    .$dynamic();
}

/** Уншигчийн одоо зээлж буй номууд, буцаах огноогоор */
export function activeLoansOf(readerId: string) {
  return selectLoans()
    .where(and(eq(loans.readerId, readerId), isNull(loans.returnedAt)))
    .orderBy(asc(loans.dueDate));
}
