(function () {
  const PROXY_URL = window.__NEWS_PROXY_URL__ || 'https://f1-news-worker.sar-brawlstars.workers.dev/?v=2';
  const MAX_ARTICLES = 500;
  const ARTICLES_PER_PAGE = 20;
  const NEWS_CACHE_KEY = 'pw-news-backlog-cache';
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  let allArticles = [];
  let currentPage = 1;
  let filteredArticles = [];

  const state = {
    activeFilters: new Set(),
    search: ''
  };

  function normalizeArticle(a) {
    return {
      title: a.title || 'Untitled',
      summary: a.summary || '',
      source: a.source || 'Unknown',
      link: a.link || '#',
      image: a.image || '',
      category: a.category || 'general',
      publishedAt: a.publishedAt || new Date().toISOString()
    };
  }

  const categoryPriority = { 'Race Weekend': 5, 'Driver Market': 4, 'Team News': 3, 'FIA': 2, 'Paddock': 1, general: 0 };
  const sourcePriority = { 'Formula1.com': 6, 'Sky Sports F1': 5, 'BBC Sport F1': 4, 'RaceFans': 3, 'default': 1 };

  function heuristicScore(a) {
    const catPri = categoryPriority[a.category] || 0;
    const srcPri = sourcePriority[a.source] || sourcePriority['default'];
    const recency = Math.max(0, 12 - Math.floor((Date.now() - new Date(a.publishedAt)) / (1000 * 60 * 60)));
    return catPri * 100 + srcPri * 10 + recency;
  }

  function isRelevant(text) {
    const keywords = /F1|Formula|Lewis|Max|Carlos|Lando|McLaren|Ferrari|Mercedes|Red Bull|Alpine|Aston|Williams|Haas|penalty|DRS|FIA|grid|qualify|sprint|strategy/i;
    return keywords.test(text);
  }

  function writeCache(articles) {
    try {
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
        articles: articles.slice(0, MAX_ARTICLES),
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  function readCache() {
    try {
      const cached = localStorage.getItem(NEWS_CACHE_KEY);
      if (!cached) return null;
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_TTL) return null;
      return data.articles;
    } catch (e) {
      return null;
    }
  }

  async function fetchAllArticles(skipCache = false) {
    try {
      const showLoading = document.getElementById('loadingBar');
      if (showLoading) {
        showLoading.classList.add('active');
        showLoading.style.width = '30%';
      }

      let articles = [];
      
      // Try to get from cache first
      if (!skipCache) {
        const cached = readCache();
        if (cached && cached.length > 0) {
          articles = cached.map(normalizeArticle);
        }
      }

      // Fetch from multiple queries to get more articles
      const queries = ['', '&offset=100', '&offset=200', '&offset=300'];
      const batchResults = [];

      for (const query of queries) {
        try {
          const res = await fetch(PROXY_URL + query);
          const data = await res.json();
          if (data.articles) {
            batchResults.push(...data.articles);
          }
        } catch (e) {}
      }

      if (batchResults.length > 0) {
        articles = batchResults
          .filter((a) => isRelevant(a.title + ' ' + a.summary))
          .map(normalizeArticle)
          .slice(0, MAX_ARTICLES);
        
        articles.sort((a, b) => heuristicScore(b) - heuristicScore(a));
        writeCache(articles);
      }

      allArticles = articles;
      applyFilters();
      renderPage(1);

      if (showLoading) {
        showLoading.style.width = '100%';
        setTimeout(() => {
          showLoading.classList.remove('active');
          showLoading.style.width = '0%';
        }, 500);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }

  function applyFilters() {
    filteredArticles = allArticles.filter((a) => {
      if (state.activeFilters.size === 0 && state.search === '') return true;

      const matchesFilter =
        state.activeFilters.size === 0 ||
        Array.from(state.activeFilters).some(
          (f) => (f.startsWith('cat:') && a.category === f.slice(4)) || (f.startsWith('src:') && a.source === f.slice(4))
        );

      const matchesSearch =
        state.search === '' ||
        (a.title.toLowerCase().includes(state.search.toLowerCase()) ||
          a.summary.toLowerCase().includes(state.search.toLowerCase()) ||
          a.source.toLowerCase().includes(state.search.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }

  function renderPage(page) {
    currentPage = page;
    const start = (page - 1) * ARTICLES_PER_PAGE;
    const end = start + ARTICLES_PER_PAGE;
    const pageItems = filteredArticles.slice(start, end);
    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);

    const container = document.getElementById('newsList');
    if (!container) return;

    if (pageItems.length === 0) {
      container.innerHTML = '<div class="empty">No articles match your filters. Try clearing them or checking back later.</div>';
      renderPagination(0);
      return;
    }

    container.innerHTML = pageItems
      .map(
        (a) => `
        <a href="${a.link}" target="_blank" rel="noopener" class="article-card">
          <div class="thumb">
            ${
              a.image
                ? `<img src="${a.image}" alt="${a.title}" onerror="this.parentElement.innerHTML='<div class=\\'thumb-fallback\\'>F1 News<small>${a.source}</small></div>'">`
                : `<div class="thumb-fallback">${a.source}<small>${a.category}</small></div>`
            }
          </div>
          <div class="article-body">
            <div class="article-meta">
              <div class="article-badges">
                ${a.category !== 'general' ? `<span class="badge">${a.category}</span>` : ''}
                <span class="badge-soft">${new Date(a.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <h3 class="article-title">${a.title}</h3>
            <p class="article-summary">${a.summary}</p>
            <footer class="article-footer">
              <span class="article-source">${a.source}</span>
              <span class="article-link">Read →</span>
            </footer>
          </div>
        </a>
      `
      )
      .join('');

    renderPagination(totalPages);
    document.getElementById('listMeta').textContent = `Showing ${start + 1}–${Math.min(end, filteredArticles.length)} of ${filteredArticles.length} articles`;
  }

  function renderPagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<div class="pagination" style="justify-content: center; margin: 20px 0;">';
    
    // Previous button
    if (currentPage > 1) {
      html += `<button class="pagination-button" onclick="goToPage(${currentPage - 1})">← Previous</button>`;
    }

    // Page numbers (Google-style)
    const maxPages = Math.min(totalPages, 10);
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    if (startPage > 1) {
      html += `<button class="pagination-button" onclick="goToPage(1)">1</button>`;
      if (startPage > 2) html += '<span style="padding: 8px;">...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage ? ' active' : '';
      html += `<button class="pagination-button${isActive}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += '<span style="padding: 8px;">...</span>';
      html += `<button class="pagination-button" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
      html += `<button class="pagination-button" onclick="goToPage(${currentPage + 1})">Next →</button>`;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function renderControls() {
    const categories = [...new Set(allArticles.map((a) => a.category))];
    const sources = [...new Set(allArticles.map((a) => a.source))];

    const categoryChips = document.getElementById('categoryChips');
    const sourceChips = document.getElementById('sourceChips');

    if (categoryChips) {
      categoryChips.innerHTML = categories
        .map(
          (cat) =>
            `<button class="chip${state.activeFilters.has(`cat:${cat}`) ? ' active' : ''}" data-filter="cat:${cat}" onclick="toggleFilter('cat:${cat}')">
              ${cat}
            </button>`
        )
        .join('');
    }

    if (sourceChips) {
      sourceChips.innerHTML = sources
        .map(
          (src) =>
            `<button class="chip${state.activeFilters.has(`src:${src}`) ? ' active' : ''}" data-filter="src:${src}" onclick="toggleFilter('src:${src}')">
              ${src}
            </button>`
        )
        .join('');
    }

    const statSources = document.getElementById('statSources');
    if (statSources) statSources.textContent = sources.length;
  }

  // Global functions for onclick handlers
  window.goToPage = function(page) {
    renderPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.toggleFilter = function(filter) {
    if (state.activeFilters.has(filter)) {
      state.activeFilters.delete(filter);
    } else {
      state.activeFilters.add(filter);
    }
    applyFilters();
    renderPage(1);
  };

  window.handleSearch = function() {
    const input = document.getElementById('searchInput');
    if (input) {
      state.search = input.value;
      applyFilters();
      renderPage(1);
    }
  };

  window.handleRefresh = function() {
    fetchAllArticles(true);
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', window.handleSearch);
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', window.handleRefresh);
    }

    fetchAllArticles();
    renderControls();
  });

  // Fetch immediately if DOM is already loaded
  if (document.readyState !== 'loading') {
    fetchAllArticles();
    renderControls();
  }
})();
