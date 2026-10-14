import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Нэвтрэх — Номын сан" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Нэвтрэх</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Уншигч бол картын дугаараа, ажилтан бол имэйлээ оруулна уу.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
