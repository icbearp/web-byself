import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { currentTokenHash, deleteUserSessions, getSessionUser, hashPassword, randomSalt } from "../../_lib/auth";
import { clearHits, lockedFor, recordHit, tooManyRequests } from "../../_lib/rate-limit";

/** 修改密码：先核对当前密码；成功后保留本机登录，其他设备全部下线。 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    const payload = (await request.json()) as { current?: string; next?: string };
    const current = payload.current ?? "";
    const next = payload.next ?? "";
    if (next.length < 8) return Response.json({ error: "新密码至少需要 8 位。" }, { status: 400 });
    if (next.length > 200) return Response.json({ error: "新密码过长。" }, { status: 400 });
    if (next === current) return Response.json({ error: "新密码不能和当前密码相同。" }, { status: 400 });

    const rules = [{ key: `password:user:${user.id}`, max: 5, windowSeconds: 15 * 60 }];
    const wait = await lockedFor(rules);
    if (wait > 0) return tooManyRequests(wait);

    const db = await getDb();
    const [row] = await db.select({ hash: users.passwordHash, salt: users.passwordSalt }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!row || (await hashPassword(current, row.salt)) !== row.hash) {
      await recordHit(rules);
      return Response.json({ error: "当前密码不正确。" }, { status: 400 });
    }

    const salt = randomSalt();
    await db.update(users).set({ passwordHash: await hashPassword(next, salt), passwordSalt: salt }).where(eq(users.id, user.id));
    await deleteUserSessions(user.id, await currentTokenHash(request));
    await clearHits([rules[0].key]);
    return Response.json({ ok: true, message: "密码已修改，其他设备已全部下线。" });
  } catch {
    return Response.json({ error: "密码暂时无法修改，请稍后再试。" }, { status: 500 });
  }
}
