import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { bills } from "../../../db/schema";
import { getSessionUser } from "../_lib/auth";

function unauthorized() {
  return Response.json({ error: "请先登录后保存和查看账单。" }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();
    const db = await getDb();
    const rows = await db.select().from(bills).where(eq(bills.userId, user.id)).orderBy(desc(bills.createdAt), desc(bills.id)).limit(30);
    return Response.json({ bills: rows.map((row) => ({ id: row.id, createdAt: row.createdAt, snapshot: JSON.parse(row.snapshotJson) })) });
  } catch {
    return Response.json({ error: "账单暂时无法读取。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();
    const payload = (await request.json()) as { snapshot?: unknown };
    if (!payload.snapshot || typeof payload.snapshot !== "object") return Response.json({ error: "账单内容无效。" }, { status: 400 });
    const snapshotJson = JSON.stringify(payload.snapshot);
    if (snapshotJson.length > 250_000) return Response.json({ error: "账单内容过大，请减少备注或明细。" }, { status: 413 });

    const snapshot = payload.snapshot as { billTitle?: string };
    const id = crypto.randomUUID();
    const title = snapshot.billTitle?.trim().slice(0, 120) || "购车金融账单";
    const db = await getDb();
    await db.insert(bills).values({ id, userId: user.id, title, snapshotJson });
    return Response.json({ id, createdAt: new Date().toISOString(), snapshot: payload.snapshot }, { status: 201 });
  } catch {
    return Response.json({ error: "账单暂时无法保存。" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();
    const payload = (await request.json()) as { id?: string };
    if (!payload.id) return Response.json({ error: "缺少账单编号。" }, { status: 400 });
    const db = await getDb();
    await db.delete(bills).where(and(eq(bills.id, payload.id), eq(bills.userId, user.id)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "账单暂时无法删除。" }, { status: 500 });
  }
}
