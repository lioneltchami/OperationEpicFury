# News Commands & Admin Media Management — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `/news` and `/x` bot commands for explicit URL processing, reject raw URLs, and add full media management (add/remove/reorder) to the admin event form.

**Architecture:** Three changes: (1) Webhook route gains command parsing and separate dispatch paths for `/news` and `/x`, with raw URL rejection. (2) Two new GH Actions workflows handle external news and tweet processing respectively. (3) AdminEventForm gets a Media section with thumbnails, add-by-URL, add-by-fileId, remove, and drag-to-reorder.

**Tech Stack:** Next.js API routes (TypeScript), GitHub Actions + Claude Code Action, React (client components), Tailwind CSS.

---

### Task 1: Add `/x` command to webhook

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts:140-180`

**Step 1: Add `/x` command handler after the `/info` handler (line 153)**

Insert command parsing for `/x <url>`. When detected:
1. Extract the URL from the message text
2. Validate it matches `x.com` or `twitter.com`
3. Use existing `fetchTweet()` to get tweet data
4. Dispatch to GH Actions with event type `tweet_news`
5. Send confirmation message

```typescript
// After the /info handler block (line 153), add:

// 3c. Handle /x command — process a tweet URL
if (cmdText.startsWith("/x ")) {
  const tweetUrl = cmdText.slice(3).trim();
  if (!TWEET_URL_RE.test(tweetUrl)) {
    await sendMessage(chatId, "Invalid URL. Use: /x https://x.com/user/status/123", messageId);
    return NextResponse.json({ ok: true });
  }

  const tweet = await fetchTweet(tweetUrl);
  if (!tweet) {
    await sendMessage(chatId, "Failed to fetch tweet. Try again.", messageId);
    return NextResponse.json({ ok: true });
  }

  const ghToken = process.env.GH_PAT;
  if (!ghToken) {
    await sendMessage(chatId, "Bot misconfigured (no GH_PAT).", messageId);
    return NextResponse.json({ ok: true });
  }

  const dispatchText = `[Tweet by ${tweet.authorName} (@${tweet.authorHandle})]\n\n${tweet.text}`;
  const tweetMedia = tweet.media.length > 0 ? JSON.stringify(tweet.media) : undefined;

  const dispatchRes = await fetch(
    "https://api.github.com/repos/FZ1010/OperationEpicFury/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "tweet_news",
        client_payload: {
          text: dispatchText,
          urls: tweetUrl,
          timestamp_et: tweet.timestampET,
          chat_id: chatId,
          message_id: messageId,
          media: tweetMedia,
          source_url: tweetUrl,
        },
      }),
    },
  );

  if (!dispatchRes.ok) {
    await sendMessage(chatId, "Failed to dispatch. Try again.", messageId);
    return NextResponse.json({ ok: true });
  }

  await sendMessage(chatId, `Processing tweet by @${tweet.authorHandle}...`, messageId);
  return NextResponse.json({ ok: true });
}
```

**Step 2: Verify build compiles**

Run: `npx next build` (or just `npx tsc --noEmit`)
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat: add /x command for explicit tweet processing"
```

---

### Task 2: Add `/news` command to webhook

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts`

**Step 1: Add `/news` command handler right after the `/x` handler**

```typescript
// 3d. Handle /news command — process an external news URL
if (cmdText.startsWith("/news ")) {
  const newsUrl = cmdText.slice(6).trim();
  // Reject twitter/x URLs — those should use /x
  if (TWEET_URL_RE.test(newsUrl)) {
    await sendMessage(chatId, "That's a tweet URL. Use /x instead.", messageId);
    return NextResponse.json({ ok: true });
  }
  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(newsUrl);
  } catch {
    await sendMessage(chatId, "Invalid URL. Use: /news https://reuters.com/...", messageId);
    return NextResponse.json({ ok: true });
  }
  if (!parsed.protocol.startsWith("http")) {
    await sendMessage(chatId, "Invalid URL. Must start with http:// or https://", messageId);
    return NextResponse.json({ ok: true });
  }

  const ghToken = process.env.GH_PAT;
  if (!ghToken) {
    await sendMessage(chatId, "Bot misconfigured (no GH_PAT).", messageId);
    return NextResponse.json({ ok: true });
  }

  const dispatchRes = await fetch(
    "https://api.github.com/repos/FZ1010/OperationEpicFury/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "external_news",
        client_payload: {
          url: newsUrl,
          chat_id: chatId,
          message_id: messageId,
        },
      }),
    },
  );

  if (!dispatchRes.ok) {
    await sendMessage(chatId, "Failed to dispatch. Try again.", messageId);
    return NextResponse.json({ ok: true });
  }

  await sendMessage(chatId, `Processing news article: ${parsed.hostname}...`, messageId);
  return NextResponse.json({ ok: true });
}
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat: add /news command for external news articles"
```

---

### Task 3: Reject plain URL messages (non-forwarded, no command)

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts:155-180`

