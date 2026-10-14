import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { findUser } from "@/lib/users";
import { AccountActions } from "../../account-actions";
import { resetStaffPassword, setStaffActive, updateStaff } from "../actions";
import { StaffForm } from "../staff-form";

export default async function StaffUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("admin");
  const { id } = await params;
  const staff = await findUser(id);
  if (!staff || staff.role === "reader") notFound();

  const active = !staff.banned;

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <PageHeader
        title={staff.name}
        actions={active ? <Badge tone="green">Идэвхтэй</Badge> : <Badge tone="red">Идэвхгүй</Badge>}
      />
      <Card>
        <StaffForm
          action={updateStaff.bind(null, staff.id)}
          submitLabel="Хадгалах"
          defaults={{ name: staff.name, email: staff.email, phone: staff.phone ?? "", role: staff.role }}
        />
      </Card>
      <AccountActions
        active={active}
        isSelf={staff.id === me.id}
        resetPasswordAction={resetStaffPassword.bind(null, staff.id)}
        setActiveAction={setStaffActive.bind(null, staff.id)}
      />
    </div>
  );
}
