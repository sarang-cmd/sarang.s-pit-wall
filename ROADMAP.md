# Pit Wall Dashboard — Roadmap & Future Features

## Overview

This roadmap outlines planned features, improvements, and optimization for **The Pit Wall** dashboard. Items are prioritized by impact and feasibility.

---

## Version 2.5 (Current) — Layout & Content Improvements ✅

**Status:** LIVE (May 2026)

### Completed Features:
- ✅ Fixed YouTube video page with better error handling
- ✅ Optimized Paddock Intel modal padding  
- ✅ Balanced 3-column layout (1fr 1fr 1.1fr)
- ✅ Added constructor stats (wins, poles) with auto-update
- ✅ Improved top bar consistency
- ✅ YouTube section with timeout & fallback
- ✅ Full implementation guide documentation

### Known Issues:
- 📌 Article inline viewing not yet implemented
- 📌 Article thumbnails limited to emoji fallbacks
- 📌 YouTube RSS feed sometimes rate-limited (allorigins.win)
- 📌 No manual article selection for dashboard

---

## Version 3.0 (Q2-Q3 2026) — Article Trading Cards

**Goal:** Rich article reading experience with thumbnails and inline viewing

### Features to Add:

#### 1. Article Thumbnails
- **What:** Extract/fetch thumbnail images for each news article
- **Implementation:**
  - Modify news worker to include `imageUrl` field
  - Add image URLs to fallback articles
  - Display in news items with lazy loading
  - Fallback to team color gradient if image unavailable

- **Files to Modify:**
  - `cloudflare-worker/f1-news-worker.js` — Parse/extract thumbnails
  - `index.html` — Add `.news-thumbnail` CSS class & HTML structure
  - `news.html` — Scale images for full news desk view
  - `assets/css/site.css` — New image styles

- **Estimated Effort:** 3-4 hours
- **Dependencies:** Image fetching from source websites, error handling for broken links

#### 2. Inline Article Modal
- **What:** Click article in dashboard → read full content inline (no external link)
- **Implementation:**
  - New modal `.article-read-modal` with larger formatting
  - Fetch article preview/summary (if available from worker)
  - Show "Read Original" as secondary action
  - Keyboard navigation (arrow keys to prev/next article)

- **Files to Modify:**
  - `index.html` — Add article modal HTML & open/close JS
  - `assets/js/dashboard.js` — Click handler & modal state
  - Modal CSS styling in `<style>` section

