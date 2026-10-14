"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { fieldErrorsOf, invalid, type FormState } from "@/lib/forms";
import { requireRole } from "@/lib/session";

const int = (min: number, max: number) =>
  z.coerce
    .number({ error: "Тоо оруулна уу" })
    .int("Бүхэл тоо оруулна уу")
    .min(min, `${min}-аас багагүй`)
    .max(max, `${max}-аас ихгүй`);

const schema = z.object({
  loanPeriodDays: int(1, 365),
  maxActiveLoans: int(1, 50),
  maxRenewals: int(0, 10),
  renewalDays: int(1, 365),
  finePerDay: int(0, 1_000_000),
  maxUnpaidFine: int(0, 10_000_000),
});

export async function saveSettings(_: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  await db.update(settings).set(parsed.data).where(eq(settings.id, 1));
  revalidatePath("/staff", "layout");
  return { success: "Тохиргоог хадгаллаа. Шинэ олголт, буцаалтад үйлчилнэ." };
}