**Step 1: After all command handlers but before the existing URL/media extraction logic**

Add a check: if the message is NOT forwarded and contains URLs but no recognized command, reject with a hint. Also remove the existing tweet auto-detection logic (lines 168-180, the `isForwardedWithMedia` / `tweetData` block).

After the `/news` command handler, add:

```typescript
// 3e. If message has URLs but no command and is not forwarded, reject
const hasUrls = (message.entities ?? message.caption_entities ?? []).some(
  (e: { type: string }) => e.type === "url" || e.type === "text_link",
);
if (hasUrls && !message.forward_origin) {
  await sendMessage(
    chatId,
    "Use /news <url> for news articles or /x <url> for tweets.",
    messageId,
  );
  return NextResponse.json({ ok: true });
}
```

**Step 2: Remove tweet auto-detection**

Remove the `isForwardedWithMedia` variable and the `tweetData` loop (lines ~171-180). Remove the `tweetData` variable usage in the dispatch payload building (lines ~229-245). Clean up: the `dispatchText` should just be `text`, `dispatchTimestamp` should just be `timestampET`, and `mediaPayload` should not reference `tweetMedia`.

The forwarded message flow (below this new check) should remain unchanged — it still uses the existing `telegram_news` event type.

**Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 4: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat: reject plain URL messages, remove tweet auto-detection"
```

---

### Task 4: Create `tweet-news.yml` GitHub Actions workflow

**Files:**
- Create: `.github/workflows/tweet-news.yml`

**Step 1: Create the workflow file**

This is a simplified version of `telegram-news.yml` tailored for pre-extracted tweet data. The tweet text, author, timestamp, and media are already provided by the webhook.

```yaml
name: Tweet News Processing

on:
  repository_dispatch:
    types: [tweet_news]

jobs:
  process-tweet:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Process tweet with Claude
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: '--allowed-tools "Bash(curl:*)"'
          prompt: |
            You received a tweet to process into a timeline event for the Operation Epic Fury timeline (Iran-Israel-US military conflict, started February 28 2026).

            ## Input

            Text: ${{ github.event.client_payload.text }}
            Timestamp (ET): ${{ github.event.client_payload.timestamp_et }}
            Source URL: ${{ github.event.client_payload.source_url }}
            Media JSON: ${{ github.event.client_payload.media }}
            Chat ID: ${{ github.event.client_payload.chat_id }}
            Message ID: ${{ github.event.client_payload.message_id }}

            ## Step 1: Check for duplicates

            Fetch existing events to check:
            ```
            curl -s "${{ vars.SITE_URL }}/api/events" | jq -r '.[] | "\(.timeET) | \(.headline)"'
            ```

            Only flag as duplicate if exact same incident at same time. Be lenient.

            If duplicate, send error callback:
            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/telegram/callback" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{"chat_id": ${{ github.event.client_payload.chat_id }}, "message_id": ${{ github.event.client_payload.message_id }}, "status": "error", "error": "Duplicate of: [<timeET>] <matching headline>"}'
            ```
            Then stop.

            ## Step 2: Use the provided timestamp

            Use the "Timestamp (ET)" value directly as timeET. It is already in "YYYY-MM-DD HH:MM" format in America/New_York timezone.

            ## Step 3: Extract structured data

            The text starts with "[Tweet by Name (@handle)]" followed by the tweet content.

            - **headline**: English, concise, news-style summary of the tweet
            - **body**: English, 2-4 sentences, factual, AP news style
            - **timeET**: From Step 2
            - **category**: One of: strike, retaliation, announcement, casualty, world-reaction, breaking, breaking-important
            - **source**: The tweet author name and handle (e.g. "John Smith (@jsmith)")
            - **sourceUrl**: Use the "Source URL" from Input
            - **breaking**: true only for major developments

            ## Step 4: Translate to Farsi

            Translate headline and body to natural, fluent Persian in formal news style.
            Use common Persian forms for proper nouns.
            CRITICAL: Write Farsi as raw UTF-8 characters, NEVER as \u escape sequences.

            ## Step 5: Create draft event

            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/events/publish" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{
                "timeET": "<YYYY-MM-DD HH:MM>",
                "headline": "<English headline>",
                "body": "<English body>",
                "category": "<category>",
                "source": "<source name>",
                "sourceUrl": "<source url>",
                "breaking": <true|false>,
                "headline_fa": "<Farsi headline>",
                "body_fa": "<Farsi body>",
                "media": <Media JSON array or omit if empty>,
                "status": "draft"
              }'
            ```

            Save the response — it contains the event `id`.

            ## Step 6: Send callback

            On success:
            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/telegram/callback" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{"chat_id": ${{ github.event.client_payload.chat_id }}, "message_id": ${{ github.event.client_payload.message_id }}, "headline": "<the headline>", "event_id": "<the id>", "status": "success"}'
            ```

            On failure:
            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/telegram/callback" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{"chat_id": ${{ github.event.client_payload.chat_id }}, "message_id": ${{ github.event.client_payload.message_id }}, "status": "error", "error": "<what went wrong>"}'
            ```

            CRITICAL RULES:
            - Do NOT use web search. Only use the input provided.
            - All Farsi text must be raw UTF-8, NEVER \u escape sequences.
            - All JSON must be valid. Escape double quotes inside strings.
            - STRICT DATE: Timeline covers events from February 28, 2026 onward.
            - If Media JSON is provided, pass it through to the publish API as-is.
