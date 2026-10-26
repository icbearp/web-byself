import { eq } from "drizzle-orm";
import { clientIp, lockedFor, recordHit, registerRules, tooManyRequests } from "../../_lib/rate-limit";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { configuredAdminEmail, createSession, hashPassword, normalizeEmail, randomSalt, sessionCookie } from "../../_lib/auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "请输入有效邮箱。" }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "密码至少需要8位。" }, { status: 400 });
    const rules = registerRules(clientIp(request));
    const wait = await lockedFor(rules);
    if (wait > 0) return tooManyRequests(wait);
    await recordHit(rules);

    const db = await getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return Response.json({ error: "这个邮箱已经注册，请直接登录。" }, { status: 409 });

    const id = crypto.randomUUID();
    const salt = randomSalt();
    // 只在网站还没有管理员时，才把 ADMIN_EMAIL 注册为管理员，避免改动变量后被他人抢注。
    const [existingAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
    const role = !existingAdmin && email === await configuredAdminEmail() ? "admin" : "user";
    await db.insert(users).values({ id, email, passwordHash: await hashPassword(password, salt), passwordSalt: salt, role });
    const session = await createSession(id);
    return Response.json({ user: { id, email, role } }, { status: 201, headers: { "set-cookie": sessionCookie(session.token) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return Response.json({ error: message.includes("UNIQUE") ? "这个邮箱已经注册，请直接登录。" : "注册暂时失败，请稍后再试。" }, { status: message.includes("UNIQUE") ? 409 : 500 });
  }
}
