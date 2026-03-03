# Operation Epic Fury — Feature Implementation Plan

**Date:** March 2, 2026
**Based on:** Community suggestions from `CODE_REVIEW_AND_SUGGESTIONS.md` (items #19–#25) + independent research on real-time news site best practices.

---

## Table of Contents

1. [Phase 7: RSS & Atom Feeds](#phase-7-rss--atom-feeds)
2. [Phase 8: Search & Filtering](#phase-8-search--filtering)
3. [Phase 9: Social Sharing & Per-Event OG Images](#phase-9-social-sharing--per-event-og-images)
4. [Phase 10: Source Credibility & Conflict Resolution](#phase-10-source-credibility--conflict-resolution)
5. [Phase 11: Event Location & Mini-Map](#phase-11-event-location--mini-map)
6. [Phase 12: Accessibility & Brave Compatibility](#phase-12-accessibility--brave-compatibility)
7. [Phase 13: Offline Support & PWA Hardening](#phase-13-offline-support--pwa-hardening)
8. [Phase 14: Archive, Export & Embeddable Widget](#phase-14-archive-export--embeddable-widget)
9. [Phase Dependency Graph](#phase-dependency-graph)
10. [Priority Matrix](#priority-matrix)

---

## Phase 7: RSS & Atom Feeds

**Origin:** Reddit request from u/ImAnOwl_ — OP said "Done" but no feed exists in the codebase.
**Impact:** High — RSS is table stakes for a news site. News aggregators (Google News, Feedly, Inoreader) require it. Many power users rely on RSS exclusively.

### 7.1 — RSS 2.0 feed route

- **Create:** `src/app/api/rss/route.ts`
- Return XML with `Content-Type: application/rss+xml`
- Fetch last 50 published events via `getPublishedEventsPaginated(0, 50)`
- Each `<item>` includes: `<title>`, `<description>`, `<link>` (to event page), `<pubDate>`, `<category>`, `<source>`, `<guid>` (event id)
- Include `<language>en</language>` in channel
- Cache with `Cache-Control: public, max-age=300, s-maxage=300` (5 min)

### 7.2 — Atom feed route

- **Create:** `src/app/api/atom/route.ts`
- Return XML with `Content-Type: application/atom+xml`
- Same data as RSS but in Atom 1.0 format
- Include `<link rel="alternate" hreflang="fa">` for Farsi version

### 7.3 — Farsi feed variants

- **Create:** `src/app/api/rss/fa/route.ts` and `src/app/api/atom/fa/route.ts`
- Same structure but use `headline_fa` and `body_fa` fields
- `<language>fa</language>`

### 7.4 — Feed autodiscovery

- **Modify:** `src/app/layout.tsx`
- Add `<link rel="alternate" type="application/rss+xml">` and `<link rel="alternate" type="application/atom+xml">` to the `<head>` via Next.js metadata

### 7.5 — Feed link in footer

- **Modify:** `src/components/sections/Footer.tsx`
- Add RSS icon/link pointing to `/api/rss`

---

## Phase 8: Search & Filtering

**Origin:** Natural extension for a growing timeline (300+ events and counting). Users need to find specific events without scrolling through everything.
**Impact:** High — directly improves usability as the dataset grows.

### 8.1 — Search index in Redis

- **Create:** `src/lib/search.ts`
- On event publish/update, tokenize headline + body into lowercase words
- Store in a Redis inverted index: `SET search:word:<token>` containing event IDs
- Provide `searchEvents(query: string, limit: number)` that intersects token sets and returns matching event IDs
- Fallback: if index doesn't exist, do a full scan with `getPublishedEvents()` and filter in-memory

### 8.2 — Search API endpoint

- **Create:** `src/app/api/events/search/route.ts`
- `GET /api/events/search?q=<query>&limit=20`
- Returns matching events sorted by relevance (number of matching tokens) then by time
- Rate limit: 30 requests/IP/minute

### 8.3 — Category filter on timeline

- **Modify:** `src/components/sections/Timeline.tsx`
- Add a horizontal filter bar above the timeline with category pills: All, Strike, Casualty, World Reaction, etc.
- Filtering is client-side on already-loaded events + modifies the fetch URL for subsequent pages (`/api/events/published?category=strike&offset=0&limit=30`)

### 8.4 — Category filter on API

- **Modify:** `src/app/api/events/published/route.ts`
- Accept optional `category` query param
- Filter in `getPublishedEventsPaginated` or add a new `getPublishedEventsByCategory` function

### 8.5 — Search bar component

- **Create:** `src/components/ui/SearchBar.tsx`
- Client component with debounced input (300ms)
- Fetches from `/api/events/search?q=...`
- Displays results in a dropdown overlay
- Keyboard navigable (arrow keys, Enter to select, Escape to close)

### 8.6 — Add search bar to page layout

- **Modify:** `src/app/[locale]/page.tsx` or the Hero section
- Place search bar below the hero, above the timeline

---

## Phase 9: Social Sharing & Per-Event OG Images

**Origin:** Research — news sites live and die by shareability. The event detail page has basic OG tags but no share buttons and no dynamic OG images.
**Impact:** Medium-high — directly affects virality and social media reach.

### 9.1 — Share buttons on event detail page

- **Create:** `src/components/ui/ShareButtons.tsx`
- Client component with share links for: X/Twitter, Telegram, WhatsApp, copy-link
- Use `navigator.share()` Web Share API as primary on mobile, fall back to individual links
- No third-party scripts — all native URL-based sharing
- Add to `src/app/[locale]/events/[slug]/page.tsx` below the source section

### 9.2 — Dynamic OG images

- **Create:** `src/app/api/og/route.tsx`
- Use Next.js `ImageResponse` (from `next/og`) to generate dynamic OG images
- Accept `?slug=<slug>` param, fetch event, render headline + category + time on a branded template
- Dark background, red accent, Operation Epic Fury branding
- Update `generateMetadata` in event detail page to point OG image to `/api/og?slug=<slug>`

### 9.3 — Share buttons on timeline entries

- **Modify:** `src/components/ui/TimelineEntry.tsx`
- Add a small share icon that expands to show share options on click
- Shares the event detail page URL (`/<locale>/events/<slug>`)

---

## Phase 10: Source Credibility & Conflict Resolution

**Origin:** Reddit feedback from u/ultrathink-art (source conflicts), u/rhymeslikeruns and u/EcstaticAd490 (perspective/bias), u/Arcnotch02 (source reliability).
**Impact:** Medium — builds trust and differentiates from other trackers.

### 10.1 — Extend TimelineEvent type

- **Modify:** `src/data/timeline.ts`
- Add fields:
  ```typescript
  confidence?: "confirmed" | "unconfirmed" | "disputed";
  sourceRegion?: "us" | "eu" | "middle-east" | "asia" | "other";
  sources?: { name: string; url: string; region?: string }[];
  ```
- `source` and `sourceUrl` remain for backward compatibility (primary source)
- `sources` array allows multiple sources per event

### 10.2 — Update validation

- **Modify:** `src/lib/validate-event.ts`
- Add `confidence` to allowed enum values
- Add `sourceRegion` to allowed enum values
- Validate `sources` array structure if present

### 10.3 — Confidence badge on timeline entries

- **Modify:** `src/components/ui/TimelineEntry.tsx`
- Show a small badge: ✓ Confirmed (green), ? Unconfirmed (yellow), ⚠ Disputed (orange)
- Default to "confirmed" if field is absent (backward compat)

### 10.4 — Source region filter

- **Modify:** `src/components/sections/Timeline.tsx`
- Add a secondary filter row for source region (alongside category filter from Phase 8)
- "All Sources", "US/Western", "Middle East", "European", "Asian"

### 10.5 — Multi-source display on event detail

- **Modify:** `src/app/[locale]/events/[slug]/page.tsx`
- If `sources` array exists, show all sources with their names and regions
- Replace the single source link with a "Sources" section listing all

### 10.6 — Update Claude processing prompts

- **Document only** — note in README that the GitHub Actions workflows should be updated to:
  - Extract confidence level from cross-checking
  - Identify source region
  - Populate the `sources` array when multiple sources cover the same event

---

## Phase 11: Event Location & Mini-Map

**Origin:** Reddit request from u/zelig_nobel — "add a mini map with a red dot/star indicating the location."
**Impact:** Medium — visual context for geographic events. Particularly valuable for strikes and military operations.

### 11.1 — Extend TimelineEvent type

- **Modify:** `src/data/timeline.ts`
- Add:
  ```typescript
  location?: { lat: number; lng: number; name: string };
  ```

### 11.2 — Update validation

- **Modify:** `src/lib/validate-event.ts`
- Validate location object structure if present (lat: -90 to 90, lng: -180 to 180, name: string)

### 11.3 — Map component

- **Install:** `leaflet` and `react-leaflet` packages
- **Create:** `src/components/ui/EventMap.tsx`
- Client component (Leaflet doesn't support SSR), loaded via `next/dynamic` with `ssr: false`
- Dark-themed map tiles (CartoDB dark_all or Stadia dark)
- Single red marker at event location
- Small (200px height), rounded corners, fits inside the timeline entry

### 11.4 — Add map to event detail page

- **Modify:** `src/app/[locale]/events/[slug]/page.tsx`
- If `event.location` exists, render `<EventMap>` below the body text

### 11.5 — Add mini-map to timeline entries

- **Modify:** `src/components/ui/TimelineEntry.tsx`
- If event has location, show a small static map thumbnail or a clickable map icon that expands

### 11.6 — Aggregate map page (stretch goal)

- **Create:** `src/app/[locale]/map/page.tsx`
- Full-page map showing all events with locations as markers
- Click a marker to see the event headline and link to detail page
- Cluster markers when zoomed out

---

## Phase 12: Accessibility & Brave Compatibility

**Origin:** u/messiah-of-cheese reported Brave mobile shows a blank black page. Plus general WCAG compliance for a public news site.
**Impact:** High — accessibility is both ethical and legally relevant (EAA 2025). Brave has ~70M monthly users.

### 12.1 — Noscript fallback

- **Modify:** `src/app/layout.tsx`
- Add `<noscript>` block with a basic message and link to the RSS feed
- Ensures content is discoverable even when JS is blocked

### 12.2 — Skip navigation link

- **Modify:** `src/app/[locale]/layout.tsx` or the locale page
- Add a visually-hidden "Skip to main content" link as the first focusable element
- Links to `#main-content` anchor on the timeline

### 12.3 — ARIA live region for new events

- **Modify:** `src/components/sections/Timeline.tsx`
- When new events load via infinite scroll, wrap the announcement in an `aria-live="polite"` region
- Screen readers will announce "X more events loaded"

### 12.4 — Keyboard navigation for timeline

- **Modify:** `src/components/ui/TimelineEntry.tsx`
- Ensure each entry is focusable and has proper `role` and `aria-label`
- Arrow key navigation between entries (optional enhancement)

### 12.5 — Reduced motion support

- **Audit:** `src/components/sections/Hero.tsx`, `StatsBar.tsx`, `Timeline.tsx`, `Ticker.tsx`
- Ensure all Framer Motion animations respect `prefers-reduced-motion`
- Framer Motion's `useReducedMotion()` hook should gate animations
- The `CountUp` component should show the final number immediately when reduced motion is preferred

### 12.6 — Brave compatibility fix

- **Test** the site with Brave shields up (aggressive blocking)
- Likely culprits: Vercel Analytics script, Framer Motion's `LazyMotion` dynamic import
- **Fix:** Ensure the SSR output contains all critical content (headlines, body text) without requiring JS hydration
- Add `font-display: swap` (already present via Next.js font config — verify)
- Test that the `SplitText` component degrades gracefully when its JS doesn't execute

### 12.7 — Color contrast audit

- Audit all text colors against WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Key concern: `text-zinc-500` and `text-zinc-600` on `bg-black` may fail contrast
- Fix any failing combinations

---

## Phase 13: Offline Support & PWA Hardening

**Origin:** Research — the site already has a manifest and service worker, but the SW is a static file that only handles push notifications. A news site benefits enormously from offline reading.
**Impact:** Medium — critical for users in regions with unreliable internet (Iran, conflict zones).

### 13.1 — Cache-first service worker

- **Rewrite:** `public/sw.js`
- Implement a proper caching strategy:
  - **App shell** (HTML, CSS, JS): cache-first with network fallback
  - **API data** (`/api/events/published`): network-first with cache fallback (stale-while-revalidate)
  - **Images/media**: cache-first with 7-day expiry
- Use the Cache API directly (no Workbox dependency needed for this scope)

### 13.2 — Offline fallback page

- **Create:** `public/offline.html`
- Simple static HTML page shown when the user is offline and the requested page isn't cached
- "You're offline. Previously loaded events are still available."
- Style it to match the site's dark theme

### 13.3 — Register SW properly

- **Modify:** `src/app/layout.tsx` or create `src/components/ui/ServiceWorkerRegistration.tsx`
- Register the SW on page load with proper update handling
- Show a toast when a new version is available: "New updates available. Refresh to see latest."

### 13.4 — Cache published events for offline reading

- **Modify:** `src/components/sections/Timeline.tsx`
- After loading events via infinite scroll, store them in IndexedDB or Cache API
- When offline, load from cache instead of showing an error

---

## Phase 14: Archive, Export & Embeddable Widget

**Origin:** Research — news archives are valuable for researchers, journalists, and historians. An embeddable widget increases reach.
**Impact:** Low-medium — long-term value, not urgent.

### 14.1 — JSON export endpoint

- **Create:** `src/app/api/export/route.ts`
- `GET /api/export?format=json` — returns all published events as a downloadable JSON file
- `GET /api/export?format=csv` — returns a CSV with columns: time, headline, category, source, sourceUrl
- Add `Content-Disposition: attachment` header
- Rate limit: 5 requests/IP/hour

### 14.2 — Archive page with date navigation

- **Create:** `src/app/[locale]/archive/page.tsx`
- Calendar-style or date-grouped view of all events
- Group by day, show event count per day
- Click a day to expand and see all events from that day
- Useful for researchers looking at specific dates

### 14.3 — Embeddable timeline widget

- **Create:** `src/app/api/embed/route.ts`
- Returns a self-contained HTML snippet with the last 10 events
- Other sites can embed via `<iframe src="https://epicfuryops.info/api/embed">`
- Minimal styling, dark theme, links back to the full site
- Add CORS headers for cross-origin embedding

### 14.4 — Embed code generator

- **Add to:** Footer or a new `/embed` page
- Show a copyable `<iframe>` snippet
- Options: number of events, category filter, light/dark theme

---

## Phase Dependency Graph

```
Phase 7 (RSS Feeds) ─────────────────────── Independent
Phase 8 (Search & Filter) ──────────────── Independent
Phase 9 (Social Sharing & OG) ──────────── Independent
Phase 10 (Source Credibility) ───────────── Independent
Phase 11 (Mini-Map) ─────────────────────── Independent (but benefits from Phase 10 source regions)
Phase 12 (Accessibility & Brave) ────────── Independent (SHOULD BE EARLY)
Phase 13 (Offline/PWA) ──────────────────── After Phase 12 (accessibility in offline page)
Phase 14 (Archive/Export/Embed) ─────────── After Phase 8 (search reuse) and Phase 10 (source data)
```

All phases are largely independent. Recommended execution order follows the priority matrix below.

---

## Priority Matrix

### Do First (high impact, low-medium effort)

| Phase | What | Why | Effort |
|-------|------|-----|--------|
| 7 | RSS & Atom Feeds | Table stakes for news sites. OP already promised it. Google News requires it. | 2-3 hrs |
| 12 | Accessibility & Brave | Brave blank page is a live bug. WCAG compliance is ethical + legal. | 3-4 hrs |
| 9 | Social Sharing | Directly drives traffic. Share buttons + dynamic OG images. | 2-3 hrs |

### Do Next (high impact, medium effort)

| Phase | What | Why | Effort |
|-------|------|-----|--------|
| 8 | Search & Filtering | 300+ events and growing. Users can't find things. | 4-5 hrs |
| 10 | Source Credibility | Builds trust. Addresses the most substantive Reddit feedback. | 3-4 hrs |

### Do Later (medium impact, higher effort)

| Phase | What | Why | Effort |
|-------|------|-----|--------|
| 13 | Offline/PWA | Critical for users in conflict zones with bad internet. | 3-4 hrs |
| 11 | Mini-Map | Cool visual feature but requires location data pipeline changes. | 4-6 hrs |
| 14 | Archive/Export/Embed | Long-term value for researchers and reach. | 4-5 hrs |

---

## Research-Based Additions (Not in Original Suggestions)

The following items came from researching best practices for real-time news sites in 2025-2026 and are incorporated into the phases above:

1. **Dynamic OG images** (Phase 9.2) — Per-event branded images dramatically improve click-through from social media. Next.js `ImageResponse` makes this trivial.

2. **Web Share API** (Phase 9.1) — Native mobile sharing is far superior to custom share buttons. Falls back gracefully on desktop.

3. **ARIA live regions** (Phase 12.3) — Critical for screen reader users on infinite-scroll pages. Without this, new content loads silently.

4. **Reduced motion support** (Phase 12.5) — Required by WCAG 2.1 AA. Framer Motion sites commonly fail this.

5. **Offline reading** (Phase 13) — Particularly relevant for this site's audience. Users in Iran and conflict zones often have intermittent connectivity. Caching previously-loaded events in the service worker means the timeline remains readable offline.

6. **JSON/CSV export** (Phase 14.1) — Researchers and journalists covering the conflict will want raw data. A simple export endpoint makes the project more valuable as a public resource.

7. **Embeddable widget** (Phase 14.3) — Other news sites and blogs covering the conflict can embed a live ticker. Increases reach without requiring users to visit the site directly.

8. **Search** (Phase 8) — Not explicitly requested by the community, but with 300+ events and growing at ~50/day, finding specific events by keyword is becoming a real usability problem. Redis-based inverted index keeps it fast without adding a search service dependency.

9. **Color contrast audit** (Phase 12.7) — The dark theme uses several zinc shades that likely fail WCAG AA contrast ratios against the black background. Quick fix with high accessibility impact.

---

*This plan should be executed in priority order. Each phase is a separate commit (or set of commits). Test with `tsc --noEmit` and `eslint` after each phase.*

---

## Phase 15: News Pipeline & Source Expansion

**Origin:** Reddit comments on source diversity (u/rhymeslikeruns, u/EcstaticAd490, u/Arcnotch02) + the fact that the current 8 sources skew heavily left-center/center with no right-leaning outlets. Also: the cron is disabled, and Claude's prompts don't extract confidence or location data.
**Impact:** Very high — source diversity is the #1 credibility factor for a news aggregator. Without balanced sourcing, the timeline inherits the bias of its inputs.

### Current Source Audit

The 8 hardcoded sources in `news-cron.yml` and their bias ratings (per AllSides / Ad Fontes Media / Media Bias Fact Check consensus):

| Source | Bias Rating | Region | Notes |
|--------|------------|--------|-------|
| Fox News | Right / Lean Right | US | Only source with any rightward lean |
| CNN | Lean Left | US | |
| Washington Post | Lean Left | US | |
| Reuters | Center | Global | Wire service, gold standard |
| Axios | Lean Left | US | |
| CBS | Lean Left | US | |
| Times of Israel | Center (on Israeli politics) | Israel | Strong on Israel-specific coverage |
| Al Jazeera | — | — | **Removed** — excluded per editorial decision |

**Problem:** 5 of 7 remaining sources are US-based. 4 of 7 lean left. Zero European, zero Asian, zero Iranian/Persian sources. Only 1 right-leaning source. No wire services besides Reuters.

### 15.1 — Balanced source list

Reorganize sources into a balanced matrix. The cron should pull from all of these:

**Center / Wire Services (most factual, least bias):**
| Source | URL | Region |
|--------|-----|--------|
| Reuters | https://www.reuters.com/ | Global |
| Associated Press | https://apnews.com/ | Global |
| BBC News | https://www.bbc.com/news | UK/Global |
| Al-Monitor | https://www.al-monitor.com/ | Middle East (US-based) |

**Lean Left / Left:**
| Source | URL | Region |
|--------|-----|--------|
| CNN | https://www.cnn.com/ | US |
| Washington Post | https://www.washingtonpost.com/ | US |
| NPR | https://www.npr.org/ | US |
| France 24 | https://www.france24.com/en/ | Europe (France) |

**Lean Right / Right:**
| Source | URL | Region |
|--------|-----|--------|
| Fox News | https://www.foxnews.com/category/politics/defense/wars/war-with-iran | US |
| Wall Street Journal | https://www.wsj.com/ | US |
| New York Post | https://nypost.com/ | US |
| Daily Telegraph | https://www.telegraph.co.uk/ | UK |
| Times of Israel | https://www.timesofisrael.com/ | Israel |

**Regional / Non-Western:**
| Source | URL | Region | Notes |
|--------|-----|--------|-------|
| Al Arabiya | https://english.alarabiya.net/ | Middle East (Saudi) | Saudi-aligned perspective |
| Middle East Eye | https://www.middleeasteye.net/ | Middle East (UK-based) | Independent ME coverage |
| DW (Deutsche Welle) | https://www.dw.com/en/ | Europe (Germany) | German public broadcaster |
| NHK World | https://www3.nhk.or.jp/nhkworld/ | Asia (Japan) | Japanese public broadcaster |
| SCMP | https://www.scmp.com/ | Asia (Hong Kong) | Asian perspective |
| Iran International | https://www.iranintl.com/en | Iran (UK-based) | Persian diaspora, anti-regime |
| IRNA | https://en.irna.ir/ | Iran (state) | Iranian state media — use with caution, label clearly |

**Total: 20 sources** — 4 center, 4 lean-left, 5 lean-right, 7 regional/non-Western.

### 15.2 — Source metadata configuration

- **Create:** `src/data/sources.ts`
- Define a `NewsSource` type and export the full source list:
  ```typescript
  export interface NewsSource {
    id: string;
    name: string;
    url: string;
    bias: "left" | "lean-left" | "center" | "lean-right" | "right";
    region: "us" | "eu" | "middle-east" | "asia" | "global";
    reliability: "high" | "medium" | "mixed";  // based on Ad Fontes/MBFC
    stateMedia?: boolean;  // flag for IRNA, etc.
  }
  ```
- This file becomes the single source of truth — used by the cron, the UI filters, and the source credibility display

### 15.3 — Update news-cron.yml

- **Modify:** `.github/workflows/news-cron.yml`
- Replace the hardcoded 8-source list with the full 21-source list
- Group into batches to avoid Claude context limits:
  - Batch 1: Wire services + center (4 sources)
  - Batch 2: US left + US right (5+3 sources)
  - Batch 3: Regional + non-Western (7 sources)
- Each batch runs as a separate job in the same workflow
- Add source bias label to the Claude prompt so it can include it in the event JSON

### 15.4 — Re-enable the cron schedule

- **Modify:** `.github/workflows/news-cron.yml`
- Uncomment the schedule:
  ```yaml
  schedule:
    - cron: "0 */3 * * *"
  ```
- Consider staggering: wire services every 2h, others every 3h

### 15.5 — Add bias/region to Claude's output

- **Modify:** All workflow prompts (`news-cron.yml`, `telegram-news.yml`, `external-news.yml`, `tweet-news.yml`)
- Update the Event JSON template to include:
  ```json
  {
    "sourceRegion": "<region>",
    "confidence": "confirmed|unconfirmed|disputed",
    "sources": [{"name": "...", "url": "...", "region": "..."}]
  }
  ```
- For the cron: Claude should cross-reference across sources and set confidence based on corroboration
- For Telegram/external: confidence defaults to "unconfirmed" (single source)

### 15.6 — Update Claude's cross-checking prompt

- **Modify:** `.github/workflows/news-cron.yml` prompt
- Add explicit instructions:
  ```
  ## Cross-checking rules:
  - If 3+ sources from different bias categories report the same event → "confirmed"
  - If only sources from one bias category report it → "unconfirmed"
  - If sources contradict each other on key facts → "disputed"
  - Always note which sources agree and which disagree
  - NEVER trust a single source for casualty numbers — require 2+ sources
  - State media (IRNA) should be labeled as such and cross-checked against independent sources
  ```

### 15.7 — Source bias indicator in UI

- **Modify:** `src/components/ui/TimelineEntry.tsx`
- Show a small colored dot next to the source name:
  - 🔵 Left / Lean Left
  - ⚪ Center
  - 🔴 Right / Lean Right
  - 🟡 Regional / Non-Western
- Tooltip on hover showing the full bias rating
- This ties into Phase 10 (source credibility) — the data model changes from Phase 10 are a prerequisite

### 15.8 — "View from all sides" feature

- When multiple sources cover the same event, show a collapsible "All perspectives" section on the event detail page
- Group by bias: "Left-leaning sources say...", "Right-leaning sources say...", "Regional sources say..."
- This is the killer feature that sites like Ground News charge for — offering it free on a conflict tracker would be a major differentiator

---

### Phase 15 Dependencies

- Phase 10 (Source Credibility) should be done first — it adds the `confidence`, `sourceRegion`, and `sources` fields to the data model
- Phase 15.7 and 15.8 depend on Phase 10's UI work
- Phase 15.1–15.6 (pipeline changes) are independent and can be done anytime

### Phase 15 Effort Estimate

| Sub-phase | Effort |
|-----------|--------|
| 15.1 Source list research | Done (above) |
| 15.2 Source metadata file | 30 min |
| 15.3 Update cron workflow | 1-2 hrs |
| 15.4 Re-enable cron | 5 min |
| 15.5 Add bias/region to prompts | 1-2 hrs |
| 15.6 Cross-checking prompt | 1 hr |
| 15.7 Bias indicator UI | 1-2 hrs |
| 15.8 "All perspectives" feature | 3-4 hrs |
| **Total** | **8-12 hrs** |

---

## Updated Priority Matrix (with Phase 15)

### Do First
| Phase | What | Why |
|-------|------|-----|
| **15.1–15.4** | **Source expansion + re-enable cron** | **No news = no site. This is the foundation.** |
| 7 | RSS & Atom Feeds | Table stakes for news sites |
| 12 | Accessibility & Brave | Live bug + legal compliance |

### Do Next
| Phase | What | Why |
|-------|------|-----|
| 10 | Source Credibility (data model) | Prerequisite for 15.7 and 15.8 |
| **15.5–15.6** | **Bias in prompts + cross-checking** | **Makes the credibility data real** |
| 9 | Social Sharing | Drives traffic |
| 8 | Search & Filtering | Usability at scale |

### Do Later
| Phase | What | Why |
|-------|------|-----|
| **15.7–15.8** | **Bias UI + "All perspectives"** | **Killer differentiator** |
| 13 | Offline/PWA | Conflict zone users |
| 11 | Mini-Map | Visual enhancement |
| 14 | Archive/Export/Embed | Long-term value |
