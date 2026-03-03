# Operation Epic Fury — Fix Plan

**Created:** March 2, 2026
**Based on:** `docs/CODE_REVIEW_AND_SUGGESTIONS.md`
**Goal:** Fix all existing issues before adding new features

---

## Phase 1: Critical Security (Immediate)

Stop the bleeding. These are actively exploitable right now.

### 1.1 — Lock down `GET /api/events` for unauthenticated users
- **File:** `src/app/api/events/route.ts`
- Return only published events for unauthenticated requests
- Return all events (including drafts) only when authenticated

### 1.2 — Lock down `GET /api/events/[id]` for draft events
- **File:** `src/app/api/events/[id]/route.ts`
- Return 404 for draft events unless authenticated

### 1.3 — Add rate limiting on `POST /api/auth`
- Implement a simple Redis-based rate limiter (IP + sliding window)
- Block after 5 failed attempts per IP per 15 minutes

### 1.4 — Add size/content validation to media proxy
- **File:** `src/app/api/media/[fileId]/route.ts`
- Check `Content-Length` before streaming, reject files > 10MB for photos
- Validate content-type is actually image or video

---

## Phase 2: Auth & Validation Hardening

### 2.1 — Replace static auth token with random session tokens
- **File:** `src/lib/auth.ts`
- Generate `randomBytes(32)` on each login
- Store session token in Redis with TTL (24h)
- Validate against Redis instead of recomputing HMAC

### 2.2 — Unify authentication into a single helper
- Create `src/lib/authorize.ts` with a single `authorize(req)` function
- Checks both cookie auth AND bearer token auth
- Replace all 3 inconsistent patterns across routes

### 2.3 — Add input validation on event creation/update
- **Files:** `src/app/api/events/route.ts`, `src/app/api/events/[id]/route.ts`, `src/app/api/events/publish/route.ts`
- Validate `category` against allowed enum values
- Enforce length limits on `headline` (500 chars) and `body` (10000 chars)
- Validate `timeET` format
- Strip unknown fields from request body

---

## Phase 3: Infrastructure & Reliability

### 3.1 — Consolidate Redis into a shared module
- Create `src/lib/redis.ts` exporting a single `getRedis()` function
- Update `kv.ts`, `push.ts`, `notify.ts` to import from shared module
- Eliminates 3 separate connection pools

### 3.2 — Add error boundary for Redis failures
- Wrap data fetches in `src/app/[locale]/page.tsx` with try/catch
- Render a graceful fallback UI when Redis is down
- Add React error boundary around Timeline component

### 3.3 — Move hardcoded GitHub repo URL to env var
- **File:** `src/app/api/telegram/webhook/route.ts`
- Replace 4 hardcoded `https://api.github.com/repos/FZ1010/OperationEpicFury/dispatches` with `process.env.GITHUB_REPO_DISPATCH_URL` or construct from `process.env.GITHUB_REPO`

---

## Phase 4: Data Layer Migration

The big one. ~296 events in a single JSON blob, growing daily.

### 4.1 — Migrate Redis from single key to hash + sorted set
- **File:** `src/lib/kv.ts`
- Store each event as `HSET timeline:events <id> <json>`
- Maintain a sorted set `ZADD timeline:events:index <timestamp> <id>` for ordering
- `getEventById` becomes `HGET` (O(1)) instead of parse-all-then-find
- `getPublishedEvents` uses `ZRANGEBYSCORE` + `HMGET`
- `addEvent` becomes atomic `HSET` + `ZADD` (no more read-modify-write race)

### 4.2 — Write a migration script
- Read all events from the old single key
- Write each to the new hash + sorted set structure
- Verify counts match
- Keep old key as backup until confirmed working

### 4.3 — Update all KV consumers
- Update all routes and components that call `getAllEvents`, `getPublishedEvents`, etc.
- Ensure `addEvent`, `updateEvent`, `deleteEvent` use atomic operations
- Test the full pipeline: Telegram → GitHub Action → publish → timeline

---

## Phase 5: Performance

### 5.1 — Add pagination / infinite scroll to main page
- **File:** `src/app/[locale]/page.tsx`, `src/components/sections/Timeline.tsx`
- Server-render the first 30 events
- Add client-side infinite scroll using `GET /api/events/published?offset=30&limit=30`
- The paginated endpoint already exists in `kv.ts`

### 5.2 — Switch to on-demand revalidation
- Remove `export const revalidate = 60` from page.tsx
- Add `revalidatePath` / `revalidateTag` calls in the publish and update routes
- Instant updates on publish, zero waste during quiet periods

### 5.3 — Move stats from hardcoded to Redis
- **File:** `src/components/sections/StatsBar.tsx`
- Create a `stats` key in Redis storing the stat values
- Add a stats API endpoint (`GET/PUT /api/stats`)
- Add a stats editor to the admin panel
- StatsBar fetches from API or receives as server-side props

---

## Phase 6: Code Quality & Cleanup

### 6.1 — Write a real README
- Project description and purpose
- Architecture overview (copy from review doc)
- All required environment variables with descriptions
- Local setup instructions
- How the automated pipeline works
- How to contribute

### 6.2 — Clean up unused assets
- Delete from `/public`: `file.svg`, `globe.svg`, `window.svg`, `vercel.svg`, `next.svg`
- Remove `browserslist` from `package.json`

### 6.3 — Type Telegram messages properly
- **File:** `src/app/api/telegram/webhook/route.ts`
- Create a `TelegramMessage` interface replacing the `any` type
- Remove the `eslint-disable` comment

### 6.4 — Sanitize error logging
- Audit all `catch` blocks across API routes
- Ensure no environment variables or tokens leak into error messages or responses

---

## Execution Notes

- Each phase should be a separate branch and PR
- Phase 1 is the most urgent — do it first, deploy immediately
- Phase 4 (Redis migration) is the riskiest — needs careful testing and a rollback plan
- Phases 5 and 6 can be done in parallel
- After all phases complete, the codebase is ready for new feature work (RSS, mini-map, source perspectives, etc.)

---

## Phase Dependency Graph

```
Phase 1 (Security) ──→ Phase 2 (Auth/Validation)
                              │
Phase 3 (Infrastructure) ─────┤
                              │
                              ▼
                     Phase 4 (Data Migration)
                              │
                              ▼
                     Phase 5 (Performance)
                              │
                     Phase 6 (Cleanup) ← can run in parallel with Phase 5
```

Phase 1 and Phase 3 have no dependencies on each other and can run in parallel.
Phase 4 depends on Phase 3 (shared Redis module should exist before migration).
Phase 5 depends on Phase 4 (pagination works better with the new data structure).
Phase 6 is independent and can happen anytime.
