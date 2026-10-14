import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { Card, PageHeader, Pagination } from "@/components/ui";
import { containsPattern } from "@/lib/catalog";
import { formatDateTime } from "@/lib/format";
import { AUDIT_ACTIONS, type AuditAction } from "@/lib/labels";
import { requireRole } from "@/lib/session";

const PAGE_SIZE = 50;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; q?: string; page?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const action = params.action && params.action in AUDIT_ACTIONS ? (params.action as AuditAction) : null;
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const pattern = containsPattern(query);
  const where = and(
    action ? eq(auditLog.action, action) : undefined,
    query ? or(ilike(auditLog.summary, pattern), ilike(auditLog.actorName, pattern)) : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.at), desc(auditLog.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(auditLog).where(where),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) =>
    `/staff/activity?${new URLSearchParams({
      ...(action && { action }),
      ...(query && { q: query }),
      ...(p > 1 && { page: String(p) }),
    })}`;

  return (
    <>
      <PageHeader title="Үйлдлийн бүртгэл" />

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <select
          name="action"
          defaultValue={action ?? ""}
          aria-label="Үйлдлийн төрөл"
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        >
          <option value="">Бүх үйлдэл</option>
          {Object.entries(AUDIT_ACTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={query}
          placeholder="Ном, уншигч, ажилтнаар хайх"
          aria-label="Бүртгэлээс хайх"
          className="h-10 w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Шүүх
        </button>
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Огноо</th>
              <th className="px-4 py-3 font-medium">Хэн</th>
              <th className="px-4 py-3 font-medium">Үйлдэл</th>
              <th className="px-4 py-3 font-medium">Дэлгэрэнгүй</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 tabular-nums">{formatDateTime(r.at)}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{r.actorName}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{AUDIT_ACTIONS[r.action as AuditAction] ?? r.action}</td>
                <td className="px-4 py-2.5">{r.summary}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  Бүртгэл алга
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} pages={pages} href={href} total={total} />
    </>
  );
}
