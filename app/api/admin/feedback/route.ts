import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { feedback, users } from "../../../../db/schema";
import { getSessionUser } from "../../_lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const db = await getDb();
    const rows = await db.select({ id: feedback.id, type: feedback.type, message: feedback.message, contact: feedback.contact, page: feedback.page, status: feedback.status, createdAt: feedback.createdAt, userEmail: users.email }).from(feedback).leftJoin(users, eq(feedback.userId, users.id)).orderBy(desc(feedback.createdAt), desc(feedback.id)).limit(100);
    return Response.json({ feedback: rows });
  } catch {
    return Response.json({ error: "留言暂时无法读取。" }, { status: 500 });
  }
}
