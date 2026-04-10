/* =====================================================
   SOLO LEVEL UP — js/views.js
   All view rendering: quests, calendar, inventory, profile
   ===================================================== */

'use strict';

const views = {

  /* ─── CURRENT QUEST TAB ─── */
  _questTab: 'today',

  switchQuestTab(tab) {
    views._questTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.quest-tab-panel').forEach(p => {
      p.style.display = p.dataset.panel === tab ? 'block' : 'none';
    });
  },

  /* ─── DYNAMIC CATEGORY LIST ─── */
  getDynamicCategories() {
    const used = new Set();
    state.tasks.forEach(t => { if (t.category) used.add(t.category); });
    state.recurringTemplates.forEach(t => { if (t.category) used.add(t.category); });
    return used.size > 0 ? Array.from(used) : ALL_CATEGORIES;
  },

  /* ─── TODAY'S TASKS ─── */
  renderTodayTasks() {
    const today      = state.todayDate;
    const todayTasks = state.tasks.filter(t => t.date === today);
    const container  = document.getElementById('taskListToday');
    const submitWrap = document.getElementById('submitBtnWrap');
    const lockWrap   = document.getElementById('lockBannerWrap');
    const emptyEl    = document.getElementById('emptyTasks');

    if (!container) return;
    container.innerHTML = '';

    if (!todayTasks.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (submitWrap) submitWrap.innerHTML = '';
      if (lockWrap)   lockWrap.innerHTML   = '';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    // Submit / lock banner
    if (!state.todayLocked) {
      if (submitWrap) submitWrap.innerHTML = `
        <button class="btn btn-primary" onclick="tasks.submitDaily()" style="margin:12px 16px 4px;">
          ⚔️ LOCK IN DAILY QUESTS
        </button>`;
      if (lockWrap) lockWrap.innerHTML = '';
    } else {
      if (submitWrap) submitWrap.innerHTML = '';
      const hasEdit = state.inventory.find(i => i.effect === 'edit' && !i.used);
      if (lockWrap) lockWrap.innerHTML = `
        <div class="lock-banner">
          <span class="lock-icon">🔒</span>
          <span>Daily quests locked${hasEdit
            ? ` — <span style="color:var(--accent);cursor:pointer;text-decoration:underline;"
                onclick="modals.openReward(state.inventory.find(i=>i.effect==='edit'&&!i.used))">
                Use Edit Pass?</span>`
            : ''}</span>
        </div>`;
    }

    todayTasks.forEach((task, idx) => {
      const el = views._buildTaskEl(task, idx);
      container.appendChild(el);
    });

    // Also refresh dashboard mini list
    views.renderDashTasks();
    ui.updateSummary();
  },

  _buildTaskEl(task, idx) {
    const locked = state.todayLocked;
    const el     = document.createElement('div');
    el.className = `task-item ${task.completed ? 'done' : ''}`;
    el.style.animationDelay = (idx * 0.04) + 's';
    el.dataset.taskId = task.id;

    let progressHTML = '';
    if (locked && !task.completed) {
      if (task.tracking === 'slider') {
        progressHTML = `
          <div class="task-progress-wrap">
            <input type="range" min="0" max="100" value="${task.progress || 0}"
              aria-label="Task progress"
              oninput="this.nextElementSibling.textContent=this.value+'%'"
              onchange="tasks.setProgress('${task.id}', parseInt(this.value))">
            <div style="font-size:10px;color:var(--text3);text-align:right;margin-top:2px;">
              ${task.progress || 0}%
            </div>
          </div>`;
      } else if (task.tracking === 'counter') {
        const goal    = task.counterGoal || 10;
        const current = Math.round(((task.progress || 0) / 100) * goal);
        progressHTML = `
          <div class="counter-row">
            <button class="btn btn-ghost btn-sm" onclick="tasks.counter('${task.id}', -1)">−</button>
            <div class="counter-val">${current} / ${goal}</div>
            <button class="btn btn-ghost btn-sm" onclick="tasks.counter('${task.id}', 1)">+</button>
          </div>`;
      }
    }

    el.innerHTML = `
      <div class="task-row">
        <div class="task-check ${task.completed ? 'checked' : ''}"
          role="checkbox"
          aria-checked="${task.completed}"
          onclick="tasks.toggle('${task.id}')"
          tabindex="0"
          onkeydown="if(event.key==='Enter'||event.key===' ')tasks.toggle('${task.id}')">
        </div>
        <div class="task-info">
          <div class="task-name">${escapeHtml(task.name)}</div>
          ${task.desc ? `<div class="task-desc">${escapeHtml(task.desc.substring(0, 70))}${task.desc.length > 70 ? '…' : ''}</div>` : ''}
          <div class="task-tags">
            <span class="tag tag-accent">${CATEGORY_ICONS[task.category] || ''} ${task.category}</span>
            <span class="tag tag-gold">+${task.xp} XP</span>
            ${task.recur !== 'none' ? `<span class="tag tag-green">🔄 ${task.recur}</span>` : ''}
            <span class="tag tag-ghost">${DIFF_LABELS[task.difficulty] || task.difficulty}</span>
          </div>
        </div>
      </div>
      ${progressHTML}`;
    return el;
  },

  /* ─── DASHBOARD MINI TASK LIST ─── */
  renderDashTasks() {
    const el    = document.getElementById('dashTaskList');
    if (!el) return;
    const today = state.todayDate;
    const list  = state.tasks.filter(t => t.date === today).slice(0, 5);
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = '<div class="empty-state" style="padding:20px 0"><div class="empty-icon">⚔️</div><p>No quests today</p></div>';
      return;
    }
    list.forEach((task, i) => {
      el.appendChild(views._buildTaskEl(task, i));
    });
  },

  /* ─── RECURRING TASKS ─── */
  renderRecurring() {
    const list   = document.getElementById('recurringList');
    const emptyR = document.getElementById('emptyRecurring');
    if (!list) return;
    list.innerHTML = '';
    if (!state.recurringTemplates.length) {
      if (emptyR) emptyR.style.display = 'block';
      return;
    }
    if (emptyR) emptyR.style.display = 'none';
    state.recurringTemplates.forEach(t => {
      const el = document.createElement('div');
      el.className = 'task-item';
      el.innerHTML = `
        <div class="task-row">
          <div class="task-info">
            <div class="task-name">${escapeHtml(t.name)}</div>
            <div class="task-tags">
              <span class="tag tag-green">🔄 ${t.recur}</span>
              <span class="tag tag-accent">${CATEGORY_ICONS[t.category]} ${t.category}</span>
              <span class="tag tag-gold">+${t.xp} XP</span>
            </div>
          </div>
          <button class="btn btn-danger btn-xs" onclick="tasks.deleteRecurring('${t.id}')">✕</button>
        </div>`;
      list.appendChild(el);
    });
  },

  /* ─── CALENDAR ─── */
  _calYear:  new Date().getFullYear(),
  _calMonth: new Date().getMonth(),

  renderCalendar() {
    const yr = views._calYear, mo = views._calMonth;
    const now      = new Date();
    const todayStr = toDateStr(now);

    document.getElementById('calMonthLabel').textContent =
      new Date(yr, mo, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay    = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const prevLast    = new Date(yr, mo, 0).getDate();
    const grid        = document.getElementById('calDays');
    if (!grid) return;
    grid.innerHTML = '';

    // Prev month filler
    for (let i = firstDay - 1; i >= 0; i--) {
      grid.appendChild(views._calDay(prevLast - i, '', true, false));
    }
    // This month
    for (let d = 1; d <= daysInMonth; d++) {
      const ds      = `${yr}-${mo + 1}-${d}`;
      const data    = state.calendarData[ds];
      const isToday = ds === todayStr;

      // Calc today's in-progress XP too
      let heat = 0;
      let xp   = data ? data.xp : 0;
      if (isToday) {
        xp = state.tasks.filter(t => t.date === ds && t.completed).reduce((a, t) => a + t.xp, 0);
      }
      if (xp > 0)   heat = 1;
      if (xp > 60)  heat = 2;
      if (xp > 150) heat = 3;
      if (xp > 300) heat = 4;
      if (xp > 500) heat = 5;

      const el = views._calDay(d, ds, false, isToday, heat);
      el.onclick = () => views.showCalDay(ds, d);
      grid.appendChild(el);
    }
    // Next month filler
    const total = firstDay + daysInMonth;
    const rem   = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= rem; i++) {
      grid.appendChild(views._calDay(i, '', true, false));
    }
  },

  _calDay(num, ds, other, isToday, heat = 0) {
    const el = document.createElement('div');
    el.className = `cal-day${other ? ' other' : ''}${isToday ? ' today' : ''}`;
    el.innerHTML = `<div class="d-heat heat-${heat}"></div><span class="d-num">${num}</span>`;
    return el;
  },

  calNav(dir) {
    views._calMonth += dir;
    if (views._calMonth > 11) { views._calMonth = 0; views._calYear++; }
    if (views._calMonth < 0)  { views._calMonth = 11; views._calYear--; }
    views.renderCalendar();
  },

  showCalDay(ds, day) {
    const detail = document.getElementById('calDetail');
    const title  = document.getElementById('calDetailTitle');
    const body   = document.getElementById('calDetailBody');
    if (!detail) return;

    const now      = new Date();
    const todayStr = toDateStr(now);
    const isToday  = ds === todayStr;
    const dateLabel = new Date(views._calYear, views._calMonth, day)
      .toLocaleString('default', { month: 'long', day: 'numeric' });
    title.textContent = dateLabel + (isToday ? ' (Today)' : '');

    let completed = 0, total = 0, xp = 0;
    if (isToday) {
      const todayTasks = state.tasks.filter(t => t.date === ds);
      completed = todayTasks.filter(t => t.completed).length;
      total     = todayTasks.length;
      xp        = todayTasks.filter(t => t.completed).reduce((a, t) => a + t.xp, 0);
    } else if (state.calendarData[ds]) {
      ({ completed, total, xp } = state.calendarData[ds]);
    }

    body.innerHTML = total > 0
      ? `<div style="display:flex;gap:20px;">
          <div><div style="font-family:var(--font-heading);font-size:20px;color:var(--accent2);">${completed}/${total}</div><div class="label-xs">Completed</div></div>
          <div><div style="font-family:var(--font-heading);font-size:20px;color:var(--gold);">${xp}</div><div class="label-xs">XP Earned</div></div>
         </div>`
      : `<div class="label-xs" style="padding:4px 0;">No data recorded.</div>`;

    detail.style.display = 'block';
    detail.classList.add('active');
    // Smooth scroll to it
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  /* ─── INVENTORY ─── */
  renderInventory() {
    const grid  = document.getElementById('invGrid');
    const empty = document.getElementById('emptyInv');
    if (!grid) return;
    grid.innerHTML = '';

    const items = state.inventory;
    if (!items.length) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = `inv-card ${item.used ? 'used' : ''}`;
      el.innerHTML = `
        <div class="inv-icon">${item.icon}</div>
        <div class="inv-name">${item.name}</div>
        <div class="inv-desc">${item.desc}</div>`;
      if (!item.used) el.onclick = () => modals.openReward(item);
      grid.appendChild(el);
    });
  },

  /* ─── RANK ROAD ─── */
  renderRankRoad() {
    const road = document.getElementById('rankRoad');
    if (!road) return;
    road.innerHTML = '';
    RANKS.forEach((rank, i) => {
      const achieved = state.level > rank.level;
      const current  = state.level === rank.level;
      const locked   = state.level < rank.level;
      const el = document.createElement('div');
      el.className = `rank-step ${achieved ? 'achieved' : ''} ${current ? 'current' : ''} ${locked ? 'locked' : ''}`;
      el.style.animationDelay = (i * 0.03) + 's';
      el.innerHTML = `
        <div class="r-dot"></div>
        <span class="r-icon">${rank.icon}</span>
        <span class="r-name">${rank.name}</span>
        <span class="r-xp">Lv.${rank.level}${rank.reward ? ' 🎁' : ''}</span>`;
      road.appendChild(el);
    });
  },

  /* ─── SETTINGS PANEL ─── */
  renderSettings() {
    // Dark mode toggle state
    const dm = document.getElementById('darkModeToggle');
    if (dm) dm.classList.toggle('on', !!state.settings.darkMode);

    // Streak toggle
    const st = document.getElementById('streakToggle');
    if (st) st.classList.toggle('on', state.settings.streakBonus !== false);

    // Day reset
    const dr = document.getElementById('dayResetSel');
    if (dr) dr.value = state.settings.dayResetTime || 6;

    // Player name
    const pn = document.getElementById('playerNameInput');
    if (pn && state.playerName !== 'PLAYER') pn.value = state.playerName;

    // Color swatches
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === state.settings.colorTheme);
    });
  },

};

