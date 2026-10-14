// Утасны дугаар: уншигчийн нэвтрэх нэр. DB-д зөвхөн 8 оронтой цифрээр хадгална.

/** "+976 9911-2233", "9911 2233" → "99112233". Монгол 8 оронтой биш бол null. */
export function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("976")) digits = digits.slice(3);
  return /^\d{8}$/.test(digits) ? digits : null;
}

/** "99112233" → "9911 2233" */
export function formatPhone(value: string | null | undefined) {
  if (!value) return "—";
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)} ${value.slice(4)}` : value;
}
