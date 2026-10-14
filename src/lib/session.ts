import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Role } from "./auth";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];

export function homeFor(role: string | null | undefined) {
  return role === "reader" ? "/me" : "/staff";
}

/** Нэвтрээгүй бол /login руу. Түр нууц үгтэй бол эхлээд солиулна. */
export async function requireUser(opts?: { allowPasswordChange?: boolean }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword && !opts?.allowPasswordChange) redirect("/password");
  return session.user;
}

/** Хуудас бүр, Server Action бүр өөрөө дуудна — layout-ын шалгалтад найдахгүй. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) redirect(homeFor(user.role));
  return user;
}
