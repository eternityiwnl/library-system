"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { fieldErrorsOf, invalid, type FormState } from "@/lib/forms";
import { requireRole } from "@/lib/session";

const schema = z.object({ name: z.string().trim().min(1, "Нэр оруулна уу").max(100, "Хэт урт байна") });
const DUPLICATE = "Ийм нэртэй ангилал байна";

function refresh() {
  revalidatePath("/staff/categories");
  revalidatePath("/staff/books");
}

export async function createCategory(_: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "librarian");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  try {
    await db.insert(categories).values({ name: parsed.data.name });
  } catch (error) {
    if (isUniqueViolation(error)) return invalid(formData, { name: DUPLICATE });
    throw error;
  }
  refresh();
  // values-гүй буцаана → маягт хоосорч дараагийн ангиллыг шууд бичиж болно
  return { success: `"${parsed.data.name}" нэмэгдлээ` };
}

export async function renameCategory(id: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "librarian");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  try {
    await db.update(categories).set({ name: parsed.data.name }).where(eq(categories.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) return invalid(formData, { name: DUPLICATE });
    throw error;
  }
  refresh();
  return { success: "Хадгаллаа" };
}

export async function deleteCategory(id: number): Promise<FormState> {
  await requireRole("admin", "librarian");
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    if (isForeignKeyViolation(error)) return { error: "Энэ ангилалд ном байгаа тул устгах боломжгүй" };
    throw error;
  }
  refresh();
  return { success: "Устгалаа" };
}
