import { Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { createReader } from "../actions";
import { ReaderForm } from "../reader-form";

export default async function NewReaderPage() {
  await requireRole("admin", "librarian");
  return (
    <div className="max-w-lg">
      <PageHeader title="Шинэ уншигч" />
      <Card>
        <ReaderForm action={createReader} submitLabel="Бүртгэх" />
      </Card>
    </div>
  );
}
