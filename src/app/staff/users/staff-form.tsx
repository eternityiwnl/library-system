"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, LinkButton, Notice, PasswordReveal, Select } from "@/components/ui";
import type { FormState } from "@/lib/forms";

type Defaults = { name: string; email: string; phone: string; role: string };

export function StaffForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (state.createdId && state.password) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success">Ажилтныг бүртгэлээ. Имэйл болон доорх түр нууц үгээр нэвтэрнэ.</Notice>
        <PasswordReveal password={state.password} />
        <LinkButton href={`/staff/users/${state.createdId}`} className="self-start">
          Ажилтны хуудас
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.success && <Notice tone="success">{state.success}</Notice>}
      <Field label="Овог нэр" name="name" required defaultValue={v.name ?? defaults?.name} error={errors.name} />
      <Field
        label="Имэйл"
        name="email"
        type="email"
        required
        defaultValue={v.email ?? defaults?.email}
        hint="Үүгээр нэвтэрнэ"
        error={errors.email}
      />
      <Field label="Утас" name="phone" type="tel" defaultValue={v.phone ?? defaults?.phone} error={errors.phone} />
      <Select label="Эрх" name="role" defaultValue={v.role ?? defaults?.role ?? "librarian"}>
        <option value="librarian">Номын санч</option>
        <option value="admin">Админ</option>
      </Select>
      {errors.role && <p className="-mt-2 text-sm text-red-600">{errors.role}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Хадгалж байна…" : submitLabel}
        </Button>
        <Link href="/staff/users" className="self-center px-2 text-sm text-zinc-500 hover:underline">
          Болих
        </Link>
      </div>
    </form>
  );
}
