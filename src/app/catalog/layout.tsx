import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
      <SiteFooter />
    </>
  );
}
