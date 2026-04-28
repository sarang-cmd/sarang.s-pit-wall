# Paddock Intel Setup Guide

This guide shows, step by step, how to turn the `Paddock Intel` section into a live news panel using the Cloudflare Worker proxy that ships with this repo.

## What You Are Building

You are connecting three pieces:

- [index.html](index.html) renders the dashboard UI.
- [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js) fetches and normalizes F1 news.
- `window.__NEWS_PROXY_URL__` tells the dashboard where the Worker is deployed.

The flow is:

1. The Worker fetches RSS feeds.
2. The Worker filters and dedupes F1 stories.
3. The Worker returns a JSON payload.
4. The dashboard fetches that JSON and replaces the hardcoded paddock cards.
5. If the proxy fails, the dashboard falls back to cached stories or the static cards already in the file.

## What Wrangler Is

Wrangler is Cloudflare's command-line tool for building and deploying Workers. Use it if you want to deploy from your terminal instead of pasting code into the Cloudflare dashboard.

Think of it like this:

- Cloudflare dashboard = click through a web UI.
- Wrangler = run commands in the terminal.

If you do not want to use Wrangler, you can still deploy the Worker manually in the Cloudflare dashboard.

## Prerequisites

Before you start, make sure you have:

- A Cloudflare account.
- Access to this repository.
- A deployed copy of the dashboard.
- Either the Cloudflare dashboard or Wrangler installed.

If you want the terminal route, install Wrangler first:

```bash
npm install -g wrangler
```

Then log in:

```bash
wrangler login
```

If `wrangler login` does not finish in your environment, use the token path below instead. Browser-based OAuth is the normal flow, but remote containers and Codespaces can make it awkward.

### Token-Based Login Path

Use this when browser login is blocked or inconvenient.

1. Open the Cloudflare dashboard in your browser.
2. Go to your profile settings.
3. Open **API Tokens**.
4. Create a token with Worker deployment permissions.
5. Copy the token value.
6. In the terminal, set it as an environment variable:

```bash
export CLOUDFLARE_API_TOKEN='your-token-here'
```

7. Find your Cloudflare account ID in the dashboard and set it too:

```bash
export CLOUDFLARE_ACCOUNT_ID='your-account-id-here'
```

8. Verify Wrangler can see your account:

```bash
wrangler whoami
```

9. Deploy with Wrangler as usual:

```bash
wrangler deploy
```

If you prefer not to install anything, skip the terminal steps and use the Cloudflare dashboard route below.

## Files You Will Touch

The relevant files are:

- [index.html](index.html)
- [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js)
- [PADDOCK_INTEL_INTEGRATION.md](PADDOCK_INTEL_INTEGRATION.md)

## Step 1: Deploy the Worker

You need a live Worker endpoint before the dashboard can show news.

### Option A: Deploy with Wrangler

Use this if you want the fastest repeatable setup.

1. Open a terminal in the repo root.
2. Confirm Wrangler is installed:

```bash
wrangler --version
```

3. If you have not already logged in, run one of these:

```bash
wrangler login
```

or, if browser login is not working in your environment:

```bash
export CLOUDFLARE_API_TOKEN='your-token-here'
export CLOUDFLARE_ACCOUNT_ID='your-account-id-here'
wrangler whoami
```

4. Create a Worker project if you do not already have one, or use the existing project tied to this repo.
5. Copy [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js) into the Worker entry file.
6. Deploy it:

```bash
wrangler deploy
```

7. Wait for Wrangler to print the deployed URL.
8. Copy the final endpoint that looks like this:

```text
https://your-worker.your-subdomain.workers.dev/f1-news
```

### Option B: Deploy in the Cloudflare Dashboard

Use this if you want to click through the UI.

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages**.
3. Create a new Worker.
4. Delete the starter code in the editor.
5. Paste the contents of [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js).
6. Save and deploy.
7. Open the deployed route ending in `/f1-news`.

## Step 2: Verify the Worker Works

The Worker should return JSON, not HTML.

Open the `/f1-news` URL in your browser. You should see output like this:

```json
{
  "generatedAt": "2026-04-28T10:00:00.000Z",
  "sourceCount": 3,
  "articleCount": 4,
  "articles": [
    {
      "title": "...",
      "summary": "...",
      "url": "https://...",
      "source": "BBC Sport Formula 1",
      "publishedAt": "2026-04-28T09:00:00.000Z",
      "category": "Race Weekend",
      "image": null
    }
  ]
}
```

If you see an error or empty response, check these in order:

1. The feed URLs in the Worker.
2. Whether Cloudflare can reach the feed source.
3. Whether the feed is returning valid RSS/XML.
4. Whether the Worker route is exactly `/f1-news`.

