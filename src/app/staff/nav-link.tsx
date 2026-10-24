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
      className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 whitespace-nowrap text-forest-300 transition-colors hover:bg-white/5 hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white md:aria-[current=page]:before:absolute md:aria-[current=page]:before:inset-y-2 md:aria-[current=page]:before:-left-2 md:aria-[current=page]:before:w-1 md:aria-[current=page]:before:rounded-r-full md:aria-[current=page]:before:bg-brass-400 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:opacity-70 aria-[current=page]:[&>svg]:text-brass-400 aria-[current=page]:[&>svg]:opacity-100"
    >
      {icon}
      {children}
    </Link>
  );
}

/** Цэсний бүлгийн гарчиг — зөвхөн өргөн дэлгэцэнд */
export function NavGroup({ label }: { label: string }) {
  return (
    <p className="hidden px-3 pt-5 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-forest-300/60 uppercase md:block">
      {label}
    </p>
  );
}
