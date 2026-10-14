"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { fieldErrorsOf, fields, invalid, type FormState } from "@/lib/forms";
import { audit } from "@/lib/audit";
import { formatPhone } from "@/lib/phone";
import { requireRole } from "@/lib/session";
import {
  createAccount,
  findUser,
  isPhoneTaken,
  isEmailTaken,
  placeholderEmail,
  resetPassword,
  setActive,
} from "@/lib/users";

const readerSchema = z.object({
  name: fields.name,
  phone: fields.loginPhone,
  email: fields.optionalEmail,
});

async function requireReader(id: string) {
  const target = await findUser(id);
  // Номын санч зөвхөн уншигчийг удирдана — ажилтны бүртгэлд энэ замаар хүрэхгүй
  if (!target || target.role !== "reader") throw new Error("Уншигч олдсонгүй");
  return target;
}

async function uniquenessErrors(data: z.infer<typeof readerSchema>, exceptUserId?: string) {
  const errors: Record<string, string> = {};
  if (await isPhoneTaken(data.phone, exceptUserId)) errors.phone = "Энэ утасны дугаар бүртгэлтэй байна";
  if (data.email && (await isEmailTaken(data.email, exceptUserId))) errors.email = "Энэ имэйл бүртгэлтэй байна";
  return Object.keys(errors).length ? errors : null;
}

export async function createReader(_: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  const parsed = readerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  const data = parsed.data;

  const taken = await uniquenessErrors(data);
  if (taken) return invalid(formData, taken);

  const { id, password } = await createAccount({
    name: data.name,
    email: data.email ?? placeholderEmail(data.phone),
    role: "reader",
    phone: data.phone,
    loginByPhone: true,
  });
  await audit(staff, "user.create", `Уншигч ${data.name} (${formatPhone(data.phone)})`);
  revalidatePath("/staff/readers");
  // Нууц үгийг URL-д хийхгүй (хөтчийн түүх, серверийн лог-д үлдэнэ) — хариунд л буцаана
  return { password, createdId: id };
}

export async function updateReader(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  await requireReader(id);
  const parsed = readerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  const data = parsed.data;

  const taken = await uniquenessErrors(data, id);
  if (taken) return invalid(formData, taken);

  await db
    .update(user)
    .set({
      name: data.name,
      // Утас = нэвтрэх нэр, хоёуланг нь хамт шинэчилнэ
      username: data.phone,
      phone: data.phone,
      email: data.email ?? placeholderEmail(data.phone),
    })
    .where(eq(user.id, id));
  await audit(staff, "user.update", `Уншигч ${data.name} (${formatPhone(data.phone)})`);
  revalidatePath("/staff/readers");
  revalidatePath(`/staff/readers/${id}`);
  return { success: "Хадгаллаа" };
}

export async function resetReaderPassword(id: string): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  const reader = await requireReader(id);
  const password = await resetPassword(id);
  await audit(staff, "user.password", `Уншигч ${reader.name}`);
  return { password };
}

export async function setReaderActive(id: string, active: boolean): Promise<FormState> {
  const staff = await requireRole("admin", "librarian");
  const reader = await requireReader(id);
  await setActive(id, active);
  await audit(staff, active ? "user.activate" : "user.deactivate", `Уншигч ${reader.name}`);
  revalidatePath("/staff/readers");
  revalidatePath(`/staff/readers/${id}`);
  return { success: active ? "Идэвхжүүллээ" : "Идэвхгүй болголоо" };
}
