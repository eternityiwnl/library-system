"use client";

import { useState, useTransition } from "react";
import { Button, Card, Notice, PasswordReveal } from "@/components/ui";
import type { FormState } from "@/lib/forms";

/** Нууц үг шинэчлэх, идэвхгүй болгох — уншигч, ажилтан хоёуланд */
export function AccountActions({
  active,
  isSelf = false,
  resetPasswordAction,
  setActiveAction,
}: {
  active: boolean;
  isSelf?: boolean;
  resetPasswordAction: () => Promise<FormState>;
  setActiveAction: (active: boolean) => Promise<FormState>;
}) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<FormState>, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      try {
        setState(await action());
      } catch {
        setState({ error: "Алдаа гарлаа. Дахин оролдоно уу." });
      }
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-semibold">Бүртгэлийн үйлдэл</h2>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.success && <Notice tone="success">{state.success}</Notice>}
      {state.password && <PasswordReveal password={state.password} />}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run(resetPasswordAction, "Шинэ түр нууц үг үүсгэх үү? Хуучин нууц үг ажиллахаа больж, бүх төхөөрөмжөөс гарна.")
          }
        >
          Нууц үг шинэчлэх
        </Button>
        {!isSelf &&
          (active ? (
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                run(() => setActiveAction(false), "Идэвхгүй болгох уу? Энэ хэрэглэгч нэвтэрч чадахгүй болно.")
              }
            >
              Идэвхгүй болгох
            </Button>
          ) : (
            <Button variant="secondary" disabled={pending} onClick={() => run(() => setActiveAction(true), "Идэвхжүүлэх үү?")}>
              Идэвхжүүлэх
            </Button>
          ))}
      </div>
    </Card>
  );
}
