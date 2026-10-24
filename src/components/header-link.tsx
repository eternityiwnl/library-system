"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Толгойн цэсний холбоос — одоогийн хуудсыг тодруулна */
export function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="rounded-lg px-2.5 py-2 whitespace-nowrap text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 aria-[current=page]:bg-white aria-[current=page]:text-zinc-900 aria-[current=page]:shadow-card aria-[current=page]:ring-1 aria-[current=page]:ring-zinc-200 sm:px-3 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:aria-[current=page]:bg-zinc-800 dark:aria-[current=page]:text-zinc-100 dark:aria-[current=page]:ring-zinc-700"
    >
      {children}
    </Link>
  );
}
