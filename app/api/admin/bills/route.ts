import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { bills, users } from "../../../../db/schema";
import { getSessionUser } from "../../_lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const db = await getDb();
    const rows = await db.select({ id: bills.id, title: bills.title, snapshotJson: bills.snapshotJson, createdAt: bills.createdAt, userEmail: users.email }).from(bills).innerJoin(users, eq(bills.userId, users.id)).orderBy(desc(bills.createdAt), desc(bills.id)).limit(100);
    return Response.json({ bills: rows.map(({ snapshotJson, ...row }) => ({ ...row, snapshot: JSON.parse(snapshotJson) })) });
  } catch {
    return Response.json({ error: "账单暂时无法读取。" }, { status: 500 });
  }
}
