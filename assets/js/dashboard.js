(function(){
  const now = new Date();
  const h = now.getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = g + ', Sarang — Max Verstappen (Red Bull)';
  const D = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  document.getElementById('dateline').textContent = D[now.getDay()] + ' · ' + String(now.getDate()).padStart(2,'0') + ' ' + M[now.getMonth()] + ' · ' + now.getFullYear();
})();

// Global variable to store next race time (updated by renderCalendar)
let nextRaceTime = new Date('2026-05-03T20:00:00Z').getTime();

(function(){
  const pad = (n) => String(n).padStart(2,'0');
  function tick() {
    const diff = nextRaceTime - Date.now();
    if (diff <= 0) {
      ['cd-d','cd-h','cd-m','cd-s'].forEach(id => document.getElementById(id).textContent = '00');
      return;
    }
    document.getElementById('cd-d').textContent = pad(Math.floor(diff / 86400000));
    document.getElementById('cd-h').textContent = pad(Math.floor((diff % 86400000) / 3600000));
    document.getElementById('cd-m').textContent = pad(Math.floor((diff % 3600000) / 60000));
    document.getElementById('cd-s').textContent = pad(Math.floor((diff % 60000) / 1000));
  }
  tick();
  setInterval(tick, 1000);
})();

(function(){
  // Global data storage for ticker updates
  let tickerData = {
    wdc: { val: 'ANTONELLI', pts: '72 pts' },
    wcc: { val: 'MERCEDES', pts: '135 pts' },
    next: { val: 'MIAMI GP', pts: 'MAY 3' },
    winner: { val: 'ANTONELLI', pts: 'JAPAN' },
    fl: { val: 'RUSSELL', pts: '1:28.411' },
    fastPit: { val: 'MCLAREN', pts: '1.94s' },
    ver: { val: '−60', pts: 'P9' },
    rookie: { val: 'LINDBLAD', pts: '4 pts' }
  };

  function updateTicker() {
    const items = [
      { sym: 'WDC', val: tickerData.wdc.val, pts: tickerData.wdc.pts },
      { sym: 'WCC', val: tickerData.wcc.val, pts: tickerData.wcc.pts },
      { sym: 'NEXT', val: tickerData.next.val, pts: tickerData.next.pts },
      { sym: 'WINNER', val: tickerData.winner.val, pts: tickerData.winner.pts },
      { sym: 'FL', val: tickerData.fl.val, pts: tickerData.fl.pts },
      { sym: 'FAST PIT', val: tickerData.fastPit.val, pts: tickerData.fastPit.pts },
      { sym: 'VER', val: tickerData.ver.val, pts: tickerData.ver.pts },
      { sym: 'ROOKIE', val: tickerData.rookie.val, pts: tickerData.rookie.pts }
    ];
    const mk = (it) => `<span class="tick"><span class="sym">${it.sym}</span> <span class="val">${it.val}</span> <span class="pts">${it.pts}</span></span><span class="tick tick-dot">◆</span>`;
    const half = items.map(mk).join('');
    const tkElem = document.getElementById('tkTrack');
    if (tkElem) tkElem.innerHTML = half + half;
  }

  updateTicker();
})();

(function(){
  setTimeout(() => {
    const next = document.querySelector('.cal-round.next');
    if (next) {
      const strip = document.getElementById('calStrip');
      strip.scrollTo({ left: next.offsetLeft - 60, behavior: 'smooth' });
    }
  }, 5000);
})();

/* ================================================================
   COLOPHON MODAL · open/close · DO NOT MODIFY
   ================================================================ */
