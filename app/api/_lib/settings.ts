import { getDb } from "../../../db";
import { siteSettings } from "../../../db/schema";
import { defaultSettings, normalizeSetting, settingsKeys, type SettingsKey, type SiteSettings } from "../../site-settings";

/** 读取首页设置：数据库里有的用数据库，没有或读取失败时用默认内容。 */
export async function loadSiteSettings(): Promise<SiteSettings> {
  const settings: SiteSettings = structuredClone(defaultSettings);
  try {
    const db = await getDb();
    const rows = await db.select().from(siteSettings);
    for (const row of rows) {
      if (!settingsKeys.includes(row.key as SettingsKey)) continue;
      try {
        const key = row.key as SettingsKey;
        (settings as Record<SettingsKey, unknown>)[key] = normalizeSetting(key, JSON.parse(row.value));
      } catch {
        // 单项损坏时保留默认值，不影响其他设置。
      }
    }
  } catch {
    // 数据库未绑定或表尚未创建：使用默认内容。
  }
  return settings;
}

export async function saveSetting(key: SettingsKey, value: unknown) {
  const normalized = normalizeSetting(key, value);
  const db = await getDb();
  const json = JSON.stringify(normalized);
  await db.insert(siteSettings)
    .values({ key, value: json })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: json, updatedAt: new Date().toISOString() } });
  return normalized;
}
