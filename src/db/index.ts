import "server-only";
import { Pool } from "@neondatabase/serverless";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL тохируулаагүй байна (.env.local файлыг шалгана уу)");
}

// WebSocket Pool — ном олгох/буцаахад транзакц хэрэгтэй тул HTTP драйвер биш
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Сул холболт сервер талаас тасарвал pool "error" үүсгэнэ — сонсогчгүй бол процесс унана
pool.on("error", (error: Error) => console.error("Postgres pool:", error.message));

// Vercel функц сул зогсохоос өмнө сул холболтуудыг хаалгана — дараагийн хүсэлт
// хөлдсөн холболт дээр гацахгүй
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });
