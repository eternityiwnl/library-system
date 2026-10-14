import { Card, PageHeader } from "@/components/ui";
import { listCategories } from "@/lib/catalog";
import { requireRole } from "@/lib/session";
import { createBook } from "../actions";
import { BookForm } from "../book-form";

export default async function NewBookPage() {
  await requireRole("admin", "librarian");
  const categories = await listCategories();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Шинэ ном" />
      <Card>
        <BookForm action={createBook} categories={categories} submitLabel="Бүртгэх" withQuantity />
      </Card>
    </div>
  );
}
