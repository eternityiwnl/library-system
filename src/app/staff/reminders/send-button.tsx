"use client";

import { useTransition } from "react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui";
import { sendRemindersNow } from "./actions";

export function SendRemindersButton({ disabled }: { disabled?: boolean }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button disabled={disabled || pending} onClick={() => startTransition(async () => toast(await sendRemindersNow()))}>
      {pending ? "Илгээж байна…" : "Одоо илгээх"}
    </Button>
  );
}
