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
      <aside className="border-b border-zinc-200 bg-zinc-50 md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="grid size-8 place-items-center rounded-md bg-emerald-700 text-white">
            <BookOpen className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="leading-tight font-semibold">Номын сан</p>
            <p className="truncate text-xs text-zinc-500">Ажлын хэсэг</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 text-sm md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:pb-4">
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
        <div className="hidden border-t border-zinc-200 p-3 text-sm md:block dark:border-zinc-800">
          <p className="truncate px-1 font-medium">{user.name}</p>
          <p className="mb-2 px-1 text-xs text-zinc-500">{isAdmin ? "Админ" : "Номын санч"}</p>
          <div className="flex flex-col gap-0.5">
            <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800">
              <ExternalLink className="size-4" aria-hidden /> Нийтийн каталог
            </Link>
            <Link href="/password" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800">
              <KeyRound className="size-4" aria-hidden /> Нууц үг солих
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <LogOut className="size-4" aria-hidden /> Гарах
              </button>
            </form>
          </div>
        </div>

        {/* Утсан дээр: гарах товч цэсний төгсгөлд */}
        <form action={signOut} className="px-2 pb-2 md:hidden">
          <button type="submit" className="flex items-center gap-2 px-3 py-1 text-sm text-zinc-500">
            <LogOut className="size-4" aria-hidden /> {user.name} · Гарах
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  );
}
