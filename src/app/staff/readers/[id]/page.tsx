import { desc, eq, isNotNull, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { loans } from "@/db/schema";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { activeLoansOf, selectLoans, unpaidFineTotal } from "@/lib/circulation";
import { formatDate, formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { findUser, realEmail } from "@/lib/users";
import { AccountActions } from "../../account-actions";
import { LoansTable } from "../../loans/loans-table";
import { resetReaderPassword, setReaderActive, updateReader } from "../actions";
import { ReaderForm } from "../reader-form";

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin", "librarian");
  const { id } = await params;
  const reader = await findUser(id);
  if (!reader || reader.role !== "reader") notFound();

  const [current, history, unpaid] = await Promise.all([
    activeLoansOf(reader.id),
    selectLoans()
      .where(and(eq(loans.readerId, reader.id), isNotNull(loans.returnedAt)))
      .orderBy(desc(loans.returnedAt))
      .limit(20),
    unpaidFineTotal(reader.id),
  ]);
  const active = !reader.banned;
  const cardNumber = (reader.username ?? "").toUpperCase();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        title={reader.name}
        actions={
          <>
            {active ? <Badge tone="green">Идэвхтэй</Badge> : <Badge tone="red">Идэвхгүй</Badge>}
            {unpaid > 0 && <Badge tone="red">Төлөгдөөгүй торгууль {formatMoney(unpaid)}</Badge>}
            {active && (
              <LinkButton href={`/staff/circulation?reader=${encodeURIComponent(cardNumber)}`}>Ном олгох</LinkButton>
            )}
          </>
        }
      />

      <Card className="p-0">
        <h2 className="px-5 pt-5 pb-3 font-semibold">Одоо зээлж буй ({current.length})</h2>
        <LoansTable rows={current} showReader={false} empty="Зээлсэн ном алга" />
      </Card>

      {history.length > 0 && (
        <Card className="p-0">
          <h2 className="px-5 pt-5 pb-3 font-semibold">Сүүлд буцаасан</h2>
          <LoansTable rows={history} showReader={false} empty="" />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Уншигчийн мэдээлэл</h2>
          <ReaderForm
            action={updateReader.bind(null, reader.id)}
            submitLabel="Хадгалах"
            defaults={{
              name: reader.name,
              cardNumber,
              phone: reader.phone ?? "",
              email: realEmail(reader.email) ?? "",
            }}
          />
        </Card>
        <div className="flex flex-col gap-4">
          <AccountActions
            active={active}
            resetPasswordAction={resetReaderPassword.bind(null, reader.id)}
            setActiveAction={setReaderActive.bind(null, reader.id)}
          />
          <p className="text-xs text-zinc-500">Бүртгэсэн: {formatDate(reader.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