/* ─── TASK ACTIONS ─── */
const tasks = {

  add() {
    const name = document.getElementById('taskNameInput').value.trim();
    if (!name) { ui.showToast('Enter a quest name!', 'danger', '⚠️'); return; }

    const diff      = document.getElementById('taskDiff').value;
    const category  = document.getElementById('taskCat').value;
    const desc      = document.getElementById('taskDesc').value.trim();
    const tracking  = document.getElementById('taskTracking').value;
    const recur     = document.getElementById('taskRecur').value;
    const counterGoal = parseInt(document.getElementById('taskCounterGoal').value) || 10;
    const xp        = calcTaskXp(diff, category, desc);
    const today     = state.todayDate;

    const task = {
      id:          'task_' + Date.now(),
      name, desc, category, difficulty: diff,
      tracking, recur, counterGoal, xp,
      date:        today,
      completed:   false,
      progress:    0,
      editUsed:    false,
    };

    state.tasks.push(task);

    if (recur !== 'none') {
      const template = { ...task, id: 'rt_' + Date.now() };
      state.recurringTemplates.push(template);
      ui.showToast(`Recurring quest added!`, 'success', '🔄');
      views.renderRecurring();
    } else {
      ui.showToast(`Quest added — +${xp} XP on completion`, 'success', '⚔️');
    }

    // Reset form
    document.getElementById('taskNameInput').value   = '';
    document.getElementById('taskDesc').value        = '';
    document.getElementById('xpPreviewVal').textContent = '—';
    saveState();
    views.renderTodayTasks();
    views.switchQuestTab('today');
  },

  toggle(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    if (!state.todayLocked) {
      ui.showToast('Lock in your quests first!', 'warning', '🔒');
      return;
    }
    if (task.tracking !== 'checkbox' && !task.completed) return;

    if (task.completed) {
      // Un-complete
      task.completed = false;
      task.progress  = 0;
      loseXp(task.xp, 'Quest uncompleted');
      state.categoryStats[task.category] = Math.max(0,
        (state.categoryStats[task.category] || 0) - task.xp);
    } else {
      tasks._complete(id);
    }
    saveState();
    views.renderTodayTasks();
    ui.renderStats && ui.renderStats();
    ui.renderRadar && ui.renderRadar();
  },

  _complete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.completed) return;
    task.completed = true;
    task.progress  = 100;

    let xpAward = task.xp;
    if (state.settings.streakBonus && state.streak >= 3) {
      xpAward += Math.floor(task.xp * 0.1 * Math.min(state.streak, 10));
    }
    awardXp(xpAward, task.name);
    state.categoryStats[task.category] = (state.categoryStats[task.category] || 0) + xpAward;
    state.lifetimeStats.tasksCompleted++;
    healHp(5);
    saveState();
    ui.renderStats();
    ui.renderRadar();
  },

  setProgress(id, val) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || !state.todayLocked) return;
    task.progress = val;
    if (val >= 100 && !task.completed) tasks._complete(id);
    else saveState();
  },

  counter(id, delta) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const goal    = task.counterGoal || 10;
    const current = Math.round(((task.progress || 0) / 100) * goal);
    const next    = Math.max(0, Math.min(goal, current + delta));
    task.progress = Math.round((next / goal) * 100);
    if (task.progress >= 100 && !task.completed) tasks._complete(id);
    else saveState();
    views.renderTodayTasks();
  },

  submitDaily() {
    const today      = state.todayDate;
    const todayTasks = state.tasks.filter(t => t.date === today);
    if (!todayTasks.length) { ui.showToast('Add quests before locking!', 'danger', '⚠️'); return; }
    state.todayLocked = true;
    saveState();
    views.renderTodayTasks();
    ui.showToast('Daily quests locked! Time to grind! 🔥', 'success', '⚔️');
  },

  deleteRecurring(id) {
    state.recurringTemplates = state.recurringTemplates.filter(t => t.id !== id);
    saveState();
    views.renderRecurring();
    ui.showToast('Recurring quest removed.', 'info', '🔄');
  },

  updateXpPreview() {
    const diff = document.getElementById('taskDiff')?.value;
    const cat  = document.getElementById('taskCat')?.value;
    const desc = document.getElementById('taskDesc')?.value;
    const xp   = calcTaskXp(diff, cat, desc);
    const el   = document.getElementById('xpPreviewVal');
    if (el) el.textContent = xp + ' XP on completion';
  },
};

