import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, hashPassword, normalizeEmail, sessionCookie } from "../../_lib/auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || (await hashPassword(password, user.passwordSalt)) !== user.passwordHash) {
      return Response.json({ error: "邮箱或密码不正确。" }, { status: 401 });
    }
    const session = await createSession(user.id);
    return Response.json({ user: { id: user.id, email: user.email, role: user.role } }, { headers: { "set-cookie": sessionCookie(session.token) } });
  } catch {
    return Response.json({ error: "登录暂时失败，请稍后再试。" }, { status: 500 });
  }
}
