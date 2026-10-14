"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Notice, Select, Textarea } from "@/components/ui";
import type { FormState } from "@/lib/forms";

export type BookDefaults = {
  title: string;
  author: string;
  categoryId: string;
  isbn: string;
  publisher: string;
  publishedYear: string;
  description: string;
};

export function BookForm({
  action,
  categories,
  defaults,
  submitLabel,
  withQuantity = false,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: { id: number; name: string }[];
  defaults?: BookDefaults;
  submitLabel: string;
  withQuantity?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (categories.length === 0) {
    return (
      <Notice tone="error">
        Ном бүртгэхийн өмнө{" "}
        <Link href="/staff/categories" className="underline">
          ангилал нэмнэ үү
        </Link>
        .
      </Notice>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.success && <Notice tone="success">{state.success}</Notice>}
      <Field label="Номын нэр" name="title" required defaultValue={v.title ?? defaults?.title} error={errors.title} />
      <Field label="Зохиогч" name="author" required defaultValue={v.author ?? defaults?.author} error={errors.author} />
      <Select label="Ангилал" name="categoryId" required defaultValue={v.categoryId ?? defaults?.categoryId ?? ""}>
        <option value="" disabled>
          Сонгох…
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      {errors.categoryId && <p className="-mt-2 text-sm text-red-600">{errors.categoryId}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ISBN" name="isbn" inputMode="numeric" defaultValue={v.isbn ?? defaults?.isbn} error={errors.isbn} />
        <Field
          label="Хэвлэгдсэн он"
          name="publishedYear"
          inputMode="numeric"
          defaultValue={v.publishedYear ?? defaults?.publishedYear}
          error={errors.publishedYear}
        />
      </div>
      <Field label="Хэвлэлийн газар" name="publisher" defaultValue={v.publisher ?? defaults?.publisher} error={errors.publisher} />
      <Textarea label="Тайлбар" name="description" defaultValue={v.description ?? defaults?.description} error={errors.description} />
      {withQuantity && (
        <Field
          label="Хувийн тоо"
          name="quantity"
          type="number"
          min={1}
          max={50}
          defaultValue={v.quantity ?? "1"}
          hint="Бүртгэлийн дугаар автоматаар олгогдоно"
          error={errors.quantity}
        />
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Хадгалж байна…" : submitLabel}
        </Button>
        <Link href="/staff/books" className="self-center px-2 text-sm text-zinc-500 hover:underline">
          Болих
        </Link>
      </div>
    </form>
  );
}