/* ─── INVENTORY / REWARDS ─── */
const rewards = {
  apply(item) {
    const inv = state.inventory.find(i => i.uid === item.uid);
    if (!inv || inv.used) return;
    inv.used = true;

    if (item.effect === 'edit') {
      state.todayLocked = false;
      ui.showToast('Edit pass used! Quests unlocked for 5 min.', 'success', '✏️');
      setTimeout(() => {
        state.todayLocked = true;
        views.renderTodayTasks();
        saveState();
      }, 5 * 60 * 1000);
    } else if (item.effect === 'dayoff') {
      state.usedDayOff = true;
      ui.showToast('Day Off activated! No tracking today.', 'success', '😴');
    } else if (item.effect === 'nopen') {
      ui.showToast('No Penalty shield saved! Auto-activates on next penalty.', 'success', '🛡️');
    }

    modals.closeReward();
    saveState();
    views.renderInventory();
    views.renderTodayTasks();
  },
};

/* ─── HELPER ─── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── PENALTY TRACKER (persistent, visible on Quests tab) ─── */
// This method is appended to the views object — called separately
views.renderPenaltyTracker = function() {
  const wrap = document.getElementById('penaltyTrackerWrap');
  if (!wrap) return;

  const active = state.pendingPenalties.filter(function(p){ return p.announced !== false; });
  // Also show ones just announced
  const all = state.pendingPenalties;

  if (!all.length) {
    wrap.innerHTML = '';
    return;
  }

  let html = '<div class="section-title" style="padding-top:14px;">⚠️ Active Penalties</div>';

  all.forEach(function(pen) {
    const totalCount    = pen.penalties.length;
    const doneCount     = pen.penalties.filter(function(p){ return p.done; }).length;
    const allDone       = doneCount === totalCount;
    const xpTotal       = pen.penalties.reduce(function(a, p){ return a + p.xp; }, 0);
    const xpEarned      = pen.penalties.filter(function(p){ return p.done; }).reduce(function(a, p){ return a + p.xp; }, 0);

    html += '<div class="penalty-tracker-card' + (allDone ? ' pen-all-done' : '') + '">';

    // Card header
    html += '<div class="pen-tracker-header">' +
      '<div class="pen-tracker-left">' +
        '<span class="pen-tracker-icon">' + (allDone ? '✅' : '💀') + '</span>' +
        '<div>' +
          '<div class="pen-tracker-task">' + escapeHtml(pen.taskName) + '</div>' +
          '<div class="pen-tracker-sub">' + doneCount + '/' + totalCount + ' completed &nbsp;·&nbsp; +' + xpEarned + '/' + xpTotal + ' XP</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn ' + (allDone ? 'btn-primary' : 'btn-ghost') + ' btn-sm" ' +
        'onclick="modals.dismissPenalty(\'' + pen.taskId + '\')">' +
        (allDone ? '✓ CLEAR' : 'SKIP') +
      '</button>' +
    '</div>';

    // Progress bar
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    html += '<div class="bar-track thin" style="margin:8px 0 10px;">' +
      '<div class="bar-fill" style="width:' + pct + '%;background:' + (allDone ? 'var(--green)' : 'var(--red)') + ';"></div>' +
    '</div>';

    // Penalty items checklist
    pen.penalties.forEach(function(p, idx) {
      html += '<label class="pen-tracker-item' + (p.done ? ' done' : '') + '">' +
        '<input type="checkbox" ' + (p.done ? 'checked' : '') + ' ' +
          'onchange="modals.completePenaltyItem(\'' + pen.taskId + '\',' + idx + ',this.checked)">' +
        '<span class="pen-tracker-text">' + escapeHtml(p.text) + '</span>' +
        '<span class="pen-xp-badge">+' + p.xp + ' XP</span>' +
      '</label>';
    });

    html += '</div>'; // .penalty-tracker-card
  });

  wrap.innerHTML = html;
};
