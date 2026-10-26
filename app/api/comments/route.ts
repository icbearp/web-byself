import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { comments } from "../../../db/schema";
import { getSessionUser } from "../_lib/auth";
import { clientIp, lockedFor, postRules, recordHit, tooManyRequests } from "../_lib/rate-limit";

const contentTypes = new Set(["tutorial", "record", "article"]);
const commentCategories = new Set(["question", "correction", "addition", "experience", "suggestion", "reply"]);

function publicCommentFields() {
  return {
    id: comments.id,
    contentType: comments.contentType,
    contentId: comments.contentId,
    contentTitle: comments.contentTitle,
    category: comments.category,
    message: comments.message,
    authorName: comments.authorName,
    anchorText: comments.anchorText,
    anchorBlock: comments.anchorBlock,
    parentId: comments.parentId,
    createdAt: comments.createdAt,
    updatedAt: comments.updatedAt,
  };
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const unavailable = message.includes("Cloudflare D1 binding") || message.includes("no such table");
  return Response.json(
    { error: unavailable ? "文章讨论正在配置中，请稍后再试。" : "文章讨论暂时无法读取，请稍后再试。" },
    { status: unavailable ? 503 : 500 },
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const latest = url.searchParams.get("latest") === "1";
    const contentType = url.searchParams.get("contentType")?.trim() ?? "";
    const contentId = url.searchParams.get("contentId")?.trim() ?? "";
    const db = await getDb();

    if (latest) {
      const rows = await db.select(publicCommentFields()).from(comments).where(eq(comments.status, "published")).orderBy(desc(comments.createdAt)).limit(18);
      return Response.json({ comments: rows });
    }

    if (!contentTypes.has(contentType) || !contentId) return Response.json({ error: "缺少正确的内容位置。" }, { status: 400 });
    const rows = await db.select(publicCommentFields()).from(comments)
      .where(and(eq(comments.contentType, contentType), eq(comments.contentId, contentId), eq(comments.status, "published")))
      .orderBy(comments.createdAt)
      .limit(200);
    return Response.json({ comments: rows });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      contentType?: string;
      contentId?: string;
      contentTitle?: string;
      category?: string;
      message?: string;
      authorName?: string;
      anchorText?: string;
      anchorBlock?: string;
      parentId?: string;
      website?: string;
    };
    if (payload.website?.trim()) return Response.json({ ok: true, reviewRequired: true }, { status: 201 });

    const contentType = payload.contentType?.trim() ?? "";
    const contentId = payload.contentId?.trim().slice(0, 160) ?? "";
    const contentTitle = payload.contentTitle?.trim().slice(0, 160) ?? "";
    const category = commentCategories.has(payload.category ?? "") ? payload.category! : "question";
    const message = payload.message?.trim() ?? "";
    const anchorText = payload.anchorText?.trim().replace(/\s+/g, " ").slice(0, 360) ?? "";
    const anchorBlock = payload.anchorBlock?.trim().slice(0, 100) ?? "";
    const parentId = payload.parentId?.trim().slice(0, 80) || null;

    if (!contentTypes.has(contentType) || !contentId || !contentTitle) return Response.json({ error: "这条留言缺少文章位置，请刷新后重试。" }, { status: 400 });
    if (message.length < 2) return Response.json({ error: "请至少写下两个字。" }, { status: 400 });
    if (message.length > 2_000) return Response.json({ error: "留言请控制在 2000 字以内。" }, { status: 400 });

    const db = await getDb();
    const user = await getSessionUser(request);
    if (user?.role !== "admin") {
      const rules = postRules("comment", clientIp(request));
      const wait = await lockedFor(rules);
      if (wait > 0) return tooManyRequests(wait);
      await recordHit(rules);
    }
    if (parentId) {
      const [parent] = await db.select({ id: comments.id }).from(comments)
        .where(and(eq(comments.id, parentId), eq(comments.contentType, contentType), eq(comments.contentId, contentId), eq(comments.status, "published")))
        .limit(1);
      if (!parent) return Response.json({ error: "要回复的留言不存在或尚未公开。" }, { status: 400 });
    }

    const authorName = user?.role === "admin"
      ? "周多福"
      : payload.authorName?.trim().slice(0, 40) || (user ? "注册读者" : "匿名读者");
    const status = user?.role === "admin" ? "published" : "pending";
    const [created] = await db.insert(comments).values({
      id: crypto.randomUUID(),
      contentType,
      contentId,
      contentTitle,
      category,
      message,
      authorName,
      anchorText,
      anchorBlock,
      parentId,
      userId: user?.id ?? null,
      status,
    }).returning();
    return Response.json({ ok: true, comment: created, reviewRequired: status !== "published" }, { status: 201 });
  } catch (error) {
    return databaseError(error);
  }
}
