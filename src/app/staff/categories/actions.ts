"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { fieldErrorsOf, invalid, type FormState } from "@/lib/forms";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/session";

const schema = z.object({ name: z.string().trim().min(1, "Нэр оруулна уу").max(100, "Хэт урт байна") });
const DUPLICATE = "Ийм нэртэй ангилал байна";

function refresh() {
  revalidatePath("/staff/categories");
  revalidatePath("/staff/books");
}

export async function createCategory(_: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  try {
    await db.insert(categories).values({ name: parsed.data.name });
  } catch (error) {
    if (isUniqueViolation(error)) return invalid(formData, { name: DUPLICATE });
    throw error;
  }
  await audit(staff, "category.create", parsed.data.name);
  refresh();
  // values-гүй буцаана → маягт хоосорч дараагийн ангиллыг шууд бичиж болно
  return { success: `"${parsed.data.name}" нэмэгдлээ` };
}

export async function renameCategory(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  const [before] = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, id));
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  try {
    await db.update(categories).set({ name: parsed.data.name }).where(eq(categories.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) return invalid(formData, { name: DUPLICATE });
    throw error;
  }
  if (before && before.name !== parsed.data.name) await audit(staff, "category.update", `${before.name} → ${parsed.data.name}`);
  refresh();
  return { success: "Хадгаллаа" };
}

export async function deleteCategory(id: number): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  let deleted: { name: string }[];
  try {
    deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ name: categories.name });
  } catch (error) {
    if (isForeignKeyViolation(error)) return { error: "Энэ ангилалд ном байгаа тул устгах боломжгүй" };
    throw error;
  }
  if (deleted[0]) await audit(staff, "category.delete", deleted[0].name);
  refresh();
  return { success: "Устгалаа" };
}
