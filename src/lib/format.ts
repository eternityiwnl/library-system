// Клиент болон серверт хоёуланд нь ажиллах форматлагчид
const TZ = "Asia/Ulaanbaatar";

export const formatMoney = (amount: number) => `${amount.toLocaleString("mn-MN")}₮`;

/** "2026-10-28" (DB-ийн date) эсвэл Date → "2026.10.28" */
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  if (typeof value === "string") return value.slice(0, 10).replaceAll("-", ".");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(value)
    .replaceAll("-", ".");
  return parts;
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(value);
  return `${formatDate(value)} ${time}`;
}
