import { sendReminders } from "@/lib/reminders";

// Vercel Cron өдөр бүр 01:00 UTC (= Улаанбаатарын 09:00) дуудна — vercel.json.
// CRON_SECRET тохируулсан үед Vercel "Authorization: Bearer <CRON_SECRET>" илгээдэг.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendReminders(null, new URL(request.url).origin);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
