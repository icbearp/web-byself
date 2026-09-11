import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { comments } from "../../../../db/schema";
import { getSessionUser } from "../../_lib/auth";

async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  return user?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const db = await getDb();
    const rows = await db.select().from(comments).orderBy(desc(comments.createdAt)).limit(150);
    return Response.json({ comments: rows });
  } catch {
    return Response.json({ error: "文章留言暂时无法读取。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const payload = (await request.json()) as { id?: string; status?: string };
    const id = payload.id?.trim() ?? "";
    const status = payload.status === "published" || payload.status === "hidden" ? payload.status : "";
    if (!id || !status) return Response.json({ error: "缺少留言或审核状态。" }, { status: 400 });
    const db = await getDb();
    const [updated] = await db.update(comments).set({ status, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(comments.id, id)).returning();
    if (!updated) return Response.json({ error: "没有找到这条留言。" }, { status: 404 });
    return Response.json({ ok: true, comment: updated });
  } catch {
    return Response.json({ error: "留言状态暂时无法更新。" }, { status: 500 });
  }
}
