// Drizzle нь Postgres-ийн алдааг DrizzleQueryError-оор ороож, эх алдааг cause-д хадгалдаг
export function pgErrorCode(error: unknown): string | undefined {
  for (let e: unknown = error; e && typeof e === "object"; e = (e as { cause?: unknown }).cause) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return undefined;
}

export const isUniqueViolation = (error: unknown) => pgErrorCode(error) === "23505";
export const isForeignKeyViolation = (error: unknown) => pgErrorCode(error) === "23503";
