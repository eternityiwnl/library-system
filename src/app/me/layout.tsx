import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/toast";

export default function ReaderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
