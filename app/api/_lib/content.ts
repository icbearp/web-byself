import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { changelog, entries } from "../../../db/schema";
import { recordCategoryOptions, type AdminEntry, type ContentSource, type EntryType, type SiteContent } from "../../content-types";
import tutorialsData from "../../../content/tutorials.json";
import recordsData from "../../../content/records.json";
import changelogData from "../../../content/changelog.json";

type EntryRow = typeof entries.$inferSelect;

const recordCategories = new Set<string>(recordCategoryOptions.map((item) => item.key));

function parseList<T>(value: string, fallback: T[] = []): T[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

export function today() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

export function splitParagraphs(content: string) {
  return content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function toAdminEntry(row: EntryRow): AdminEntry {
  return {
    type: row.type === "record" ? "record" : "tutorial",
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    stage: row.stage,
    tags: parseList<string>(row.tags),
    content: row.content,
    takeaway: row.takeaway,
    sources: parseList<ContentSource>(row.sources),
    date: row.date,
    status: row.status === "published" ? "published" : "draft",
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** 校验并整理后台提交的内容，规则与原本地发布工具一致。 */
export function normalizeEntryInput(input: Record<string, unknown>) {
  const type: EntryType = input.type === "record" ? "record" : "tutorial";
  const title = String(input.title ?? "").trim().slice(0, 120);
  const id = (String(input.id ?? "").trim() || slugify(title)).slice(0, 100);
  if (!title) throw new Error("请填写标题。");
  if (!id) throw new Error("请填写内容编号。");
  const sources = Array.isArray(input.sources)
    ? (input.sources as Array<Partial<ContentSource>>)
      .filter((item) => item?.label && /^https?:\/\//.test(String(item.href ?? "")))
      .slice(0, 30)
      .map((item) => ({ label: String(item.label).trim().slice(0, 120), href: String(item.href).trim().slice(0, 1000) }))
    : [];
  const tags = Array.isArray(input.tags) ? input.tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 12) : [];
  const summary = String(input.summary ?? "").trim().slice(0, 300);
  const content = String(input.content ?? "").trim().slice(0, 80_000);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date ?? "")) ? String(input.date) : today();

  if (type === "record") {
    const category = recordCategories.has(String(input.category)) ? String(input.category) : "life-efficiency";
    return {
      type, id, title, summary, content, date, category, stage: null,
      tags: JSON.stringify(tags),
      sources: JSON.stringify(sources),
      takeaway: (String(input.takeaway ?? "").trim() || summary || "这条记录仍在继续整理。").slice(0, 500),
    };
  }
  return {
    type, id, title, summary, content, date,
    category: String(input.category ?? "").trim().slice(0, 30) || "未分类",
    stage: null,
    tags: JSON.stringify(tags),
    sources: JSON.stringify(sources),
    takeaway: "",
  };
}

function bundledContent(): SiteContent {
  return {
    tutorials: tutorialsData as SiteContent["tutorials"],
    records: recordsData as SiteContent["records"],
    changelog: changelogData as SiteContent["changelog"],
    source: "bundled",
  };
}

/**
 * 网站读取内容：D1 可用且已导入时以数据库为准；数据库未绑定、尚未迁移或尚无内容时，
 * 退回仓库里的 content/*.json，保证网站始终能打开。
 */
export async function loadSiteContent(): Promise<SiteContent> {
  try {
    const db = await getDb();
    const [rows, logs] = await Promise.all([
      db.select().from(entries).where(eq(entries.status, "published")).orderBy(desc(entries.date), desc(entries.updatedAt)),
      db.select().from(changelog).orderBy(desc(changelog.id)).limit(60),
    ]);
    if (rows.length === 0) return bundledContent();
    const items = rows.map(toAdminEntry);
    return {
      tutorials: items.filter((item) => item.type === "tutorial").map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        tags: item.tags,
        publishedAt: item.publishedAt ?? item.date,
        updatedAt: item.updatedAt.slice(0, 10),
        content: item.content,
        sources: item.sources,
      })),
      records: items.filter((item) => item.type === "record").map((item) => ({
        id: item.id,
        date: item.date,
        category: item.category,
        ...(item.stage ? { stage: item.stage } : {}),
        tags: item.tags,
        title: item.title,
        summary: item.summary,
        paragraphs: splitParagraphs(item.content),
        takeaway: item.takeaway,
        content: item.content,
        publishedAt: item.publishedAt ?? item.date,
        updatedAt: item.updatedAt.slice(0, 10),
        sources: item.sources,
      })),
      changelog: logs.map((item) => ({ date: item.date, title: item.title, detail: item.detail })),
      source: "database",
    };
  } catch {
    return bundledContent();
  }
}

export async function findEntry(type: EntryType, id: string) {
  const db = await getDb();
  const [row] = await db.select().from(entries).where(and(eq(entries.type, type), eq(entries.id, id))).limit(1);
  return row ?? null;
}
