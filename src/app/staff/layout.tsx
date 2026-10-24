import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  BookCopy,
  BookOpen,
  Bell,
  ClipboardList,
  ExternalLink,
  FolderTree,
  House,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import { signOut } from "@/app/actions";
import { ToastProvider } from "@/components/toast";
import { requireRole } from "@/lib/session";
import { NavGroup, NavLink } from "./nav-link";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("admin", "librarian");
  const isAdmin = user.role === "admin";

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="bg-forest-900 text-forest-200 md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col dark:bg-forest-950 dark:md:border-r dark:md:border-white/5">
        {/* Тэмдэг дээр дарвал нийтийн нүүр хуудас руу */}
        <Link
          href="/"
          title="Нүүр хуудас руу буцах"
          className="group mx-2 my-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5 md:mx-3 md:my-3"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest-800 text-brass-400 ring-1 ring-white/10">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg leading-tight font-semibold text-white">Номын сан</p>
            <p className="truncate text-xs text-forest-300">Ажлын хэсэг</p>
          </div>
          <House className="size-4 shrink-0 text-forest-300 opacity-60 transition group-hover:text-white group-hover:opacity-100" aria-hidden />
        </Link>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 text-sm [scrollbar-width:none] md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:px-3 md:pb-4">
          <NavLink href="/staff" exact icon={<LayoutDashboard aria-hidden />}>
            Хяналтын самбар
          </NavLink>
          <NavLink href="/staff/circulation" icon={<ArrowLeftRight aria-hidden />}>
            Олголт / буцаалт
          </NavLink>

          <NavGroup label="Зээл" />
          <NavLink href="/staff/loans" icon={<ClipboardList aria-hidden />}>
            Зээлүүд
          </NavLink>
          <NavLink href="/staff/fines" icon={<Receipt aria-hidden />}>
            Торгууль
          </NavLink>

          <NavGroup label="Каталог" />
          <NavLink href="/staff/books" icon={<BookCopy aria-hidden />}>
            Номууд
          </NavLink>
          <NavLink href="/staff/categories" icon={<FolderTree aria-hidden />}>
            Ангилал
          </NavLink>
          <NavLink href="/staff/readers" icon={<Users aria-hidden />}>
            Уншигчид
          </NavLink>
          <NavLink href="/staff/reports" icon={<BarChart3 aria-hidden />}>
            Тайлан
          </NavLink>

          {isAdmin && (
            <>
              <NavGroup label="Удирдлага" />
              <NavLink href="/staff/users" icon={<UserCog aria-hidden />}>
                Ажилтнууд
              </NavLink>
              <NavLink href="/staff/reminders" icon={<Bell aria-hidden />}>
                Имэйл сануулга
              </NavLink>
              <NavLink href="/staff/activity" icon={<ClipboardList aria-hidden />}>
                Үйлдлийн бүртгэл
              </NavLink>
              <NavLink href="/staff/settings" icon={<Settings aria-hidden />}>
                Тохиргоо
              </NavLink>
            </>
          )}
        </nav>

        {/* Хэрэглэгч — өргөн дэлгэцэнд доод талд */}
        <div className="hidden border-t border-white/10 p-3 text-sm md:block">
          <div className="mb-2 flex items-center gap-3 px-2 py-1">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brass-500/20 font-semibold text-brass-400 ring-1 ring-brass-400/30">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{user.name}</p>
              <p className="text-xs text-forest-300">{isAdmin ? "Админ" : "Номын санч"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-forest-300 transition-colors hover:bg-white/5 hover:text-white">
              <ExternalLink className="size-4 opacity-70" aria-hidden /> Нийтийн каталог
            </Link>
            <Link href="/password" className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-forest-300 transition-colors hover:bg-white/5 hover:text-white">
              <KeyRound className="size-4 opacity-70" aria-hidden /> Нууц үг солих
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-forest-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut className="size-4 opacity-70" aria-hidden /> Гарах
              </button>
            </form>
          </div>
        </div>

        {/* Утсан дээр: гарах товч цэсний төгсгөлд */}
        <form action={signOut} className="px-2 pb-3 md:hidden">
          <button type="submit" className="flex items-center gap-2 px-3 py-1 text-sm text-forest-300">
            <LogOut className="size-4" aria-hidden /> {user.name} · Гарах
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-9">
        <div className="mx-auto max-w-6xl">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </main>
    </div>
  );
}
