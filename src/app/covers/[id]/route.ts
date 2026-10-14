import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookCovers } from "@/db/schema";

// /covers/:id?v=N — URL нь хувилбартай тул CDN болон хөтөч мөнхөд кэшлэнэ.
// Зураг солиход cover_version өсөж, URL өөрчлөгдөнө.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });

  const [cover] = await db
    .select({ mime: bookCovers.mime, data: bookCovers.data })
    .from(bookCovers)
    .where(eq(bookCovers.bookId, id));
  if (!cover) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(cover.data), {
    headers: {
      "Content-Type": cover.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
