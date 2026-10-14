"use server";

import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { homeFor, requireUser } from "@/lib/session";

export type PasswordState = { error?: string; fieldErrors?: Record<string, string> };

const schema = z
  .object({
    currentPassword: z.string().min(1, "Одоогийн нууц үгээ оруулна уу"),
    newPassword: z.string().min(8, "Дор хаяж 8 тэмдэгт").max(128, "Хэт урт байна"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Нууц үг таарахгүй байна",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "Шинэ нууц үг хуучнаасаа өөр байх ёстой",
  });

export async function changePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const current = await requireUser({ allowPasswordChange: true });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) return { fieldErrors: { currentPassword: "Одоогийн нууц үг буруу байна" } };
    throw error;
  }

  await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, current.id));
  redirect(homeFor(current.role));
}
