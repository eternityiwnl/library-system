import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { findUser, realEmail } from "@/lib/users";
import { AccountActions } from "../../account-actions";
import { resetReaderPassword, setReaderActive, updateReader } from "../actions";
import { ReaderForm } from "../reader-form";

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin", "librarian");
  const { id } = await params;
  const reader = await findUser(id);
  if (!reader || reader.role !== "reader") notFound();

  const active = !reader.banned;

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <PageHeader
        title={reader.name}
        actions={active ? <Badge tone="green">Идэвхтэй</Badge> : <Badge tone="red">Идэвхгүй</Badge>}
      />
      <Card>
        <ReaderForm
          action={updateReader.bind(null, reader.id)}
          submitLabel="Хадгалах"
          defaults={{
            name: reader.name,
            cardNumber: (reader.username ?? "").toUpperCase(),
            phone: reader.phone ?? "",
            email: realEmail(reader.email) ?? "",
          }}
        />
      </Card>
      <AccountActions
        active={active}
        resetPasswordAction={resetReaderPassword.bind(null, reader.id)}
        setActiveAction={setReaderActive.bind(null, reader.id)}
      />
      <p className="text-xs text-zinc-500">
        Бүртгэсэн: {reader.createdAt.toLocaleDateString("mn-MN")}
      </p>
    </div>
  );
}
