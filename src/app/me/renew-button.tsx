"use client";

import { useTransition } from "react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui";
import { renewMyLoan } from "./actions";

export function RenewButton({ loanId }: { loanId: number }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => toast(await renewMyLoan(loanId)))}
    >
      {pending ? "Сунгаж байна…" : "Сунгах"}
    </Button>
  );
}
