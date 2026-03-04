# Telegram Bot Integration Setup

This document covers the full setup for automated news ingestion via Telegram bots into the Operation Epic Fury timeline.

## Architecture Overview

```
RSS Feeds ──► Feed Reader Bot ──► Private Telegram Channel ──► Your Bot Webhook
                                                                      │
OSINT Channels ──► JunctionBot ──► Private Telegram Channel ──────────┘
                                                                      │
                                                              ┌───────▼────────┐
                                                              │ Webhook Route  │
                                                              │ (Next.js API)  │
                                                              └───────┬────────┘
                                                                      │
                                              ┌───────────────────────┼──────────────────────┐
                                              │                       │                      │
                                    URL with article?          Tweet URL?            Text/forwarded?
                                              │                       │                      │
                                     external_news            tweet_news           telegram_news
                                     (GitHub Action)          (GitHub Action)      (GitHub Action)
                                              │                       │                      │
                                              └───────────────────────┼──────────────────────┘
                                                                      │
                                                              Claude processes
                                                              & publishes event
```

## Prerequisites

- A Telegram bot (created via @BotFather)
- Feed Reader Bot premium subscription (tfrbot.com)
- JunctionBot direct bundle (junctionbot.io) -- optional
- GitHub PAT with `repo` scope
- Vercel deployment with environment variables

## Step 1: Create Your Telegram Bot

1. Open Telegram and message @BotFather
2. Send `/newbot` and follow the prompts
3. Save the **bot token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Send `/setprivacy` to @BotFather, select your bot, and set to **Disabled** (so it can read channel posts)

## Step 2: Create a Private Telegram Channel

1. Create a new private channel in Telegram (e.g., "EpicFury News Intake")
2. This channel will receive automated news from Feed Reader Bot and JunctionBot

## Step 3: Add Your Bot as Admin

**This is critical for auto-triggering.**

1. Go to your private channel settings
2. Tap "Administrators" > "Add Administrator"
3. Search for your bot by its username
4. Add it as admin -- it needs permission to read messages (the default permissions are fine)

Without admin access, the bot cannot see channel posts and the webhook will never fire.

## Step 4: Get the Channel ID

The channel ID is a negative number (e.g., `-1001234567890`). To find it:

**Method A -- Using /info command:**

1. Forward a message from your channel to your bot in a DM
2. Send `/info` as a reply to the forwarded message
3. The JSON dump will show the channel's `chat.id`

**Method B -- Using @userinfobot:**

1. Forward any message from your channel to @userinfobot
2. It will reply with the channel ID

**Method C -- Using the Telegram Bot API directly:**

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates" | jq '.result[-1].channel_post.chat.id'
```

## Step 5: Set Environment Variables

Add these to your Vercel project (Settings > Environment Variables):

| Variable                    | Value                                          | Example                      |
| --------------------------- | ---------------------------------------------- | ---------------------------- |
| `TELEGRAM_BOT_TOKEN`        | Your bot token from BotFather                  | `123456789:ABCdef...`        |
| `TELEGRAM_WEBHOOK_SECRET`   | A random secret string you create              | `mysecrettoken123`           |
| `TELEGRAM_ALLOWED_CHANNELS` | Comma-separated channel IDs                    | `-1001234567890`             |
| `TELEGRAM_ALLOWED_USERS`    | Your Telegram user ID (for DM commands)        | `123456789`                  |
| `GH_PAT`                    | GitHub Personal Access Token with `repo` scope | `ghp_xxxx...`                |
| `GITHUB_REPO`               | Your GitHub repo (owner/name)                  | `username/OperationEpicFury` |
| `PUBLISH_SECRET`            | Secret for the publish API                     | `your-publish-secret`        |

**Important:** After adding/changing env vars on Vercel, redeploy for them to take effect.

## Step 6: Register the Webhook

Register your bot's webhook URL with Telegram:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR_DOMAIN>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Example:

```bash
curl "https://api.telegram.org/bot123456789:ABCdef.../setWebhook?url=https://epicfuryops.info/api/telegram/webhook&secret_token=mysecrettoken123"
```

Verify it's set:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo" | jq
```

You should see `"url": "https://epicfuryops.info/api/telegram/webhook"` and `"has_custom_certificate": false`.

## Step 7: Configure Feed Reader Bot

