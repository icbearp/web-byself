import { and, eq, gt, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { sessions, users } from "../../../db/schema";

export const SESSION_COOKIE = "zhouduofu_session";
const SESSION_DAYS = 30;

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function hashText(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: base64ToBytes(salt), iterations: 100_000, hash: "SHA-256" }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}

export function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

function cookieValue(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`));
  return match?.slice(`${SESSION_COOKIE}=`.length) ?? "";
}

export async function deleteSession(request: Request) {
  const token = cookieValue(request);
  if (!token) return;
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, await hashText(token)));
}

export async function getSessionUser(request: Request) {
  const token = cookieValue(request);
  if (!token) return null;
  const db = await getDb();
  const tokenHash = await hashText(token);
  const [row] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, Math.floor(Date.now() / 1000)), eq(users.disabled, 0)))
    .limit(1);
  return row ?? null;
}

/** 当前请求所用登录凭证的哈希；用于“退出其他设备”时保留本机。 */
export async function currentTokenHash(request: Request) {
  const token = cookieValue(request);
  return token ? hashText(token) : "";
}

/** 让某个用户在所有设备下线；传入 keepTokenHash 时保留那一个会话。 */
export async function deleteUserSessions(userId: string, keepTokenHash = "") {
  const db = await getDb();
  await db.delete(sessions).where(keepTokenHash ? and(eq(sessions.userId, userId), ne(sessions.tokenHash, keepTokenHash)) : eq(sessions.userId, userId));
}

export async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  return user?.role === "admin" ? user : null;
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const db = await getDb();
  await db.insert(sessions).values({ tokenHash: await hashText(token), userId, expiresAt });
  return { token, expiresAt };
}

export function sessionCookie(token: string, maxAge = SESSION_DAYS * 24 * 60 * 60) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function configuredAdminEmail() {
  try {
    const { env } = await import("cloudflare:workers");
    return normalizeEmail(String((env as unknown as Record<string, unknown>).ADMIN_EMAIL ?? ""));
  } catch {
    return "";
  }
}
