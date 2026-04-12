/* =====================================================
   SOLO LEVEL UP — js/ui.js
   DOM rendering, theme, HP mechanic, AI briefing,
   insights, stats, radar
   ===================================================== */
'use strict';

const ui = {

  /* ─── THEME ─── */
  applyTheme() {
    const tier  = getTier();
    const mode  = state.settings.darkMode ? 'dark' : 'light';
    const color = state.settings.colorTheme || 'sapphire';
    document.documentElement.setAttribute('data-tier',  tier);
    document.documentElement.setAttribute('data-mode',  mode);
    document.documentElement.setAttribute('data-color', color);
  },

  toggleDarkMode() {
    state.settings.darkMode = !state.settings.darkMode;
    saveState();
    ui.applyTheme();
    document.querySelectorAll('.dm-toggle').forEach(b =>
      b.classList.toggle('on', state.settings.darkMode));
  },

  setColorTheme(colorId) {
    state.settings.colorTheme = colorId;
    saveState();
    ui.applyTheme();
    document.querySelectorAll('.swatch').forEach(s =>
      s.classList.toggle('active', s.dataset.color === colorId));
  },

  /* ─── AVATAR ─── */
  updateAvatar() {
    const tier = getTier();
    const svg  = getAvatarSvg(tier);
    ['avatarInner','sideAvatarInner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = svg;
    });
  },

  /* ─── HEADER ─── */
  updateHeader() {
    const rank = getCurrentRank();
    const set = (id, v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
    set('playerName',    state.playerName || 'PLAYER');
    set('rankBadgeText', rank.icon+' '+rank.name+' — LVL '+state.level);
    set('sidePlayerName',state.playerName || 'PLAYER');
    set('sideRankText',  rank.icon+' '+rank.name+' — LVL '+state.level);
    ui.updateAvatar();
    ui.applyTheme();
  },

  /* ─── XP BAR ─── */
  updateXpBar() {
    const {pct} = xpProgress();
    const fill  = document.getElementById('xpFill');
    const label = document.getElementById('xpLabel');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = state.totalXp.toLocaleString()+' / '+getXpForLevel(state.level+1).toLocaleString();
  },

  /* ─── HP BAR ─── */
  updateHpBar() {
    const pct   = Math.max(0, Math.min(100, (state.hp/state.maxHp)*100));
    const fill  = document.getElementById('hpFill');
    const label = document.getElementById('hpLabel');
    if (fill)  fill.style.width = pct+'%';
    if (label) label.textContent = state.hp+' / '+state.maxHp;
  },

  /* ─── HP STATE MECHANIC (#8) ─── */
  updateHpState() {
    const pct = (state.hp / state.maxHp) * 100;
    const bar = document.getElementById('hpFill');
    const shell = document.getElementById('mainContent');

    // Color changes
    if (bar) {
      if (pct < 20)      bar.style.background = 'linear-gradient(90deg,#8b0000,#c00020)';
      else if (pct < 50) bar.style.background = 'linear-gradient(90deg,#c02040,#f03060)';
      else               bar.style.background = '';
    }

    // Critical HP overlay tint
    const existing = document.getElementById('hpCriticalOverlay');
    if (pct < 20) {
      if (!existing) {
        const ov = document.createElement('div');
        ov.id = 'hpCriticalOverlay';
        ov.className = 'hp-critical-overlay';
        ov.innerHTML = '<div class="hp-critical-label">⚠️ CRITICAL HP — XP gains halved</div>';
        document.body.appendChild(ov);
      }
      // Halve XP: handled in awardXp check
    } else if (pct < 50) {
      if (existing) existing.remove();
      const warn = document.getElementById('hpWarnBanner');
      if (!warn) {
        const w = document.createElement('div');
        w.id = 'hpWarnBanner';
        w.className = 'hp-warn-banner';
        w.innerHTML = '❤️ HP below 50% — complete penalties to recover';
        const header = document.getElementById('headerBar');
        if (header) header.appendChild(w);
      }
    } else {
      if (existing) existing.remove();
      const warn = document.getElementById('hpWarnBanner');
      if (warn) warn.remove();
    }
  },

  /* ─── META ROW ─── */
  updateMeta() {
    const set = (id, v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
    set('streakText', state.streak+' day streak');
    const h = new Date().getHours();
    let phase, cls;
    if (h>=5&&h<12)      { phase='Morning';   cls='phase-morning'; }
    else if (h>=12&&h<17){ phase='Afternoon'; cls='phase-afternoon'; }
    else if (h>=17&&h<21){ phase='Evening';   cls='phase-evening'; }
    else                  { phase='Night';    cls='phase-night'; }
    const dot  = document.getElementById('phaseDot');
    const text = document.getElementById('phaseText');
    if (dot)  dot.className = 'phase-dot '+cls;
    if (text) text.textContent = phase;
  },

  /* ─── DAILY SUMMARY ─── */
  updateSummary() {
    const today = state.todayDate;
    const tt    = state.tasks.filter(t=>t.date===today);
    const done  = tt.filter(t=>t.completed);
    const xp    = done.reduce((a,t)=>a+t.xp, 0);
    const set = (id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
    set('sumTotal', tt.length);
    set('sumDone',  done.length);
    set('sumXp',    xp);
    ui._updatePenaltyIndicators();
  },

  _updatePenaltyIndicators() {
    const count = state.pendingPenalties.length;
    const dot   = document.getElementById('navPenaltyDot');
    const badge = document.getElementById('sidebarPenaltyBadge');
    const tab   = document.querySelector('.tab-btn[data-tab="today"]');
    if (dot)   dot.style.display   = count > 0 ? 'block' : 'none';
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-flex' : 'none'; }
    if (tab)   tab.classList.toggle('has-penalty', count > 0);
  },

  /* ─── INSIGHTS (#9) ─── */
  renderInsights() {
    const wrap = document.getElementById('insightsWrap');
    if (!wrap) return;
    const insights = generateInsights();
    if (!insights.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = insights.map(i =>
      '<div class="insight-card insight-'+i.type+'">' +
        '<span class="insight-icon">'+i.icon+'</span>' +
        '<span class="insight-text">'+i.text+'</span>' +
      '</div>'
    ).join('');
  },

  /* ─── AI DAILY BRIEFING (#5) ─── */
  /* ─── LOCAL DAILY BRIEFING (no API, no cost) ─── */
  fetchAIBriefing() {
    const btn = document.getElementById('briefingBtn');
    const out = document.getElementById('briefingOut');
    if (!btn || !out) return;

    btn.disabled = true;
    btn.textContent = '⏳ Consulting the system…';

    // Simulate a brief "thinking" pause for effect
    setTimeout(() => {
      const text = ui._generateBriefing();
      out.innerHTML = '<div class="briefing-text">' + text + '</div>';
      btn.disabled = false;
      btn.textContent = '🤖 New Briefing';
      fx.sound('unlock');
      fx.haptic('light');
    }, 800);
  },

  _generateBriefing() {
    const today    = state.todayDate;
    const tasks_   = state.tasks.filter(t => t.date === today);
    const done_    = tasks_.filter(t => t.completed);
    const rank     = getCurrentRank();
    const hpPct    = Math.round((state.hp / state.maxHp) * 100);
    const name     = state.playerName || 'HUNTER';
    const total    = tasks_.length;
    const doneCount= done_.length;
    const pending  = state.pendingPenalties.length;
    const streak   = state.streak;
    const level    = state.level;

    // Pick opening based on time of day
    const hour = new Date().getHours();
    const timeGreeting = hour < 12
      ? ['The gates of dawn open before you.', 'A new day rises. The weak sleep — you do not.', 'The System stirs as morning breaks.']
      : hour < 17
      ? ['The battle rages on, hunter.', 'Midday. The weak have already surrendered.', 'The System watches your every move.']
      : ['Twilight descends. Your trials are not over.', 'Night approaches. The true hunters do not rest.', 'The dungeon grows darker — so does your resolve.'];

    // Pick middle line based on quest progress
    let midLine;
    if (total === 0) {
      midLine = 'No quests assigned yet, '+name+'. Set your missions and begin the climb.';
    } else if (doneCount === total) {
      midLine = 'All '+total+' missions completed, '+name+'. You have exceeded expectations today.';
    } else if (doneCount === 0) {
      midLine = name+', you have '+total+' mission'+(total>1?'s':'')+' awaiting. The gap between you and your potential widens with every passing hour.';
    } else {
      const remaining = total - doneCount;
      midLine = name+' — '+doneCount+' of '+total+' missions cleared. '+remaining+' remain'+(remaining>1?'':'s')+'. Do not falter now.';
    }

    // Pick closing based on state
    let closing;
    if (pending > 0) {
      closing = 'WARNING: '+pending+' penalt'+(pending>1?'ies':'y')+' outstanding. The System demands payment.';
    } else if (hpPct < 30) {
      closing = 'Your HP is critical at '+hpPct+'%. Recover — a dead hunter earns no XP.';
    } else if (streak >= 7) {
      closing = 'A '+streak+'-day streak, '+rank.name+'. The System acknowledges your resolve.';
    } else if (streak >= 3) {
      closing = streak+' days straight. Good. Consistency is the rarest weapon.';
    } else if (level >= 10) {
      closing = 'Level '+level+' — the rank of '+rank.name+'. Those who doubted you have long since fallen behind.';
    } else {
      const closings = [
        'Every quest completed is a step away from the person you used to be.',
        'The System does not reward potential. Only results.',
        'Rise, '+name+'. The dungeon does not wait.',
        'Your future self is watching. Do not disappoint them.',
        'Weakness is a choice. So is strength. Choose.',
      ];
      closing = closings[Math.floor(Math.random() * closings.length)];
    }

    const opening = timeGreeting[Math.floor(Math.random() * timeGreeting.length)];
    return opening + ' ' + midLine + '<br><br><em>' + closing + '</em>';
  },

  /* ─── RADAR ─── */
  renderRadar() {
    const container = document.getElementById('radarContainer');
    if (!container) return;
    const cats = views.getDynamicCategories();
    if (cats.length < 3) {
      container.innerHTML = '<div style="text-align:center;padding:28px;color:var(--text3);font-size:12px;">Add quests in 3+ categories to reveal your radar.</div>';
      return;
    }
    const cx=115, cy=115, r=82;
    const maxVal = Math.max(50, ...cats.map(c=>state.categoryStats[c]||0));
    const ang    = i => (i/cats.length)*Math.PI*2 - Math.PI/2;
    const outer  = (i,rt=1) => [cx+Math.cos(ang(i))*r*rt, cy+Math.sin(ang(i))*r*rt];
    const pt     = (i,v)   => outer(i, Math.max(0.06, v/maxVal));

    let grid = '';
    [0.2,0.4,0.6,0.8,1].forEach(rt => {
      const pts = cats.map((_,i)=>outer(i,rt).join(',')).join(' ');
      grid += '<polygon points="'+pts+'" fill="none" stroke="rgba(128,160,255,0.1)" stroke-width="1"/>';
    });
    const axes  = cats.map((_,i)=>{ const [x,y]=outer(i); return '<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="rgba(128,160,255,0.12)" stroke-width="1"/>'; }).join('');
    const dPts  = cats.map((c,i)=>pt(i,state.categoryStats[c]||0).join(',')).join(' ');
    const dots  = cats.map((c,i)=>{ const [x,y]=pt(i,state.categoryStats[c]||0); return '<circle cx="'+x+'" cy="'+y+'" r="4" fill="'+(CATEGORY_COLORS[c]||'var(--accent2)')+'" filter="url(#rdg)"/>'; }).join('');
    const lbls  = cats.map((c,i)=>{ const [x,y]=outer(i,1.28); const col=CATEGORY_COLORS[c]||'var(--accent2)'; const s=c.toUpperCase().slice(0,9); return '<text x="'+x+'" y="'+y+'" fill="'+col+'" font-size="7.5" text-anchor="middle" dominant-baseline="middle" font-family="Rajdhani,sans-serif" font-weight="700" letter-spacing="0.5">'+s+'</text>'; }).join('');

    container.innerHTML =
      '<svg viewBox="0 0 230 230" width="230" height="230" style="overflow:visible">' +
        '<defs>' +
          '<filter id="rdg" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
          '<filter id="rfg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
        '</defs>' +
        grid + axes +
        '<polygon points="'+dPts+'" fill="var(--glow-sm)" stroke="none" filter="url(#rfg)" opacity="0.6"/>' +
        '<polygon points="'+dPts+'" fill="rgba(29,111,221,0.15)" stroke="var(--accent)" stroke-width="1.8"/>' +
        dots + lbls +
      '</svg>';
  },

  /* ─── STATS GRID ─── */
  renderStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    views.getDynamicCategories().forEach(cat => {
      const val = state.categoryStats[cat] || 0;
      const pct = Math.min(100, (val / Math.max(100,val)) * 100);
      const col = CATEGORY_COLORS[cat] || 'var(--accent2)';
      const d   = document.createElement('div');
      d.className = 'stat-card';
      d.innerHTML =
        '<div class="stat-label-text">'+CATEGORY_ICONS[cat]+' '+cat+'</div>' +
        '<div class="stat-value-text" style="color:'+col+'">'+val+'</div>' +
        '<div class="bar-track thin"><div class="bar-fill" style="width:100%;background:'+col+'"></div></div>';
      grid.appendChild(d);
    });
  },

  /* ─── LIFETIME STATS ─── */
  renderLifetimeStats() {
    const grid = document.getElementById('lifetimeStats');
    if (!grid) return;
    const ls = state.lifetimeStats;
    const items = [
      { icon:'🏆', label:'Tasks Done',  val:ls.tasksCompleted,      col:'var(--green)' },
      { icon:'⚡', label:'Total XP',    val:ls.totalXpEarned,       col:'var(--gold)' },
      { icon:'🔥', label:'Best Streak', val:ls.streakBest,          col:'var(--accent2)' },
      { icon:'📅', label:'Days Active', val:ls.daysActive||0,       col:'var(--accent3)' },
      { icon:'⚠️', label:'Penalties',   val:ls.penaltiesCompleted,  col:'var(--red)' },
      { icon:'💎', label:'Level',       val:state.level,            col:'var(--gold)' },
    ];
    grid.innerHTML = items.map(it =>
      '<div class="stat-card">' +
        '<div class="stat-label-text">'+it.icon+' '+it.label+'</div>' +
        '<div class="stat-value-text" style="color:'+it.col+'">'+it.val+'</div>' +
      '</div>'
    ).join('');
  },

  /* ─── TOAST ─── */
  _toastTimer: null,
  showToast(text, type, icon) {
    const el = document.getElementById('toast');
    if (!el) return;
    document.getElementById('toastText').textContent = text;
    document.getElementById('toastIcon').textContent = icon || '⚡';
    el.className = 'toast show '+(type||'info');
    clearTimeout(ui._toastTimer);
    ui._toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  },

  /* ─── CANVAS PARTICLES ─── */
  initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    let W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i=0; i<28; i++) {
      particles.push({ x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
        vy:-(0.15+Math.random()*0.4), vx:(Math.random()-0.5)*0.15,
        r:0.8+Math.random()*1.4, a:Math.random(), da:0.002+Math.random()*0.004 });
    }
    const getAccent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1d6fdd';
    const frame = () => {
      ctx.clearRect(0,0,W,H);
      const col = getAccent();
      particles.forEach(p => {
        p.y+=p.vy; p.x+=p.vx; p.a+=p.da;
        if (p.a>0.55||p.a<0) p.da*=-1;
        if (p.y<-10) { p.y=H+10; p.x=Math.random()*W; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=col; ctx.globalAlpha=p.a*0.5; ctx.fill();
      });
      ctx.globalAlpha=1;
      requestAnimationFrame(frame);
    };
    frame();
  },
};
