# The Pit Wall 🏎️

**The Pit Wall** is a personal Formula 1 dashboard built as a fully static site using vanilla HTML, CSS, and JavaScript, deployed on Cloudflare Workers. It brings together live driver and constructor standings, the full season race calendar, podium results, an AI-ranked F1 news desk, and YouTube creator feeds — all in a single broadcaster-style interface.

**Live site:** https://n.sar-brawlstars.workers.dev  
**Repository:** https://github.com/sarang-cmd/sarang.s-pit-wall

---

## Features

| Feature | Description |
|---|---|
| 🏁 Driver Standings | Top 10 drivers with points bars, auto-refreshed every 10 minutes |
| 🏆 Constructor Standings | All teams with calculated wins, poles, and race stats |
| 📅 Race Calendar | Full 23-round season with color-coded status and podium results |
| 📰 Paddock Intel | AI-ranked F1 news from 10+ sources with inline preview modal |
| 📺 YouTube Sections | Racing channels and creator feeds with timeout & fallback |
| 🌗 Theme Toggle | Light/Dark mode persisted via localStorage |
| 📱 Responsive Layout | Mobile-friendly cards with breakpoints at 980px and 540px |
| ☁️ Cloudflare Worker | Serverless news proxy, YouTube feed proxy, and static asset hosting |

---

## Project Structure

```text
/
├── index.html                  # Main dashboard — standings, calendar, news, YouTube
├── news.html                   # Dedicated news desk with AI ranking and filters
├── archive.html                # Full paginated news archive with author attribution
├── assets/
│   ├── css/
│   │   └── site.css           # Shared stylesheet (if extracted from HTML)
│   └── js/
│       ├── dashboard.js       # Shared dashboard utilities (standings, calendar helpers)
│       └── news.js            # News page module (ranking, caching, rendering)
├── cloudflare-worker/
│   ├── f1-news-worker.js      # Cloudflare Worker — news proxy + YouTube feed proxy
│   └── wrangler.toml          # Worker-specific Wrangler config
├── wrangler.jsonc             # Root Wrangler config — static asset deployment
├── IMPLEMENTATION_GUIDE.md    # Deep-dive architecture and customization reference
├── ROADMAP.md                 # Planned features and version targets
└── API_TEST_REPORT.md         # API endpoint test results and status
```

---

## How It Works

### Data Sources

The dashboard is entirely client-side and relies on three categories of external data:

