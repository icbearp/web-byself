export const dynamic = "force-dynamic";

async function getDatabase() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("D1 database binding is unavailable");
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS site_stats (key TEXT PRIMARY KEY NOT NULL, value INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  ).run();
  return env.DB;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const row = await db.prepare("SELECT value FROM site_stats WHERE key = ?").bind("visits").first<{ value: number }>();
    return Response.json({ count: row?.value ?? 0 }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ count: 0, unavailable: true }, { status: 503 });
  }
}

export async function POST() {
  try {
    const db = await getDatabase();
    await db.prepare(
      "INSERT INTO site_stats (key, value, updated_at) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = value + 1, updated_at = CURRENT_TIMESTAMP",
    ).bind("visits").run();
    const row = await db.prepare("SELECT value FROM site_stats WHERE key = ?").bind("visits").first<{ value: number }>();
    return Response.json({ count: row?.value ?? 1 }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ count: 0, unavailable: true }, { status: 503 });
  }
}
