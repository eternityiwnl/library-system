"use server";

import { revalidatePath } from "next/cache";
import { CirculationError, renew } from "@/lib/circulation";
import { formatDate } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { requireRole } from "@/lib/session";

export async function renewMyLoan(loanId: number): Promise<FormState> {
  const reader = await requireRole("reader");
  try {
    // readerId дамжуулснаар зөвхөн өөрийн зээлийг сунгана
    const { dueDate } = await renew({ loanId, readerId: reader.id });
    revalidatePath("/me");
    revalidatePath("/staff", "layout");
    return { success: `Сунгалаа. Шинэ хугацаа: ${formatDate(dueDate)}` };
  } catch (error) {
    if (error instanceof CirculationError) return { error: error.message };
    throw error;
  }
}
