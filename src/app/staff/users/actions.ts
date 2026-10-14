"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { fieldErrorsOf, fields, invalid, type FormState } from "@/lib/forms";
import { requireRole } from "@/lib/session";
import { createAccount, findUser, isEmailTaken, resetPassword, setActive } from "@/lib/users";

const staffSchema = z.object({
  name: fields.name,
  email: fields.email,
  phone: fields.phone,
  role: fields.staffRole,
});

async function requireStaffTarget(id: string) {
  const target = await findUser(id);
  if (!target || target.role === "reader") throw new Error("Ажилтан олдсонгүй");
  return target;
}

export async function createStaff(_: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  const data = parsed.data;

  if (await isEmailTaken(data.email)) return invalid(formData, { email: "Энэ имэйл бүртгэлтэй байна" });

  const { id, password } = await createAccount({ ...data, cardNumber: null });
  revalidatePath("/staff/users");
  return { password, createdId: id };
}

export async function updateStaff(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const me = await requireRole("admin");
  await requireStaffTarget(id);
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, fieldErrorsOf(parsed.error));
  const data = parsed.data;

  // Өөрийгөө админаас буулгавал систем админгүй үлдэж болзошгүй
  if (id === me.id && data.role !== "admin") return invalid(formData, { role: "Өөрийн эрхийг бууруулах боломжгүй" });
  if (await isEmailTaken(data.email, id)) return invalid(formData, { email: "Энэ имэйл бүртгэлтэй байна" });

  await db
    .update(user)
    .set({ name: data.name, email: data.email, phone: data.phone, role: data.role })
    .where(eq(user.id, id));
  revalidatePath("/staff/users");
  revalidatePath(`/staff/users/${id}`);
  return { success: "Хадгаллаа" };
}

export async function resetStaffPassword(id: string): Promise<FormState> {
  await requireRole("admin");
  await requireStaffTarget(id);
  return { password: await resetPassword(id) };
}

export async function setStaffActive(id: string, active: boolean): Promise<FormState> {
  const me = await requireRole("admin");
  await requireStaffTarget(id);
  if (id === me.id) return { error: "Өөрийгөө идэвхгүй болгох боломжгүй" };
  await setActive(id, active);
  revalidatePath("/staff/users");
  revalidatePath(`/staff/users/${id}`);
  return { success: active ? "Идэвхжүүллээ" : "Идэвхгүй болголоо" };
}
