import Link from "next/link";
import { Badge } from "./ui";

export function AvailabilityBadge({ available, copies }: { available: number; copies: number }) {
  if (copies === 0) return <Badge tone="gray">Хувь бүртгээгүй</Badge>;
  if (available === 0) return <Badge tone="gray">Одоогоор байхгүй</Badge>;
  return <Badge tone="green">{available} хувь байгаа</Badge>;
}

export function BookCard({
  book,
}: {
  book: { id: number; title: string; author: string; category: string; year: number | null; available: number; copies: number };
}) {
  return (
    <Link
      href={`/catalog/${book.id}`}
      className="flex h-full flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-emerald-600/50 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-xs text-zinc-500">{book.category}</p>
      <h3 className="leading-snug font-semibold">{book.title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {book.author}
        {book.year && <span className="text-zinc-400"> · {book.year}</span>}
      </p>
      <div className="mt-auto pt-2">
        <AvailabilityBadge available={book.available} copies={book.copies} />
      </div>
    </Link>
  );
}
