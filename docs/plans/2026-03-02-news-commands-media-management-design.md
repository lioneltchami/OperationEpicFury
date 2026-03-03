# Design: News Commands & Admin Media Management

**Date:** 2026-03-02

## Problem

1. **External news URLs** (Reuters, AP, etc.) pasted to the bot are handled the same as forwarded Telegram messages. The timestamp comes from message send time (not article publication date), and images aren't extracted from the article page.
2. **Twitter/X URLs** are auto-detected but there's no explicit command — mixing with other URL handling causes confusion.
3. **Admin dashboard** has zero media management — can't view, add, remove, or reorder images on events.

## Solution

### Part A: Bot Commands

Three distinct news input flows, each with its own command:

#### `/news <url>` — External News Articles
- For news from Reuters, AP, BBC, Al Jazeera, etc.
- Webhook extracts URL, validates it's not a twitter/x.com link
- Dispatches to GH Actions with event type: `external_news`
- Dedicated GH Actions prompt:
  - Fetches the article page via WebFetch/curl
  - Extracts: headline, body text, **publication date**, article images (og:image, etc.)
  - Uses the **article's publication date** as timeET (not Telegram message time)
  - Images from og:image stored as MediaItem with `url` field (same pattern as tweet images)
  - Translates to Farsi, checks duplicates, creates draft

#### `/x <url>` — Twitter/X Posts
- For tweets/X posts only
- Webhook extracts URL, validates it matches x.com or twitter.com
- Uses existing `fetchTweet()` fxtwitter API logic in the webhook
- Dispatches to GH Actions with event type: `tweet_news`
- Same processing as current auto-detect, just behind explicit command

#### Forwarded Messages — No Change
- Existing `telegram_news` event type
- Uses forward_date for timestamp
- No modifications

#### Plain Messages with URLs — Reject
- If a non-forwarded message contains a URL but no command:
  - Respond: "Use /news <url> for news articles or /x <url> for tweets."
  - Do NOT auto-process
- Remove existing auto-detect of tweet URLs in plain messages

### Part B: Admin Media Management

New "Media" section in `AdminEventForm`, placed between "Source" and "Persian Translation".

#### Display
- Grid of thumbnail cards for existing media items
- Photos: rendered via `/api/media/{fileId}` or direct URL
- Videos: rendered via thumbnailFileId with play icon overlay
- Each card has a drag handle (top-left) and remove button (top-right)

#### Operations
1. **Remove**: Click X on card -> removes from local media array
2. **Add by URL**: Text input + "Add" button -> creates `{fileId: "", type: "photo", url: "<pasted>"}`
3. **Add by Telegram file ID**: Text input + type selector (photo/video) + "Add" -> creates `{fileId: "<id>", type: "<type>"}`
4. **Reorder**: Drag cards to reorder positions in the media array

#### Save Behavior
- `media` array included in PUT/POST payload
- Works in both create and edit modes

### Part C: New GH Actions Workflows

#### `.github/workflows/external-news.yml`
- Triggered by `external_news` dispatch
- Prompt instructs Claude to:
  1. Fetch the URL content
  2. Extract article headline, body, publication date
  3. Extract og:image and article images as media items with direct URLs
  4. Check duplicates against existing events
  5. Create structured event with article's pub date as timeET
  6. Translate to Farsi
  7. POST draft to /api/events/publish
  8. Send callback to Telegram

#### `.github/workflows/tweet-news.yml`
- Triggered by `tweet_news` dispatch
- Same structure as current telegram-news.yml but with tweet-specific prompt
- Tweet data (text, author, timestamp, images) pre-extracted by webhook

## Files to Change

- `src/app/api/telegram/webhook/route.ts` — Add /news and /x command handlers, reject raw URLs
- `src/components/ui/AdminEventForm.tsx` — Add Media section with add/remove/reorder
- `src/data/timeline.ts` — No changes (MediaItem already supports url field)
- `.github/workflows/external-news.yml` — New workflow for article processing
- `.github/workflows/tweet-news.yml` — New workflow for tweet processing
- `.github/workflows/telegram-news.yml` — Keep as-is for forwarded messages