```

**Step 2: Commit**

```bash
git add .github/workflows/tweet-news.yml
git commit -m "feat: add tweet-news workflow for /x command"
```

---

### Task 5: Create `external-news.yml` GitHub Actions workflow

**Files:**
- Create: `.github/workflows/external-news.yml`

**Step 1: Create the workflow file**

This workflow fetches an article URL, extracts content, publication date, and images.

```yaml
name: External News Processing

on:
  repository_dispatch:
    types: [external_news]

jobs:
  process-news:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Process news article with Claude
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: '--allowed-tools "WebFetch,Bash(curl:*)"'
          prompt: |
            You received a news article URL to process into a timeline event for the Operation Epic Fury timeline (Iran-Israel-US military conflict, started February 28 2026).

            ## Input

            URL: ${{ github.event.client_payload.url }}
            Chat ID: ${{ github.event.client_payload.chat_id }}
            Message ID: ${{ github.event.client_payload.message_id }}

            ## Step 1: Fetch the article

            Use WebFetch or curl to fetch the article at the URL above. Extract:
            - **Article headline/title**
            - **Article body text** (the main content, not navigation/ads)
            - **Publication date/time** — look for:
              - `<meta property="article:published_time">` or `<meta name="pubdate">`
              - `<time datetime="...">` elements
              - JSON-LD `datePublished` field
              - Any visible date/time in the article
            - **Article image** — look for:
              - `<meta property="og:image">` tag
              - The primary/hero image of the article
              - Any significant images in the article body

            Do NOT search the web. Do NOT use any source other than the provided URL.

            ## Step 2: Check for duplicates

            Fetch existing events:
            ```
            curl -s "${{ vars.SITE_URL }}/api/events" | jq -r '.[] | "\(.timeET) | \(.headline)"'
            ```

            Only flag as duplicate if exact same incident at same time. Be lenient.

            If duplicate, send error callback:
            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/telegram/callback" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{"chat_id": ${{ github.event.client_payload.chat_id }}, "message_id": ${{ github.event.client_payload.message_id }}, "status": "error", "error": "Duplicate of: [<timeET>] <matching headline>"}'
            ```
            Then stop.

            ## Step 3: Determine the timestamp

            CRITICAL: Use the **article's publication date** extracted in Step 1, NOT the current time.
            Convert it to America/New_York timezone in "YYYY-MM-DD HH:MM" format.

            If the article has no extractable publication date, use the current time in ET as a fallback and note this in the body.

            ## Step 4: Extract structured data

            - **headline**: English, concise, news-style (rewrite the article title if needed for brevity)
            - **body**: English, 2-4 sentences, factual, AP news style, summarizing the article
            - **timeET**: From Step 3 (article publication time in ET)
            - **category**: One of: strike, retaliation, announcement, casualty, world-reaction, breaking, breaking-important
            - **source**: The news outlet name (e.g. "Reuters", "AP", "BBC")
            - **sourceUrl**: The input URL
            - **breaking**: true only for major developments
            - **media**: If an og:image or article image was found, include it as:
              ```json
              [{"fileId": "", "type": "photo", "url": "<image-url>"}]
              ```

            ## Step 5: Translate to Farsi

            Translate headline and body to natural, fluent Persian in formal news style.
            Use common Persian forms for proper nouns.
            CRITICAL: Write Farsi as raw UTF-8 characters, NEVER as \u escape sequences.

            ## Step 6: Create draft event

            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/events/publish" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{
                "timeET": "<YYYY-MM-DD HH:MM>",
                "headline": "<English headline>",
                "body": "<English body>",
                "category": "<category>",
                "source": "<source name>",
                "sourceUrl": "<source url>",
                "breaking": <true|false>,
                "headline_fa": "<Farsi headline>",
                "body_fa": "<Farsi body>",
                "media": <media array or omit>,
                "status": "draft"
              }'
            ```

            Save the response — it contains the event `id`.

            ## Step 7: Send callback

            On success:
            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/telegram/callback" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{"chat_id": ${{ github.event.client_payload.chat_id }}, "message_id": ${{ github.event.client_payload.message_id }}, "headline": "<the headline>", "event_id": "<the id>", "status": "success"}'
            ```

            On failure:
            ```
            curl -sf -X POST "${{ vars.SITE_URL }}/api/telegram/callback" \
              -H "Authorization: Bearer ${{ secrets.PUBLISH_SECRET }}" \
              -H "Content-Type: application/json" \
              -d '{"chat_id": ${{ github.event.client_payload.chat_id }}, "message_id": ${{ github.event.client_payload.message_id }}, "status": "error", "error": "<what went wrong>"}'
            ```

            CRITICAL RULES:
            - Do NOT search the web. Only fetch the provided URL.
            - Use the ARTICLE'S publication date as timeET, NOT the current time.
            - All Farsi text must be raw UTF-8, NEVER \u escape sequences.
            - All JSON must be valid. Escape double quotes inside strings.
            - STRICT DATE: Timeline covers events from February 28, 2026 onward.
```

