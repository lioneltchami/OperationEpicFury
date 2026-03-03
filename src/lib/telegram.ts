const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(
  chatId: number | string,
  text: string,
  replyToMessageId?: number,
  parseMode: "Markdown" | "HTML" = "Markdown",
) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      ...(replyToMessageId && { reply_to_message_id: replyToMessageId }),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`Telegram sendMessage failed ${res.status}: ${body}`);
  }
}

export async function getFile(fileId: string): Promise<string> {
  const res = await fetch(
    `${TELEGRAM_API}/getFile?file_id=${encodeURIComponent(fileId)}`,
  );
  if (!res.ok) throw new Error(`getFile failed: ${res.status}`);
  const data = await res.json();
  return data.result.file_path as string;
}

export function getFileUrl(filePath: string): string {
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
}
