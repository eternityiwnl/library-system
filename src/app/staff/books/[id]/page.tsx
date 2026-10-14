import { and, asc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookCopies, books, loans, user } from "@/db/schema";
import { Card, LinkButton, Notice, PageHeader } from "@/components/ui";
import { listCategories } from "@/lib/catalog";
import { requireRole } from "@/lib/session";
import { updateBook } from "../actions";
import { BookForm } from "../book-form";
import { AddCopiesForm, CopyRow, DeleteBookButton } from "./copies";
import { CoverUploader } from "./cover-uploader";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireRole("admin", "librarian");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { created } = await searchParams;

  const [[book], copies, categories] = await Promise.all([
    db.select().from(books).where(eq(books.id, id)).limit(1),
    db
      .select({
        id: bookCopies.id,
        inventoryNumber: bookCopies.inventoryNumber,
        status: bookCopies.status,
        note: bookCopies.note,
        loanReaderId: loans.readerId,
        loanReaderName: user.name,
        loanDueDate: loans.dueDate,
      })
      .from(bookCopies)
      .leftJoin(loans, and(eq(loans.copyId, bookCopies.id), isNull(loans.returnedAt)))
      .leftJoin(user, eq(user.id, loans.readerId))
      .where(eq(bookCopies.bookId, id))
      .orderBy(asc(bookCopies.inventoryNumber)),
    listCategories(),
  ]);
  if (!book) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={book.title} actions={<LinkButton href={`/catalog/${book.id}`} variant="secondary">Каталогт харах</LinkButton>} />
      {created && <Notice tone="success">Номыг бүртгэлээ.</Notice>}

      <Card>
        <CoverUploader book={book} />
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">
          Хувиуд ({copies.length}) ·{" "}
          <span className="font-normal text-zinc-500">
            {copies.filter((c) => c.status === "active" && !c.loanReaderId).length} олгох боломжтой
          </span>
        </h2>
        {copies.length > 0 && (
          <div className="-mx-5 mb-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-2 font-medium">Бүртгэлийн №</th>
                  <th className="px-4 py-2 font-medium">Төлөв</th>
                  <th className="px-4 py-2 font-medium">Тэмдэглэл</th>
                  <th className="px-4 py-2 font-medium">Зээл</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {copies.map((c) => (
                  <CopyRow key={c.id} bookId={book.id} copy={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AddCopiesForm bookId={book.id} />
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Номын мэдээлэл</h2>
        <BookForm
          action={updateBook.bind(null, book.id)}
          categories={categories}
          submitLabel="Хадгалах"
          defaults={{
            title: book.title,
            author: book.author,
            categoryId: String(book.categoryId),
            isbn: book.isbn ?? "",
            publisher: book.publisher ?? "",
            publishedYear: book.publishedYear ? String(book.publishedYear) : "",
            description: book.description ?? "",
          }}
        />
      </Card>

      <DeleteBookButton bookId={book.id} title={book.title} />
    </div>
  );
}
