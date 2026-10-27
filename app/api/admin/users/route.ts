import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { bills, comments, feedback, sessions, users } from "../../../../db/schema";
import { deleteUserSessions, requireAdmin } from "../../_lib/auth";

function databaseError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("no such column")) return Response.json({ error: "用户表还没有升级，请先在 D1 执行 drizzle/0008_tickets_and_users.sql。" }, { status: 503 });
  return Response.json({ error: fallback }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const db = await getDb();
    const now = Math.floor(Date.now() / 1000);
    const rows = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      disabled: users.disabled,
      createdAt: users.createdAt,
      // 子查询用别名并写全表名，避免 SQLite 把 "id" 解析成子查询内部表的列。
      comments: sql<number>`(select count(*) from comments c where c.user_id = "users"."id")`,
      feedback: sql<number>`(select count(*) from feedback f where f.user_id = "users"."id")`,
      sessions: sql<number>`(select count(*) from sessions s where s.user_id = "users"."id" and s.expires_at > ${now})`,
    }).from(users).orderBy(desc(users.createdAt)).limit(500);
    return Response.json({ users: rows });
  } catch (error) {
    return databaseError(error, "用户暂时无法读取。");
  }
}

/** action：disable 停用并下线、enable 恢复、logout 强制在所有设备下线。不能对自己操作。 */
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const payload = (await request.json()) as { id?: string; action?: string };
    const id = String(payload.id ?? "");
    if (!id) return Response.json({ error: "缺少用户编号。" }, { status: 400 });
    if (id === admin.id) return Response.json({ error: "不能对自己的账户执行这个操作。" }, { status: 400 });
    const db = await getDb();
    const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
    if (!target) return Response.json({ error: "没有找到这个用户。" }, { status: 404 });

    if (payload.action === "disable") {
      if (target.role === "admin") return Response.json({ error: "不能停用管理员账户。" }, { status: 400 });
      await db.update(users).set({ disabled: 1 }).where(eq(users.id, id));
      await deleteUserSessions(id);
      return Response.json({ ok: true, message: "已停用，并让该用户在所有设备下线。" });
    }
    if (payload.action === "enable") {
      await db.update(users).set({ disabled: 0 }).where(eq(users.id, id));
      return Response.json({ ok: true, message: "已恢复，该用户可以重新登录。" });
    }
    if (payload.action === "logout") {
      await deleteUserSessions(id);
      return Response.json({ ok: true, message: "已让该用户在所有设备下线。" });
    }
    return Response.json({ error: "未知的操作。" }, { status: 400 });
  } catch (error) {
    return databaseError(error, "操作暂时失败。");
  }
}

/** 删除普通用户：登录会话和账单一并删除；留言和讨论保留，但不再关联该账户。 */
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id) return Response.json({ error: "缺少用户编号。" }, { status: 400 });
    if (id === admin.id) return Response.json({ error: "不能删除自己的账户。" }, { status: 400 });
    const db = await getDb();
    const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
    if (!target) return Response.json({ error: "没有找到这个用户。" }, { status: 404 });
    if (target.role === "admin") return Response.json({ error: "不能删除管理员账户。" }, { status: 400 });
    await db.batch([
      db.delete(sessions).where(eq(sessions.userId, id)),
      db.delete(bills).where(eq(bills.userId, id)),
      db.update(comments).set({ userId: null }).where(eq(comments.userId, id)),
      db.update(feedback).set({ userId: null }).where(eq(feedback.userId, id)),
      db.delete(users).where(eq(users.id, id)),
    ]);
    return Response.json({ ok: true, message: "已删除该用户。" });
  } catch (error) {
    return databaseError(error, "删除暂时失败。");
  }
}