(function(){
  const modal   = document.getElementById('colophon-modal');
  const openBtn = document.getElementById('openColophon');
  const closeBtn= modal && modal.querySelector('.colo-close');
  const backdrop= modal && modal.querySelector('.colo-backdrop');
  if (!modal || !openBtn) return;

  function open() {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
    document.body.classList.add('colo-open');
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    modal.classList.remove('open');
    document.body.classList.remove('colo-open');
    setTimeout(() => { modal.hidden = true; }, 300);
  }
  openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  backdrop && backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();

  window.__NEWS_PROXY_URL__ = 'https://f1-news-worker.sar-brawlstars.workers.dev/?v=2';
</script>

(function(){
  const btn = document.getElementById('themeToggle');
  const driverContainer = document.getElementById('driverStandings');
  const driverTitle = driverContainer && driverContainer.previousElementSibling;
  const calendarStrip = document.getElementById('calStrip');
  const calendarMeta = document.querySelector('.cal-section .cal-meta');
  const calendarProgressFill = document.querySelector('.cal-progress-fill');
  const newsBlock = document.getElementById('newsBlock');
  const NEWS_PROXY_URL = window.__NEWS_PROXY_URL__ || '';
  const NEWS_REFRESH_MS = 30 * 60 * 1000;
  const NEWS_CACHE_KEY = 'pw-news-cache';
  const NEWS_LIMIT = 4;

  const TEAM_COLORS = {
    'Mercedes': 'var(--mercedes)',
    'Ferrari': 'var(--ferrari)',
    'McLaren': 'var(--mclaren)',
    'Haas F1 Team': 'var(--haas)',
    'Haas': 'var(--haas)',
    'Alpine F1 Team': 'var(--alpine)',
    'Alpine': 'var(--alpine)',
    'Red Bull Racing': 'var(--redbull)',
    'Red Bull': 'var(--redbull)',
    'Racing Bulls': 'var(--racingbulls)',
    'Visa Cash App RB': 'var(--racingbulls)',
    'RB': 'var(--racingbulls)',
    'Aston Martin': 'var(--aston)',
    'Aston Martin Aramco Mercedes': 'var(--aston)',
    'Williams': 'var(--williams)',
    'Audi': 'var(--audi)',
    'Cadillac': 'var(--cadillac)'
  };

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const teamColorFor = (name) => TEAM_COLORS[name] || 'var(--ink-3)';

  const COUNTRY_FLAGS = {
    Australia: '🇦🇺',
    China: '🇨🇳',
    Japan: '🇯🇵',
    USA: '🇺🇸',
    Canada: '🇨🇦',
    Monaco: '🇲🇨',
    Spain: '🇪🇸',
    Austria: '🇦🇹',
    UK: '🇬🇧',
    Belgium: '🇧🇪',
    Hungary: '🇭🇺',
    Netherlands: '🇳🇱',
    Italy: '🇮🇹',
    Azerbaijan: '🇦🇿',
    Singapore: '🇸🇬',
    Mexico: '🇲🇽',
    Brazil: '🇧🇷',
    Qatar: '🇶🇦',
    UAE: '🇦🇪'
  };

  const CIRCUIT_LABELS = {
    'Albert Park Grand Prix Circuit': 'Albert Park',
    'Shanghai International Circuit': 'Shanghai',
    'Suzuka Circuit': 'Suzuka',
    'Miami International Autodrome': 'Miami',
    'Circuit Gilles Villeneuve': 'Montreal',
    'Circuit de Monaco': 'Monte Carlo',
    'Circuit de Barcelona-Catalunya': 'Barcelona',
    'Red Bull Ring': 'Red Bull Ring',
    'Silverstone Circuit': 'Silverstone',
    'Circuit de Spa-Francorchamps': 'Spa',
    'Hungaroring': 'Hungaroring',
    'Circuit Zandvoort': 'Zandvoort',
    'Autodromo Nazionale Monza': 'Monza',
    'Madrid Circuit': 'Madrid',
    'Baku City Circuit': 'Baku',
    'Marina Bay Street Circuit': 'Marina Bay',
    'Circuit of the Americas': 'Austin',
    'Autódromo Hermanos Rodríguez': 'Mexico City',
    'Autodromo Hermanos Rodriguez': 'Mexico City',
    'Autódromo José Carlos Pace': 'São Paulo',
    'Autodromo Jose Carlos Pace': 'São Paulo',
    'Las Vegas Strip Circuit': 'Las Vegas',
    'Lusail International Circuit': 'Lusail',
    'Yas Marina Circuit': 'Yas Marina'
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function applyTheme(t){
    if(!t){ const sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; t = sys? 'dark':'light'; }
    if(t === 'dark'){
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      if(btn){ btn.setAttribute('aria-pressed','true'); btn.textContent = '🌙 Dark'; }
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      if(btn){ btn.setAttribute('aria-pressed','false'); btn.textContent = '☀️ Light'; }
    }
  }
  try{ const stored = localStorage.getItem('pw-theme'); applyTheme(stored); }catch(e){}
  if(btn) btn.addEventListener('click', function(){ const now = document.body.classList.contains('dark')? 'light':'dark'; try{ localStorage.setItem('pw-theme', now); }catch(e){} applyTheme(now); });

  function driverName(driver){
    const info = driver.Driver || driver;
    if (info.givenName && info.familyName) return info.givenName.charAt(0) + '. ' + info.familyName;
    return info.familyName || info.name || info.code || 'Driver';
  }

  function driverTeam(driver){
    return driver.Constructors && driver.Constructors[0] ? driver.Constructors[0].name : 'TBA';
  }

  function driverCode(driver){
    const info = driver.Driver || driver;
    return info.code ? info.code : ((info.familyName || info.name || 'DRV').slice(0, 3)).toUpperCase();
  }

  function flagForCountry(country){
    return COUNTRY_FLAGS[country] || '🏁';
  }

  function venueForRace(race){
    const circuitName = race?.Circuit?.circuitName || '';
    return CIRCUIT_LABELS[circuitName] || circuitName.replace(/\s+(Grand Prix Circuit|International Circuit|International Autodrome|Street Circuit|Street Circuit|Circuit|Ring|Motor Speedway)$/i, '').trim() || race?.raceName || 'Race';
  }

  function formatWeekend(race){
    const sessionDates = [];
    const collect = (value) => {
      if (value && value.date) sessionDates.push(value.date);
    };
    collect(race.FirstPractice);
    collect(race.SecondPractice);
    collect(race.ThirdPractice);
    collect(race.Sprint);
    collect(race.Qualifying);
    if (race.date) sessionDates.push(race.date);

    const uniqueDates = [...new Set(sessionDates)].filter(Boolean).sort();
    if (!uniqueDates.length) return '';
    const first = new Date(uniqueDates[0] + 'T00:00:00Z');
    const last = new Date(uniqueDates[uniqueDates.length - 1] + 'T00:00:00Z');
    const firstMonth = MONTHS[first.getUTCMonth()];
    const lastMonth = MONTHS[last.getUTCMonth()];
    const firstDay = String(first.getUTCDate()).padStart(2, '0');
    const lastDay = String(last.getUTCDate()).padStart(2, '0');
    if (uniqueDates.length === 1) return `${firstMonth} ${firstDay} · ${WEEKDAYS[first.getUTCDay()]}`;
    if (first.getUTCMonth() === last.getUTCMonth()) return `${firstMonth} ${firstDay}–${lastDay}`;
    return `${firstMonth} ${firstDay}–${lastMonth} ${lastDay}`;
  }

  function formatWinner(result){
    const info = result?.Driver || {};
    if (info.givenName && info.familyName) return `${info.givenName.charAt(0)}. ${info.familyName}`;
    return info.familyName || info.code || 'Winner';
  }

  function formatRaceState(roundNumber, isDone, isNext){
    const roundLabel = `R${String(roundNumber).padStart(2, '0')}`;
    if (isNext) return `${roundLabel} · NEXT`;
    return roundLabel;
  }

  async function fetchRoundResult(roundNumber){
    try {
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/current/${roundNumber}/results.json`);
      const payload = await response.json();
      const race = payload.MRData?.RaceTable?.Races?.[0];
      const results = race?.Results || [];
      return { roundNumber, winner: results[0] || null, hasResults: results.length > 0 };
    } catch (error) {
      return { roundNumber, winner: null, hasResults: false };
    }
  }

  function renderCalendar(races, resultMap){
    if (!calendarStrip) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    let doneCount = 0;
    const unresolvedIndexes = [];

    races.forEach((race, index) => {
      const result = resultMap.get(String(race.round));
      if (!(result && result.hasResults)) unresolvedIndexes.push(index);
    });

    let nextIndex = races.findIndex((race) => {
      const result = resultMap.get(String(race.round));
      return !(result && result.hasResults) && race.date >= todayIso;
    });

    const seasonEndIso = races.length ? (races[races.length - 1].date || todayIso) : todayIso;
    if (nextIndex < 0 && unresolvedIndexes.length && todayIso <= seasonEndIso) {
      nextIndex = unresolvedIndexes[0];
    }

    const html = races.map((race, index) => {
      const roundNumber = Number(race.round);
      const result = resultMap.get(String(roundNumber));
      const isDone = Boolean(result && result.hasResults);
      const isNext = index === nextIndex;
      if (isDone) doneCount += 1;

      const statusClass = isDone ? 'done' : (isNext ? 'next' : '');
      const roundText = formatRaceState(roundNumber, isDone, isNext);
      const winnerHtml = isDone && result?.winner ? `<div class="cal-winner">${escapeHtml(formatWinner(result.winner))}</div>` : '';
      const flag = flagForCountry(race.Circuit?.Location?.country || '');
      const venue = escapeHtml(venueForRace(race));
      const country = escapeHtml(race.Circuit?.Location?.country || '');
      const dateText = escapeHtml(formatWeekend(race));

      return `
        <div class="cal-round ${statusClass}">
          <div class="cal-rnum">${roundText}<span class="cal-status-dot"></span></div>
          <div class="cal-flag-emoji">${flag}</div>
          <div class="cal-country">${country}</div>
          <div class="cal-flag-name">${venue}</div>
          <div class="cal-date">${dateText}</div>
          ${winnerHtml}
        </div>`;
    }).join('');

    calendarStrip.innerHTML = html;

    if (calendarMeta && races.length) {
      const firstMonth = MONTHS[new Date((races[0].date || races[0].FirstPractice?.date || '2026-03-01') + 'T00:00:00Z').getUTCMonth()];
      const lastRace = races[races.length - 1];
      const lastMonth = MONTHS[new Date((lastRace.date || lastRace.FirstPractice?.date || '2026-12-01') + 'T00:00:00Z').getUTCMonth()];
      calendarMeta.textContent = `${races.length} Rounds · ${firstMonth} → ${lastMonth} ${races[0].season || ''}`.trim();
    }

    if (calendarProgressFill && races.length) {
      calendarProgressFill.style.width = `${Math.round((doneCount / races.length) * 1000) / 10}%`;
    }

    const nextCard = calendarStrip.querySelector('.cal-round.next');
    if (nextCard) {
      calendarStrip.scrollTo({ left: Math.max(0, nextCard.offsetLeft - 60), behavior: 'smooth' });
    }

    // Update global nextRaceTime for countdown
    const todayIsoForCountdown = new Date().toISOString().slice(0, 10);
    let nextRaceIndex = races.findIndex((race) => {
      const result = resultMap.get(String(race.round));
      return !(result && result.hasResults) && race.date >= todayIsoForCountdown;
    });
    
    if (nextRaceIndex >= 0) {
      const nextRace = races[nextRaceIndex];
      // Use race.time if available, otherwise estimate based on date
      const raceTimeStr = nextRace.time || '20:00:00Z';
      const raceDateTime = `${nextRace.date}T${raceTimeStr}`;
      nextRaceTime = new Date(raceDateTime).getTime();

      // Update ticker with next race data
      const nextVenue = venueForRace(nextRace);
      const nextDate = new Date(nextRace.date + 'T00:00:00Z');
      const nextDateStr = MONTHS[nextDate.getUTCMonth()] + ' ' + nextDate.getUTCDate();
      tickerData.next.val = nextVenue.toUpperCase();
      tickerData.next.pts = nextDateStr;
    }

    // Update ticker with last race winner and fastest lap
    const completedRaces = races.filter(r => resultMap.get(String(r.round))?.hasResults);
    if (completedRaces.length > 0) {
      const lastRaceRound = completedRaces[completedRaces.length - 1].round;
      const lastRaceResult = resultMap.get(String(lastRaceRound));
      if (lastRaceResult?.winner) {
        const winnerName = driverName(lastRaceResult.winner).toUpperCase();
        const raceName = venueForRace(completedRaces[completedRaces.length - 1]);
        tickerData.winner.val = winnerName;
        tickerData.winner.pts = raceName;
      }
    }

    updateTicker();
  }

  function renderPodium(race, results) {
    const podiumList = document.getElementById('podiumList');
    const podiumHead = document.getElementById('podiumHead');
    if (!podiumList || !podiumHead) return;

    // Show top 3 finishers
    const top3 = results.slice(0, 3);
    const raceName = venueForRace(race);
    const circuitName = race?.Circuit?.circuitName || '';
    podiumHead.textContent = `${raceName} · ${circuitName} · Result`;

    podiumList.innerHTML = top3.map((result, idx) => {
      const position = idx + 1;
      const posClass = position === 1 ? 'p1' : position === 2 ? 'p2' : 'p3';
      const driver = result.Driver || {};
      const driverName = driver.givenName && driver.familyName ? 
        `${driver.givenName} ${driver.familyName}` : driver.familyName || 'Driver';
      const team = result.Constructor?.name || 'TBA';
      const driverNum = result.number || '00';
      
      // Calculate time/gap
      let timeDisplay = '+' + (result.Time?.time || '0:00.000');
      if (position === 1) {
        timeDisplay = result.Time?.time || '0:00.000';
      }

      return `
        <div class="pod-row ${posClass}">
          <div class="pod-badge">P${position}</div>
          <div>
            <div class="pod-driver-name">${escapeHtml(driverName)}</div>
            <div class="pod-driver-team">${escapeHtml(team)} · #${escapeHtml(driverNum)}</div>
          </div>
          <div class="pod-time">${escapeHtml(timeDisplay)}</div>
        </div>`;
    }).join('');
  }

  function formatNewsAge(publishedAt){
    if (!publishedAt) return '';
    const published = new Date(publishedAt);
    if (Number.isNaN(published.getTime())) return '';
    const minutes = Math.max(0, Math.round((Date.now() - published.getTime()) / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }

  function normalizeNewsArticle(raw, index){
    const title = raw?.title || raw?.headline || raw?.name || '';
    const summary = raw?.summary || raw?.description || raw?.excerpt || '';
    const url = raw?.url || raw?.link || '#';
    const source = raw?.source || raw?.publisher || raw?.feedName || 'Paddock';
    const publishedAt = raw?.publishedAt || raw?.pubDate || raw?.date || '';
    const category = raw?.category || raw?.section || 'Paddock';
    return { title, summary, url, source, publishedAt, category, index };
  }

  function renderNews(items){
    if (!newsBlock) return;
    if (!items.length) return;
    newsBlock.innerHTML = items.map((item, index) => {
      const leadClass = index === 0 ? 'lead' : 'neutral';
      const age = formatNewsAge(item.publishedAt);
      const ageText = age ? `<span class="news-source">${escapeHtml(age)}</span>` : '<span class="news-source">Fresh</span>';
      return `
        <article class="news-item ${leadClass}">
          <div class="news-meta">
            <span class="news-kicker">${escapeHtml(item.category || 'Paddock')}</span>
            <span class="news-num">${String(index + 1).padStart(2, '0')}</span>
          </div>
          <h3 class="news-headline">${escapeHtml(item.title)}</h3>
          <p class="news-body">${escapeHtml(item.summary)}</p>
          <div class="news-source-row">
            <span class="news-source">${escapeHtml(item.source || 'Paddock')}</span>
            ${ageText}
            <a class="news-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Read original</a>
          </div>
        </article>`;
    }).join('');
  }

  function readNewsCache(){
    try{
      const raw = localStorage.getItem(NEWS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.articles)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeNewsCache(payload){
    try{
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
        storedAt: new Date().toISOString(),
        articles: payload
      }));
    } catch (error) {
      // Ignore storage quota and privacy-mode failures.
    }
  }

  async function updateNews(){
    if (!newsBlock || !NEWS_PROXY_URL) return;
    try{
      const response = await fetch(NEWS_PROXY_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`News proxy returned ${response.status}`);
      const payload = await response.json();
      const articles = (payload.articles || [])
        .map(normalizeNewsArticle)
        .filter(item => item.title && item.url)
        .slice(0, NEWS_LIMIT);

      if (!articles.length) return;
      renderNews(articles);
      writeNewsCache(articles);
    } catch (error) {
      console.warn('News fetch failed', error);
      const cached = readNewsCache();
      if (cached && Array.isArray(cached.articles) && cached.articles.length) {
        renderNews(cached.articles.map(normalizeNewsArticle).slice(0, NEWS_LIMIT));
      }
    }
  }

  function renderDriverStandings(list){
    if (!driverContainer) return;
    driverContainer.innerHTML = list.map((driver, index) => {
      const teamName = driverTeam(driver);
      const teamColor = teamColorFor(teamName);
      const position = String(driver.position || index + 1).padStart(2, '0');
      const name = escapeHtml(driverName(driver));
      const team = escapeHtml(teamName);
      const code = escapeHtml(driverCode(driver));
      const country = escapeHtml((driver.Driver && driver.Driver.nationality) || '');
      let posClass = '';
      if (index === 0) posClass = ' leader';
      else if (index === 1) posClass = ' p2';
      else if (index === 2) posClass = ' p3';
      return `
        <div class="driver-row${posClass}" style="--team-color: ${teamColor}; animation-delay:${4.5 + index * 0.06}s;">
          <div class="driver-pos">${position}</div>
          <div class="driver-info">
            <div class="driver-line"><span class="driver-name">${name}</span><span class="driver-code" style="background:${teamColor}; color:#000;">${code}</span></div>
            <div class="driver-team">${team}${country ? ' · ' + country : ''}${index === 0 ? '' : ''}</div>
          </div>
          <div class="driver-pts-wrap"><div class="driver-pts">${escapeHtml(driver.points)}</div><div class="driver-pts-sub">pts</div></div>
        </div>`;
    }).join('');
    if (driverTitle) driverTitle.textContent = `Top ${list.length} · Current Season`;
  }

  async function updateStandings(){
    try{
      const [dr, cr] = await Promise.all([
        fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings.json'),
        fetch('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json')
      ]);
      const jd = await dr.json();
      const jc = await cr.json();
      const driverList = jd.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
      renderDriverStandings(driverList);

      const clist = jc.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
      const conRows = document.querySelectorAll('.con-row');
      let maxPts = 0;
      clist.forEach(c => maxPts = Math.max(maxPts, Number(c.points)));
      conRows.forEach((row, i) => {
        const c = clist[i];
        if(!c) return;
        const ptsEl = row.querySelector('.con-pts');
        if(ptsEl) ptsEl.textContent = c.points;
        const fill = row.querySelector('.con-bar-fill');
        if(fill){
          const pct = maxPts? Math.round((Number(c.points)/maxPts)*100):0;
          fill.style.width = pct + '%';
        }
      });

      // Update ticker with standings data
      if (driverList.length > 0) {
        const leader = driverList[0];
        tickerData.wdc.val = driverName(leader).toUpperCase();
        tickerData.wdc.pts = leader.points + ' pts';
      }
      if (clist.length > 0) {
        const conLeader = clist[0];
        tickerData.wcc.val = conLeader.Constructor.name.toUpperCase();
        tickerData.wcc.pts = conLeader.points + ' pts';
      }
      // Find rookie with most points
      const rookieList = driverList.filter(d => d.Driver?.dateOfBirth);
      if (rookieList.length > 0) {
        const rookie = rookieList[0];
        tickerData.rookie.val = driverName(rookie).toUpperCase();
        tickerData.rookie.pts = rookie.points + ' pts';
      }
      updateTicker();
    }catch(e){ console.warn('Standings fetch failed', e); }
  }

  async function updateCalendar(){
    try{
      const scheduleResponse = await fetch('https://api.jolpi.ca/ergast/f1/current.json');
      const schedulePayload = await scheduleResponse.json();
      const races = schedulePayload.MRData?.RaceTable?.Races || [];
      const roundResults = await Promise.all(races.map((race) => fetchRoundResult(race.round)));
      const resultMap = new Map(roundResults.map((entry) => [String(entry.roundNumber), entry]));
      renderCalendar(races, resultMap);

      // Fetch and render podium for last completed race
      const completedRaces = races.filter(r => resultMap.get(String(r.round))?.hasResults);
      if (completedRaces.length > 0) {
        const lastRace = completedRaces[completedRaces.length - 1];
        try {
          const podiumResponse = await fetch(`https://api.jolpi.ca/ergast/f1/current/${lastRace.round}/results.json`);
          const podiumPayload = await podiumResponse.json();
          const results = podiumPayload.MRData?.RaceTable?.Races?.[0]?.Results || [];
          if (results.length > 0) {
            renderPodium(lastRace, results);
          }
        } catch (e) {
          console.warn('Podium fetch failed', e);
        }
      }
    } catch (error) {
      console.warn('Calendar fetch failed', error);
    }
  }

  // Calendar navigation
  const calPrevBtn = document.getElementById('calPrev');
  const calNextBtn = document.getElementById('calNext');
  const calStrip = document.getElementById('calStrip');
  
  if (calPrevBtn && calNextBtn && calStrip) {
    const SCROLL_AMOUNT = 320; // ~3 race cards (100px each + gap)
    
    calPrevBtn.addEventListener('click', () => {
      calStrip.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    });
    
    calNextBtn.addEventListener('click', () => {
      calStrip.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
    });
  }

  updateStandings();
  updateCalendar();
  updateNews();
  setInterval(updateStandings, 10 * 60 * 1000);
  setInterval(updateCalendar, 30 * 60 * 1000);
  if (NEWS_PROXY_URL) {
    setInterval(updateNews, NEWS_REFRESH_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') updateNews();
    });
  }
})();

