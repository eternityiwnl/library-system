"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { COPY_STATUS_LABELS, type CopyStatus } from "@/lib/labels";
import { addCopies, deleteBook, deleteCopy, updateCopy } from "../actions";

const controlClass =
  "h-9 rounded-md border border-zinc-300 bg-white px-2 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm";

function Message({ state }: { state: FormState }) {
  const error = state.error ?? Object.values(state.fieldErrors ?? {})[0];
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (state.success) return <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.success}</p>;
  return null;
}

export function AddCopiesForm({ bookId }: { bookId: number }) {
  const [state, action, pending] = useActionState(addCopies.bind(null, bookId), {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Хувь нэмэх</span>
          <input name="quantity" type="number" min={1} max={50} defaultValue={state.values?.quantity ?? "1"} className={`${controlClass} w-24`} />
        </label>
        <Button type="submit" disabled={pending}>
          Нэмэх
        </Button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function CopyRow({
  bookId,
  copy,
}: {
  bookId: number;
  copy: {
    id: number;
    inventoryNumber: string;
    status: CopyStatus;
    note: string | null;
    loanReaderId: string | null;
    loanReaderName: string | null;
    loanDueDate: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateCopy.bind(null, bookId, copy.id), {});
  const [deleteState, setDeleteState] = useState<FormState>({});
  const [deleting, startDelete] = useTransition();
  const formId = `copy-${copy.id}`;

  return (
    <tr>
      <td className="px-4 py-3 font-mono whitespace-nowrap">{copy.inventoryNumber}</td>
      <td className="px-4 py-3">
        <form id={formId} action={action} />
        <select
          key={state.values?.status ?? copy.status}
          form={formId}
          name="status"
          defaultValue={state.values?.status ?? copy.status}
          aria-label={`${copy.inventoryNumber} төлөв`}
          className={controlClass}
        >
          {Object.entries(COPY_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          form={formId}
          name="note"
          defaultValue={state.values?.note ?? copy.note ?? ""}
          placeholder="Тэмдэглэл"
          aria-label={`${copy.inventoryNumber} тэмдэглэл`}
          className={`${controlClass} w-full min-w-40`}
        />
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        {copy.loanReaderId ? (
          <>
            <Link href={`/staff/readers/${copy.loanReaderId}`} className="hover:underline">
              {copy.loanReaderName}
            </Link>
            <span className="block text-xs text-zinc-500">{formatDate(copy.loanDueDate)} хүртэл</span>
          </>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button form={formId} type="submit" variant="secondary" disabled={pending} className="h-9">
            Хадгалах
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={deleting || Boolean(copy.loanReaderId)}
            title={copy.loanReaderId ? "Олгогдсон хувийг устгах боломжгүй" : undefined}
            className="h-9"
            onClick={() => {
              if (!window.confirm(`${copy.inventoryNumber} хувийг устгах уу?`)) return;
              startDelete(async () => setDeleteState(await deleteCopy(bookId, copy.id)));
            }}
          >
            Устгах
          </Button>
        </div>
        <Message state={deleteState.error ? deleteState : state} />
      </td>
    </tr>
  );
}

export function DeleteBookButton({ bookId, title }: { bookId: number; title: string }) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`"${title}" номыг бүх хувийн хамт устгах уу?`)) return;
          startTransition(async () => setState(await deleteBook(bookId)));
        }}
      >
        Номыг устгах
      </Button>
      <Message state={state} />
    </div>
  );
}
