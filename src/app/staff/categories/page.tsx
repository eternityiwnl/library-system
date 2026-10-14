import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { CategoryCreateForm, CategoryRow } from "./category-forms";

export default async function CategoriesPage() {
  await requireRole("admin", "librarian");
  const rows = await db
    .select({ id: categories.id, name: categories.name, bookCount: count(books.id) })
    .from(categories)
    .leftJoin(books, eq(books.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Ангилал" />
      <Card>
        <CategoryCreateForm />
      </Card>
      <Card className="p-0">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((c) => (
            <CategoryRow key={c.id} id={c.id} name={c.name} bookCount={c.bookCount} />
          ))}
          {rows.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-zinc-500">Ангилал нэмээгүй байна</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
