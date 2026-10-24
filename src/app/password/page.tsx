import type { Metadata } from "next";
import Link from "next/link";
import { homeFor, requireUser } from "@/lib/session";
import { LogoMark } from "@/components/site-header";
import { Notice } from "@/components/ui";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Нууц үг солих — Хүрээ Номын сан" };

export default async function PasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-7 shadow-raised dark:border-zinc-800 dark:bg-zinc-900">
        <LogoMark className="size-10" />
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Нууц үг солих</h1>
        {user.mustChangePassword && (
          <Notice tone="success">
            Сайн байна уу, {user.name}! Үргэлжлүүлэхийн өмнө түр нууц үгээ өөрийн нууц үгээр солино уу.
          </Notice>
        )}
        <PasswordForm />
        {!user.mustChangePassword && (
          <Link href={homeFor(user.role)} className="text-center text-sm text-zinc-500 hover:underline">
            Буцах
          </Link>
        )}
      </div>
    </main>
  );
}
