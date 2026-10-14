"use client";

import { useActionState } from "react";
import { Button, Field, Notice } from "@/components/ui";
import { changePassword, type PasswordState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field
        label="Одоогийн нууц үг"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={errors.currentPassword}
      />
      <Field
        label="Шинэ нууц үг"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Дор хаяж 8 тэмдэгт"
        error={errors.newPassword}
      />
      <Field
        label="Шинэ нууц үг давтах"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Хадгалж байна…" : "Нууц үг солих"}
      </Button>
    </form>
  );
}
