import { eq } from "drizzle-orm";
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

    const db = await getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return Response.json({ error: "这个邮箱已经注册，请直接登录。" }, { status: 409 });

    const id = crypto.randomUUID();
    const salt = randomSalt();
    const role = email === await configuredAdminEmail() ? "admin" : "user";
    await db.insert(users).values({ id, email, passwordHash: await hashPassword(password, salt), passwordSalt: salt, role });
    const session = await createSession(id);
    return Response.json({ user: { id, email, role } }, { status: 201, headers: { "set-cookie": sessionCookie(session.token) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return Response.json({ error: message.includes("UNIQUE") ? "这个邮箱已经注册，请直接登录。" : "注册暂时失败，请稍后再试。" }, { status: message.includes("UNIQUE") ? 409 : 500 });
  }
}
