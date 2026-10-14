"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  exact,
  icon,
  children,
}: {
  href: string;
  exact?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 whitespace-nowrap text-zinc-700 hover:bg-zinc-200/60 aria-[current=page]:bg-emerald-700 aria-[current=page]:text-white dark:text-zinc-300 dark:hover:bg-zinc-800 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:opacity-70 aria-[current=page]:[&>svg]:opacity-100"
    >
      {icon}
      {children}
    </Link>
  );
}

/** Цэсний бүлгийн гарчиг — зөвхөн өргөн дэлгэцэнд */
export function NavGroup({ label }: { label: string }) {
  return <p className="hidden px-3 pt-4 pb-1 text-[11px] font-medium tracking-wide text-zinc-400 uppercase md:block">{label}</p>;
}
