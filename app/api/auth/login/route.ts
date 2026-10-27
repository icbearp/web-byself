import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, hashPassword, normalizeEmail, sessionCookie } from "../../_lib/auth";
import { clearHits, clientIp, lockedFor, loginRules, recordHit, tooManyRequests } from "../../_lib/rate-limit";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";
    const rules = loginRules(clientIp(request), email);
    const wait = await lockedFor(rules);
    if (wait > 0) return tooManyRequests(wait);
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || (await hashPassword(password, user.passwordSalt)) !== user.passwordHash) {
      await recordHit(rules);
      return Response.json({ error: "邮箱或密码不正确。" }, { status: 401 });
    }
    if (user.disabled) return Response.json({ error: "这个账户已被停用，如有疑问请联系站长。" }, { status: 403 });
    await clearHits([rules[0].key]);
    const session = await createSession(user.id);
    return Response.json({ user: { id: user.id, email: user.email, role: user.role } }, { headers: { "set-cookie": sessionCookie(session.token) } });
  } catch {
    return Response.json({ error: "登录暂时失败，请稍后再试。" }, { status: 500 });
  }
}
