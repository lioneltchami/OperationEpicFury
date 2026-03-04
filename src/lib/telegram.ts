import { getRedis, isRedisAvailable } from "@/lib/redis";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const FILE_CACHE_PREFIX = "tg:file:";
const FILE_CACHE_TTL = 3600; // 1 hour (Telegram file paths expire after ~1h)

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

export async function getFileCached(fileId: string): Promise<string> {
  if (isRedisAvailable()) {
    const redis = getRedis();
    const cached = await redis.get(`${FILE_CACHE_PREFIX}${fileId}`);
    if (cached) return cached;
  }

  const filePath = await getFile(fileId);

  if (isRedisAvailable()) {
    const redis = getRedis();
    await redis.set(
      `${FILE_CACHE_PREFIX}${fileId}`,
      filePath,
      "EX",
      FILE_CACHE_TTL,
    );
  }

  return filePath;
}

export function getFileUrl(filePath: string): string {
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
}
