"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { fines } from "@/db/schema";
import { formatMoney } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { requireRole } from "@/lib/session";

export async function resolveFine(id: number, outcome: "paid" | "waived"): Promise<FormState> {
  // Төлбөр хүлээн авах — номын санч; торгуулиас чөлөөлөх — зөвхөн админ
  const staff = outcome === "waived" ? await requireRole("admin") : await requireRole("admin", "librarian");

  // status = 'unpaid' нөхцөлтэй update — давхар дарсан ч нэг л удаа бүртгэгдэнэ
  const [fine] = await db
    .update(fines)
    .set({ status: outcome, resolvedAt: sql`now()`, resolvedBy: staff.id })
    .where(and(eq(fines.id, id), eq(fines.status, "unpaid")))
    .returning({ amount: fines.amount });
  if (!fine) return { error: "Торгууль олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн" };

  revalidatePath("/staff", "layout");
  return {
    success: outcome === "paid" ? `${formatMoney(fine.amount)} төлбөр бүртгэлээ` : `${formatMoney(fine.amount)} торгуулиас чөлөөллөө`,
  };
}
