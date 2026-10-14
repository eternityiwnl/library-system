"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { bookCopies, books, copyStatus } from "@/db/schema";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { fieldErrorsOf, fields, invalid, type FormState } from "@/lib/forms";
import { requireRole } from "@/lib/session";

const bookSchema = z.object({
  title: fields.title,
  author: fields.author,
  categoryId: fields.categoryId,
  isbn: fields.isbn,
  publisher: fields.optionalText(200),
  publishedYear: fields.year,
  description: fields.optionalText(2000),
});

const copiesSchema = z.object({
  quantity: z.coerce
    .number({ error: "Тоо оруулна уу" })
    .int("Бүхэл тоо оруулна уу")
    .min(1, "Дор хаяж 1")
    .max(50, "Нэг удаад 50 хүртэл"),
});

const ISBN_TAKEN = "Энэ ISBN-тэй ном бүртгэлтэй байна";

function refresh(bookId?: number) {
  revalidatePath("/staff/books");
  revalidatePath("/staff/categories");
  if (bookId) revalidatePath(`/staff/books/${bookId}`);
}

export async function createBook(_: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "librarian");
  const parsed = bookSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  const copies = copiesSchema.safeParse({ quantity: formData.get("quantity") || 1 });
  if (!copies.success) return invalid(formData, fieldErrorsOf(copies.error));

  let bookId: number;
  try {
    bookId = await db.transaction(async (tx) => {
      const [book] = await tx.insert(books).values(parsed.data).returning({ id: books.id });
      // Бүртгэлийн дугаарыг DB-ийн sequence олгоно
      await tx.insert(bookCopies).values(Array.from({ length: copies.data.quantity }, () => ({ bookId: book.id })));
      return book.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return invalid(formData, { isbn: ISBN_TAKEN });
    if (isForeignKeyViolation(error)) return invalid(formData, { categoryId: "Ангилал олдсонгүй" });
    throw error;
  }
  refresh();
  redirect(`/staff/books/${bookId}?created=1`);
}

export async function updateBook(id: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "librarian");
  const parsed = bookSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  try {
    await db.update(books).set(parsed.data).where(eq(books.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) return invalid(formData, { isbn: ISBN_TAKEN });
    if (isForeignKeyViolation(error)) return invalid(formData, { categoryId: "Ангилал олдсонгүй" });
    throw error;
  }
  refresh(id);
  return { success: "Хадгаллаа" };
}

export async function deleteBook(id: number): Promise<FormState> {
  await requireRole("admin", "librarian");
  try {
    await db.delete(books).where(eq(books.id, id));
  } catch (error) {
    if (isForeignKeyViolation(error)) return { error: "Зээлийн түүхтэй хувьтай тул устгах боломжгүй. Хувиудыг \"Хасагдсан\" болгоно уу." };
    throw error;
  }
  refresh();
  redirect("/staff/books");
}

export async function addCopies(bookId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "librarian");
  const parsed = copiesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  const created = await db
    .insert(bookCopies)
    .values(Array.from({ length: parsed.data.quantity }, () => ({ bookId })))
    .returning({ inventoryNumber: bookCopies.inventoryNumber });
  refresh(bookId);
  return { success: `${created.length} хувь нэмэгдлээ: ${created.map((c) => c.inventoryNumber).join(", ")}` };
}

const copyUpdateSchema = z.object({
  status: z.enum(copyStatus.enumValues),
  note: fields.optionalText(300),
});

export async function updateCopy(bookId: number, copyId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "librarian");
  const parsed = copyUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  await db
    .update(bookCopies)
    .set(parsed.data)
    .where(and(eq(bookCopies.id, copyId), eq(bookCopies.bookId, bookId)));
  refresh(bookId);
  return { success: "Хадгаллаа" };
}

export async function deleteCopy(bookId: number, copyId: number): Promise<FormState> {
  await requireRole("admin", "librarian");
  try {
    await db.delete(bookCopies).where(and(eq(bookCopies.id, copyId), eq(bookCopies.bookId, bookId)));
  } catch (error) {
    if (isForeignKeyViolation(error)) return { error: "Зээлийн түүхтэй хувийг устгах боломжгүй. \"Хасагдсан\" болгоно уу." };
    throw error;
  }
  refresh(bookId);
  return { success: "Устгалаа" };
}
