# Paddock Intel Integration Guide

## Goal

Wire the `Paddock Intel` section to an external news source so the dashboard can show current F1 news stories instead of hardcoded copy.

## Recommended Approach

Use a dedicated news pipeline separate from the Jolpica F1 API:

- **Jolpica F1 API** for structured race data such as standings, calendar, and results.
- **News API or RSS feed** for paddock news and articles.
- **A normalized internal article shape** so the UI only handles one consistent format.

For this dashboard, the cleanest approach is:

1. Fetch articles from a news source.
2. Filter them to F1-relevant stories.
3. Normalize the response into a simple article object.
4. Render those articles into the existing `news-block` section.
5. Cache the last successful result for fallback behavior.

## Source Options

### Option 1: RSS Feeds
Best if you want the simplest setup.

Pros:
- No backend required
- Easy to keep the dashboard mostly static
- Good for a single-file style app

Cons:
- Limited metadata
- Some feeds are not browser-friendly
- Can be inconsistent across publishers

### Option 2: News API
Best if you want more structure and better filtering.

Examples:
- NewsAPI
- GNews
- Guardian API

Pros:
- Easier filtering
- Cleaner article metadata
- Better for headlines, summaries, source attribution

Cons:
- API keys often required
- Rate limits may apply
- Some endpoints are not CORS-friendly

### Option 3: Small Proxy or Worker
Best if you want reliability without exposing API keys.

Examples:
- Cloudflare Worker
- Netlify Function
- Vercel Function

Pros:
- Hides API keys
- Solves CORS
- Lets you merge multiple news sources
- Can cache and dedupe results

Cons:
- Adds a tiny backend layer

## Suggested Data Shape

Normalize every article into the same object shape:

```js
{
  title: 'Antonelli's rookie surge rewrites Mercedes' championship math',
  source: 'BBC Sport',
  url: 'https://example.com/article',
  publishedAt: '2026-04-28T10:00:00Z',
  summary: 'Three rounds in, the Italian rookie ...',
  category: 'Race Analysis',
  image: null
}
```

This keeps rendering simple and avoids source-specific UI logic.

## Integration Flow

### 1. Fetch raw articles
Retrieve stories from your selected news source.

### 2. Filter for F1 relevance
Use keywords such as:

- Formula 1
- F1
- Grand Prix
- Mercedes
- Ferrari
- Red Bull
- McLaren
- Antonelli
- Russell
- Leclerc

### 3. Normalize the response
Convert the source payload into a small article object with the same fields every time.

### 4. Render the UI
Replace the hardcoded cards in the `news-block` with dynamically generated markup.

### 5. Cache the last successful payload
If the news request fails, keep the previous content on screen.

## Recommended UI Pattern

Render a lead story plus three supporting stories.

- First card: lead story, larger headline
- Remaining cards: standard stories
- Include source attribution and a link out to the original article

## Example Browser-Side Implementation

If you already have a CORS-friendly endpoint or proxy, this is the basic browser-side pattern:

```html
<script>
(async function updateNews() {
  const newsBlock = document.getElementById('newsBlock');
  if (!newsBlock) return;

  try {
    const response = await fetch('https://your-proxy.example.com/f1-news');
    const payload = await response.json();

    const articles = (payload.articles || [])
      .filter(item => item.title && item.url)
      .slice(0, 4);

    if (!articles.length) return;

    const html = articles.map((item, index) => {
      const leadClass = index === 0 ? 'lead' : 'neutral';
      return `
        <article class="news-item ${leadClass}">
          <div class="news-meta">
            <span class="news-kicker">${item.category || 'Paddock'}</span>
            <span class="news-num">${String(index + 1).padStart(2, '0')}</span>
          </div>
          <h3 class="news-headline">${item.title}</h3>
          <p class="news-body">${item.summary || ''}</p>
        </article>
      `;
    }).join('');

    newsBlock.innerHTML = html;
  } catch (error) {
    console.warn('News fetch failed', error);
  }
})();
</script>
```

If you use this pattern, sanitize any untrusted text before inserting it into the DOM.

## Better Structure for the Codebase

For a cleaner implementation, split the work into these helpers:

- `normalizeNewsArticle(raw)`
- `filterF1News(items)`
- `renderNews(items)`
- `updateNews()`

That keeps the fetching, filtering, and rendering separate.

## Example Normalizer

```js
function normalizeNewsArticle(raw) {
  return {
    title: raw.title || '',
    summary: raw.description || raw.summary || '',
    url: raw.url || '#',
    source: raw.source?.name || 'News',
    publishedAt: raw.publishedAt || raw.pubDate || '',
    category: raw.category || 'Paddock'
  };
}
```

## Suggested Refresh Strategy

- Refresh on page load
- Refresh every 30 to 60 minutes
- Refresh again when the tab becomes visible
- Keep the last successful payload in local storage

The news section is lower priority than standings or countdown, so resilience matters more than aggressive polling.

## Fallback Behavior

Handle these cases gracefully:

- empty article list
- stale or duplicate stories
- source outages
- API rate limits
- blocked requests

Recommended fallback behavior:

- keep the last rendered stories on screen
- show a short message if nothing new is available
- never blank the section because one request failed

## Legal and UX Notes

- Show the source name for every article
- Link to the original article
- Avoid republishing full article text
- Prefer headlines and short summaries
- Check that the source allows reuse in your UI

## Recommended Architecture for This Dashboard

For your current single-file dashboard, the best path is:

1. Keep Jolpica F1 API for standings, schedule, and results.
2. Add a small news proxy or Worker.
3. Pull from one or two news sources only.
4. Normalize into the existing `news-item` cards.
5. Refresh every 30 minutes.
6. Cache the last good stories locally.
7. Always attribute the source and link out.

## Suggested Next Step

If you want to implement this now, the cleanest next step is to add:

- a `newsBlock` renderer
- a `updateNews()` fetch function
- a tiny proxy or Worker for the source API
- a cache fallback so the UI stays populated if the network fails

## Option 3: Cloudflare Worker Proxy

This repository now includes a Worker implementation at [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js). It aggregates RSS feeds, filters them for F1 relevance, deduplicates stories, and returns a clean JSON payload for the dashboard.

### What it does

- Fetches from multiple F1-friendly RSS feeds
- Normalizes each story into the dashboard article shape
- Deduplicates repeated headlines and links
- Sorts stories by published time
- Returns JSON with CORS enabled
- Caches the response at the edge for a short period

### Dashboard hookup

The dashboard reads a configurable proxy URL from `window.__NEWS_PROXY_URL__`. Set it to your deployed Worker endpoint before loading the main script, for example:

```html
<script>
  window.__NEWS_PROXY_URL__ = 'https://your-worker.your-subdomain.workers.dev/f1-news';
</script>
```

If the proxy URL is not set, the dashboard keeps the existing static paddock cards as a fallback.

### Deployment steps

1. Deploy [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js) to Cloudflare Workers.
2. Point `window.__NEWS_PROXY_URL__` at the deployed `/f1-news` endpoint.
3. Reload the dashboard.
4. Confirm the `news-block` swaps from the hardcoded cards to live stories.

### Recommended refresh behavior

- Refresh on load
- Refresh every 30 minutes
- Refresh when the tab becomes visible again
- Keep the last successful response in local storage

### Notes

- The Worker is intentionally small so it can be replaced later with a different provider.
- You can add or swap RSS feeds in the Worker without touching the dashboard.
- If you prefer another backend platform, the same JSON contract still works.
