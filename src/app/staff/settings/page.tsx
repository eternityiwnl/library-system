import { Card, PageHeader } from "@/components/ui";
import { getSettings } from "@/lib/circulation";
import { requireRole } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requireRole("admin");
  const s = await getSettings();
  return (
    <div className="max-w-xl">
      <PageHeader title="Тохиргоо" />
      <Card>
        <SettingsForm
          values={{
            loanPeriodDays: s.loanPeriodDays,
            maxActiveLoans: s.maxActiveLoans,
            maxRenewals: s.maxRenewals,
            renewalDays: s.renewalDays,
            finePerDay: s.finePerDay,
            maxUnpaidFine: s.maxUnpaidFine,
          }}
        />
      </Card>
    </div>
  );
}
