import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL тохируулаагүй байна (.env.local файлыг шалгана уу)");
}

// WebSocket Pool — ном олгох/буцаахад транзакц хэрэгтэй тул HTTP драйвер биш
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle({ client: pool, schema });
