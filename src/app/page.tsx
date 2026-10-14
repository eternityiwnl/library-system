import { LinkButton } from "@/components/ui";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Номын сангийн удирдлагын систем</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Ном, ангилал, уншигч, ном олголт ба буцаалтыг нэг дороос удирдана.
      </p>
      <LinkButton href="/home">Нэвтрэх</LinkButton>
    </main>
  );
}
