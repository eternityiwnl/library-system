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
      className="group flex h-full gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-emerald-600/40 hover:shadow-raised dark:border-zinc-800 dark:bg-zinc-900"
    >
      <BookCover book={book} size="sm" className="w-20 sm:w-24" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[11px] font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">{book.category}</p>
        <h3 className="font-serif text-[1.05rem] leading-snug font-semibold group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
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
    <Link href={`/catalog/${book.id}`} className="group flex flex-col gap-2.5">
      <BookCover
        book={book}
        size="md"
        className="transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-1deg] group-hover:shadow-raised"
      />
      <div>
        <h3 className="line-clamp-2 font-serif text-sm leading-snug font-semibold group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-zinc-500">{book.author}</p>
      </div>
    </Link>
  );
}
