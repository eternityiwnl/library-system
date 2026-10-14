import "server-only";
import { randomInt } from "node:crypto";
import { and, eq, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth, type Role } from "./auth";

// Уншигч имэйлгүй байж болох ч Better Auth имэйл шаарддаг.
// .invalid домэйн нь стандартаар хэзээ ч бодит хаяг болохгүй.
const PLACEHOLDER_EMAIL_DOMAIN = "no-email.invalid";

export function placeholderEmail(phone: string) {
  return `${phone}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function realEmail(email: string) {
  return email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`) ? null : email;
}

// Андуурагдах тэмдэгт (0/O, 1/l/I) оруулахгүй — уншигчид цаасан дээр бичиж өгнө
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  return out;
}

export async function findUser(id: string) {
  const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return row ?? null;
}

export async function isEmailTaken(email: string, exceptUserId?: string) {
  const where = exceptUserId
    ? and(eq(user.email, email.toLowerCase()), ne(user.id, exceptUserId))
    : eq(user.email, email.toLowerCase());
  const [row] = await db.select({ id: user.id }).from(user).where(where).limit(1);
  return Boolean(row);
}

/** Утас нэвтрэх нэр (username) эсвэл утасны баганад аль хэдийн байгаа эсэх */
export async function isPhoneTaken(phone: string, exceptUserId?: string) {
  const taken = or(eq(user.username, phone), eq(user.phone, phone));
  const where = exceptUserId ? and(taken, ne(user.id, exceptUserId)) : taken;
  const [row] = await db.select({ id: user.id }).from(user).where(where).limit(1);
  return Boolean(row);
}

/** Шинэ хэрэглэгч түр нууц үгтэй үүснэ; анх нэвтрэхэд солиулна. */
export async function createAccount(input: {
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  /** Уншигчид: утас нь нэвтрэх нэр болно */
  loginByPhone: boolean;
}) {
  const password = generatePassword();
  // Headers дамжуулахгүй = серверийн итгэмжлэгдсэн дуудлага. Эрхийг дуудагч шалгасан байх ёстой.
  const { user: created } = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password,
      // Admin plugin-д тусгай roles тохируулаагүй тул төрөл нь "user" | "admin" — DB check зөв утгыг баталгаажуулна
      role: input.role as "admin",
      data: {
        phone: input.phone,
        mustChangePassword: true,
        ...(input.loginByPhone && input.phone ? { username: input.phone } : {}),
      },
    },
  });
  return { id: created.id, password };
}

export async function resetPassword(userId: string) {
  const password = generatePassword();
  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(userId, await ctx.password.hash(password));
  await ctx.internalAdapter.deleteUserSessions(userId);
  await db.update(user).set({ mustChangePassword: true }).where(eq(user.id, userId));
  return password;
}

export async function setActive(userId: string, active: boolean) {
  await db
    .update(user)
    .set({ banned: !active, banReason: active ? null : "Идэвхгүй болгосон" })
    .where(eq(user.id, userId));
  if (!active) {
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUserSessions(userId);
  }
}
