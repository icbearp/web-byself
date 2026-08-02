import { getDb } from "../../../db";
import { feedback } from "../../../db/schema";

const feedbackTypes = new Set(["suggestion", "question", "experience"]);

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = message.includes("Cloudflare D1 binding") || message.includes("no such table") ? 503 : 500;
  return Response.json(
    { error: status === 503 ? "留言服务正在配置中，请稍后再试；也可以先通过页面上的联系方式联系我。" : "留言暂时没有提交成功，请稍后再试。" },
    { status },
  );
}

export async function GET() {
  // The public site may submit feedback, but must never expose other users'
  // messages. An authenticated admin inbox will be added with the account flow.
  return Response.json({ error: "需要管理员登录后查看留言。" }, { status: 401 });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { type?: string; message?: string; contact?: string; page?: string; website?: string };
    if (payload.website?.trim()) return Response.json({ ok: true }, { status: 201 });

    const type = feedbackTypes.has(payload.type ?? "") ? payload.type! : "suggestion";
    const message = payload.message?.trim() ?? "";
    const contact = payload.contact?.trim() ?? "";
    const page = payload.page?.trim().slice(0, 80) || "home";

    if (message.length < 2) return Response.json({ error: "请至少写下两句话或一个具体建议。" }, { status: 400 });
    if (message.length > 2_000) return Response.json({ error: "留言请控制在 2000 字以内。" }, { status: 400 });
    if (contact.length > 200) return Response.json({ error: "联系方式过长，请检查后重试。" }, { status: 400 });

    const db = await getDb();
    const [created] = await db.insert(feedback).values({ type, message, contact, page }).returning();
    return Response.json({ ok: true, feedback: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
