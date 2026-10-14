import Link from "next/link";
import { signOut } from "@/app/actions";
import { getSession } from "@/lib/session";

/** Нийтийн каталог, уншигчийн булангийн толгой хэсэг */
export async function SiteHeader() {
  const session = await getSession();
  const role = session?.user.role;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight whitespace-nowrap">
          Номын сан
        </Link>
        <nav className="flex items-center overflow-x-auto text-sm sm:gap-1">
          <Link href="/catalog" className="rounded-md px-2 py-2 whitespace-nowrap sm:px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Ном хайх
          </Link>
          {role === "reader" && (
            <Link href="/me" className="rounded-md px-2 py-2 whitespace-nowrap sm:px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Миний ном
            </Link>
          )}
          {role && role !== "reader" && (
            <Link href="/staff" className="rounded-md px-2 py-2 whitespace-nowrap sm:px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Ажлын хэсэг
            </Link>
          )}
          {session ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md px-2 py-2 whitespace-nowrap sm:px-3 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Гарах
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-md bg-emerald-700 px-2 py-2 sm:px-3 font-medium whitespace-nowrap text-white hover:bg-emerald-800"
            >
              Нэвтрэх
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
