import { getSessionUser } from "../../_lib/auth";
import { loadSiteSettings, saveSetting } from "../../_lib/settings";
import { settingsKeys, type SettingsKey } from "../../../site-settings";

async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  return user?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    return Response.json({ settings: await loadSiteSettings() });
  } catch {
    return Response.json({ error: "设置暂时无法读取。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await requireAdmin(request)) return Response.json({ error: "需要管理员登录。" }, { status: 403 });
    const payload = (await request.json()) as { key?: string; value?: unknown };
    if (!settingsKeys.includes(payload.key as SettingsKey)) return Response.json({ error: "未知的设置项。" }, { status: 400 });
    const value = await saveSetting(payload.key as SettingsKey, payload.value);
    return Response.json({ ok: true, value, message: "已保存，首页立即生效。" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("no such table")) return Response.json({ error: "设置表还没有创建，请先在 D1 执行 drizzle/0007_site_settings.sql。" }, { status: 503 });
    return Response.json({ error: "设置暂时无法保存。" }, { status: 500 });
  }
}
