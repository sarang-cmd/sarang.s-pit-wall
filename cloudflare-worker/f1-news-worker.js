const FEEDS = [
  { name: 'Formula1.com', url: 'https://news.google.com/rss/search?q=site%3Aformula1.com+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Sky Sports F1', url: 'https://news.google.com/rss/search?q=site%3Askysports.com%2Ff1+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'BBC Sport F1', url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml' },
  { name: 'RaceFans', url: 'https://news.google.com/rss/search?q=site%3Aracefans.net+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'PlanetF1', url: 'https://news.google.com/rss/search?q=site%3Aplanetf1.com+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'RacingNews365', url: 'https://news.google.com/rss/search?q=site%3Aracingnews365.com+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Motorsport.com', url: 'https://news.google.com/rss/search?q=site%3Amotorsport.com+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'The Race', url: 'https://news.google.com/rss/search?q=site%3Athe-race.com+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'The Athletic', url: 'https://news.google.com/rss/search?q=site%3Atheathletic.com+Formula+1&hl=en-US&gl=US&ceid=US:en' },
  { name: 'NewsNow F1', url: 'https://news.google.com/rss/search?q=site%3Anewsnow.co.uk+Formula+1&hl=en-US&gl=US&ceid=US:en' }
];

const KEYWORDS = [
  /\bformula 1\b/i,
  /\bformula one\b/i,
  /\bf1\b/i,
  /\bgrand prix\b/i,
  /\bmercedes\b/i,
  /\bferrari\b/i,
  /\bred bull\b/i,
  /\bmclaren\b/i,
  /\baston martin\b/i,
  /\bwilliams\b/i,
  /\bracing bulls\b/i,
  /\bcadillac\b/i,
  /\baudi\b/i,
  /\bantonelli\b/i,
  /\brussell\b/i,
  /\bleclerc\b/i,
  /\bverstappen\b/i,
  /\bnorris\b/i,
  /\bpiastri\b/i,
  /\bhamilton\b/i,
  /\bgasly\b/i,
  /\bbearman\b/i,
  /\blawson\b/i
];

function decodeEntities(input) {
  return String(input || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(input) {
  return decodeEntities(String(input || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractTag(block, tag) {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\/${tag}>`, 'i');
  const match = block.match(pattern);
  return match ? stripHtml(match[1]) : '';
}

function extractAttribute(block, tag, attribute) {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?[^>]*${attribute}=["']([^"']+)["'][^>]*>`, 'i');
  const match = block.match(pattern);
  return match ? decodeEntities(match[1]) : '';
}

function truncate(input, limit) {
  const text = String(input || '').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function normalizeUrl(url, baseUrl) {
  if (!url) return '';
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function inferCategory(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  if (/race|grand prix|qualifying|sprint|podium/.test(text)) return 'Race Weekend';
  if (/contract|signed|signs|extends|rookie|driver/.test(text)) return 'Driver Market';
  if (/team|constructor|factory|engine|power unit|aero/.test(text)) return 'Team News';
  if (/fia|steering|penalty|steward|regulation|technical/.test(text)) return 'FIA';
  return 'Paddock';
}

function isF1Relevant(article) {
  const text = `${article.title} ${article.summary}`;
  return KEYWORDS.some((pattern) => pattern.test(text));
}

function parseRss(xmlText, feedName, feedUrl) {
  const items = [];
  const itemBlocks = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const block of itemBlocks) {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractTag(block, 'guid');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');
    const source = extractTag(block, 'source') || feedName;
    const mediaUrl = extractAttribute(block, 'media:content', 'url') || extractAttribute(block, 'enclosure', 'url');

    if (!title || !link) continue;

    const summary = truncate(stripHtml(description), 220);
    const normalized = {
      title: stripHtml(title),
      summary,
      url: normalizeUrl(link, feedUrl),
      source: stripHtml(source || feedName),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : '',
      category: inferCategory(title, summary),
      image: mediaUrl ? normalizeUrl(mediaUrl, feedUrl) : null
    };

    if (isF1Relevant(normalized)) {
      items.push(normalized);
    }
  }

  return items;
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; SarangPitWall/1.0)'
    }
  });

  if (!response.ok) return [];

  const xmlText = await response.text();
  return parseRss(xmlText, feed.name, feed.url);
}

function dedupeAndSort(items) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = `${item.url}|${item.title}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  output.sort((a, b) => {
    const aTime = Date.parse(a.publishedAt || '') || 0;
    const bTime = Date.parse(b.publishedAt || '') || 0;
    return bTime - aTime;
  });

  return output;
}

function jsonResponse(data, cacheMaxAgeSeconds = 900) {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${cacheMaxAgeSeconds}, stale-while-revalidate=3600`,
      'access-control-allow-origin': '*'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, OPTIONS',
          'access-control-allow-headers': 'content-type'
        }
      });
    }

    const url = new URL(request.url);
    const allowedPaths = new Set(['/f1-news', '/f1-news/']);
    if (request.method !== 'GET' || !allowedPaths.has(url.pathname)) {
      return new Response('Not found', { status: 404 });
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }

    const feeds = [...FEEDS];
    if (env?.EXTRA_NEWS_FEED_URL) {
      feeds.unshift({ name: env.EXTRA_NEWS_FEED_NAME || 'Extra Feed', url: env.EXTRA_NEWS_FEED_URL });
    }

    const results = await Promise.allSettled(feeds.map(fetchFeed));
    const articles = dedupeAndSort(
      results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    ).slice(0, 10);

    const payload = {
      generatedAt: new Date().toISOString(),
      sourceCount: feeds.length,
      articleCount: articles.length,
      articles
    };

    const response = jsonResponse(payload);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  }
};
