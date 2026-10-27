import { currentTokenHash, deleteUserSessions, getSessionUser, sessionCookie } from "../../_lib/auth";

/** 退出所有设备。keepCurrent 为 true 时只让其他设备下线，本机保持登录。 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    const payload = (await request.json().catch(() => ({}))) as { keepCurrent?: boolean };
    if (payload.keepCurrent) {
      await deleteUserSessions(user.id, await currentTokenHash(request));
      return Response.json({ ok: true, message: "其他设备已全部下线。" });
    }
    await deleteUserSessions(user.id);
    return Response.json({ ok: true, message: "已在所有设备退出登录。" }, { headers: { "set-cookie": sessionCookie("", 0) } });
  } catch {
    return Response.json({ error: "暂时无法完成，请稍后再试。" }, { status: 500 });
  }
}
