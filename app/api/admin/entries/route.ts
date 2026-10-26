import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { changelog, entries } from "../../../../db/schema";
import { findEntry, normalizeEntryInput, toAdminEntry, today } from "../../_lib/content";
import { getSessionUser } from "../../_lib/auth";

async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  return user?.role === "admin" ? user : null;
}

function databaseError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("no such table")) return Response.json({ error: "内容表还没有创建，请先在 D1 执行 drizzle/0004 和 0005 迁移。" }, { status: 503 });
  if (message.includes("Cloudflare D1 binding")) return Response.json({ error: "数据库 DB 尚未绑定。" }, { status: 503 });
  return Response.json({ error: fallback }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const db = await getDb();
    const [rows, logs] = await Promise.all([
      db.select().from(entries).orderBy(desc(entries.updatedAt)),
      db.select().from(changelog).orderBy(desc(changelog.id)).limit(30),
    ]);
    return Response.json({ entries: rows.map(toAdminEntry), changelog: logs });
  } catch (error) {
    return databaseError(error, "内容暂时无法读取。");
  }
}

/** 保存内容。action：save 保持当前状态（新内容为草稿）、publish 发布、unpublish 下线为草稿。 */
export async function POST(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const payload = (await request.json()) as { action?: string; entry?: Record<string, unknown>; isNew?: boolean };
    const action = payload.action === "publish" || payload.action === "unpublish" ? payload.action : "save";
    let entry;
    try {
      entry = normalizeEntryInput(payload.entry ?? {});
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "内容格式不正确。" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await findEntry(entry.type, entry.id);
    if (existing && payload.isNew) return Response.json({ error: "这个内容编号已经存在，请换一个。" }, { status: 409 });

    const wasPublished = existing?.status === "published";
    const status = action === "publish" ? "published" : action === "unpublish" ? "draft" : existing?.status ?? "draft";
    const publishedAt = existing?.publishedAt ?? (status === "published" ? today() : null);

    let saved;
    if (existing) {
      [saved] = await db.update(entries)
        .set({ ...entry, status, publishedAt, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(eq(entries.type, entry.type), eq(entries.id, entry.id)))
        .returning();
    } else {
      [saved] = await db.insert(entries).values({ ...entry, status, publishedAt }).returning();
    }

    if (action === "publish") {
      const label = entry.type === "record" ? "随心记录" : "教程";
      await db.insert(changelog).values({
        date: today(),
        title: `${wasPublished ? "更新" : "发布"}${label}：${entry.title}`,
        detail: entry.summary || entry.takeaway || `${label}内容已更新。`,
      });
    }

    const message = action === "publish" ? (wasPublished ? "已更新，网站立即生效。" : "已发布，网站立即生效。") : action === "unpublish" ? "已下线，网站不再显示。" : "已保存。";
    return Response.json({ ok: true, entry: toAdminEntry(saved), message });
  } catch (error) {
    return databaseError(error, "内容暂时无法保存。");
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const url = new URL(request.url);
    const type = url.searchParams.get("type") === "record" ? "record" : "tutorial";
    const id = url.searchParams.get("id")?.trim() ?? "";
    if (!id) return Response.json({ error: "缺少内容编号。" }, { status: 400 });
    const db = await getDb();
    const [deleted] = await db.delete(entries).where(and(eq(entries.type, type), eq(entries.id, id))).returning();
    if (!deleted) return Response.json({ error: "没有找到这条内容。" }, { status: 404 });
    const label = type === "record" ? "随心记录" : "教程";
    await db.delete(changelog).where(inArray(changelog.title, [`发布${label}：${deleted.title}`, `更新${label}：${deleted.title}`]));
    return Response.json({ ok: true, message: "已删除。" });
  } catch (error) {
    return databaseError(error, "内容暂时无法删除。");
  }
}
