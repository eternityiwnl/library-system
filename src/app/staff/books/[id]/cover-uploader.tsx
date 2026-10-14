"use client";

import { useRef, useState, useTransition } from "react";
import { BookCover } from "@/components/book-cover";
import { Button, StateNotice } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { removeCover, uploadCover } from "../actions";

const MAX_W = 600;
const MAX_H = 900;

/** Хөтөч дээр жижигрүүлж WebP (боломжгүй бол JPEG) болгоно — утасны 5MB зураг ~80KB болно */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_W / bitmap.width, MAX_H / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await encode("image/webp", 0.85);
  // Хуучин Safari WebP кодлохгүй бол PNG буцаадаг — JPEG рүү шилжинэ
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.85);
  if (!blob) throw new Error("encode failed");
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `cover.${ext}`, { type: blob.type });
}

export function CoverUploader({
  book,
}: {
  book: { id: number; title: string; author: string; coverVersion: number | null };
}) {
  const [result, setResult] = useState<FormState>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    setResult({});
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setResult({ error: "Зураг файл сонгоно уу" });
      return;
    }
    try {
      const small = await shrink(file);
      setPreview(URL.createObjectURL(small));
      const fd = new FormData();
      fd.set("cover", small);
      startTransition(async () => {
        const r = await uploadCover(book.id, {}, fd);
        setResult(r);
        if (r.success) setPreview(null); // серверийн шинэ зургийг харуулна
      });
    } catch {
      setResult({ error: "Энэ зургийг уншиж чадсангүй. Өөр файл оролдоно уу." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex gap-5">
      <div className="w-32 shrink-0 sm:w-40">
        {preview ? (
          <div className="relative aspect-[2/3] overflow-hidden rounded-md ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={preview} alt="Урьдчилан харах" className="h-full w-full object-cover opacity-70" />
          </div>
        ) : (
          <BookCover book={book} size="md" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="font-semibold">Хавтасны зураг</h2>
        <p className="text-sm text-zinc-500">JPG, PNG эсвэл WebP. Автоматаар жижигрүүлнэ. Босоо (2:3) зураг хамгийн сайн харагдана.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id={`cover-${book.id}`}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Хадгалж байна…" : book.coverVersion ? "Зураг солих" : "Зураг оруулах"}
          </Button>
          {book.coverVersion && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                if (!window.confirm("Хавтасны зургийг устгах уу?")) return;
                setPreview(null);
                startTransition(async () => setResult(await removeCover(book.id)));
              }}
            >
              Устгах
            </Button>
          )}
        </div>
        <StateNotice state={result} />
      </div>
    </div>
  );
}
