import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