1. **F1 standings & results** — fetched from the [Jolpi/Ergast F1 API](https://api.jolpi.ca/ergast/f1/) (no key required)
2. **F1 news** — fetched via the custom Cloudflare Worker news proxy, which aggregates 10+ RSS feeds
3. **YouTube videos** — fetched via RSS feeds proxied through the same Cloudflare Worker

### News Data Flow

```
Cloudflare Worker (f1-news-worker.js)
    ↓ fetches from 10 RSS sources in parallel
    ↓ deduplicates, filters by F1 keywords, sorts by date
    ↓ returns { articleCount, articles: [...] }
         ↓
    index.html / news.html
         ↓ Puter.js AI ranking (optional, falls back gracefully)
         ↓ LocalStorage caching for resilience
         ↓ Fallback to hardcoded sources if worker returns 0 articles
```

---

## Key Functions

### `f1-news-worker.js` — Cloudflare Worker

| Function | Description |
|---|---|
| `fetchFeed(feed)` | Fetches a single RSS feed URL and returns parsed article objects |
| `parseRss(xmlText, feedName, feedUrl)` | Parses raw XML, extracts title/link/description/pubDate/image per `<item>` |
| `decodeEntities(input)` | Converts HTML entities (`&amp;`, `&#39;`, etc.) to plain characters |
| `stripHtml(input)` | Removes all HTML tags and collapses whitespace to a clean string |
| `extractTag(block, tag)` | Extracts the inner text of a named XML/HTML tag within an item block |
| `extractAttribute(block, tag, attribute)` | Extracts an attribute value (e.g., `url` from `<media:content>`) |
| `truncate(input, limit)` | Trims text to a character limit, appending `…` if truncated |
| `normalizeUrl(url, baseUrl)` | Resolves relative URLs to absolute using a base URL |
| `inferCategory(title, summary)` | Classifies an article into categories: Race Weekend, Driver Market, Team News, FIA, or Paddock |
| `isF1Relevant(article)` | Checks article text against a keyword list to filter non-F1 content |
| `dedupeAndSort(items)` | Removes duplicate articles (by URL+title key) and sorts by publish date descending |
| `jsonResponse(data, cacheMaxAgeSeconds)` | Returns a JSON `Response` with CORS headers and Cache-Control |
| `fetchYouTubeFeed(channelId)` | Fetches a YouTube channel's RSS feed XML for the `/api/youtube-feed` endpoint |
| `fetch(request, env, ctx)` | Worker entry point — routes `/f1-news` (news proxy) and `/api/youtube-feed` (YouTube proxy) |

### `index.html` — Main Dashboard JS

| Function | Description |
|---|---|
| `updateStandings()` | Fetches driver standings, constructor standings, and full race results from the Ergast API; updates all DOM elements and calculates team wins/poles |
| `renderCalendar()` | Fetches round-by-round results for the current season; marks each race card as Previous, Next, or Upcoming; loads the latest podium |
| `updateNews()` | Calls the news worker, applies Puter.js AI ranking if available, caches results in localStorage, and renders the Paddock Intel section |
| `rankWithPuter(articles)` | Sends article titles to the Puter.js LLM API and returns them reordered by F1 relevance score |
| `openIntelModal(article)` | Opens the inline news preview modal with the article title, source, summary, and external link |

---

## Local Preview

No build step or package install is required. Open any HTML file directly in a browser, or serve the root with any static file server:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code Live Server extension — click "Go Live" in the status bar
```

Then visit `http://localhost:8080` in your browser.

> **Note:** Some features (news proxy, YouTube feed) require the Cloudflare Worker to be deployed and reachable. During local development, news will fall back to hardcoded articles if the worker is unavailable.

---

## Deployment

The project deploys to [Cloudflare Workers](https://workers.cloudflare.com/) as a Worker script that also serves all static assets from the repository root.

### Prerequisites

- **Node.js** 16 or later
- **Wrangler CLI** v4+ — install with `npm install -g wrangler` or use `npx wrangler`
- A **Cloudflare account** with Workers enabled (free tier is sufficient)
- A **Cloudflare API token** with *Edit Workers* permissions

### Step 1 — Authenticate

```bash
# Option A: interactive login (opens browser)
wrangler login

# Option B: token via environment variable
export CLOUDFLARE_API_TOKEN="your_api_token_here"
```

To create an API token: Cloudflare Dashboard → My Profile → API Tokens → Create Token → use the *Edit Cloudflare Workers* template.

### Step 2 — Configure

The root `wrangler.jsonc` is already configured. Review the key fields:

```jsonc
{
  "name": "n",                           // Worker name (appears in your Cloudflare dashboard)
  "main": "cloudflare-worker/f1-news-worker.js",  // Worker entry point
  "compatibility_date": "2026-04-29",
  "assets": { "directory": "." },        // Serves all files from repo root as static assets
  "compatibility_flags": ["nodejs_compat"]
}
```

Change `"name"` if you want a different subdomain (e.g. `"pit-wall"` → `pit-wall.<your-subdomain>.workers.dev`).

### Step 3 — Deploy

From the repository root:

```bash
wrangler deploy
```

Wrangler will:
1. Bundle the Worker script (`f1-news-worker.js`)
2. Upload all static assets (HTML, CSS, JS, images) from the repo root
3. Publish everything to Cloudflare's edge network
4. Print the live URL (e.g. `https://n.<your-subdomain>.workers.dev`)

Deployment typically takes 10–30 seconds.

### Step 4 — Verify

After deployment:
- Visit the live URL and confirm standings load
- Check `<live-url>/f1-news` returns a JSON news payload
- Check `<live-url>/api/youtube-feed?channel_id=UCB_qr75-ydFVKSF9Dmo6izg` returns YouTube XML

### Deploying the News Worker Separately (Optional)

If you want to run the news proxy as a standalone worker on a different route or domain:

```bash
cd cloudflare-worker
wrangler deploy --config wrangler.toml
```

The standalone worker is available at `https://f1-news-worker.<your-subdomain>.workers.dev`.

### Rollback

Each `wrangler deploy` creates a versioned deployment. To roll back:

```bash
wrangler deployments list          # list recent deployments
wrangler rollback <deployment-id>  # roll back to a specific version
```

---

## API Reference

### Worker Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/f1-news` | GET | Returns up to 10 deduplicated, sorted F1 news articles from 10+ RSS sources |
| `/api/youtube-feed?channel_id=CHANNEL_ID` | GET | Proxies a YouTube channel RSS feed (cached for 5 minutes) |

**`/f1-news` response shape:**
```json
{
  "generatedAt": "2026-05-09T12:00:00.000Z",
  "sourceCount": 10,
  "articleCount": 10,
  "articles": [
    {
      "title": "Verstappen takes pole in Monaco",
      "summary": "Max Verstappen secured pole position...",
      "url": "https://example.com/article",
      "source": "Sky Sports F1",
      "publishedAt": "2026-05-09T11:30:00.000Z",
      "category": "Race Weekend",
      "image": "https://example.com/image.jpg"
    }
  ]
}
```

### External APIs Used

| API | Base URL | Auth | Rate Limit | Used For |
|---|---|---|---|---|
| Jolpi/Ergast F1 | `https://api.jolpi.ca/ergast/f1/current/` | None | ~1000/day | Driver & constructor standings, race results |
| Google News RSS | `https://news.google.com/rss/search?q=...` | None | Generous | News source aggregation in worker |
| BBC Sport RSS | `https://feeds.bbci.co.uk/sport/formula1/rss.xml` | None | Generous | News source in worker |
| YouTube RSS | `https://www.youtube.com/feeds/videos.xml?channel_id=...` | None | Generous | Video feed in worker |
| Puter.js | `https://js.puter.com/v2/` | None (free tier) | ~100 req/day | AI-powered news ranking |

---

## Customization

### Update the Season Calendar

Edit the race card HTML in `index.html` (look for `<div class="cal-round">` blocks) and update the `nextRaceTime` variable to the next race's UTC timestamp.

### Add or Remove YouTube Channels

Locate the `RACING_CHANNELS` and `TOP_F1_YOUTUBERS` arrays near the YouTube section in `index.html` and add or remove channel objects:

```js
{ name: 'Channel Name', id: 'YOUTUBE_CHANNEL_ID' }
```

### Change News Cache Duration

Find `NEWS_REFRESH_MS` near the top of the news script block in `index.html` and adjust the value (default: `1800000` = 30 minutes).

### Add Extra News Sources

Set the `EXTRA_NEWS_FEED_URL` environment variable on your Worker deployment to inject an additional RSS feed at the top of the source list:

```bash
wrangler secret put EXTRA_NEWS_FEED_URL
# also optionally:
wrangler secret put EXTRA_NEWS_FEED_NAME
```

### Update Team Colors

CSS custom properties for all 10 teams are defined at the top of the `<style>` block in `index.html`:

```css
:root {
  --mercedes: #00D2BE;
  --ferrari:  #E8002D;
  --mclaren:  #FF8000;
  /* ...etc... */
}
```

---

## Troubleshooting

**News shows "No articles"**
1. Visit `<live-url>/f1-news` directly — if it returns `articleCount: 0`, the RSS sources may be temporarily unavailable.
2. Open DevTools → Console. You should see fallback articles loaded from `localStorage` or hardcoded defaults.
3. Try clearing the cache: run `localStorage.clear()` in the browser console and refresh.

**YouTube section shows only placeholder cards**
1. Open DevTools → Network and look for `youtube-feed` requests. A 4xx/5xx status means the proxy is unreachable.
2. RSS feeds are rate-limited on `allorigins.win`; the Worker proxy is preferred. Confirm the Worker is deployed.
3. Fallback videos defined in `TOP_F1_YOUTUBERS` should still render even without live RSS data.

**Constructor stats not showing wins/poles**
1. Confirm the Ergast API is reachable: open `https://api.jolpi.ca/ergast/f1/current/results.json?limit=1000` in a new tab.
2. Check the console for fetch errors in `updateStandings()`.
3. Stats are calculated from full race results and refresh every 10 minutes; wait or call `updateStandings()` manually in the console.

**`wrangler deploy` fails with authentication error**
1. Run `wrangler whoami` to confirm your account is authenticated.
2. If using a token, verify `CLOUDFLARE_API_TOKEN` is set and has *Edit Workers* permissions.
3. Re-run `wrangler login` to refresh credentials.

---

## Browser Compatibility

| Browser | Minimum Version |
|---|---|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

Requires: ES2017 (async/await), Fetch API, CSS Grid, `backdrop-filter`, and LocalStorage. Internet Explorer is not supported.

---

## Further Reading

- [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md) — architecture deep-dive, CSS class reference, and customization notes
- [`ROADMAP.md`](ROADMAP.md) — planned features for v3.0 through v5.0
- [`API_TEST_REPORT.md`](API_TEST_REPORT.md) — endpoint test results and status history
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Ergast/Jolpi API Docs](https://ergast.com/mrd/)
- [Puter.js Docs](https://docs.puter.com)