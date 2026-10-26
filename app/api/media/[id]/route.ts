import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { media } from "../../../../db/schema";

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

/** 输出后台上传的图片。每张图片的地址都是随机且不变的，所以可以长期缓存。 */
export async function GET(request: Request) {
  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  if (!/^[a-z0-9-]{8,64}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const db = await getDb();
    const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
    if (!row) return new Response("Not found", { status: 404 });
    return new Response(base64ToBytes(row.data), {
      headers: {
        "content-type": row.mime,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
