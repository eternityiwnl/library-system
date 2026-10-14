"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { createCategory, deleteCategory, renameCategory } from "./actions";

const inputClass =
  "h-10 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm";

function Message({ state }: { state: FormState }) {
  const error = state.error ?? state.fieldErrors?.name;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (state.success) return <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.success}</p>;
  return null;
}

export function CategoryCreateForm() {
  const [state, action, pending] = useActionState(createCategory, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="new-category" className="text-sm font-medium">
        Шинэ ангилал
      </label>
      <div className="flex gap-2">
        <input
          id="new-category"
          name="name"
          required
          placeholder="Жишээ нь: Уран зохиол"
          defaultValue={state.values?.name}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          className={inputClass}
        />
        <Button type="submit" disabled={pending}>
          Нэмэх
        </Button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function CategoryRow({ id, name, bookCount }: { id: number; name: string; bookCount: number }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await renameCategory(id, prev, formData);
      if (!result.fieldErrors) setEditing(false);
      return result;
    },
    {},
  );
  const [deleteState, setDeleteState] = useState<FormState>({});
  const [deleting, startDelete] = useTransition();

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form action={action} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              name="name"
              required
              autoFocus
              defaultValue={state.values?.name ?? name}
              aria-label="Ангиллын нэр"
              aria-invalid={state.fieldErrors?.name ? true : undefined}
              className={inputClass}
            />
            <Button type="submit" disabled={pending}>
              Хадгалах
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Болих
            </Button>
          </div>
          <Message state={state} />
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{name}</p>
        <Link href={`/staff/books?category=${id}`} className="text-sm text-zinc-500 hover:underline">
          {bookCount} ном
        </Link>
        <Message state={deleteState} />
      </div>
      <Button variant="secondary" onClick={() => setEditing(true)}>
        Засах
      </Button>
      <Button
        variant="secondary"
        disabled={deleting || bookCount > 0}
        title={bookCount > 0 ? "Номтой ангиллыг устгах боломжгүй" : undefined}
        onClick={() => {
          if (!window.confirm(`"${name}" ангиллыг устгах уу?`)) return;
          startDelete(async () => setDeleteState(await deleteCategory(id)));
        }}
      >
        Устгах
      </Button>
    </li>
  );
}
