import { deleteSession, SESSION_COOKIE, sessionCookie } from "../../_lib/auth";

export async function POST(request: Request) {
  try {
    await deleteSession(request);
  } catch {
    // Clearing the browser cookie is still enough to end this device's session.
  }
  return Response.json({ ok: true }, { headers: { "set-cookie": sessionCookie("", 0), "x-cleared-cookie": SESSION_COOKIE } });
}