- **Estimated Effort:** 4-5 hours
- **Dependencies:** Article text extraction (may require server-side parsing if sources don't provide summaries)

#### 3. Alternative Article Sources
- **What:** Add more news sources (ESPN F1, Racer, Motorsport Network)
- **Implementation:**
  - Expand news worker to crawl additional sites
  - Parse HTML (via Cheerio or similar on Cloudflare Workers)
  - Deduplicate articles using content hash
  - Rank by freshness + source priority

- **Files to Modify:**
  - `cloudflare-worker/f1-news-worker.js` — Add scraper logic
  - `index.html` — Update fallback sources list

- **Estimated Effort:** 5-6 hours
- **Dependencies:** HTML parsing library support on Cloudflare Workers

---

## Version 3.5 (Q3 2026) — Advanced Analytics & Stats

**Goal:** Deeper driver/team technical data

### Features to Add:

#### 1. Driver Technical Specs
- **What:** Display per-driver weight, height, experience (career starts), car number
- **Implementation:**
  - Ergast API doesn't include height/weight; use hardcoded mapping
  - Add new row below driver standings with stats icon
  - On hover: tooltip or small card showing details

- **Files to Modify:**
  - `index.html` — Add `.driver-stats` row & CSS
  - Add hardcoded driver data object (lines ~2800)

- **Estimated Effort:** 2-3 hours
- **Example Data:**
```javascript
const DRIVER_SPECS = {
  'LEC': { height: '182cm', weight: '75kg', carNo: '16' },
  // ...
};
```

#### 2. Race Pace Comparison
- **What:** Show lap time deltas, sector comparisons, tire strategies
- **Implementation:**
  - Fetch qualifying & race session lap data from Ergast
  - Build comparison table (1st place vs 2nd vs 3rd, etc.)
  - Show delta in milliseconds
  - Strategy icons (soft/medium/hard compounds)

- **Files to Modify:**
  - New page `race-analysis.html` (linked from calendar)
  - `assets/js/race-analysis.js` — Data fetching & rendering

- **Estimated Effort:** 6-8 hours
- **Dependencies:** Session timing data from Ergast (available)

#### 3. Reliability Stats (DNF Tracker)
- **What:** Count retirements, mechanical failures, penalties per team/driver
- **Implementation:**
  - Parse status codes from `/results.json`
  - Calculate DNF rate (DNFs / races)
  - Display reliability badge in constructor row

- **Files to Modify:**
  - `index.html` — Modify constructor stats section
  - JavaScript in `updateStandings()` to parse DNF reasons

- **Estimated Effort:** 3-4 hours
- **Example:** "DNF Rate: 15% (2 of 14)"

---

## Version 4.0 (Q4 2026) — Interactivity Overhaul

**Goal:** Interactive dashboards, comparisons, predictions

### Features to Add:

#### 1. Driver Comparison Tool
- **What:** Select 2-4 drivers, compare stats side-by-side
- **Implementation:**
  - Dropdown selector in modal
  - Comparison table (points, wins, podiums, DNFs, avg grid, avg finish)
  - Visual bar charts for easy comparison
  - Export as image/PDF

- **Files to Modify:**
  - New modal in `index.html` — `.comparison-modal`
  - New chart library (Chart.js or D3.js)

- **Estimated Effort:** 5-6 hours
- **Dependencies:** Chart rendering library

#### 2. Championship Predictor
- **What:** "What-if" scenarios (e.g., "If Russell wins next 3 races?")
- **Implementation:**
  - Input race results for remaining season
  - Simulate championship outcomes
  - Show probability distribution (Bayesian model)

- **Files to Modify:**
  - New page `predictor.html`
  - JavaScript simulation engine

- **Estimated Effort:** 8-10 hours
- **Complexity:** High (requires statistical modeling)

#### 3. Notes & Annotations
- **What:** Users can add personal notes to races/drivers (stored in localStorage)
- **Implementation:**
  - Click race card → add notes modal
  - Notes stored in `pw-user-notes` localStorage key
  - Display note count badge on race card

- **Files to Modify:**
  - `index.html` — Add note icon & modal
  - New `notes.js` module for CRUD ops

- **Estimated Effort:** 2-3 hours
- **Low Priority:** Nice-to-have, not critical

---

## Version 5.0 (2027) — PWA & Mobile App

**Goal:** Installable app, offline support, push notifications

### Features to Add:

#### 1. Service Worker (Offline Mode)
- **What:** Cache assets and data so dashboard works offline
- **Implementation:**
  - Create `sw.js` service worker
  - Cache critical assets on install
  - Serve cached content if network unavailable
  - Show "offline mode" indicator

- **Files to Create:**
  - `service-worker.js` — SW logic
  - `manifest.webmanifest` — PWA metadata

- **Estimated Effort:** 4-5 hours
- **Dependencies:** Service Worker API (browser support good as of 2026)

#### 2. Web App Manifest
- **What:** Allow "Install to home screen" on mobile
- **Implementation:**
  - Create `manifest.json` with app metadata
  - Add `<link rel="manifest">` to HTML head
  - Include app icons (192x192, 512x512)

- **Files to Create:**
  - `manifest.webmanifest`
  - `/assets/icons/` — app icons

- **Estimated Effort:** 1-2 hours

#### 3. Push Notifications (Optional)
- **What:** Notify user when race starts, standings change, news published
- **Implementation:**
  - Cloudflare Workers Cron trigger (runs every 5 min)
  - Checks for significant data changes
  - Sends Web Push to registered clients
  - Requires user permission

- **Files to Modify:**
  - `cloudflare-worker/f1-news-worker.js` — Add event detection
  - `index.html` — Add Notification API integration

- **Estimated Effort:** 5-6 hours
- **Complexity:** Medium

---

## Bug Fixes & Optimizations

### High Priority (Next Sprint):
- [ ] YouTube RSS feed rate limiting — implement server-side caching
- [ ] Article source parsing — handle HTML entities properly
- [ ] Modal keyboard accessibility — improve focus management
- [ ] Constructor stats calculation — optimize for large datasets

### Medium Priority:
- [ ] Reduce bundle size (consider code splitting)
- [ ] Image optimization (use WebP with fallback)
- [ ] Reduce JavaScript execution time (profiling needed)
- [ ] Sticky header for long standings

### Low Priority:
- [ ] Dark mode color tweaks
- [ ] Animation performance on low-end devices
- [ ] Accessibility audit (WCAG 2.1 AA compliance)

---

## Performance Improvements

### Planned:

1. **Edge Caching**
   - Set Cache-Control headers for assets
   - Cache API responses on edge (Cloudflare KV)
   - TTL: 10 min for standings, 1 hour for news

2. **Code Splitting**
   - Separate YouTube script into lazy module
   - Archive page code loads only when needed
   - Estimated 20% reduction in initial JS

3. **Database Indexing (if self-hosting)**
   - If migrating off Cloudflare Workers to traditional backend
   - Index driver IDs, team names, dates for fast queries

---

## Dependency Updates

| Library | Current | Latest | Update Priority |
|---------|---------|--------|------------------|
| Wrangler | 4.86.0 | 5.0+ | ⚠️ Q3 2026 (breaking changes) |
| Chart.js | N/A | 4.x | 📋 If adding analytics |
| D3.js | N/A | 7.x | 📋 If adding complex visualizations |

---

## Risk Assessment

### Technical Risks:
- **YouTube API Deprecation** — RSS feeds may become unavailable; mitigation: switch to official API
- **Ergast API Shutdown** — Unlikely but possible; mitigation: mirror data locally or use alternative
- **Cloudflare Rate Limiting** — High traffic could trigger limits; mitigation: add edge caching

### Mitigation Strategies:
- Implement server-side result caching for all external APIs
- Add circuit breaker pattern for API failures
- Monitor rate limit headers and adjust request cadence

---

## Community Feedback & Feature Requests

(To be filled as user reports come in)

- [ ] User 1: "Add team radio quotes" — Will need source API
- [ ] User 2: "Compare lap times for qualifying vs race" — Possible with Ergast timing data
- [ ] User 3: "Show driver salaries/contract info" — Low priority, limited public data available

---

## Success Metrics

**Track these to prioritize features:**

- Daily Active Users (DAU)
- Time on Site (avg session duration)
- API latency (target < 200ms)
- Cache hit ratio (target > 80%)
- News article reading rate (% of articles clicked)
- YouTube video clicks (engagement)

---

## Rollout Strategy

1. **Feature branches** for each v3.x/v4.x feature
2. **Staging URL** for QA before production
3. **Gradual rollout** (A/B test new features if possible)
4. **Rollback plan** (keep 2 prev versions live)
5. **Change log** updated with each release

---

## Questions & Notes

- **Article thumbnails:** Should we use AI to generate them if not available?
- **Inline reading:** How much article text to fetch? (Full vs. summary)
- **Performance budget:** What's the acceptable page load time? (target: < 2s)
- **Monetization:** Is this a public project or personal-only? (Affects support/roadmap)

---

**Last Updated:** May 2026  
**Roadmap Owner:** Sarang  
**Next Review:** June 2026

---

## Voting on Next Features

**Community, please upvote your top 3:**
1. 👍 Article thumbnails & inline reading (v3.0)
2. 👍 Driver data & specs (v3.5)
3. 👍 Championship predictor (v4.0)
4. 👍 Comparison tool (v4.0)
5. 👍 PWA / offline mode (v5.0)

---

