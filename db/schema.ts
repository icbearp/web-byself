import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull().default("suggestion"),
  message: text("message").notNull(),
  contact: text("contact").notNull().default(""),
  page: text("page").notNull().default("home"),
  status: text("status").notNull().default("new"),
  userId: text("user_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const bills = sqliteTable("bills", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const siteStats = sqliteTable("site_stats", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  contentType: text("content_type").notNull(),
  contentId: text("content_id").notNull(),
  contentTitle: text("content_title").notNull(),
  category: text("category").notNull().default("question"),
  message: text("message").notNull(),
  authorName: text("author_name").notNull().default("匿名读者"),
  anchorText: text("anchor_text").notNull().default(""),
  anchorBlock: text("anchor_block").notNull().default(""),
  parentId: text("parent_id"),
  userId: text("user_id").references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_comments_content_status_created").on(table.contentType, table.contentId, table.status, table.createdAt),
  index("idx_comments_parent_id").on(table.parentId),
]);

export const entries = sqliteTable("entries", {
  type: text("type").notNull(),
  id: text("id").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  category: text("category").notNull().default(""),
  stage: text("stage"),
  tags: text("tags").notNull().default("[]"),
  content: text("content").notNull().default(""),
  takeaway: text("takeaway").notNull().default(""),
  sources: text("sources").notNull().default("[]"),
  date: text("date").notNull().default(""),
  status: text("status").notNull().default("draft"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.type, table.id] }),
  index("idx_entries_type_status_date").on(table.type, table.status, table.date),
]);

export const changelog = sqliteTable("changelog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: integer("window_start").notNull(),
  lockedUntil: integer("locked_until").notNull().default(0),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 后台上传的小图片（头像、二维码），浏览器端压缩后以 base64 保存，经 /api/media/[id] 输出。
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  data: text("data").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
