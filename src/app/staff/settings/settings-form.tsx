"use client";

import { useActionState } from "react";
import { Button, Field, StateNotice } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { saveSettings } from "./actions";

type Values = {
  loanPeriodDays: number;
  maxActiveLoans: number;
  maxRenewals: number;
  renewalDays: number;
  finePerDay: number;
  maxUnpaidFine: number;
};

const FIELDS: { name: keyof Values; label: string; hint: string; suffix?: string }[] = [
  { name: "loanPeriodDays", label: "Зээлийн хугацаа", hint: "Ном олгосноос хойш хэд хоногийн дотор буцаах", suffix: "хоног" },
  { name: "maxActiveLoans", label: "Нэг уншигчийн зээлийн дээд тоо", hint: "Зэрэг зээлж болох номын тоо", suffix: "ном" },
  { name: "maxRenewals", label: "Сунгалтын дээд тоо", hint: "0 бол сунгах боломжгүй", suffix: "удаа" },
  { name: "renewalDays", label: "Нэг сунгалтын хугацаа", hint: "Буцаах огноог хэд хоногоор хойшлуулах", suffix: "хоног" },
  { name: "finePerDay", label: "Хоцролтын торгууль", hint: "Хоцорсон хоног тутамд. 0 бол торгуульгүй", suffix: "₮ / хоног" },
  {
    name: "maxUnpaidFine",
    label: "Олголт зогсоох торгуулийн хэмжээ",
    hint: "Төлөгдөөгүй торгууль үүнд хүрвэл ном олгохгүй. 0 бол ямар ч төлөгдөөгүй торгууль зогсооно",
    suffix: "₮",
  },
];

export function SettingsForm({ values }: { values: Values }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5">
      <StateNotice state={state} />
      {FIELDS.map((f) => (
        <div key={f.name} className="flex items-end gap-3">
          <div className="flex-1">
            <Field
              label={f.label}
              name={f.name}
              type="number"
              inputMode="numeric"
              required
              defaultValue={state.values?.[f.name] ?? values[f.name]}
              hint={f.hint}
              error={errors[f.name]}
            />
          </div>
          {f.suffix && <span className="mb-8 w-20 text-sm text-zinc-500">{f.suffix}</span>}
        </div>
      ))}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Хадгалж байна…" : "Хадгалах"}
      </Button>
    </form>
  );
}
