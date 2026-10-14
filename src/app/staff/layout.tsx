import type { ReactNode } from "react";
import { signOut } from "@/app/actions";
import { ToastProvider } from "@/components/toast";
import { requireRole } from "@/lib/session";
import { NavLink } from "./nav-link";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("admin", "librarian");

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-b border-zinc-200 bg-zinc-50 md:w-60 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <p className="font-semibold">Номын сан</p>
          <p className="text-xs text-zinc-500 md:mt-1">
            {user.name} · {user.role === "admin" ? "Админ" : "Номын санч"}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 text-sm md:flex-col md:pb-4">
          <NavLink href="/staff" exact>
            Хяналтын самбар
          </NavLink>
          <NavLink href="/staff/circulation">Олголт / буцаалт</NavLink>
          <NavLink href="/staff/loans">Зээлүүд</NavLink>
          <NavLink href="/staff/fines">Торгууль</NavLink>
          <NavLink href="/staff/books">Номууд</NavLink>
          <NavLink href="/staff/categories">Ангилал</NavLink>
          <NavLink href="/staff/readers">Уншигчид</NavLink>
          {user.role === "admin" && (
            <>
              <NavLink href="/staff/users">Ажилтнууд</NavLink>
              <NavLink href="/staff/settings">Тохиргоо</NavLink>
            </>
          )}
          <NavLink href="/password">Нууц үг солих</NavLink>
          <form action={signOut} className="md:mt-4">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left whitespace-nowrap text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Гарах
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  );
}
