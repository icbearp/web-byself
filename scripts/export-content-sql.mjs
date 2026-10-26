// 把 content/*.json 中已发布的教程、随心记录和更新日志导出为 D1 一次性导入 SQL。
// 用法：node scripts/export-content-sql.mjs  → 生成 drizzle/0005_seed_content.sql
// 使用 INSERT OR IGNORE，重复执行不会覆盖后台里已经修改过的内容。
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const quote = (value) => value === null || value === undefined ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;

const tutorials = await readJson("content/tutorials.json");
const records = await readJson("content/records.json");
const changelog = await readJson("content/changelog.json");

const rows = [
  ...tutorials.map((item) => ({
    type: "tutorial",
    id: item.id,
    title: item.title,
    summary: item.summary ?? "",
    category: item.category ?? "未分类",
    stage: null,
    tags: item.tags ?? [],
    content: item.content ?? "",
    takeaway: "",
    sources: item.sources ?? [],
    date: item.publishedAt ?? "",
    publishedAt: item.publishedAt ?? null,
    updatedAt: item.updatedAt ?? item.publishedAt ?? null,
  })),
  ...records.map((item) => ({
    type: "record",
    id: item.id,
    title: item.title,
    summary: item.summary ?? "",
    category: item.category ?? "life-efficiency",
    stage: item.stage ?? null,
    tags: item.tags ?? [],
    content: item.content || (item.paragraphs ?? []).join("\n\n"),
    takeaway: item.takeaway ?? "",
    sources: item.sources ?? [],
    date: item.date ?? item.publishedAt ?? "",
    publishedAt: item.publishedAt ?? item.date ?? null,
    updatedAt: item.updatedAt ?? item.date ?? null,
  })),
];

const columns = ["type", "id", "title", "summary", "category", "stage", "tags", "content", "takeaway", "sources", "date", "status", "published_at", "updated_at"];
const statements = rows.map((row) => `INSERT OR IGNORE INTO \`entries\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${[
  row.type, row.id, row.title, row.summary, row.category, row.stage, JSON.stringify(row.tags), row.content, row.takeaway, JSON.stringify(row.sources), row.date, "published", row.publishedAt, row.updatedAt ?? row.publishedAt,
].map(quote).join(", ")});`);

// 更新日志按时间从旧到新插入，使自增 id 与时间顺序一致；只在日志表为空时导入。
const changelogStatements = [...changelog].reverse().map((item) => `INSERT INTO \`changelog\` (\`date\`, \`title\`, \`detail\`) SELECT ${quote(item.date)}, ${quote(item.title)}, ${quote(item.detail ?? "")} WHERE NOT EXISTS (SELECT 1 FROM \`changelog\` WHERE \`title\` = ${quote(item.title)} AND \`date\` = ${quote(item.date)});`);

const header = "-- 由 scripts/export-content-sql.mjs 生成：把 content/*.json 导入 D1。可以重复执行，不会覆盖后台已修改的内容。\n";
await writeFile(new URL("drizzle/0005_seed_content.sql", root), `${header}${[...statements, ...changelogStatements].join("\n")}\n`, "utf8");
process.stdout.write(`已生成 drizzle/0005_seed_content.sql：${rows.length} 条内容，${changelog.length} 条更新日志\n`);
