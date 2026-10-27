"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { fines, user } from "@/db/schema";
import { formatMoney } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/session";

export async function resolveFine(id: number, outcome: "paid" | "waived"): Promise<FormState> {
  // Эрхийг хамгийн түрүүнд шалгана — нэвтрээгүй хүнд юу ч хариулахгүй
  const staff = await requireRole("admin", "librarian");
  // Аргументууд хөтчөөс ирдэг тул TypeScript-ийн төрөлд найдахгүй
  if (outcome !== "paid" && outcome !== "waived") return { error: "Буруу үйлдэл" };
  if (!Number.isSafeInteger(id)) return { error: "Торгууль олдсонгүй" };
  // Төлбөр хүлээн авах — номын санч; торгуулиас чөлөөлөх — зөвхөн админ
  if (outcome === "waived") await requireRole("admin");

  // status = 'unpaid' нөхцөлтэй update — давхар дарсан ч нэг л удаа бүртгэгдэнэ
  const fine = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(fines)
      .set({ status: outcome, resolvedAt: sql`now()`, resolvedBy: staff.id })
      .where(and(eq(fines.id, id), eq(fines.status, "unpaid")))
      .returning({ amount: fines.amount, readerId: fines.readerId });
    if (!row) return null;
    const [reader] = await tx.select({ name: user.name }).from(user).where(eq(user.id, row.readerId));
    await audit(staff, outcome === "paid" ? "fine.paid" : "fine.waived", `${reader?.name}: ${formatMoney(row.amount)}`, tx);
    return row;
  });
  if (!fine) return { error: "Торгууль олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн" };

  revalidatePath("/staff", "layout");
  return {
    success: outcome === "paid" ? `${formatMoney(fine.amount)} төлбөр бүртгэлээ` : `${formatMoney(fine.amount)} торгуулиас чөлөөллөө`,
  };
}