**Step 2: Commit**

```bash
git add .github/workflows/external-news.yml
git commit -m "feat: add external-news workflow for /news command"
```

---

### Task 6: Add Media section to AdminEventForm

**Files:**
- Modify: `src/components/ui/AdminEventForm.tsx`

**Step 1: Add media state and the Media section UI**

Add state for managing media items. Place the section between "Source" and "Persian Translation".

At the top of the component (after other state declarations ~line 47), add:

```typescript
const [media, setMedia] = useState<MediaItem[]>(event?.media ?? []);
const [newMediaUrl, setNewMediaUrl] = useState("");
const [newMediaFileId, setNewMediaFileId] = useState("");
const [newMediaType, setNewMediaType] = useState<"photo" | "video">("photo");
const [dragIdx, setDragIdx] = useState<number | null>(null);
```

Add the import for `MediaItem` at the top:
```typescript
import type { TimelineEvent, EventCategory, MediaItem } from "@/data/timeline";
```

**Step 2: Add media helper functions inside the component**

```typescript
function removeMedia(idx: number) {
  setMedia((prev) => prev.filter((_, i) => i !== idx));
}

function addMediaByUrl() {
  const url = newMediaUrl.trim();
  if (!url) return;
  setMedia((prev) => [...prev, { fileId: "", type: "photo" as const, url }]);
  setNewMediaUrl("");
}

function addMediaByFileId() {
  const fileId = newMediaFileId.trim();
  if (!fileId) return;
  setMedia((prev) => [...prev, { fileId, type: newMediaType }]);
  setNewMediaFileId("");
}

function handleDragStart(idx: number) {
  setDragIdx(idx);
}

function handleDragOver(e: React.DragEvent, idx: number) {
  e.preventDefault();
  if (dragIdx === null || dragIdx === idx) return;
  setMedia((prev) => {
    const next = [...prev];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    return next;
  });
  setDragIdx(idx);
}

function handleDragEnd() {
  setDragIdx(null);
}
```

**Step 3: Add the Media section JSX**

