import { getDb } from "../../../../db";
import { media } from "../../../../db/schema";
import { getSessionUser } from "../../_lib/auth";

const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png"]);
const MAX_BYTES = 700 * 1024;

/** 后台上传图片：浏览器端已压缩为 data URL，这里校验类型与大小后保存。 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (user?.role !== "admin") return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const payload = (await request.json()) as { dataUrl?: string };
    const match = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(payload.dataUrl ?? "");
    if (!match || !ALLOWED.has(match[1])) return Response.json({ error: "只支持 WebP、JPEG 或 PNG 图片。" }, { status: 400 });
    const size = Math.floor((match[2].length * 3) / 4);
    if (size > MAX_BYTES) return Response.json({ error: "图片压缩后仍超过 700KB，请换一张小一点的图片。" }, { status: 413 });
    const id = crypto.randomUUID();
    const db = await getDb();
    await db.insert(media).values({ id, mime: match[1], data: match[2], size });
    return Response.json({ ok: true, url: `/api/media/${id}` }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("no such table")) return Response.json({ error: "图片表还没有创建，请先在 D1 执行 drizzle/0007_site_settings.sql。" }, { status: 503 });
    return Response.json({ error: "图片暂时无法上传。" }, { status: 500 });
  }
}
