"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Field, LinkButton, Notice, PasswordReveal } from "@/components/ui";
import type { FormState } from "@/lib/forms";

type Defaults = { name: string; phone: string; email: string };

export function ReaderForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  // key солиход маягт цэвэрхэн дахин үүснэ ("Дахин нэмэх")
  const [formKey, setFormKey] = useState(0);
  return <ReaderFormInner key={formKey} {...{ action, defaults, submitLabel }} onReset={() => setFormKey((k) => k + 1)} />;
}

function ReaderFormInner({
  action,
  defaults,
  submitLabel,
  onReset,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
  onReset: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (state.createdId && state.password) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success">Уншигчийг бүртгэлээ.</Notice>
        <PasswordReveal password={state.password} />
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/staff/readers/${state.createdId}`}>Уншигчийн хуудас</LinkButton>
          <Button variant="secondary" onClick={onReset}>
            Дахин нэмэх
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.success && <Notice tone="success">{state.success}</Notice>}
      <Field label="Овог нэр" name="name" required defaultValue={v.name ?? defaults?.name} error={errors.name} />
      <Field
        label="Утасны дугаар"
        name="phone"
        type="tel"
        inputMode="tel"
        required
        placeholder="9911 2233"
        defaultValue={v.phone ?? defaults?.phone}
        hint="Уншигч үүгээр нэвтэрнэ"
        error={errors.phone}
      />
      <Field
        label="Имэйл"
        name="email"
        type="email"
        defaultValue={v.email ?? defaults?.email}
        hint="Заавал биш — хугацаа хэтэрсэн сануулга илгээхэд хэрэглэнэ"
        error={errors.email}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Хадгалж байна…" : submitLabel}
        </Button>
        <Link href="/staff/readers" className="self-center px-2 text-sm text-zinc-500 hover:underline">
          Болих
        </Link>
      </div>
    </form>
  );
}
