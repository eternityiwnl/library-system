import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/site-header";
import { getSession, homeFor } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Нэвтрэх — Хүрээ Номын сан" };

// Чимэглэлийн тавиур: номын нуруунуудын өнгө, өндөр (%), өргөн (px)
const SPINES: [string, number, number][] = [
  ["#1f4d3a", 78, 26], ["#6e2a2a", 92, 20], ["#b88a3a", 70, 14], ["#1f3a5f", 86, 30], ["#4b2d52", 74, 18],
  ["#34373a", 96, 24], ["#1d4f55", 82, 16], ["#7a2943", 68, 28], ["#6b4a1f", 90, 20], ["#1f4d3a", 76, 22],
  ["#1f3a5f", 94, 14], ["#6e2a2a", 72, 26], ["#4b2d52", 88, 20], ["#b88a3a", 66, 12], ["#1d4f55", 84, 24],
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));

  return (
    <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Брэндийн хэсэг — зөвхөн өргөн дэлгэцэнд */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-forest-900 p-12 text-forest-200 lg:flex">
        <Link href="/" className="flex items-center gap-3 text-white">
          <LogoMark className="size-10" onDark />
          <span className="font-serif text-xl font-semibold tracking-tight">Хүрээ Номын сан</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="font-serif text-4xl leading-tight font-semibold text-white">
            Номын сангийн удирдлагын систем
          </p>
          <p className="mt-4 text-lg leading-relaxed text-forest-300">
            Каталог, ном олголт, буцаалт, торгууль — бүгд нэг дор.
          </p>
        </div>

        <div className="relative -mx-12 -mb-12 flex h-48 items-end gap-1 overflow-hidden border-b-8 border-[#0b1913] px-12" aria-hidden>
          {[...SPINES, ...SPINES.slice().reverse()].map(([color, height, width], i) => (
            <div
              key={i}
              className="shrink-0 rounded-t-sm shadow-[inset_-3px_0_0_rgb(0_0_0/0.25),inset_2px_0_0_rgb(255_255_255/0.08)]"
              style={{ backgroundColor: color, height: `${height}%`, width }}
            >
              <div className="mx-auto mt-3 h-px w-3/5 bg-[#d4a95a]/50" />
              <div className="mx-auto mt-1 h-px w-3/5 bg-[#d4a95a]/50" />
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="size-4" aria-hidden /> Нүүр хуудас
          </Link>
          <div className="mb-6 lg:hidden">
            <LogoMark className="size-10" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-semibold tracking-tight">Нэвтрэх</h1>
          <p className="mb-7 text-sm leading-relaxed text-zinc-500">
            Уншигч бол утасны дугаараа, ажилтан бол имэйлээ оруулна уу.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
