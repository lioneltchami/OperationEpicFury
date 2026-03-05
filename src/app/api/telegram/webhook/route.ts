import { type NextRequest, NextResponse } from "next/server";
import type { MediaItem } from "@/data/timeline";
import { dispatchGitHubAction } from "@/lib/github";
import { bufferMediaItem } from "@/lib/kv";
import { sendMessage } from "@/lib/telegram";

interface TelegramPhotoSize {
  file_id: string;
  width: number;
  height: number;
}

interface TelegramVideo {
  file_id: string;
  width?: number;
  height?: number;
  duration?: number;
  mime_type?: string;
  thumbnail?: { file_id: string };
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number; username?: string };
  from?: { id: number };
  date: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  video?: TelegramVideo;
  animation?: TelegramVideo;
  media_group_id?: string;
  reply_to_message?: TelegramMessage;
  forward_origin?: {
    type: string;
    date?: number;
    chat?: { username?: string };
    message_id?: number;
  };
  forward_date?: number;
  entities?: TelegramEntity[];
  caption_entities?: TelegramEntity[];
}

interface TelegramEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Convert a Unix timestamp (seconds) to "YYYY-MM-DD HH:MM" in ET */
function unixToET(unix: number): string {
  const d = new Date(unix * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function extractMedia(message: TelegramMessage): MediaItem | null {
  if (
    message.photo &&
    Array.isArray(message.photo) &&
    message.photo.length > 0
  ) {
    const largest = message.photo[message.photo.length - 1];
    return {
      fileId: largest.file_id,
      type: "photo",
      width: largest.width,
      height: largest.height,
    };
  }

  const video = message.video ?? message.animation;
  if (video) {
    return {
      fileId: video.file_id,
      type: "video",
      thumbnailFileId: video.thumbnail?.file_id,
      width: video.width,
      height: video.height,
      duration: video.duration,
      mimeType: video.mime_type,
    };
  }

  return null;
}

/** Match x.com or twitter.com status URLs */
const TWEET_URL_RE =
  /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/(\w+)\/status\/(\d+)/;

interface TweetData {
  text: string;
  authorName: string;
  authorHandle: string;
  timestampET: string;
  sourceUrl: string;
  media: MediaItem[];
}

async function fetchTweet(url: string): Promise<TweetData | null> {
  const match = url.match(TWEET_URL_RE);
  if (!match) return null;

  const [, user, statusId] = match;
  const apiUrl = `https://api.fxtwitter.com/${user}/status/${statusId}`;

  try {
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "TelegramBot" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const tweet = data?.tweet;
    if (!tweet) return null;

    const timestampET = tweet.created_timestamp
      ? unixToET(tweet.created_timestamp)
      : "";

    const media: MediaItem[] = [];
    if (tweet.media?.photos) {
      for (const photo of tweet.media.photos) {
        media.push({
          fileId: "",
          type: "photo",
          url: photo.url,
          width: photo.width,
          height: photo.height,
        });
      }
    }
    if (tweet.media?.videos) {
      for (const video of tweet.media.videos) {
        media.push({
          fileId: "",
          type: "video",
          url: video.url,
          thumbnailFileId: undefined,
          width: video.width,
          height: video.height,
          duration: video.duration,
          mimeType: video.format ?? "video/mp4",
        });
      }
    }

    return {
      text: tweet.text ?? "",
      authorName: tweet.author?.name ?? user,
      authorHandle: tweet.author?.screen_name ?? user,
      timestampET,
      sourceUrl: url,
      media,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 1. Verify Telegram secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse update
  const update = await req.json();
  const message: TelegramMessage | undefined =
    update.message ?? update.channel_post;
  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const messageId = message.message_id;
  const userId = String(message.from?.id ?? "");

  // 3. Determine if this is an auto-monitored channel post
  const isChannelPost = !!update.channel_post;
  const allowedChannels = (process.env.TELEGRAM_ALLOWED_CHANNELS ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (isChannelPost) {
    // Channel posts have no `from` user — check against channel allowlist instead
    if (!allowedChannels.includes(String(chatId))) {
      // Silently ignore posts from non-allowlisted channels (can't DM a channel)
      return NextResponse.json({ ok: true });
    }
    // ✅ Allowed channel — fall through to process as news (skip user commands)
  } else {
    // 3b. Normal user message — check user allowlist
    const allowed = (process.env.TELEGRAM_ALLOWED_USERS ?? "")
      .split(",")
      .map((s: string) => s.trim());
    if (!allowed.includes(userId)) {
      await sendMessage(chatId, "403 Forbidden", messageId);
      return NextResponse.json({ ok: true });
    }

    // 3c. Handle /info command — dump replied-to message details (user only)
    const cmdText = (message.text ?? "").trim();
    if (cmdText === "/info") {
      const target = message.reply_to_message;
      if (!target) {
        await sendMessage(
          chatId,
          "Reply to a message with /info to inspect it.",
          messageId,
        );
        return NextResponse.json({ ok: true });
      }
      const dump = JSON.stringify(target, null, 2);
      const truncated =
        dump.length > 4000 ? dump.slice(0, 4000) + "\n..." : dump;
      await sendMessage(
        chatId,
        `<pre>${escapeHtml(truncated)}</pre>`,
        messageId,
        "HTML",
      );
      return NextResponse.json({ ok: true });
    }

    // 3c. Handle /x command — process a tweet URL
    if (cmdText.startsWith("/x ")) {
      const tweetUrl = cmdText.slice(3).trim();
      if (!TWEET_URL_RE.test(tweetUrl)) {
        await sendMessage(
          chatId,
          "Invalid URL. Use: /x https://x.com/user/status/123",
          messageId,
        );
        return NextResponse.json({ ok: true });
      }

      const tweet = await fetchTweet(tweetUrl);
      if (!tweet) {
        await sendMessage(
          chatId,
          "Failed to fetch tweet. Try again.",
          messageId,
        );
        return NextResponse.json({ ok: true });
      }

      if (!process.env.GH_PAT) {
        await sendMessage(chatId, "Bot misconfigured (no GH_PAT).", messageId);
        return NextResponse.json({ ok: true });
      }

      const dispatchText = `[Tweet by ${tweet.authorName} (@${tweet.authorHandle})]\n\n${tweet.text}`;
      const tweetMedia =
        tweet.media.length > 0 ? JSON.stringify(tweet.media) : undefined;

      const ok = await dispatchGitHubAction("tweet_news", {
        text: dispatchText,
        urls: tweetUrl,
        timestamp_et: tweet.timestampET,
        chat_id: chatId,
        message_id: messageId,
        media: tweetMedia,
        source_url: tweetUrl,
      });

      if (!ok) {
        await sendMessage(chatId, "Failed to dispatch. Try again.", messageId);
        return NextResponse.json({ ok: true });
      }

      await sendMessage(
        chatId,
        `Processing tweet by @${tweet.authorHandle}...`,
        messageId,
      );
      return NextResponse.json({ ok: true });
    }

    // 3d. Handle /news command — process an external news URL
    if (cmdText.startsWith("/news ")) {
      const newsUrl = cmdText.slice(6).trim();
      if (TWEET_URL_RE.test(newsUrl)) {
        await sendMessage(
          chatId,
          "That's a tweet URL. Use /x instead.",
          messageId,
        );
        return NextResponse.json({ ok: true });
      }
      let parsed: URL;
      try {
        parsed = new URL(newsUrl);
      } catch {
        await sendMessage(
          chatId,
          "Invalid URL. Use: /news https://reuters.com/...",
          messageId,
        );
        return NextResponse.json({ ok: true });
      }
      if (!parsed.protocol.startsWith("http")) {
        await sendMessage(
          chatId,
          "Invalid URL. Must start with http:// or https://",
          messageId,
        );
        return NextResponse.json({ ok: true });
      }

      if (!process.env.GH_PAT) {
        await sendMessage(chatId, "Bot misconfigured (no GH_PAT).", messageId);
        return NextResponse.json({ ok: true });
      }

      const ok = await dispatchGitHubAction("external_news", {
        url: newsUrl,
        chat_id: chatId,
        message_id: messageId,
      });

      if (!ok) {
        await sendMessage(chatId, "Failed to dispatch. Try again.", messageId);
        return NextResponse.json({ ok: true });
      }

      await sendMessage(
        chatId,
        `Processing news article: ${parsed.hostname}...`,
        messageId,
      );
      return NextResponse.json({ ok: true });
    }

    // 3e. If message has URLs but no command and is not forwarded, reject
    const hasUrls = (message.entities ?? message.caption_entities ?? []).some(
      (e: TelegramEntity) => e.type === "url" || e.type === "text_link",
    );
    if (hasUrls && !message.forward_origin) {
      await sendMessage(
        chatId,
        "Use /news <url> for news articles or /x <url> for tweets.",
        messageId,
      );
      return NextResponse.json({ ok: true });
    }
  } // end else (user message)

  // 4. Extract text, URLs, and media (shared: channel posts + user forwarded messages)
  const text = message.text ?? message.caption ?? "";
  const urls: string[] = [];

  const entities = message.entities ?? message.caption_entities ?? [];
  for (const entity of entities) {
    if (entity.type === "url") {
      urls.push(text.slice(entity.offset, entity.offset + entity.length));
    } else if (entity.type === "text_link" && entity.url) {
      urls.push(entity.url);
    }
  }

  const forwardOrigin = message.forward_origin
    ? JSON.stringify(message.forward_origin)
    : undefined;

  // Build the Telegram message link for forwarded channel messages
  let forwardMessageLink: string | undefined;
  if (
    message.forward_origin?.type === "channel" &&
    message.forward_origin.chat?.username &&
    message.forward_origin.message_id
  ) {
    forwardMessageLink = `https://t.me/${message.forward_origin.chat.username}/${message.forward_origin.message_id}`;
  }

  // For direct channel posts, use the channel's t.me link as source
  if (isChannelPost && message.chat.username) {
    forwardMessageLink =
      forwardMessageLink ??
      `https://t.me/${message.chat.username}/${messageId}`;
  }

  // Extract timestamp from forwarded message and convert to ET
  const forwardUnix: number | undefined =
    message.forward_origin?.date ?? message.forward_date ?? message.date;
  const timestampET = forwardUnix ? unixToET(forwardUnix) : "";

  const mediaItem = extractMedia(message);
  const mediaGroupId: string | undefined = message.media_group_id;

  // 5. Handle media groups: buffer each item
  if (mediaGroupId && mediaItem) {
    const count = await bufferMediaItem(mediaGroupId, mediaItem);

    // If this message has no caption, it's a non-primary group member — just buffer
    if (!text) {
      if (!isChannelPost) {
        await sendMessage(
          chatId,
          `Media received (${count} in group)`,
          messageId,
        );
      }
      return NextResponse.json({ ok: true });
    }
  }

  // 6. Reject empty messages (no text, no URLs, no media)
  if (!text && urls.length === 0 && !mediaItem) {
    if (!isChannelPost) {
      await sendMessage(
        chatId,
        "Send a news link or forward a news message.",
        messageId,
      );
    }
    return NextResponse.json({ ok: true });
  }

  // 7. Trigger GitHub Actions
  if (!process.env.GH_PAT) {
    if (!isChannelPost) {
      await sendMessage(chatId, "Bot misconfigured (no GH_PAT).", messageId);
    }
    return NextResponse.json({ ok: true });
  }

  // 7a. Smart routing for channel posts with URLs (e.g., from Feed Reader Bot)
  // Route URL-based posts to external_news for full article fetching (og:image, body, pub date)
  if (isChannelPost && urls.length > 0) {
    const articleUrl = urls[0];

    if (TWEET_URL_RE.test(articleUrl)) {
      // Tweet URL in channel -- use tweet workflow
      const tweet = await fetchTweet(articleUrl);
      if (tweet) {
        const dispatchText = `[Tweet by ${tweet.authorName} (@${tweet.authorHandle})]\n\n${tweet.text}`;
        const tweetMedia =
          tweet.media.length > 0 ? JSON.stringify(tweet.media) : undefined;
        await dispatchGitHubAction("tweet_news", {
          text: dispatchText,
          urls: articleUrl,
          timestamp_et: tweet.timestampET,
          chat_id: chatId,
          message_id: messageId,
          media: tweetMedia,
          source_url: articleUrl,
        });
        return NextResponse.json({ ok: true });
      }
      // Tweet fetch failed -- fall through to telegram_news
    } else {
      // News article URL -- dispatch as external_news for full article processing
      // Pass any Telegram-attached media as fallback (used if article has no og:image)
      const fallbackMedia = mediaItem ? JSON.stringify([mediaItem]) : undefined;
      const dispatched = await dispatchGitHubAction("external_news", {
        url: articleUrl,
        chat_id: chatId,
        message_id: messageId,
        telegram_media: fallbackMedia,
      });
      if (dispatched) return NextResponse.json({ ok: true });
      // Dispatch failed -- fall through to telegram_news as fallback
    }
  }

  // 7b. Default: dispatch as telegram_news (forwarded messages, text-only posts)
  const dispatchUrls = urls.join("\n");
  const mediaPayload: string | undefined = mediaGroupId
    ? undefined
    : mediaItem
      ? JSON.stringify([mediaItem])
      : undefined;

  const ok = await dispatchGitHubAction("telegram_news", {
    text,
    urls: dispatchUrls,
    forward_origin: forwardOrigin,
    forward_message_link: forwardMessageLink,
    timestamp_et: timestampET,
    chat_id: chatId,
    message_id: message.message_id,
    media: mediaPayload,
    media_group_id: mediaGroupId,
  });

  if (!ok) {
    if (!isChannelPost) {
      await sendMessage(chatId, "Failed to dispatch. Try again.", messageId);
    }
    return NextResponse.json({ ok: true });
  }

  const sourceNote = mediaItem ? " (with media)" : "";
  if (!isChannelPost) {
    await sendMessage(
      chatId,
      `Processing your news${sourceNote}...`,
      messageId,
    );
  }
  return NextResponse.json({ ok: true });
}
