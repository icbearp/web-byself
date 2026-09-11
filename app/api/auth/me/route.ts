import { getSessionUser } from "../../_lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    return Response.json({ user });
  } catch {
    return Response.json({ user: null });
  }
}
