import Link from "next/link";
import { BookCover } from "./book-cover";
import { Badge } from "./ui";

type CardBook = {
  id: number;
  title: string;
  author: string;
  category: string;
  year: number | null;
  available: number;
  copies: number;
  coverVersion: number | null;
  excerpt?: string | null;
};

export function AvailabilityBadge({ available, copies }: { available: number; copies: number }) {
  if (copies === 0) return <Badge tone="gray">Хувь бүртгээгүй</Badge>;
  if (available === 0) return <Badge tone="gray">Одоогоор байхгүй</Badge>;
  return <Badge tone="green">{available} хувь байгаа</Badge>;
}

/** Каталогийн хэвтээ карт: хавтас + мэдээлэл + тайлбарын эхлэл */
export function BookCard({ book }: { book: CardBook }) {
  return (
    <Link
      href={`/catalog/${book.id}`}
      className="group flex h-full gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-emerald-600/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <BookCover book={book} size="sm" className="w-20 sm:w-24" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-xs text-zinc-500">{book.category}</p>
        <h3 className="leading-snug font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
          {book.title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {book.author}
          {book.year && <span className="text-zinc-400"> · {book.year}</span>}
        </p>
        {book.excerpt && <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{book.excerpt}</p>}
        <div className="mt-auto pt-2">
          <AvailabilityBadge available={book.available} copies={book.copies} />
        </div>
      </div>
    </Link>
  );
}

/** Нүүр хуудасны тавиур: хавтас голлосон босоо карт */
export function BookTile({ book }: { book: CardBook }) {
  return (
    <Link href={`/catalog/${book.id}`} className="group flex flex-col gap-2">
      <BookCover book={book} size="md" className="transition group-hover:-translate-y-0.5 group-hover:shadow-md" />
      <div>
        <h3 className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-zinc-500">{book.author}</p>
      </div>
    </Link>
  );
}
