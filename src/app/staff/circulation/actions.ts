"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Actor } from "@/lib/audit";
import { CirculationError, lend, renew, returnCopy } from "@/lib/circulation";
import { formatDate, formatMoney } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { requireRole } from "@/lib/session";

const inventorySchema = z.object({
  inventoryNumber: z.string().trim().min(1, "Бүртгэлийн дугаар оруулна уу").max(32),
});

// Олголт/буцаалт олон хуудсанд (самбар, ном, уншигч, зээл) нөлөөлнө
const refreshStaff = () => revalidatePath("/staff", "layout");

async function run(fn: () => Promise<FormState>): Promise<FormState> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof CirculationError) return { error: error.message };
    throw error;
  }
}

export async function lendAction(readerId: string, _: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  const parsed = inventorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  return run(async () => {
    const result = await lend({ readerId, inventoryNumber: parsed.data.inventoryNumber, actor: staff });
    refreshStaff();
    return { success: `«${result.title}» олголоо. Буцаах хугацаа: ${formatDate(result.dueDate)}` };
  });
}

export async function returnAction(_: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  const parsed = inventorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return returnByInventoryNumber(parsed.data.inventoryNumber, staff);
}

export async function returnLoanAction(inventoryNumber: string): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  return returnByInventoryNumber(inventoryNumber, staff);
}

async function returnByInventoryNumber(inventoryNumber: string, actor: Actor) {
  return run(async () => {
    const result = await returnCopy({ inventoryNumber, actor });
    refreshStaff();
    const base = `«${result.title}» — ${result.readerName} буцаалаа.`;
    if (result.fine > 0) {
      return { warning: `${base} ${result.daysLate} хоног хоцорсон тул ${formatMoney(result.fine)} торгууль ногдлоо.` };
    }
    return { success: result.daysLate > 0 ? `${base} ${result.daysLate} хоног хоцорсон (торгуульгүй).` : base };
  });
}

export async function renewAction(loanId: number): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  return run(async () => {
    const { dueDate } = await renew({ loanId, actor: staff });
    refreshStaff();
    return { success: `Сунгалаа. Шинэ хугацаа: ${formatDate(dueDate)}` };
  });
}
