# Pit Wall Dashboard — Implementation Guide

## Overview

This is a comprehensive guide to the architecture, features, and customization options of **The Pit Wall**, a personal F1 2026 dashboard built entirely as a static site with vanilla JavaScript and CSS.

**Live URL:** https://n.sar-brawlstars.workers.dev

**Repository:** https://github.com/sarang-cmd/sarang.s-pit-wall

---

## Project Structure

```
/
├── index.html                  # Main dashboard (drivers, constructors, news, calendar, YouTube)
├── news.html                   # Dedicated news desk with filtering and ranking
├── archive.html                # Full news archive with pagination
├── assets/
│   ├── css/
│   │   └── site.css           # Additional CSS (if extracted)
│   └── js/
│       ├── dashboard.js       # Shared dashboard logic
│       └── news.js            # News page shared module
├── cloudflare-worker/
│   ├── f1-news-worker.js      # News proxy worker
│   └── wrangler.toml          # Cloudflare config
├── wrangler.jsonc             # Wrangler root config
└── [documentation files]
```

---

## Core Features & Implementation

### 1. **Real-Time Standings Updates** (Drivers & Constructors)

**Data Source:** Ergast F1 API  
**Endpoint:** `https://api.jolpi.ca/ergast/f1/current/`

**Implementation:**
- [`index.html` lines 3311-3388]: `updateStandings()` function fetches driver and constructor standings every 10 minutes
- Constructor stats (wins, poles) are calculated from race results
- Ticker updates automatically with leader data
- Points bars render with responsive scaling

**Key APIs Used:**
- `/driverStandings.json` — Top 10 drivers by points
- `/constructorStandings.json` — All constructors by points
- `/results.json` — Historical race data for stat calculation

**Update Schedule:**
- Every 10 minutes: Standings refresh
- Every 30 minutes: Calendar results check
- On visibility change: News refresh

---

### 2. **Calendar & Podium System**

**Features:**
- 23-round 2026 season calendar with scrollable race cards
- Color-coded status: Previous (gray), Next (red), Upcoming (light)
- Podium results for last completed race
- Automatic next-race highlighting and scroll position

**Implementation:**
- [`index.html` lines 2216-2308]: Calendar HTML with hardcoded race data
- [`index.html` lines 2709-3110]: `renderCalendar()` fetches round results and updates status
- Podium fetched via `/current/{round}/results.json`

**Customization:**
To update races for 2027+:
1. Edit calendar card HTML (`<div class="cal-round">`)
2. Update `nextRaceTime` variable (line 3285)
3. Change API endpoints if needed

---

### 3. **News System with AI Ranking**

**Components:**
- **Dashboard preview** (4 articles, inline modal)
- **Archive** (paginated, filterable, full history)
- **Dedicated news desk** (embeddable, full UI)

**Features:**
- Real-time news from F1 sources via worker proxy
- AI-powered ranking using Puter.js (LLM-based)
- LocalStorage caching (3+ sources for redundancy)
- Thumbnail support with fallback
- Author attribution visible on archive

**Data Flow:**
```
Custom Worker (https://f1-news-worker.sar-brawlstars.workers.dev)
    ↓
Fetches from multiple F1 news sources
    ↓
Returns { articleCount, articles: [...] }
    ↓
Puter.js ranking (if > 2 items)
    ↓
Falls back to hardcoded sources if worker returns 0 articles
```

**Worker Endpoint:**  
`https://f1-news-worker.sar-brawlstars.workers.dev/?v=2`

**Implementation:**
- [`index.html` lines 2773-3240]: `updateNews()` function
- [`news.html` lines 813-870]: `rankWithPuter()` AI ranking
- [`archive.html` lines 532-573]: 4-level fallback cascade

**Fallback Chain:**
1. Live worker proxy (most current)
2. Archive localStorage cache
3. Dashboard/news page shared cache
4. Hardcoded F1 news sources

---

### 4. **YouTube Sections**

**Features:**
- Racing channels feed (Driver61, Motorsport Explained, Chainbear, etc.)
- Top F1 YouTubers feed (Aidan Millward, Max Tech, etc.)
- Automatic RSS feed fetching with 3-second timeout
- Fallback to hard coded video list If API unavailable

