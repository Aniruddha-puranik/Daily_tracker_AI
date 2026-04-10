/* =====================================================
   SOLO LEVEL UP — js/ui.js
   DOM rendering: header, bars, dashboard, radar, stats
   ===================================================== */

'use strict';

const ui = {

  /* ─── THEME & MODE ─── */
  applyTheme() {
    const tier   = getTier();
    const mode   = state.settings.darkMode ? 'dark' : 'light';
    const color  = state.settings.colorTheme || 'sapphire';
    document.documentElement.setAttribute('data-tier',  tier);
    document.documentElement.setAttribute('data-mode',  mode);
    document.documentElement.setAttribute('data-color', color);
    // Sidebar nav active highlight inherits accent
  },

  toggleDarkMode() {
    state.settings.darkMode = !state.settings.darkMode;
    saveState();
    ui.applyTheme();
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
      btn.classList.toggle('on', state.settings.darkMode);
      btn.setAttribute('aria-label', state.settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode');
    }
  },

  setColorTheme(colorId) {
    state.settings.colorTheme = colorId;
    saveState();
    ui.applyTheme();
    // Update active swatch
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === colorId);
    });
  },

  /* ─── AVATAR ─── */
  updateAvatar() {
    const el = document.getElementById('avatarInner');
    if (!el) return;
    const tier = getTier();
    el.innerHTML = getAvatarSvg(tier);
  },

  /* ─── HEADER TEXT ─── */
  updateHeader() {
    const rank = getCurrentRank();
    const nameEl  = document.getElementById('playerName');
    const rankEl  = document.getElementById('rankBadgeText');
    if (nameEl) nameEl.textContent = state.playerName || 'PLAYER';
    if (rankEl) rankEl.textContent = `${rank.icon} ${rank.name} — LVL ${state.level}`;
    ui.updateAvatar();
    ui.applyTheme();
  },

  /* ─── XP BAR ─── */
  updateXpBar() {
    const { current, needed, pct } = xpProgress();
    const fill  = document.getElementById('xpFill');
    const label = document.getElementById('xpLabel');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = `${state.totalXp.toLocaleString()} / ${getXpForLevel(state.level + 1).toLocaleString()}`;
  },

  /* ─── HP BAR ─── */
  updateHpBar() {
    const pct   = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
    const fill  = document.getElementById('hpFill');
    const label = document.getElementById('hpLabel');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = `${state.hp} / ${state.maxHp}`;
  },

  /* ─── STREAK & TIME PHASE ─── */
  updateMeta() {
    const streakEl = document.getElementById('streakText');
    if (streakEl) streakEl.textContent = `${state.streak} day streak`;

    const h = new Date().getHours();
    let phase, cls;
    if (h >= 5  && h < 12) { phase = 'Morning';   cls = 'phase-morning'; }
    else if (h >= 12 && h < 17) { phase = 'Afternoon'; cls = 'phase-afternoon'; }
    else if (h >= 17 && h < 21) { phase = 'Evening';   cls = 'phase-evening'; }
    else                        { phase = 'Night';     cls = 'phase-night'; }

    const dot  = document.getElementById('phaseDot');
    const text = document.getElementById('phaseText');
    if (dot)  { dot.className = `phase-dot ${cls}`; }
    if (text) { text.textContent = phase; }
  },

  /* ─── DAILY SUMMARY PILLS ─── */
  updateSummary() {
    const today      = state.todayDate;
    const todayTasks = state.tasks.filter(t => t.date === today);
    const done       = todayTasks.filter(t => t.completed);
    const xpToday    = done.reduce((a, t) => a + t.xp, 0);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('sumTotal',  todayTasks.length);
    set('sumDone',   done.length);
    set('sumXp',     xpToday);
  },

  /* ─── RADAR CHART ─── */
  renderRadar() {
    const container = document.getElementById('radarContainer');
    if (!container) return;

    const cats = views.getDynamicCategories();
    if (cats.length < 3) {
      container.innerHTML = `
        <div style="text-align:center;padding:28px 16px;color:var(--text3);font-size:12px;">
          Add quests in at least 3 different categories to reveal your skill radar.
        </div>`;
      return;
    }

    const cx = 115, cy = 115, r = 85;
    const maxVal = Math.max(50, ...cats.map(c => state.categoryStats[c] || 0));

    const angle  = (i) => (i / cats.length) * Math.PI * 2 - Math.PI / 2;
    const outer  = (i, ratio = 1) => [
      cx + Math.cos(angle(i)) * r * ratio,
      cy + Math.sin(angle(i)) * r * ratio,
    ];
    const point  = (i, val) => outer(i, Math.max(0.06, val / maxVal));

    // Grid rings
    let grid = '';
    [0.2, 0.4, 0.6, 0.8, 1].forEach(ratio => {
      const pts = cats.map((_, i) => outer(i, ratio).join(',')).join(' ');
      grid += `<polygon points="${pts}" fill="none" stroke="rgba(128,160,255,0.1)" stroke-width="1"/>`;
    });

    // Axis lines
    let axes = cats.map((_, i) => {
      const [x, y] = outer(i);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(128,160,255,0.15)" stroke-width="1"/>`;
    }).join('');

    // Data polygon
    const dataPts = cats.map((c, i) => point(i, state.categoryStats[c] || 0).join(',')).join(' ');

    // Dots
    const dots = cats.map((c, i) => {
      const [x, y] = point(i, state.categoryStats[c] || 0);
      const col    = CATEGORY_COLORS[c] || 'var(--accent2)';
      return `<circle cx="${x}" cy="${y}" r="4" fill="${col}" filter="url(#rdotglow)"/>`;
    }).join('');

    // Labels
    const labels = cats.map((c, i) => {
      const [x, y] = outer(i, 1.28);
      const col    = CATEGORY_COLORS[c] || 'var(--accent2)';
      const short  = c.toUpperCase().slice(0, 9);
      return `<text x="${x}" y="${y}" fill="${col}" font-size="7.5"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Rajdhani,sans-serif" font-weight="700" letter-spacing="0.5">${short}</text>`;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 230 230" width="230" height="230" style="overflow:visible">
        <defs>
          <filter id="rdotglow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="rfillglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        ${grid}${axes}
        <polygon points="${dataPts}"
          fill="var(--glow-sm)" stroke="none" filter="url(#rfillglow)" opacity="0.6"/>
        <polygon points="${dataPts}"
          fill="rgba(29,111,221,0.18)" stroke="var(--accent)" stroke-width="1.8"/>
        ${dots}${labels}
      </svg>`;
  },

  /* ─── ATTRIBUTE STAT CARDS ─── */
  renderStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const cats = views.getDynamicCategories();
    cats.forEach(cat => {
      const val = state.categoryStats[cat] || 0;
      const max = Math.max(100, val);
      const pct = (val / max) * 100;
      const col = CATEGORY_COLORS[cat] || 'var(--accent2)';
      const div = document.createElement('div');
      div.className = 'stat-card';
      div.innerHTML = `
        <div class="stat-label-text">${CATEGORY_ICONS[cat] || '◈'} ${cat}</div>
        <div class="stat-value-text" style="color:${col}">${val}</div>
        <div class="bar-track thin">
          <div class="bar-fill" style="width:${pct}%;background:${col}"></div>
        </div>`;
      grid.appendChild(div);
    });
  },

  /* ─── LIFETIME STATS ─── */
  renderLifetimeStats() {
    const grid = document.getElementById('lifetimeStats');
    if (!grid) return;
    const ls = state.lifetimeStats;
    const items = [
      { icon:'🏆', label:'Tasks Done',   val: ls.tasksCompleted,  col: 'var(--green)' },
      { icon:'⚡', label:'Total XP',     val: ls.totalXpEarned,   col: 'var(--gold)' },
      { icon:'🔥', label:'Best Streak',  val: ls.streakBest,      col: 'var(--accent2)' },
      { icon:'📅', label:'Days Active',  val: ls.daysActive || 0, col: 'var(--accent3)' },
      { icon:'⚠️', label:'Penalties',    val: ls.penaltiesCompleted, col: 'var(--red)' },
      { icon:'💎', label:'Level',        val: state.level,        col: 'var(--gold)' },
    ];
    grid.innerHTML = items.map(it => `
      <div class="stat-card">
        <div class="stat-label-text">${it.icon} ${it.label}</div>
        <div class="stat-value-text" style="color:${it.col}">${it.val}</div>
      </div>`).join('');
  },

  /* ─── TOAST NOTIFICATION ─── */
  _toastTimer: null,
  showToast(text, type = 'info', icon = '⚡') {
    const el   = document.getElementById('toast');
    const iEl  = document.getElementById('toastIcon');
    const tEl  = document.getElementById('toastText');
    if (!el) return;
    tEl.textContent = text;
    iEl.textContent = icon;
    el.className = `toast show ${type}`;
    clearTimeout(ui._toastTimer);
    ui._toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  },

  /* ─── BACKGROUND PARTICLES (canvas) ─── */
  initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const particles = [];
    let W, H;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 28; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vy: -(0.15 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.15,
        r:  0.8 + Math.random() * 1.4,
        a:  Math.random(),
        da: 0.002 + Math.random() * 0.004,
      });
    }

    const getAccent = () => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim() || '#1d6fdd';
    };

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      const col = getAccent();
      particles.forEach(p => {
        p.y  += p.vy;
        p.x  += p.vx;
        p.a  += p.da;
        if (p.a > 0.55 || p.a < 0) p.da *= -1;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.globalAlpha = p.a * 0.5;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    };
    frame();
  },

};

/* ─── SIDEBAR SYNC (appended) ─── */
const _origUpdateHeader = ui.updateHeader.bind(ui);
ui.updateHeader = function() {
  _origUpdateHeader();
  const rank = getCurrentRank();
  const sa = document.getElementById('sideAvatarInner');
  const ha = document.getElementById('avatarInner');
  if (sa && ha) sa.innerHTML = ha.innerHTML;
  const sn = document.getElementById('sidePlayerName');
  if (sn) sn.textContent = state.playerName || 'PLAYER';
  const sr = document.getElementById('sideRankText');
  if (sr) sr.textContent = rank.icon + ' ' + rank.name + ' — LVL ' + state.level;
};
