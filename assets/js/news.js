    (function () {
      const PROXY_URL = window.__NEWS_PROXY_URL__ || 'https://f1-news-worker.sar-brawlstars.workers.dev/?v=2';
      const ARTICLE_LIMIT = 8;
      const NEWS_CACHE_KEY = 'pw-news-page-cache';
      const categoryChips = document.getElementById('categoryChips');
      const sourceChips = document.getElementById('sourceChips');
      const newsList = document.getElementById('newsList');
      const searchInput = document.getElementById('searchInput');
      const listMeta = document.getElementById('listMeta');
      const statShown = document.getElementById('statShown');
      const statSources = document.getElementById('statSources');
      const statUpdated = document.getElementById('statUpdated');
      const sourceStack = document.getElementById('sourceStack');
      const refreshBtn = document.getElementById('refreshBtn');

      const state = {
        articles: [],
        filtered: [],
        category: 'all',
        source: 'all',
        search: ''
      };

      const categoryOrder = ['all', 'Race Weekend', 'Driver Market', 'Team News', 'Technical', 'FIA', 'Paddock'];
      const categoryLabels = {
        all: 'All',
        'Race Weekend': 'Race Weekend',
        'Driver Market': 'Driver Market',
        'Team News': 'Team News',
        'Technical': 'Technical',
        'FIA': 'FIA',
        'Paddock': 'Paddock'
      };

      function escapeHtml(input) {
        return String(input ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function clampText(value, limit) {
        const text = String(value || '').trim();
        if (text.length <= limit) return text;
        return `${text.slice(0, limit - 1).trimEnd()}…`;
      }

      function normalizeArticle(raw, index) {
        const url = raw?.url || raw?.link || '#';
        const title = raw?.title || raw?.headline || '';
        const summary = raw?.summary || raw?.description || raw?.excerpt || '';
        const source = raw?.source || raw?.publisher || raw?.feedName || 'F1 News';
        const category = raw?.category || raw?.section || 'Paddock';
        const publishedAt = raw?.publishedAt || raw?.pubDate || raw?.date || '';
        const image = raw?.image || raw?.thumbnail || raw?.media || '';
        return {
          id: `${url}|${title}|${index}`,
          url,
          title: clampText(title, 120),
          summary: clampText(summary, 220),
          source,
          category,
          publishedAt,
          image,
          index
        };
      }

      function timeAgo(publishedAt) {
        if (!publishedAt) return 'Fresh';
        const published = new Date(publishedAt);
        if (Number.isNaN(published.getTime())) return 'Fresh';
        const minutes = Math.max(0, Math.round((Date.now() - published.getTime()) / 60000));
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.round(hours / 24);
        return `${days}d ago`;
      }

      function hashColor(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue} 72% 36%)`;
      }

      function categoryPriority(category) {
        switch ((category || '').toLowerCase()) {
          case 'race weekend': return 5;
          case 'driver market': return 4;
          case 'team news': return 4;
          case 'technical': return 4;
          case 'fia': return 3;
          case 'paddock': return 2;
          default: return 1;
        }
      }

      function sourcePriority(source) {
        const value = String(source || '').toLowerCase();
        if (value.includes('formula1.com')) return 6;
        if (value.includes('bbc')) return 5;
        if (value.includes('sky')) return 5;
        if (value.includes('racefans')) return 5;
        if (value.includes('planetf1')) return 4;
        if (value.includes('racingnews365')) return 4;
        if (value.includes('motorsport')) return 4;
        if (value.includes('the race')) return 4;
        if (value.includes('athletic')) return 3;
        if (value.includes('newsnow')) return 3;
        return 2;
      }

      function recencyScore(publishedAt) {
        const ts = Date.parse(publishedAt || '');
        if (!ts) return 0;
        const hours = Math.max(0, (Date.now() - ts) / 3600000);
        return Math.max(0, 12 - hours);
      }

      function heuristicRank(items) {
        return [...items].sort((a, b) => {
          const aScore = categoryPriority(a.category) + sourcePriority(a.source) + recencyScore(a.publishedAt);
          const bScore = categoryPriority(b.category) + sourcePriority(b.source) + recencyScore(b.publishedAt);
          if (bScore !== aScore) return bScore - aScore;
          return (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0);
        });
      }

      function extractPuterText(result) {
        if (typeof result === 'string') return result;
        if (!result || typeof result !== 'object') return '';
        return result.text || result.content || result.message || result.response || '';
      }

      async function rankWithPuter(items) {
        if (!window.puter || !window.puter.ai || typeof window.puter.ai.chat !== 'function') return null;
        const compact = items.map((item) => ({
          title: item.title,
          source: item.source,
          category: item.category,
          summary: item.summary,
          publishedAt: item.publishedAt,
          url: item.url
        }));
        const prompt = [
          'Rank the following Formula 1 news stories from most relevant and interesting to least relevant.',
          'Return only a JSON array of URLs in the selected order. Keep at most 8 items.',
          'Prioritize official updates, race weekend implications, driver market moves, team developments, technical changes, FIA decisions, and strong mainstream reporting.',
          'Avoid duplicates, rumor-only pieces, and generic roundup articles.',
          JSON.stringify(compact, null, 2)
        ].join('\n\n');

        try {
          const result = await window.puter.ai.chat(prompt);
          const text = extractPuterText(result);
          const match = text.match(/\[[\s\S]*\]/);
          if (!match) return null;
          const parsed = JSON.parse(match[0]);
          if (!Array.isArray(parsed)) return null;
          return parsed.map(String).filter(Boolean);
        } catch (error) {
          return null;
        }
      }

      function scoreByUrlOrder(items, orderedUrls) {
        if (!Array.isArray(orderedUrls) || !orderedUrls.length) return heuristicRank(items);
        const lookup = new Map(orderedUrls.map((url, index) => [url, index]));
        const ranked = [...items].sort((a, b) => {
          const aRank = lookup.has(a.url) ? lookup.get(a.url) : Number.MAX_SAFE_INTEGER;
          const bRank = lookup.has(b.url) ? lookup.get(b.url) : Number.MAX_SAFE_INTEGER;
          if (aRank !== bRank) return aRank - bRank;
          return heuristicRank([a, b])[0] === a ? -1 : 1;
        });
        const seen = new Set();
        return ranked.filter((item) => {
          if (seen.has(item.url)) return false;
          seen.add(item.url);
          return true;
        });
      }

      function getFilteredArticles() {
        const term = state.search.trim().toLowerCase();
        return state.articles.filter((item) => {
          const categoryMatch = state.category === 'all' || item.category === state.category;
          const sourceMatch = state.source === 'all' || item.source === state.source;
          const text = `${item.title} ${item.summary} ${item.source} ${item.category}`.toLowerCase();
          const searchMatch = !term || text.includes(term);
          return categoryMatch && sourceMatch && searchMatch;
        });
      }

      function buildChip(label, value, active, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `chip${active ? ' active' : ''}`;
        button.textContent = label;
        button.addEventListener('click', onClick);
        button.dataset.value = value;
        return button;
      }

      function renderControls() {
        categoryChips.innerHTML = '';
        categoryOrder.forEach((category) => {
          const label = categoryLabels[category] || category;
          categoryChips.appendChild(buildChip(label, category, state.category === category, () => {
            state.category = category;
            renderControls();
            renderList();
          }));
        });

        sourceChips.innerHTML = '';
        const sources = [...new Set(state.articles.map((article) => article.source))].sort((a, b) => a.localeCompare(b));
        sourceChips.appendChild(buildChip('All sources', 'all', state.source === 'all', () => {
          state.source = 'all';
          renderControls();
          renderList();
        }));
        sources.forEach((source) => {
          sourceChips.appendChild(buildChip(source, source, state.source === source, () => {
            state.source = source;
            renderControls();
            renderList();
          }));
        });

        const topSources = sources.slice(0, 5);
        sourceStack.innerHTML = topSources.map((source) => `<div class="pulse-item"><strong>Source</strong><span>${escapeHtml(source)}</span></div>`).join('');
        statSources.textContent = String(sources.length);
      }

      function thumbMarkup(item) {
        if (item.image) {
          return `<div class="thumb"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"></div>`;
        }
        const accent = hashColor(item.source || item.category || item.title);
        const initials = (item.source || item.category || 'F1').split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
        return `<div class="thumb" style="background:${accent}"><div class="thumb-fallback">${escapeHtml(initials || 'F1')}<small>${escapeHtml(item.category || 'Paddock')}</small></div></div>`;
      }

      function cardMarkup(item) {
        const age = timeAgo(item.publishedAt);
        const badges = [`<span class="badge">${escapeHtml(item.category || 'Paddock')}</span>`, `<span class="badge-soft">${escapeHtml(age)}</span>`];
        return `
          <article class="article-card">
            ${thumbMarkup(item)}
            <div class="article-body">
              <div class="article-meta">
                <div class="article-badges">${badges.join('')}</div>
                <div class="article-source">${escapeHtml(item.source || 'F1 News')}</div>
              </div>
              <h3 class="article-title">${escapeHtml(item.title)}</h3>
              <p class="article-summary">${escapeHtml(item.summary)}</p>
              <div class="article-footer">
                <a class="article-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Read original</a>
                <span class="article-source">${escapeHtml(item.publishedAt ? new Date(item.publishedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Fresh')}</span>
              </div>
            </div>
          </article>`;
      }

      function renderList() {
        const filtered = getFilteredArticles();
        state.filtered = filtered;
        statShown.textContent = String(filtered.length);
        statUpdated.textContent = filtered.length ? timeAgo(filtered[0].publishedAt) : '--';
        listMeta.textContent = `${filtered.length} story${filtered.length === 1 ? '' : 's'} shown out of ${state.articles.length}. Scroll the list for more, or narrow it with the filters above.`;

        if (!filtered.length) {
          newsList.innerHTML = `<div class="empty">No stories match the current filter set. Try another category, a different source, or clear the search field.</div>`;
          return;
        }

        newsList.innerHTML = filtered.slice(0, ARTICLE_LIMIT).map(cardMarkup).join('');
      }

      function readCache() {
        try {
          const raw = localStorage.getItem(NEWS_CACHE_KEY);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed?.articles) ? parsed.articles : null;
        } catch (error) {
          return null;
        }
      }

      function writeCache(articles) {
        try {
          localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ storedAt: new Date().toISOString(), articles }));
        } catch (error) {
          // Ignore storage failures.
        }
      }

      async function fetchArticles(force = false) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
        try {
          const response = await fetch(PROXY_URL, { cache: force ? 'no-store' : 'default' });
          if (!response.ok) throw new Error(`News proxy returned ${response.status}`);
          const payload = await response.json();
          const normalized = (payload.articles || []).map(normalizeArticle).filter((item) => item.title && item.url);
          const immediate = heuristicRank(normalized).slice(0, ARTICLE_LIMIT);
          state.articles = immediate;
          renderControls();
          renderList();
          writeCache(immediate);

          const rankedUrls = await Promise.race([
            rankWithPuter(normalized),
            new Promise((resolve) => setTimeout(() => resolve(null), 4000))
          ]);

          if (Array.isArray(rankedUrls) && rankedUrls.length) {
            const ranked = scoreByUrlOrder(normalized, rankedUrls).slice(0, ARTICLE_LIMIT);
            state.articles = ranked;
            renderControls();
            renderList();
            writeCache(ranked);
          }
        } catch (error) {
          const cached = readCache();
          if (cached && cached.length) {
            state.articles = cached.map(normalizeArticle);
          } else {
            state.articles = [];
          }
        } finally {
          renderControls();
          renderList();
          refreshBtn.disabled = false;
          refreshBtn.textContent = 'Refresh stories';
        }
      }

      searchInput.addEventListener('input', () => {
        state.search = searchInput.value;
        renderList();
      });
      refreshBtn.addEventListener('click', () => fetchArticles(true));

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') fetchArticles();
      });

      const cached = readCache();
      if (cached && cached.length) {
        state.articles = cached.map(normalizeArticle);
        renderControls();
        renderList();
      }

      fetchArticles();
    })();
