import { Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { createStaff } from "../actions";
import { StaffForm } from "../staff-form";

export default async function NewStaffPage() {
  await requireRole("admin");
  return (
    <div className="max-w-lg">
      <PageHeader title="Шинэ ажилтан" />
      <Card>
        <StaffForm action={createStaff} submitLabel="Бүртгэх" />
      </Card>
    </div>
  );
}
