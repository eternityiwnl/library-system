"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useToast } from "@/components/toast";
import { Button, StateNotice } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { lendAction, renewAction, returnAction, returnLoanAction } from "./actions";

const inputClass =
  "h-10 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 font-mono text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm";

/** Бүртгэлийн дугаар оруулах нэг талбартай маягт: илгээсний дараа дахин фокуслана */
function InventoryForm({
  action,
  label,
  submitLabel,
  autoFocus,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  submitLabel: string;
  autoFocus?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!pending && (state.success || state.error || state.warning)) inputRef.current?.focus();
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            name="inventoryNumber"
            required
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder="000123"
            className={inputClass}
          />
          <Button type="submit" disabled={pending}>
            {submitLabel}
          </Button>
        </div>
      </label>
      <StateNotice state={state} />
    </form>
  );
}

export function LendForm({ readerId }: { readerId: string }) {
  return (
    <InventoryForm
      action={lendAction.bind(null, readerId)}
      label="Олгох номын бүртгэлийн дугаар"
      submitLabel="Олгох"
      autoFocus
    />
  );
}

export function ReturnForm() {
  return <InventoryForm action={returnAction} label="Буцаах номын бүртгэлийн дугаар" submitLabel="Буцаах" />;
}

/** Зээлийн мөр дээрх "Сунгах", "Буцаах" товч — үр дүнг toast-аар харуулна (буцаасны дараа мөр алга болно) */
export function LoanActions({ loanId, inventoryNumber }: { loanId: number; inventoryNumber: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(async () => toast(await renewAction(loanId)))}
      >
        Сунгах
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`${inventoryNumber} дугаартай номыг буцаах уу?`)) return;
          startTransition(async () => toast(await returnLoanAction(inventoryNumber)));
        }}
      >
        Буцаах
      </Button>
    </div>
  );
}
