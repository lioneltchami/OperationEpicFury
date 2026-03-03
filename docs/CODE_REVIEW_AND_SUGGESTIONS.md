# Operation Epic Fury — Code Review & Community Suggestions

**Date:** March 2, 2026
**Sources:** Two independent code reviews + Reddit community feedback (r/ClaudeAI showcase thread, 156 upvotes)

---

## Table of Contents

1. [Project Summary](#project-summary)
2. [Architecture Overview](#architecture-overview)
3. [Critical Security Issues](#critical-security-issues)
4. [High Priority Issues](#high-priority-issues)
5. [Performance & Scalability](#performance--scalability)
6. [Infrastructure & Reliability](#infrastructure--reliability)
7. [Community Feature Requests](#community-feature-requests)
8. [Code Quality & Maintenance](#code-quality--maintenance)
9. [Reconciliation Notes](#reconciliation-notes)
10. [Recommended Priority Order](#recommended-priority-order)

---

## Project Summary

A Next.js 16 real-time news timeline tracking Operation Epic Fury (US-Israel strikes on Iran, starting Feb 28, 2026). The site aggregates news from multiple sources every 3 hours via Claude AI, cross-checks across sources, translates to Farsi, and posts them as GitHub issues for human review before publishing.

**Stack:** Next.js 16, React 19, Redis (ioredis), Tailwind CSS 4, Framer Motion, Vercel, GitHub Actions, Telegram Bot, Claude AI

**Key features:**
- Automated news pipeline (cron → Claude scrapes → cross-check → translate → GitHub issue → human approval → publish)
- Telegram bot integration (forward news → auto-process → draft)
- Admin panel with draft/publish workflow
- Bilingual support (English/Farsi) with RTL
- Push notifications via Web Push
- SEO with JSON-LD structured data

---

## Architecture Overview

```
Telegram Bot ──→ /api/telegram/webhook ──→ GitHub Actions (telegram-news.yml)
                                                  │
News Cron (every 3h) ──→ GitHub Actions ──────────┤
                         (news-cron.yml)          │
External URLs ──→ GitHub Actions ─────────────────┤
                  (external-news.yml)             │
Tweet URLs ──→ GitHub Actions ────────────────────┤
               (tweet-news.yml)                   │
                                                  ▼
                                        Claude AI processes
                                        Creates GitHub Issue
                                                  │
                                                  ▼
                                        Human closes issue
                                        (news-approve.yml)
                                                  │
                                                  ▼
                                        POST /api/events/publish
                                        Event goes live on timeline
                                                  │
                                                  ▼
                                        translate.yml triggers
                                        Farsi translation added

Data: Redis (single JSON blob under "timeline:events" key)
Frontend: SSR with 60s revalidation, client-side Framer Motion animations
Admin: Cookie-based auth, draft/publish workflow with preview
```

---

## Critical Security Issues

### 1. Unauthenticated `GET /api/events` Exposes All Drafts

**File:** `src/app/api/events/route.ts`

```typescript
export async function GET() {
  const events = await getAllEvents(); // returns EVERYTHING — drafts included
  return NextResponse.json(events);
}
```

Anyone can hit `GET /api/events` and see all draft events, unpublished content, internal notes, and events pending review. This completely bypasses the draft/publish workflow.

**Fix:** Either require authentication or filter to published events only:

```typescript
export async function GET() {
  if (!(await isAuthenticated())) {
    const published = await getPublishedEvents();
    return NextResponse.json(published);
  }
  return NextResponse.json(await getAllEvents());
}
```

---

### 2. Unauthenticated `GET /api/events/[id]` Exposes Any Event

**File:** `src/app/api/events/[id]/route.ts`

No auth check — any event accessible by UUID, including drafts.

**Fix:** Return 404 for draft events unless authenticated:

```typescript
if (event.status === "draft" && !(await isAuthenticated())) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

---

### 3. Auth Token Is Static and Predictable

**File:** `src/lib/auth.ts`

```typescript
export function computeToken(password: string): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", secret).update(password).digest("hex");
}
```

The HMAC key is the password itself, and the input is also the password. This means the token is always `HMAC-SHA256(ADMIN_PASSWORD, ADMIN_PASSWORD)` — a fixed, deterministic value. There is no randomness, no session ID, no rotation. If the cookie is ever leaked (logs, browser extension, network sniff), the attacker has permanent access until the password itself changes.

Note: The other review incorrectly stated the cookie has "no httpOnly flag set explicitly." It actually does — `httpOnly: true`, `secure: true` in production, `sameSite: "lax"`, and `maxAge: 60 * 60 * 24` (1 day) are all set in `POST /api/auth`. The real problem is the deterministic token, not the cookie flags.

**Fix:** Generate a random session token on each login, store it in Redis with a TTL:

```typescript
import { randomBytes } from "crypto";

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
// Store in Redis: SET session:<token> <userId> EX 86400
```

---

### 4. Media Proxy Has No Size Limits or Content Validation

**File:** `src/app/api/media/[fileId]/route.ts`

The endpoint proxies arbitrary Telegram files through the serverless function with no size check, no content-type validation, and no abuse prevention. A large file could exhaust memory. Arbitrary content could be served through the domain.

**Fix:**
- Check `Content-Length` header before streaming (reject files > 10MB for photos)
- Validate that the content-type is actually an image/video
- Add rate limiting

---

### 5. No Rate Limiting on Any Endpoint

No endpoint has rate limiting. The auth endpoint (`POST /api/auth`) is vulnerable to brute force. The Telegram webhook could be flooded. The publish API only checks a bearer token — someone with the token could flood the timeline.

**Fix:** Add rate limiting at minimum on:
- `POST /api/auth` (login attempts)
- `POST /api/telegram/webhook`
- `POST /api/events/publish`
- `GET /api/events/published` (public data)

---

## High Priority Issues

### 6. Race Conditions in Redis Data Layer

**File:** `src/lib/kv.ts`

All events are stored as a single JSON blob under one Redis key:

```typescript
const KEY = "timeline:events";

export async function addEvent(event: TimelineEvent): Promise<void> {
  const events = await getAllEvents();  // READ
  events.push(event);                   // MODIFY
  await setAllEvents(events);           // WRITE
}
```

Classic read-modify-write race condition. If two requests hit `addEvent` simultaneously (e.g., two news items processed at the same time by GitHub Actions), one write will overwrite the other, silently losing an event.

**Fix options:**
- **Quick:** Use Redis `WATCH`/`MULTI` for optimistic locking
- **Better:** Use Redis sorted sets (`ZADD`) with timestamp as score, individual `HSET` per event
- **Best:** Move to a proper database (Postgres via Vercel Postgres, or Supabase)

---

### 7. No Input Validation on Event Creation/Update

**Files:** `src/app/api/events/route.ts`, `src/app/api/events/[id]/route.ts`

```typescript
const body = (await req.json()) as Omit<TimelineEvent, "id">;
const event: TimelineEvent = { ...body, id, slug };
```

The request body is spread directly into the event object with no validation:
- No check that `category` is a valid enum value
- No length limits on `headline` or `body`
- No sanitization for XSS in text fields
- No validation that `timeET` is a valid date string
- Extra fields in the body get persisted silently

---

### 8. Hardcoded Repository URL (4 occurrences)

**File:** `src/app/api/telegram/webhook/route.ts`

```typescript
"https://api.github.com/repos/FZ1010/OperationEpicFury/dispatches"
```

Appears 4 times in the webhook handler. Should be `process.env.GITHUB_REPO` or similar.

---

### 9. Hardcoded Stats in StatsBar

**File:** `src/components/sections/StatsBar.tsx`

```typescript
const statKeys = [
  { key: "killed" as const, value: 555, suffix: "+", prefix: "" },
  { key: "injured" as const, value: 2000, suffix: "+", prefix: "" },
  { key: "usKilled" as const, value: 6, suffix: "", prefix: "" },
  { key: "israeliKilled" as const, value: 11, suffix: "", prefix: "" },
  { key: "jets" as const, value: 200, suffix: "", prefix: "~" },
  { key: "targets" as const, value: 600, suffix: "+", prefix: "" },
  { key: "missiles" as const, value: 340, suffix: "+", prefix: "" },
  { key: "countries" as const, value: 10, suffix: "", prefix: "" },
];
```

All casualty and operational numbers are hardcoded in the component. The OP mentioned on Reddit that they "update those stats manually once everyday." This means every stat update requires a code change and redeploy.

**Fix:** Store stats in Redis under a `stats` key. Add a stats editor to the admin panel. The StatsBar component fetches from an API or receives stats as server-side props.

---

### 10. Source Conflict Resolution Is Undefined

**Raised by:** u/ultrathink-art (Reddit)

> "When 3 sources say X and 1 says Y, what does the agent do? Hard-coded 'majority wins' sounds obvious until you realize the minority source is sometimes the accurate one."

The news-cron workflow uses Claude to cross-check sources, but there's no defined strategy for handling contradictions.

**Suggestion:** Add a `confidence` field to events and a `conflictingSources` field when sources disagree:

```typescript
export interface TimelineEvent {
  // ... existing fields
  confidence?: "confirmed" | "unconfirmed" | "disputed";
  conflictingSources?: string[];
}
```

---

## Performance & Scalability

### 11. Main Page Loads ALL Events at Once

**File:** `src/app/[locale]/page.tsx`

```typescript
const events = await getPublishedEvents(); // fetches ALL published events
const reversed = [...events].reverse();
```

Every page load deserializes the entire event list from Redis, reverses it, and renders all of them. The `getPublishedEventsPaginated` function exists in `kv.ts` but is never used on the main page.

As events grow (already hundreds based on the Reddit thread), this will hurt Time to First Byte and increase client-side hydration cost.

**Fix:** Implement infinite scroll or "load more." Load the first 20-30 events server-side, then fetch more on scroll using the existing paginated endpoint.

---

### 12. Every KV Read Deserializes the Entire Dataset

Even `getEventById` calls `getAllEvents()` and then filters:

```typescript
export async function getEventById(id: string): Promise<TimelineEvent | undefined> {
  const events = await getAllEvents();
  return events.find((e) => e.id === id);
}
```

With 500+ events, every single API call parses the full JSON and sorts it.

**Fix:** Use Redis hashes (`HSET timeline:events <id> <json>`) for individual event access, and a sorted set (`ZADD timeline:events:index <timestamp> <id>`) for ordered listing.

---

### 13. 60-Second Revalidation Is Wasteful During Quiet Periods

```typescript
export const revalidate = 60;
```

During active news periods, 60 seconds is fine. During quiet periods, Vercel regenerates the page every minute for no reason, consuming serverless invocations.

**Fix:** Use on-demand revalidation (`revalidatePath`/`revalidateTag`) triggered when events are published. Instant updates when news drops, zero waste during quiet periods.

---

## Infrastructure & Reliability

### 14. Three Separate Redis Connection Pools

**Files:** `src/lib/kv.ts`, `src/lib/push.ts`, `src/lib/notify.ts`

Each file creates its own `cachedRedis` instance with identical configuration:

```typescript
// kv.ts
let cachedRedis: Redis | null = null;
function getRedis(): Redis {
  if (!cachedRedis) {
    cachedRedis = new Redis(process.env.KV_REDIS_URL!, { maxRetriesPerRequest: 3, lazyConnect: true });
  }
  return cachedRedis;
}

// push.ts — exact same pattern
// notify.ts — exact same pattern
```

This means up to 3 Redis connections per serverless invocation instead of 1.

**Fix:** Create a shared `src/lib/redis.ts` module that exports a single `getRedis()` function, and import it everywhere.

---

### 15. No Error Boundary for Redis Failures

If Redis goes down, the entire page crashes with an unhandled error. There's no React error boundary and no try/catch in the server components.

**Fix:** Wrap the data fetch in `page.tsx` with a try/catch and render a graceful fallback:

```typescript
let events: TimelineEvent[] = [];
try {
  events = await getPublishedEvents();
} catch {
  // render fallback UI
}
```

Or add a React error boundary component around the Timeline.

---

### 16. News Cron Is Disabled

**File:** `.github/workflows/news-cron.yml`

```yaml
  # schedule:
  #   - cron: "0 */3 * * *"
```

The automated 3-hour news gathering schedule is commented out. Only `workflow_dispatch` (manual trigger) works. Probably intentional during development or to control API costs, but worth noting since the Reddit post describes it as automated.

---

### 17. Media Buffer Has No Cleanup Mechanism

**File:** `src/lib/kv.ts`

```typescript
await redis.set(key, JSON.stringify(items), "EX", 600); // 10 min TTL
```

The media buffer for Telegram media groups has a 10-minute TTL, which is fine. But if `getBufferedMedia` is never called (e.g., the GitHub Action fails), the buffer just expires silently and the media is lost. There's no retry or dead-letter mechanism.

---

### 18. Service Worker Is a Static File

**File:** `public/sw.js`

The service worker is a hand-written static file rather than being generated. This means push notification handling (routes, icons, behavior) needs to be manually kept in sync with the app's routing. If the URL structure changes, the SW won't know.

Low risk for now, but worth noting for future maintenance.

---

## Community Feature Requests

All from the Reddit thread, organized by feasibility and demand.

### 19. RSS Feed / Newsletter

**Requested by:** u/ImAnOwl_ — "Please add rss or some Newsletter / Ticker thingy"
**OP response:** "I will add this as soon as possible" → "Done" (2 hours later)

Not present in the current codebase. If it was added after this commit, great. If not, a `GET /api/rss` route returning XML from published events would be straightforward.

---

### 20. Mini-Map with Event Locations

**Requested by:** u/zelig_nobel

> "For each item in this timeline, there's a place associated with it. I suggest adding a mini map with a red dot/star indicating the location of the event."

**Implementation:**
1. Add location field to `TimelineEvent`: `location?: { lat: number; lng: number; name: string }`
2. Add a lightweight map component (Leaflet or Mapbox GL) to `TimelineEntry`
3. Claude can extract location data during news processing

**Effort:** Medium. Data model change is trivial, but the map component and reliable coordinate extraction add complexity.

---

### 21. News Source Perspective / Political Spectrum

**Requested by:** u/rhymeslikeruns, u/start_hustle_001, u/EcstaticAd490

> "How do you manage coverage bias? I'd love to see the news sources as a summary in terms of political spectrum."

> "Is it possible to have a feature where we can view news from different perspectives?"

> "I would recommend to include international perspectives rather than simply u.s left-right"

**OP response:** "The goal here is a timeline, not a narrative. It's what happened, when, where, and who published it. The political spectrum summary is actually a good idea."

**Implementation:**
1. Add source metadata: `sourceRegion?: "us" | "eu" | "middle-east" | "asia" | "other"`
2. Add filter UI on the timeline to toggle perspectives
3. The `source` field already exists on every event — a simple grouping/filter on the frontend would go a long way as a quick win

---

### 22. US Casualty/Injury Counts

**Requested by:** u/sendmespam — "can you add death/injury counts for the US too?"
**OP response:** "I update those stats manually once everyday. Those stats should be accurate. I will add that too."

The StatsBar already has `usKilled: 6` hardcoded. The request was likely for more granular US stats (injured, etc.). Ties into issue #9 — stats should be in Redis, not hardcoded.

---

### 23. Brave Mobile Compatibility

**Reported by:** u/messiah-of-cheese — "Doesn't seem to work on brave mobile, just a large black page."

Likely caused by Brave's aggressive script blocking. The Hero section uses CSS-only animations which should be fine, but the `SplitText` component and Framer Motion's JS-based animations may be the culprit. The `contentVisibility: "auto"` optimization on timeline entries is good but doesn't help if the initial render fails.

**Fix:**
- Test with Brave shields up
- Ensure critical content renders without JS (SSR should handle this, but verify)
- Add a `<noscript>` fallback for the timeline content
- Check if any third-party scripts (Vercel Analytics) are blocking render

---

### 24. Expand to General Breaking News Platform

**Suggested by:** u/Dry_Natural_3617

> "You should find a nice generic news domain and expand it to all breaking news"

**OP response:** Interested but limited by internal sources being the key differentiator. Most news sources are internal/Persian (like Vahid Online) that get news from people inside Iran, often hours before Western media.

If pursued, would need multi-topic support, topic-based routing, and a more robust data layer.

---

### 25. SaaS-Style Animations on a War Tracker

**Noted by:** u/ProfessorSpecialist

> "Using Saas lp animations for a war tracker is kind of funny to me, but otherwise pretty good. I hope claude will one day manage to not make every page look the same"

Valid UX concern. The polished SaaS aesthetic (gradient glows, scroll velocity ticker, spotlight cards) creates a tonal mismatch with the gravity of the content. Not a bug, but worth considering if the goal is to be taken seriously as a news source.

---

## Code Quality & Maintenance

### 26. README Is Default Boilerplate

Still the default `create-next-app` template. For an open-source project with 156+ upvotes, it should document:
- What the project is and why it exists
- Architecture overview
- Required environment variables (there are many: `KV_REDIS_URL`, `ADMIN_PASSWORD`, `PUBLISH_SECRET`, `GH_PAT`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_USERS`, `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_SITE_URL`)
- How to set up locally
- How the automated pipeline works
- How to contribute

---

### 27. Inconsistent Authentication Patterns

Three different auth patterns across routes:

| Pattern | Routes |
|---------|--------|
| Cookie-only (`isAuthenticated()`) | `POST /api/events`, `POST /api/seed` |
| Token-only (`Bearer PUBLISH_SECRET`) | `POST /api/events/publish`, `POST /api/events/sort` |
| Dual (cookie OR token) | `PUT/DELETE /api/events/[id]`, `POST /api/events/migrate-slugs` |

This inconsistency makes it hard to reason about security. Should be unified into a single `authorize(req)` helper.

---

### 28. Unused Static Assets in `/public`

Default Next.js assets not used anywhere:
- `file.svg`, `globe.svg`, `window.svg`, `vercel.svg`, `next.svg`

---

### 29. `browserslist` in `package.json` Is Redundant

```json
"browserslist": ["Chrome >= 90", "Firefox >= 90", "Safari >= 15", "Edge >= 90"]
```

Next.js handles browser targeting internally via SWC. This config has no effect.

---

### 30. TypeScript `any` in Telegram Webhook

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMedia(message: any): MediaItem | null {
```

The Telegram message type should be properly typed. Consider using the `@types/node-telegram-bot-api` types or creating a `TelegramMessage` interface.

---

## Reconciliation Notes

Two independent reviews were performed. Here's where they agreed, disagreed, and what each uniquely caught:

### Both reviews caught:
- Unauthenticated `/api/events` GET leaking drafts
- Static/deterministic auth token
- Redis single-key bottleneck and race conditions
- No rate limiting
- No input validation
- Hardcoded GitHub repo URL
- Main page loading all events without pagination
- RSS feed missing from codebase despite OP saying "Done"
- Brave mobile issue

### Review 2 uniquely caught (added to this doc):
- **Hardcoded stats in StatsBar** — significant because OP manually updates daily
- **Three separate Redis connection pools** across kv.ts, push.ts, notify.ts
- **No error boundary** for Redis failures
- **News cron is disabled** (schedule commented out)
- **SplitText component** as likely Brave culprit (more specific diagnosis)

### Review 2 got wrong:
- **"Cookie has no httpOnly flag set explicitly"** — Incorrect. The cookie IS set with `httpOnly: true`, `secure: true` (in production), `sameSite: "lax"`, and `maxAge: 86400`. The auth route at `src/app/api/auth/route.ts` lines 13-17 clearly set these. The real problem is the deterministic token value, not the cookie flags.

### Review 1 uniquely caught:
- **Media proxy size/content validation** issue
- **Unauthenticated `GET /api/events/[id]`** for individual draft access
- **Media buffer cleanup** — no retry if GitHub Action fails
- **Error logging leaking sensitive info** in some routes
- **On-demand revalidation** as alternative to 60s timer

---

## Recommended Priority Order

### Immediate (do now)

| # | Issue | Risk | Effort |
|---|-------|------|--------|
| 1 | Lock down `GET /api/events` to published-only for unauthed users | Data leak | 10 min |
| 2 | Lock down `GET /api/events/[id]` for draft events | Data leak | 10 min |
| 3 | Add rate limiting on `POST /api/auth` | Brute force | 30 min |
| 4 | Add size limit to media proxy | Resource abuse | 30 min |

### This week

| # | Issue | Risk | Effort |
|---|-------|------|--------|
| 5 | Replace static auth token with random session tokens | Session hijack | 1 hr |
| 6 | Add input validation on event creation/update | XSS, data corruption | 1 hr |
| 7 | Unify authentication pattern into single helper | Maintainability | 1 hr |
| 8 | Consolidate 3 Redis connections into shared module | Resource waste | 30 min |
| 9 | Move hardcoded GitHub repo URL to env var | Maintainability | 15 min |
| 10 | Move stats from hardcoded to Redis/API | Daily pain point | 1-2 hrs |
| 11 | Add error boundary / try-catch for Redis failures | Reliability | 30 min |

### Next sprint

| # | Issue | Risk | Effort |
|---|-------|------|--------|
| 12 | Migrate Redis from single key to sorted sets/hashes | Data loss (race conditions) | 3-4 hrs |
| 13 | Add pagination/infinite scroll to main page | Performance | 2-3 hrs |
| 14 | Switch to on-demand revalidation | Cost/performance | 1 hr |
| 15 | RSS feed (if not already done) | Feature request | 30 min |
| 16 | Test and fix Brave mobile rendering | Accessibility | 1-2 hrs |
| 17 | Write a real README with env var docs | Community/contributors | 1 hr |

### Backlog (nice to have)

| # | Issue | Risk | Effort |
|---|-------|------|--------|
| 18 | Add `confidence` field for source conflict resolution | Trust/accuracy | 2 hrs |
| 19 | Source perspective/region metadata + filter UI | Feature request | 4-6 hrs |
| 20 | Mini-map with event locations | Feature request | 6-8 hrs |
| 21 | Re-enable news cron schedule | Automation | 5 min |
| 22 | Clean up unused assets and browserslist | Housekeeping | 10 min |
| 23 | Type Telegram messages properly (remove `any`) | Code quality | 1 hr |
| 24 | Service worker generation instead of static file | Maintainability | 2 hrs |

---

## Live Pipeline Observations

As of March 2, 2026, the GitHub issues tab shows the pipeline is actively running:

- **16 open issues** (pending human review)
- **280 closed issues** (published to timeline)
- **~296 total events** processed through the system

Issues are being created by the `claude` bot in batches consistent with the 3-hour cycle (batches at 8h ago, 6h ago, 1h ago), suggesting the cron is either re-enabled or being triggered manually via `workflow_dispatch`.

**Labeling is well-structured:** Each issue carries category labels (`cat:strike`, `cat:announcement`, `cat:world-reaction`, `cat:casualty`, `cat:breaking-important`) that map directly to the `EventCategory` TypeScript type, plus a `pending-review` label as the human gate.

**Key takeaway for scalability:** With ~296 events already, the single Redis JSON blob concern (issues #6 and #12) is no longer theoretical. Every API call is parsing and sorting a ~296-element array. At the current ingestion rate (~16 events per batch, multiple batches per day), this will cross 500+ events within a week or two, making the Redis migration increasingly urgent.

**Test issue spotted:** `#359 [Test] single-quote-backtick-test` — edge case testing for the news processing pipeline, indicating active development and QA.

---

## Reddit Thread Key Interactions

For context, here are the notable community interactions that informed this review:

- **u/ddadovic** suggested sorting news by latest first (descending). OP implemented it same day.
- **u/WhoKnewTech** confirmed the sort fix and praised the execution.
- **u/JoeyJoeC** suggested detecting user timezone from browser headers instead of showing ET. OP implemented it same day.
- **u/TimeKillsThem** asked about the design process. OP revealed the entire landing page was generated from a single prompt with zero design instructions beyond "i really wanna good ui."
- **u/SpoiledKoolAid** reported Claude blocking similar automated news search requests as "surveillance." OP's advice: give Claude freedom rather than detailed instructions.
- **u/justgetoffmylawn** asked about the development process. OP used Opus 4.6 with `--dangerously-skip-permissions`, Chrome DevTools MCP, and Vercel MCP.
- **u/ultrathink-art** raised the source conflict resolution question — the most technically substantive feedback in the thread.
- **u/ProfessorSpecialist** noted the SaaS-style animations feel odd for a war tracker.
- **u/Arcnotch02** raised concerns about Al Jazeera as a source. OP explained they manually cross-check and delete unreliable entries, and mark unconfirmed news as such.
- **u/DatafyingTech** suggested using a Claude Agent Team Manager to reduce API costs.
- **u/FZ1010 (OP)** mentioned most news sources are internal/Persian (like Vahid Online) that get news from people inside Iran, often hours before Western media picks it up.

---

*This document should be reviewed and updated as issues are addressed. Check off items as they're completed.*