/* ============= LOADING BAR (YouTube-style) ============= */
function showLoadingBar() {
  const bar = document.getElementById('loadingBar');
  if (!bar) return;
  bar.classList.add('active');
  bar.style.width = '10%';
  let progress = 10;
  const interval = setInterval(() => {
    progress += Math.random() * 30;
    if (progress > 90) progress = 90;
    bar.style.width = progress + '%';
  }, 200);
  window._loadingBarInterval = interval;
}

function hideLoadingBar() {
  const bar = document.getElementById('loadingBar');
  if (!bar) return;
  if (window._loadingBarInterval) clearInterval(window._loadingBarInterval);
  bar.style.width = '100%';
  setTimeout(() => {
    bar.classList.remove('active');
    bar.style.width = '0%';
  }, 500);
}

/* ============= NEWS MODAL ============= */
function openNewsModal() {
  showLoadingBar();
  const modal = document.getElementById('newsModal');
  if (modal) {
    modal.classList.add('active');
    fetchNewsModalContent();
  }
}

function closeNewsModal() {
  const modal = document.getElementById('newsModal');
  if (modal) modal.classList.remove('active');
  hideLoadingBar();
}

let modalNewsArticles = [];
let modalNewsPage = 1;

async function fetchNewsModalContent() {
  try {
    const PROXY_URL = window.__NEWS_PROXY_URL__ || 'https://f1-news-worker.sar-brawlstars.workers.dev/?v=2';
    const response = await fetch(PROXY_URL + '&limit=50', { cache: 'no-store' });
    const data = await response.json();
    modalNewsArticles = (data.articles || []).slice(0, 50);
    renderNewsModalPage(1);
  } catch (e) {
    console.error('Error fetching modal news:', e);
  } finally {
    hideLoadingBar();
  }
}

