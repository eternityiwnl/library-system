import Link from "next/link";
import { signOut } from "@/app/actions";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/session";

// Уншигчийн булан — ном хайх, зээлсэн ном, торгууль 5-р үе шатанд нэмэгдэнэ
export default async function ReaderHome() {
  const reader = await requireRole("reader");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Сайн байна уу, {reader.name}</h1>
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-500 hover:underline">
            Гарах
          </button>
        </form>
      </div>
      <Card>
        <p className="text-sm text-zinc-500">Картын дугаар</p>
        <p className="mt-1 font-mono text-xl">{(reader.username ?? "").toUpperCase()}</p>
      </Card>
      <p className="text-sm text-zinc-500">
        Зээлсэн ном, хугацаа, торгуулийн мэдээлэл удахгүй энд харагдана.{" "}
        <Link href="/password" className="text-emerald-700 hover:underline dark:text-emerald-400">
          Нууц үг солих
        </Link>
      </p>
    </main>
  );
}