Insert between the Source `</FormSection>` and the Persian Translation `<div>`:

```tsx
{/* ── Section: Media ── */}
<FormSection title="Media">
  {/* Existing media grid */}
  {media.length > 0 && (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {media.map((item, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          className={`relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 ${
            dragIdx === idx ? "opacity-50 ring-2 ring-red-500" : ""
          }`}
        >
          {/* Drag handle */}
          <div className="absolute top-1 left-1 z-10 p-1 rounded bg-black/60 text-zinc-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeMedia(idx)}
            className="absolute top-1 right-1 z-10 p-1 rounded bg-black/60 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Thumbnail */}
          <div className="aspect-video bg-zinc-800 flex items-center justify-center">
            {item.type === "video" ? (
              item.thumbnailFileId ? (
                <img
                  src={`/api/media/${encodeURIComponent(item.thumbnailFileId)}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-8 h-8 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )
            ) : (
              <img
                src={item.url || `/api/media/${encodeURIComponent(item.fileId)}`}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Type badge */}
          <div className="px-2 py-1 text-[10px] text-zinc-500 truncate">
            {item.type === "video" ? "Video" : "Photo"}
            {item.url ? " (URL)" : item.fileId ? ` (${item.fileId.slice(0, 12)}...)` : ""}
          </div>
        </div>
      ))}
    </div>
  )}

  {/* Add by URL */}
  <div>
    <FormLabel>Add Image by URL</FormLabel>
    <div className="flex gap-2">
      <input
        className={`${inputClass} flex-1`}
        value={newMediaUrl}
        onChange={(e) => setNewMediaUrl(e.target.value)}
        placeholder="https://example.com/image.jpg"
        type="url"
      />
      <button
        type="button"
        onClick={addMediaByUrl}
        disabled={!newMediaUrl.trim()}
        className="px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 transition-all shrink-0"
      >
        Add
      </button>
    </div>
  </div>

  {/* Add by Telegram file ID */}
  <div>
    <FormLabel>Add by Telegram File ID</FormLabel>
    <div className="flex gap-2">
      <input
        className={`${inputClass} flex-1`}
        value={newMediaFileId}
        onChange={(e) => setNewMediaFileId(e.target.value)}
        placeholder="AgACAgIAAxkBAAI..."
      />
      <select
        className={`${inputClass} w-24 shrink-0`}
        value={newMediaType}
        onChange={(e) => setNewMediaType(e.target.value as "photo" | "video")}
      >
        <option value="photo">Photo</option>
        <option value="video">Video</option>
      </select>
      <button
        type="button"
        onClick={addMediaByFileId}
        disabled={!newMediaFileId.trim()}
        className="px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 transition-all shrink-0"
      >
        Add
      </button>
    </div>
  </div>
</FormSection>
```

**Step 4: Include media in the save payload**

In the `handleConfirm` function (~line 70), add `media` to the payload:

```typescript
// After line 78 (where payload is built), add:
payload.media = media;
```

**Step 5: Show media in preview**

In the preview section (~line 165, after the body paragraph), add:

```tsx
{media.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
    {media.map((item, idx) => (
      <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-zinc-800">
        {item.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : (
          <img
            src={item.url || `/api/media/${encodeURIComponent(item.fileId)}`}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
    ))}
  </div>
)}
```

**Step 6: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 7: Commit**

```bash
git add src/components/ui/AdminEventForm.tsx
git commit -m "feat: add media management section to admin event form"
```

---

### Task 7: Visual testing via Chrome DevTools

**Files:** None (manual testing)

**Step 1: Start dev server and test admin form**

Run: `npm run dev`

Navigate to the admin page and test:
1. Open an existing event with media — verify thumbnails show
2. Click X to remove an image — verify it disappears
3. Add an image by URL — verify it appears as a thumbnail
4. Add by file ID — verify it appears with correct type badge
5. Drag to reorder — verify order changes
6. Save the event — verify media persists on reload

**Step 2: Test the preview**

Click "Preview & Update" — verify media thumbnails show in the preview section.

**Step 3: Create event with media**

Create a new event, add a media item by URL, save as draft — verify media persists.

---

### Task 8: Final verification and PR

**Step 1: Run full build**

Run: `npx next build`
Expected: Build succeeds with no errors.

**Step 2: Create PR**

Create a PR from the feature branch to master with all changes.