function renderNewsModalPage(page) {
  const itemsPerPage = 15;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = modalNewsArticles.slice(start, end);
  const totalPages = Math.ceil(modalNewsArticles.length / itemsPerPage);
  modalNewsPage = page;

  const container = document.getElementById('newsModalContent');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 16px;">
      ${pageItems.map((a, i) => `
        <a href="${a.link || '#'}" target="_blank" rel="noopener noreferrer" style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; padding: 12px; border: 1px solid rgba(10,10,10,0.14); margin-bottom: 10px; text-decoration: none; color: inherit; transition: all 0.2s ease;" onmouseover="this.style.borderColor='rgba(10,10,10,0.26)'" onmouseout="this.style.borderColor='rgba(10,10,10,0.14)'">
          <div style="min-height: 80px; background: linear-gradient(135deg, rgba(225,6,0,0.25), rgba(10,10,10,0.75)); border: 1px solid rgba(10,10,10,0.2); overflow: hidden;">
            ${a.image ? `<img src="${a.image}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;\\'>📰</div>'">` : '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">📰</div>'}
          </div>
          <div style="min-width: 0;">
            <div style="font-size: 10px; color: #8a8172; margin-bottom: 4px; font-family: 'JetBrains Mono';">${a.source || 'Unknown'}</div>
            <h4 style="margin: 0 0 6px; font-size: 14px; line-height: 1.3; font-weight: 700;">${a.title}</h4>
            <p style="margin: 0; font-size: 12px; color: #4a4438; line-height: 1.4;">${a.summary || ''}</p>
            <div style="margin-top: 8px; font-size: 10px; color: #e10600; font-family: 'JetBrains Mono';">Read →</div>
          </div>
        </a>
      `).join('')}
    </div>
    <div class="pagination" style="gap: 6px;">
      ${totalPages > 1 ? Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
        const pageNum = i + 1;
        const isActive = pageNum === page ? ' active' : '';
        return `<button class="pagination-button${isActive}" onclick="renderNewsModalPage(${pageNum})"> ${pageNum} </button>`;
      }).join('') : ''}
      <div class="pagination-info">Page ${page} of ${totalPages} • ${modalNewsArticles.length} articles</div>
    </div>
  `;

  document.getElementById('newsModalPaginationInfo').textContent = `Page ${page} of ${totalPages}`;
}

/* ============= YOUTUBE INTEGRATION ============= */
const RACING_CHANNELS = [
  { name: 'Formula 1', id: 'UCB_qr75Oy' },
  { name: 'Sky Sports F1', id: 'UC0DMrwVWSzFEW78UjeZO-ZQ' },
  { name: 'ESPN F1', id: 'UC-_qhCiSj20rk1-gLnbqsjQ' },
  { name: 'Motorsport.com', id: 'UCksvEz_qVrpW2_8-s_7TvhA' },
  { name: 'RacingNews365', id: 'UCn0QtvQdcQJz5xQNaLyLLEg' }
];

const F1_YOUTUBERS = [
  { name: 'Senna Bracket', id: 'UCpg8JHQMvlrXJBCE_fB8gEw' },
  { name: 'Jimmy Broadbent', id: 'UCqH-8cI80G_R_aeVA5N8k0g' },
  { name: 'TomBlackF1', id: 'UC2lnHVBHGz7d3cLV3-SHQ8g' },
  { name: 'Tiametmarduk', id: 'UCV1qs8fgvMBCr0hbhFGZeOg' },
  { name: 'Formula Craic', id: 'UCpqILBKDiSO0lnF9RxmFyxw' },
  { name: 'Driver61', id: 'UCEgEiHVp1qxqmLKhsKfb-9w' },
  { name: 'TheBrainF1', id: 'UCnPkzRMjKNwQ4dW0_8xHZRQ' },
  { name: 'Speed Champions', id: 'UC-fI01AaxyMyBZoxLWLAEgg' },
  { name: 'Matt Button', id: 'UCdw1eTfZH_0p8KLwHwzJIvg' },
  { name: 'WTF1', id: 'UCs7nPQIEba0We2-qaCzXcMw' }
];

async function fetchYouTubeVideos(channelList, sectionId, title) {
  try {
    const videos = [];
    
    for (const channel of channelList.slice(0, 4)) {
      try {
        // Using YouTube's public feed (no API key needed)
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`);
        const data = await response.json();
        
        if (data.contents) {
          const dom = new DOMParser().parseFromString(data.contents, 'text/xml');
          const entries = dom.querySelectorAll('entry');
          entries.forEach((entry, i) => {
            if (i < 2) {
              const title = entry.querySelector('title')?.textContent || 'Untitled';
              const link = entry.querySelector('link')?.getAttribute('href') || '#';
              const thumbnail = entry.querySelector('media\\:thumbnail')?.getAttribute('url') || '';
              videos.push({
                title: title.substring(0, 60),
                channel: channel.name,
                link: link,
                thumbnail: thumbnail
              });
            }
          });
        }
      } catch (e) {
        console.log(`Skipping channel ${channel.name}`);
      }
    }
    
    renderYouTubeSection(videos, sectionId, title);
  } catch (e) {
    console.error('YouTube fetch error:', e);
  }
}

