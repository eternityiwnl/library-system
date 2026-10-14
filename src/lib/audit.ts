import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import type { AuditAction } from "./labels";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Actor = { id: string; name: string };

/** Үйлдлийг бүртгэнэ. Транзакц дотор дуудвал үйлдэлтэй хамт commit/rollback болно. */
export async function audit(actor: Actor | null, action: AuditAction, summary: string, tx: Tx | typeof db = db) {
  await tx.insert(auditLog).values({
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? "Систем",
    action,
    summary,
  });
}
