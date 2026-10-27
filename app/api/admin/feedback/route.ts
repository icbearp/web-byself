import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { feedback, users } from "../../../../db/schema";
import { requireAdmin } from "../../_lib/auth";

// 留言当作工单处理：新留言 → 跟进中 → 已完成 / 无效。
const statuses = new Set(["new", "following", "done", "invalid"]);

function databaseError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("no such column")) return Response.json({ error: "留言表还没有升级，请先在 D1 执行 drizzle/0008_tickets_and_users.sql。" }, { status: 503 });
  return Response.json({ error: fallback }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const db = await getDb();
    const rows = await db.select({
      id: feedback.id,
      type: feedback.type,
      message: feedback.message,
      contact: feedback.contact,
      page: feedback.page,
      status: feedback.status,
      note: feedback.note,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      userEmail: users.email,
    }).from(feedback).leftJoin(users, eq(feedback.userId, users.id)).orderBy(desc(feedback.createdAt), desc(feedback.id)).limit(300);
    return Response.json({ feedback: rows });
  } catch (error) {
    return databaseError(error, "留言暂时无法读取。");
  }
}

export async function PATCH(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const payload = (await request.json()) as { id?: number; status?: string; note?: string };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "缺少留言编号。" }, { status: 400 });
    const patch: { status?: string; note?: string; updatedAt: string } = { updatedAt: new Date().toISOString() };
    if (payload.status !== undefined) {
      if (!statuses.has(payload.status)) return Response.json({ error: "未知的处理状态。" }, { status: 400 });
      patch.status = payload.status;
    }
    if (payload.note !== undefined) patch.note = String(payload.note).slice(0, 2000);
    const db = await getDb();
    const [updated] = await db.update(feedback).set(patch).where(eq(feedback.id, id)).returning({ id: feedback.id, status: feedback.status, note: feedback.note, updatedAt: feedback.updatedAt });
    if (!updated) return Response.json({ error: "没有找到这条留言。" }, { status: 404 });
    return Response.json({ ok: true, item: updated });
  } catch (error) {
    return databaseError(error, "留言暂时无法更新。");
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "缺少留言编号。" }, { status: 400 });
    const db = await getDb();
    const [deleted] = await db.delete(feedback).where(eq(feedback.id, id)).returning({ id: feedback.id });
    if (!deleted) return Response.json({ error: "没有找到这条留言。" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return databaseError(error, "留言暂时无法删除。");
  }
}
