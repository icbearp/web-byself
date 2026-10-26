import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { rateLimits } from "../../../db/schema";

type Rule = { key: string; max: number; windowSeconds: number; lockSeconds?: number };

export function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function now() {
  return Math.floor(Date.now() / 1000);
}

/** 返回仍需等待的秒数；0 表示可以继续。限流表不可用时放行，避免把网站整体锁死。 */
export async function lockedFor(rules: Rule[]) {
  try {
    const db = await getDb();
    const rows = await db.select().from(rateLimits).where(inArray(rateLimits.key, rules.map((rule) => rule.key)));
    const current = now();
    return rows.reduce((wait, row) => Math.max(wait, row.lockedUntil - current), 0);
  } catch {
    return 0;
  }
}

/** 记一次失败（或一次提交）；窗口内次数达到上限即锁定一段时间。 */
export async function recordHit(rules: Rule[]) {
  try {
    const db = await getDb();
    const current = now();
    for (const rule of rules) {
      const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, rule.key)).limit(1);
      const fresh = !row || current - row.windowStart > rule.windowSeconds;
      const count = fresh ? 1 : row.count + 1;
      const lockedUntil = count >= rule.max ? current + (rule.lockSeconds ?? rule.windowSeconds) : (fresh ? 0 : row.lockedUntil);
      const values = { key: rule.key, count, windowStart: fresh ? current : row.windowStart, lockedUntil };
      await db.insert(rateLimits).values(values).onConflictDoUpdate({ target: rateLimits.key, set: values });
    }
  } catch {
    // 限流只是附加保护，记录失败不影响正常请求。
  }
}

export async function clearHits(keys: string[]) {
  try {
    const db = await getDb();
    await db.delete(rateLimits).where(inArray(rateLimits.key, keys));
  } catch {
    // 同上。
  }
}

export function tooManyRequests(waitSeconds: number) {
  const minutes = Math.max(1, Math.ceil(waitSeconds / 60));
  return Response.json({ error: `尝试次数过多，请 ${minutes} 分钟后再试。` }, { status: 429, headers: { "retry-after": String(waitSeconds) } });
}

export const loginRules = (ip: string, email: string): Rule[] => [
  { key: `login:email:${email}`, max: 5, windowSeconds: 15 * 60, lockSeconds: 15 * 60 },
  { key: `login:ip:${ip}`, max: 20, windowSeconds: 15 * 60, lockSeconds: 30 * 60 },
];

export const registerRules = (ip: string): Rule[] => [{ key: `register:ip:${ip}`, max: 5, windowSeconds: 60 * 60 }];
export const postRules = (scope: string, ip: string): Rule[] => [{ key: `${scope}:ip:${ip}`, max: 10, windowSeconds: 10 * 60 }];
