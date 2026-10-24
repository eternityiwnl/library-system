import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { getSession } from "@/lib/session";
import { HeaderLink } from "./header-link";

/** Номын сангийн тэмдэг — толгой, нэвтрэх хуудас, ажилтны цэсэнд ижил */
export function LogoMark({ className = "size-8", onDark = false }: { className?: string; onDark?: boolean }) {
  const tone = onDark ? "bg-forest-800 ring-white/15" : "bg-forest-900 ring-black/5 dark:bg-forest-800 dark:ring-white/10";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg text-brass-400 shadow-sm ring-1 ${tone} ${className}`}
    >
      <BookOpen className="size-[55%]" aria-hidden />
    </span>
  );
}

/** Нийтийн каталог, уншигчийн булангийн толгой хэсэг */
export async function SiteHeader() {
  const session = await getSession();
  const role = session?.user.role;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap" aria-label="Хүрээ Номын сан — нүүр хуудас">
          <LogoMark />
          {/* Нэвтэрсэн үед утсан дээр цэсэнд зай гаргахын тулд зөвхөн тэмдэг.
              Утсан дээр нэр хоёр мөр: жижиг "ХҮРЭЭ" дээр нь, "Номын сан" доор нь */}
          <span
            className={`font-serif text-lg font-semibold tracking-tight max-sm:flex max-sm:flex-col max-sm:leading-none ${session ? "max-sm:hidden" : ""}`}
          >
            <span className="max-sm:mb-0.5 max-sm:font-sans max-sm:text-[10px] max-sm:font-semibold max-sm:tracking-[0.2em] max-sm:text-emerald-700 max-sm:uppercase">
              Хүрээ{" "}
            </span>
            Номын сан
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] sm:gap-1">
          <HeaderLink href="/catalog">Ном хайх</HeaderLink>
          {role === "reader" && <HeaderLink href="/me">Миний ном</HeaderLink>}
          {role && role !== "reader" && <HeaderLink href="/staff">Ажлын хэсэг</HeaderLink>}
          {session ? (
            <form action={signOut}>
              <button
                type="submit"
                title="Гарах"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 whitespace-nowrap text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 sm:px-3 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="max-sm:sr-only">Гарах</span>
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-lg bg-emerald-700 px-3 py-2 font-medium whitespace-nowrap text-white shadow-sm shadow-emerald-950/15 transition-colors hover:bg-emerald-800 sm:px-4 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Нэвтрэх
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

/** Нийтийн хуудсуудын доод хэсэг */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-zinc-500">
        <span className="flex items-center gap-2">
          <LogoMark className="size-6" />
          Номын сангийн удирдлагын систем
        </span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
