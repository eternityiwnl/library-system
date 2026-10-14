import { z } from "zod";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
  /** Нэг удаа харуулах түр нууц үг */
  password?: string;
  createdId?: string;
  /** Алдаатай илгээсэн утгууд — React 19 маягтыг илгээсний дараа цэвэрлэдэг тул буцааж бөглөнө */
  values?: Record<string, string>;
};

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData) if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  return out;
}

/** Талбарын алдаа + бөглөсөн утгууд */
export function invalid(formData: FormData, fieldErrors: Record<string, string>): FormState {
  return { fieldErrors, values: formValues(formData) };
}

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const fields = {
  name: z.string().trim().min(1, "Нэрээ оруулна уу").max(100, "Хэт урт байна"),
  cardNumber: z
    .string()
    .trim()
    .min(1, "Картын дугаар оруулна уу")
    .max(32, "Хэт урт байна")
    .regex(/^[A-Za-z0-9-]+$/, "Зөвхөн латин үсэг, тоо, зураас (-) ашиглана"),
  phone: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{6,20}$/, "Утасны дугаар буруу байна")
      .nullable(),
  ),
  optionalEmail: z.preprocess(
    emptyToNull,
    z.string().trim().toLowerCase().pipe(z.email("Имэйл хаяг буруу байна")).nullable(),
  ),
  email: z.string().trim().toLowerCase().pipe(z.email("Имэйл хаяг буруу байна")),
  staffRole: z.enum(["librarian", "admin"], { error: "Эрх сонгоно уу" }),
  title: z.string().trim().min(1, "Номын нэр оруулна уу").max(300, "Хэт урт байна"),
  author: z.string().trim().min(1, "Зохиогч оруулна уу").max(200, "Хэт урт байна"),
  categoryId: z.coerce.number({ error: "Ангилал сонгоно уу" }).int().positive("Ангилал сонгоно уу"),
  // Зураас, зайг хасаад 10 эсвэл 13 оронтой ISBN-ийг хадгална
  isbn: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(/[\s-]/g, "").toUpperCase() || null : v),
    z
      .string()
      .regex(/^(\d{9}[\dX]|\d{13})$/, "ISBN 10 эсвэл 13 оронтой байна")
      .nullable(),
  ),
  optionalText: (max: number) =>
    z.preprocess(emptyToNull, z.string().trim().max(max, "Хэт урт байна").nullable()),
  year: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ error: "Он буруу байна" })
      .int("Он буруу байна")
      .min(1000, "Он буруу байна")
      .max(new Date().getFullYear() + 1, "Он буруу байна")
      .nullable(),
  ),
};
