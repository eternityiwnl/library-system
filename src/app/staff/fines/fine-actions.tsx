"use client";

import { useTransition } from "react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { resolveFine } from "./actions";

export function FineActions({ fineId, amount, canWaive }: { fineId: number; amount: number; canWaive: boolean }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function resolve(outcome: "paid" | "waived", question: string) {
    if (!window.confirm(question)) return;
    startTransition(async () => toast(await resolveFine(fineId, outcome)));
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        className="h-8 px-3"
        disabled={pending}
        onClick={() => resolve("paid", `${formatMoney(amount)} төлбөр хүлээн авсан уу?`)}
      >
        Төлсөн
      </Button>
      {canWaive && (
        <Button
          variant="secondary"
          className="h-8 px-3"
          disabled={pending}
          onClick={() => resolve("waived", `${formatMoney(amount)} торгуулиас чөлөөлөх үү?`)}
        >
          Чөлөөлөх
        </Button>
      )}
    </div>
  );
}