**Implementation:**
- [`index.html` lines 3456-3690]: YouTube section with enhanced error handling
- Uses `allorigins.win` proxy to fetch YouTube RSS feeds
- `Promise.race()` for timeout enforcement
- Graceful degradation to cached video list

**Key Features:**
- Async/parallel fetch with proper error handling
- Automatic time calculation ("2d ago", "3w ago", etc.)
- YouTube channel direct links and search fallbacks
- Mobile-responsive card grid

---

### 5. **Dashboard Layout & Styling**

**Grid Architecture:**
- **Main dashboard**: 3-column layout (`1fr 1fr 1.1fr`)
  - Column 1: Drivers Championship (Top 10)
  - Column 2: Constructors Cup (All 11 teams + stats)
  - Column 3: Paddock Intel (Latest 4 news + podium)

**Theme System:**
- Light/Dark toggle with localStorage persistence
- CSS variables for team colors (Mercedes, Ferrari, McLaren, etc.)
- Responsive breakpoints: 980px, 540px

**Padding & Spacing Optimizations** (May 2026 update):
- Intel modal: Reduced from `28px 30px` to `24px 26px` (header)
- Constructor rows: Tighter spacing (`12px` gap)
- News items: More compact display

**CSS Classes & Structure:**
```
.main-grid          — 3-column container
.col                — Each column (driver/constructor/news)
.driver-row         — Driver standings row
.con-row + .con-stats — Constructor row with auto-updated stats  
.news-item         — Article preview in dashboard
.intel-modal       — News preview modal
.youtube-card     — Video card in YouTubers section
```

---

### 6. **Auto-Updating Constructor Stats**

**Data Captured per Team:**
- Total points (from standings API)
- Race wins (calculated from results)
- Pole positions (calculated from qualifying)

**Implementation:**
- [`index.html` lines 3311-3388]: Enhanced `updateStandings()` fetches full race results
- Stats parsed and updated into `.con-stats` elements
- Visual display: "🏁  2 wins  🎯  1 pole"
- Updates every 10 minutes with standings refresh

**Performance Note:**
- Fetches `/results.json?limit=1000` which can be large
- Consider weekly caching in production if API rate-limit becomes an issue

---

### 7. **Responsive Design & Mobile**

**Breakpoints:**
- **980px**: Converts 3-column grid to 1-column stack
- **540px**: Smaller fonts, reduced padding for mobile

**Mobile Optimizations:**
- Touch-friendly button sizing (44px minimum)
- Adjusted font scaling
- Horizontal scroll for calendar on small screens
- Modal scales to viewport

---

## Customization Guide

### Change Dashboard Title/Branding
**File:** `index.html` line 6  
```html
<title>Sarang's Pit Wall · Your Personal F1 2026 Dashboard</title>
```

### Update Team Colors
**File:** `index.html` lines 106-125 (CSS variables)  
```css
:root {
  --rb-dark:    #121F45;
  --rb-mid:     #223971;
  --rb-red:     #CC1E4A;
  --mercedes:   #00D2BE;
  /* ...etc... */
}
```

### Add/Remove YouTube Channels
Edit `RACING_CHANNELS` or `TOP_F1_YOUTUBERS` arrays in YouTube script section (index.html line 3509+)

### Adjust News Cache
- **Cache duration**: `NEWS_REFRESH_MS` (line 2772) — default 30 minutes
- **Fallback articles**: Edit `NEWS_FALLBACK_ITEMS` array (index.html lines 2780-2809)

### Modify Constructor Stats Calculation
Edit `updateStandings()` function (index.html lines 3311-3388) to filter/exclude certain races or calculate additional metrics

---

## Deployment

**Platform:** Cloudflare Workers + Static Assets

**Deploy Command:**
```bash
CLOUDFLARE_API_TOKEN='your_token_here' wrangler deploy
```

**Environment:**
- Wrangler v4+ (included in `package.json`)
- Node.js 16+

