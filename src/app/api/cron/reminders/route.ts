import { createHash, timingSafeEqual } from "node:crypto";
import { sendReminders } from "@/lib/reminders";

// Хариу өгөх хугацаагаар нууц үгийг тааж болохгүйн тулд тогтмол хугацаанд харьцуулна
const digest = (s: string) => createHash("sha256").update(s).digest();

// Vercel Cron өдөр бүр 01:00 UTC (= Улаанбаатарын 09:00) дуудна — vercel.json.
// CRON_SECRET тохируулсан үед Vercel "Authorization: Bearer <CRON_SECRET>" илгээдэг.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret || !timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendReminders(null, new URL(request.url).origin);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