## Step 3: Point the Dashboard at the Worker

The dashboard reads the proxy URL from `window.__NEWS_PROXY_URL__`.

You need to set it before the main dashboard script runs.

Add this near the bottom of [index.html](index.html), before the data initialization script:

```html
<script>
  window.__NEWS_PROXY_URL__ = 'https://your-worker.your-subdomain.workers.dev/f1-news';
</script>
```

Replace the placeholder URL with your actual deployed Worker URL.

If you do not set this variable, the dashboard keeps the hardcoded paddock stories instead of fetching live news.

## Step 4: Reload and Check the UI

After setting the proxy URL:

1. Reload the dashboard page.
2. Find the `Paddock Intel` section.
3. Confirm the static cards are replaced by live stories.
4. Check that each card shows a source label.
5. Click the `Read original` link on at least one card.

The news section is already mounted in the page as `#newsBlock`, so you are only wiring data into existing markup.

## Step 5: Understand What the Dashboard Does

Once the Worker is configured, the dashboard does this:

1. Calls the Worker endpoint.
2. Reads `payload.articles`.
3. Normalizes each article into the internal card shape.
4. Renders the cards into `#newsBlock`.
5. Caches the articles locally so the section does not go blank on failure.

It also refreshes the news every 30 minutes and again when the tab becomes visible.

## Step 6: Tune the Worker Feeds

The Worker feeds are defined at the top of [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js).

Current example feeds:

```js
const FEEDS = [
  { name: 'BBC Sport Formula 1', url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml' },
  { name: 'Google News F1', url: 'https://news.google.com/rss/search?q=%22Formula+1%22+OR+F1+OR+%22Grand+Prix%22&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Google News Motorsport', url: 'https://news.google.com/rss/search?q=motorsport+Formula+1&hl=en-US&gl=US&ceid=US:en' }
];
```

To change the sources:

1. Open [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js).
2. Edit the `FEEDS` array.
3. Save the file.
4. Redeploy the Worker.
5. Refresh the dashboard.

You can also inject one extra feed using Worker environment variables:

- `EXTRA_NEWS_FEED_URL`
- `EXTRA_NEWS_FEED_NAME`

## Step 7: Understand the Filter Logic

The Worker does not keep every story it sees.

It filters for F1 relevance using keywords such as:

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
- Verstappen

If a feed becomes too broad, tighten the keyword list in the Worker. If it becomes too strict, loosen the keyword checks.

## Step 8: Test the Fallback Behavior

You should always check the failure path.

To test it:

1. Temporarily change `window.__NEWS_PROXY_URL__` to an invalid URL.
2. Reload the dashboard.
3. Confirm the page still renders.
4. Confirm the paddock section either shows cached stories or the static fallback cards.

Expected result:

- no blank section
- no broken layout
- no crash in the browser console

## Step 9: Production Rules

For production, keep the setup small and stable:

1. Use one Worker endpoint.
2. Keep the number of stories small, usually 4 to 8.
3. Keep edge caching enabled.
4. Always link back to the original article.
5. Do not republish the full article text.

That keeps the section readable and avoids turning the dashboard into a scraped-content mirror.

## Troubleshooting

### The section does not update

Check these first:

1. `window.__NEWS_PROXY_URL__` is set.
2. The URL ends in `/f1-news`.
3. The Worker returns JSON.
4. The browser console does not show a network or CORS error.

### `wrangler login` does not complete

If Wrangler opens a browser flow and then stops, or if the terminal environment cannot complete the callback, use the token-based login path above. That is the easiest fix in remote containers.

### The Worker returns no stories

Check:

1. The feed URLs are still valid.
2. The feeds are actually returning RSS/XML.
3. The keyword filters are not too strict.
4. Cloudflare is not being blocked by the source.

### The links are wrong

Check that each article has a valid `url` field and that relative links are normalized correctly inside the Worker.

### The section still shows old stories

That usually means the cache is doing its job. Clear local storage if you want to force a fresh render.

## Quick Checklist

- [ ] Deploy [cloudflare-worker/f1-news-worker.js](cloudflare-worker/f1-news-worker.js)
- [ ] Open the Worker endpoint and confirm it returns JSON
- [ ] Set `window.__NEWS_PROXY_URL__` in [index.html](index.html)
- [ ] Reload the dashboard
- [ ] Confirm live stories replace the static cards
- [ ] Confirm the static fallback still works if the proxy is unavailable

## Final Result

When everything is wired correctly, the `Paddock Intel` section becomes a live news feed powered by a small Worker proxy, while the rest of the dashboard continues using Jolpica F1 data for standings, calendar, countdown, and race results.