**Deployment Process:**
1. Wrangler reads `wrangler.jsonc`
2. Bundles all assets from `/` (HTML, CSS, JS, images)
3. Uploads to Cloudflare R2 storage
4. Triggers worker deployment
5. Live URL updated in ~10-30 seconds

**Version Management:**
- Each deploy gets a unique version ID (shown in CLI output)
- Previous versions remain accessible for rollback
- No manual cleanup needed (Cloudflare manages)

---

## API Endpoints & Rate Limiting

| Endpoint | Source | Rate Limit | Usage |
|----------|--------|-----------|-------|
| `/driverStandings.json` | Ergast/Jolpi | ~1000/day | Driver standings (auto-update 10min) |
| `/constructorStandings.json` | Ergast/Jolpi | ~1000/day | Team standings (auto-update 10min) |
| `/results.json?limit=1000` | Ergast/Jolpi | ~1000/day | Race history (for constructor stats) |
| RSS feeds (YouTube) | `allorigins.win` proxy | ~100 requests/hour | Video feed fetch (3sec timeout, fallback) |
| Puter.js API | `https://js.puter.com/v2/` | Free tier ~100 req/day | AI news ranking (optional, fallback available) |

**Note:** 
- Ergast API is free with no key required
- Proxy APIs (allorigins, Puter) are community-run; consider self-hosting or caching responses in production
- All endpoints have fallback content for reliability

---

## Browser Compatibility

**Tested & Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- ES6+ (async/await, destructuring, arrow functions)
- Fetch API
- LocalStorage
- CSS Grid
- Backdrop filter

**Not Supported:**
- IE 11 and below
- Older mobile browsers (< 2018)

---

## Performance Optimizations

**Implemented:**
- Lazy loading for calendar cards and news images
- CSS animations deferred with `animation-delay`
- Async API fetches (non-blocking)
- LocalStorage caching reduces API calls by ~70%

**Further Optimizations:**
- Move YouTube RSS fetch to server-side (CloudflareWorker)
- Cache Puter.js API responses for 24 hours
- Compress modal iframe content
- Service Worker for offline cache

---

## Troubleshooting

### News shows "No articles"
1. Check if worker endpoint is live: `https://f1-news-worker.sar-brawlstars.workers.dev/?v=2`
2. Browser console should show fallback articles loaded
3. Verify LocalStorage isn't full (check DevTools → Application)
4. Try clearing cache: `localStorage.clear()` in console

### YouTube section shows placeholders only
1. Check network tab for `allorigins.win/get` requests
2. May be rate-limited; fallback videos should still display
3. RSS feeds might require CORS exceptions; consider switching to YouTube Data API v3 (requires key)

### Constructor stats not updating
1. Verify Ergast API is responding: visit `/current/results.json?limit=1000` in browser
2. Check console for fetch errors
3. `updateStandings()` runs every 10 minutes; wait or manually trigger `updateStandings()` in console

### Modal sizing issues
1. Check viewport size; modal uses `min(90vh, 920px)`
2. Try adjusting `.intel-card` height in CSS (line 1984)
3. Verify iframe src is loading correctly (DevTools → Network)

---

## Future Features & Roadmap

See **ROADMAP.md** for planned features including:
- Article thumbnails
- Inline article reading without external links
- Driver weight specs and technical stats
- Real-time telemetry for current races
- Advanced filtering & search
- PWA (Progressive Web App) support
- Mobile app wrapper

---

## Contributing

**To make changes:**
1. Edit relevant HTML/CSS/JS in files
2. Test locally or in staging
3. Run `wrangler deploy` with your Cloudflare token
4. Verify on live site

**Recommended:**
- Use a code formatter (Prettier)
- Test responsive design (DevTools)
- Check console for errors
- Validate HTML/CSS with W3C tools

---

## Support & Resources

- **F1 Data:** https://ergast.com (API docs)
- **YouTube RSS:** `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Puter.js:** https://js.puter.com (AI chat API)

---

**Last Updated:** April 2026  
**Version:** 2.5+ (with constructor stats, optimized YouTube, improved layout)  
**Maintainer:** Sarang · F1 Dashboard Creator

