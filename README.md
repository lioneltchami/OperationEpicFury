# Operation Epic Fury

A real-time news timeline tracking Operation Epic Fury (US-Israel strikes on Iran, starting Feb 28, 2026). The site aggregates news from multiple sources every 3 hours via Claude AI, cross-checks across sources, translates to French, and publishes them after human review.

**Live:** [epicfuryops.info](https://epicfuryops.info)

## Stack

Next.js 16 · React 19 · Redis (ioredis) · Tailwind CSS 4 · Framer Motion · Vercel · GitHub Actions · Telegram Bot · Claude AI

## Architecture

```
Telegram Bot ──→ /api/telegram/webhook ──→ GitHub Actions
News Cron (3h) ──→ GitHub Actions ──────→ Claude AI processes
External URLs ──→ GitHub Actions ────────→ Creates GitHub Issue
Tweet URLs ──→ GitHub Actions ───────────→ Human closes issue
                                                │
                                                ▼
                                      POST /api/events/publish
                                      Event goes live on timeline
```

### Automated Pipeline

1. **Ingestion** — News enters via cron scrape (every 3h), Telegram bot forwarding, or manual `/news` and `/x` commands
2. **Processing** — GitHub Actions dispatches to Claude AI, which summarizes, cross-checks sources, and extracts structured event data
3. **Review** — Claude creates a GitHub Issue with the draft event. A human reviews and closes the issue to approve
4. **Publishing** — `news-approve.yml` fires on issue close, calling `POST /api/events/publish` to push the event live
5. **Translation** — A separate action translates English events to French via Claude

### Key Features

- Bilingual (English/French) with full i18n support
- Source credibility tracking (confidence levels, multi-source, source regions)
- Push notifications via Web Push API
- Admin panel with draft/publish workflow
- Infinite-scroll timeline with server-side pagination
- On-demand ISR revalidation (no polling)
- Redis-backed data layer with hash + sorted set indexing

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `KV_REDIS_URL` | Yes | Redis connection URL (e.g. Upstash) |
| `ADMIN_PASSWORD` | Yes | Password for admin panel login |
| `PUBLISH_SECRET` | Yes | Bearer token for API-to-API auth (GitHub Actions → publish endpoint) |
| `GH_PAT` | Yes | GitHub Personal Access Token for dispatching Actions |
| `GITHUB_REPO` | No | GitHub repo (default: `FZ1010/OperationEpicFury`) |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram Bot API token |
| `TELEGRAM_WEBHOOK_SECRET` | Yes | Secret for verifying Telegram webhook requests |
| `TELEGRAM_ALLOWED_USERS` | Yes | Comma-separated Telegram user IDs allowed to submit news |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for Web Push |
| `SITE_URL` | No | Site URL (default: `https://epicfuryops.info`) |

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/FZ1010/OperationEpicFury.git
cd OperationEpicFury
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Fill in the variables above

# 3. Run dev server
pnpm dev
```

> **Note:** The app requires a Redis connection. Without `KV_REDIS_URL`, the homepage will show a fallback error UI and `next build` will fail at data-fetching pages.

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # i18n pages (en, fa)
│   ├── admin/             # Admin panel
│   └── api/
│       ├── auth/          # Login (rate-limited)
│       ├── events/        # CRUD + publish + sort + migrate
│       ├── media/         # Telegram media proxy
│       ├── stats/         # Site statistics
│       ├── telegram/      # Webhook + callback
│       └── translate-trigger/
├── components/
│   ├── sections/          # Hero, Timeline, StatsBar, Footer
│   └── ui/                # Reusable components
├── lib/                   # Redis, auth, KV, validation, etc.
├── i18n/                  # Dictionaries (en.json, fa.json)
└── data/                  # TypeScript types
```

## Source Credibility

Events support optional credibility metadata:

- `confidence` — `"confirmed"` | `"unconfirmed"` | `"disputed"` (defaults to confirmed if absent)
- `sourceRegion` — `"us"` | `"eu"` | `"middle-east"` | `"asia"` | `"other"`
- `sources` — Array of `{ name, url, region? }` for multi-source events

All four GitHub Actions workflows (`news-cron.yml`, `telegram-news.yml`, `external-news.yml`, `tweet-news.yml`) populate these fields automatically. Cross-checking rules: 3+ sources from different bias categories → confirmed; single bias category → unconfirmed; contradicting facts → disputed.