function renderYouTubeSection(videos, sectionId, title) {
  const container = document.getElementById(sectionId);
  if (!container || videos.length === 0) return;
  
  container.innerHTML = `
    <div class="youtube-section">
      <h3 class="youtube-title">${title}</h3>
      <div class="youtube-grid">
        ${videos.map(v => `
          <a href="${v.link}" target="_blank" rel="noopener noreferrer" class="youtube-card">
            <div class="youtube-thumb">
              ${v.thumbnail ? `<img src="${v.thumbnail}" alt="${v.title}">` : '<div style="background: rgba(225,6,0,0.25); width:100%; height:100%;"></div>'}
              <div class="youtube-play">▶</div>
            </div>
            <div class="youtube-info">
              <div class="youtube-channel">${v.channel}</div>
              <h4 class="youtube-name">${v.title}</h4>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

/* ============= INITIALIZE MODAL & YOUTUBE ============= */
(function() {
  // Close modal when clicking outside
  const modal = document.getElementById('newsModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeNewsModal();
    });
    // Keyboard close (ESC)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeNewsModal();
    });
  }

  // Fetch YouTube videos on page load (but not immediately to avoid blocking)
  setTimeout(() => {
    const racingContainer = document.getElementById('youtubeRacing');
    const youtubersContainer = document.getElementById('youtubeYoutubers');
    
    if (racingContainer) fetchYouTubeVideos(RACING_CHANNELS, 'youtubeRacing', '🎬 Latest Racing Videos');
    if (youtubersContainer) fetchYouTubeVideos(F1_YOUTUBERS, 'youtubeYoutubers', '⭐ Top F1 Creators');
  }, 2000);
})();
