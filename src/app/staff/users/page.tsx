import Link from "next/link";
import { asc, ne } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";

export default async function StaffUsersPage() {
  await requireRole("admin");
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, banned: user.banned })
    .from(user)
    .where(ne(user.role, "reader"))
    .orderBy(asc(user.name));

  return (
    <>
      <PageHeader title="Ажилтнууд" actions={<LinkButton href="/staff/users/new">Шинэ ажилтан</LinkButton>} />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Овог нэр</th>
              <th className="px-4 py-3 font-medium">Имэйл</th>
              <th className="px-4 py-3 font-medium">Эрх</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <Link href={`/staff/users/${r.id}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.role === "admin" ? "Админ" : "Номын санч"}</td>
                <td className="px-4 py-3">
                  {r.banned ? <Badge tone="red">Идэвхгүй</Badge> : <Badge tone="green">Идэвхтэй</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
