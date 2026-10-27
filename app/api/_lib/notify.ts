// 新留言 / 新讨论推送到 Telegram。需要在 Cloudflare 项目里配置两个 Secret：
// TELEGRAM_BOT_TOKEN（机器人令牌）和 TELEGRAM_CHAT_ID（接收消息的会话 ID）。
// 未配置或发送失败时静默跳过，不影响读者提交。

async function telegramConfig() {
  try {
    const { env } = await import("cloudflare:workers");
    const record = env as unknown as Record<string, unknown>;
    const token = String(record.TELEGRAM_BOT_TOKEN ?? "").trim();
    const chatId = String(record.TELEGRAM_CHAT_ID ?? "").trim();
    return token && chatId ? { token, chatId } : null;
  } catch {
    return null;
  }
}

export async function notifyOwner(lines: Array<string | null | undefined | false>) {
  const config = await telegramConfig();
  if (!config) return false;
  const text = lines.filter(Boolean).join("\n").slice(0, 3500);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text, disable_web_page_preview: true }),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export const feedbackTypeLabels: Record<string, string> = {
  suggestion: "内容建议",
  question: "提问",
  experience: "使用体验",
  cooperation: "商务合作",
};
