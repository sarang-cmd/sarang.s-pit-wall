# The Pit Wall

The Pit Wall is a personal Formula 1 dashboard built as a static site with vanilla HTML, CSS, and JavaScript. It combines live standings, race calendar data, podium results, paddock news, and YouTube feeds into a single broadcaster-style experience.

Live site: https://n.sar-brawlstars.workers.dev

Demo: https://n.sar-brawlstars.workers.dev/

Repository: https://github.com/sarang-cmd/sarang.s-pit-wall

## What It Includes

- Driver and constructor standings with automatic refreshes
- Full season calendar with next-race highlighting and podium results
- News desk, archive, and dashboard news previews
- YouTube sections for racing channels and F1 creators
- Responsive layout with theme toggles and mobile-friendly cards
- Cloudflare Worker-backed news proxy and static asset deployment

## Project Structure

```text
/
├── index.html
├── news.html
├── archive.html
├── assets/
│   ├── css/site.css
│   └── js/
│       ├── dashboard.js
│       └── news.js
├── cloudflare-worker/
│   ├── f1-news-worker.js
│   └── wrangler.toml
└── wrangler.jsonc
```

## Local Preview

This workspace does not include a package manifest, so there is no install step here. The site can be opened directly in a browser from the workspace root, or served with any static file server if you prefer a local HTTP origin.

## Deploy

The root `wrangler.jsonc` config serves the repository as static assets on Cloudflare.

Deploy from the repo root with:

```bash
wrangler deploy
```

If you need to authenticate first, set your Cloudflare API token in the environment before deploying.

## Notes

- The project is intentionally static, so most of the behavior lives in `index.html` and the scripts under `assets/js`.
- The separate worker files under `cloudflare-worker/` document the news proxy used by the dashboard.
- The implementation guide in `IMPLEMENTATION_GUIDE.md` contains deeper architecture and customization notes.