1. Open Telegram and start a chat with @TheFeedReaderBot
2. Send `/add` to add a new RSS feed
3. Add your feeds one by one (see "Recommended RSS Feeds" below)
4. Send `/settings` and set the **output channel** to your private channel from Step 2
5. Set refresh interval (30 min for Premium, 10 min for Elite)

### Feed Template (Optional)

Configure a custom template to send clean output:

```
/template
{title}

{link}
```

This ensures each post has a clean title + URL that the webhook can parse.

## Step 8: Configure JunctionBot (Optional)

1. Open Telegram and start a chat with @JunctionBot
2. Create a new route: source = OSINT channel, destination = your private channel
3. Enable keyword/regex filters if needed (e.g., `Iran|Israel|strike|missile`)
4. Enable "Forward as copy" so messages appear as native channel posts

### Recommended OSINT Source Channels

- @intikilab -- Intel Lab
- @inikilab_special -- Intel Lab Special
- @sentdefender -- Sentdefender
- @AuroraIntel -- Aurora Intel
- @raikinoart -- War Monitor

## Recommended RSS Feeds for Feed Reader Bot

### Tier 1: Wire Services (Highest Priority)

- `https://feeds.reuters.com/reuters/worldNews` -- Reuters World
- `https://feeds.bbci.co.uk/news/world/middle_east/rss.xml` -- BBC Middle East
- `https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml` -- NYT Middle East

### Tier 2: US/Western Defense

- `https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945` -- DoD News
- `https://breakingdefense.com/feed/` -- Breaking Defense
- `https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml` -- Defense News
- `https://thehill.com/feed/` -- The Hill

### Tier 3: Israeli Media

- `https://www.timesofisrael.com/feed/` -- Times of Israel
- `https://www.jpost.com/rss/rssfeedsfrontpage.aspx` -- Jerusalem Post
- `https://www.ynetnews.com/Integration/StoryRss1854.xml` -- Ynet News

### Tier 4: Middle East / Gulf

- `https://www.aljazeera.com/xml/rss/all.xml` -- Al Jazeera
- `https://english.alarabiya.net/tools/rss` -- Al Arabiya
- `https://www.middleeasteye.net/rss` -- Middle East Eye

### Tier 5: Analysis / OSINT

- `https://www.crisisgroup.org/feed` -- Crisis Group
- `https://warontherocks.com/feed/` -- War on the Rocks
- `https://www.iiss.org/en/rss/` -- IISS

## How Auto-Triggering Works

1. Feed Reader Bot checks RSS feeds every 10-30 minutes
2. New articles are posted to your private Telegram channel
3. Telegram sends a `channel_post` update to your webhook URL
4. The webhook verifies the channel ID is in `TELEGRAM_ALLOWED_CHANNELS`
5. **Smart routing** determines the workflow:
   - Post contains a news article URL -> `external_news` workflow (fetches full article, og:image, publication date)
   - Post contains a tweet/X URL -> `tweet_news` workflow (fetches tweet via fxtwitter API)
   - Post is text-only or forwarded -> `telegram_news` workflow (processes raw text)
6. GitHub Action runs, Claude processes the content, and creates a draft timeline event
7. The callback bot sends a confirmation message

## Troubleshooting

### News arrives in channel but no GitHub Action triggers

1. **Check bot is admin**: Your bot must be an admin of the private channel
2. **Check channel ID**: Verify the numeric channel ID is in `TELEGRAM_ALLOWED_CHANNELS`
3. **Check webhook is registered**: Run `getWebhookInfo` (see Step 6)
4. **Check Vercel logs**: Go to your Vercel dashboard > Functions > check for 403 errors or missing env vars
5. **Check GH_PAT**: Ensure your GitHub PAT hasn't expired and has `repo` scope

### GitHub Action triggers but event isn't created

1. Check the GitHub Actions logs for the specific run
2. Verify `PUBLISH_SECRET` and `SITE_URL` are set in GitHub repo secrets/variables
3. Verify `CLAUDE_CODE_OAUTH_TOKEN` is set in GitHub repo secrets

### Duplicate detection

Both `external_news` and `tweet_news` workflows check for duplicates by comparing against existing events. If a legitimate event is being flagged as duplicate, check the events API to see what it's matching against.

## Manual Commands (via DM to bot)

These commands work when messaging the bot directly (not in channels):

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `/x <tweet-url>`      | Process a tweet into a timeline event        |
| `/news <article-url>` | Process a news article into a timeline event |
| `/info`               | Reply to a message with this to see raw JSON |
