"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/forms";
import { sendReminders } from "@/lib/reminders";
import { requireRole } from "@/lib/session";

export async function sendRemindersNow(): Promise<FormState> {
  const admin = await requireRole("admin");
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const result = await sendReminders(admin, origin);
  revalidatePath("/staff/reminders");
  return result.ok ? { success: result.message } : { error: result.error };
}
