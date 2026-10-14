import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookCopies, books, user } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";

export default async function StaffDashboard() {
  await requireRole("admin", "librarian");

  const [[readers], [titles], [copies]] = await Promise.all([
    db.select({ n: count() }).from(user).where(eq(user.role, "reader")),
    db.select({ n: count() }).from(books),
    db.select({ n: count() }).from(bookCopies),
  ]);

  const stats = [
    { label: "Уншигч", value: readers.n },
    { label: "Номын нэр", value: titles.n },
    { label: "Номын хувь", value: copies.n },
  ];

  return (
    <>
      <PageHeader title="Хяналтын самбар" />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value.toLocaleString("mn-MN")}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
