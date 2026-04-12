/* =====================================================
   SOLO LEVEL UP — js/state.js
   State management, XP/HP/boss logic
   ===================================================== */
'use strict';

const STORAGE_KEY = 'sluState_v3';

function loadState() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e) { console.warn('Save failed:', e); }
}

function mergeState(saved) {
  const m = JSON.parse(JSON.stringify(DEFAULT_STATE));
  for (const k of Object.keys(m)) {
    if (saved[k] !== undefined) {
      if (typeof m[k]==='object' && !Array.isArray(m[k]) && m[k]!==null)
        Object.assign(m[k], saved[k]);
      else m[k] = saved[k];
    }
  }
  if (Array.isArray(saved.tasks))              m.tasks              = saved.tasks;
  if (Array.isArray(saved.recurringTemplates)) m.recurringTemplates = saved.recurringTemplates;
  if (Array.isArray(saved.inventory))          m.inventory          = saved.inventory;
  if (Array.isArray(saved.pendingPenalties))   m.pendingPenalties   = saved.pendingPenalties;
  if (saved.calendarData)                      m.calendarData       = saved.calendarData;
  return m;
}

const _saved = loadState();
let state = _saved ? mergeState(_saved) : JSON.parse(JSON.stringify(DEFAULT_STATE));

/* ─── RANK / TIER ─── */
function getCurrentRank(level) {
  level = level !== undefined ? level : state.level;
  let rank = RANKS[0];
  for (const r of RANKS) { if (level >= r.level) rank = r; }
  return rank;
}
function getTier(level) { return getCurrentRank(level).tier; }

/* ─── XP ─── */
function calcLevel(xp) {
  let l = 0;
  while (getXpForLevel(l+1) <= xp) l++;
  return l;
}
function recalcLevel() { state.level = calcLevel(state.totalXp); }

function xpProgress() {
  const start = getXpForLevel(state.level);
  const end   = getXpForLevel(state.level + 1);
  const cur   = state.totalXp - start;
  const need  = end - start;
  return { current:cur, needed:need, pct: Math.min(100,(cur/need)*100) };
}

function awardXp(amount, source) {
  const old = state.level;
  state.totalXp += amount;
  state.lifetimeStats.totalXpEarned += amount;
  recalcLevel();
  saveState();
  ui.showToast('+'+ amount +' XP'+ (source?' — '+source:''), 'success', '⚡');
  ui.updateXpBar();
  fx.floatXp(amount, 'success');
  if (state.level > old) triggerLevelUp(old, state.level);
}

function loseXp(amount, reason) {
  state.totalXp = Math.max(0, state.totalXp - amount);
  recalcLevel();
  saveState();
  ui.showToast('-'+ amount +' XP — '+(reason||''), 'danger', '💀');
  ui.updateXpBar();
  fx.floatXp(amount, 'danger');
}

/* ─── HP (now a real mechanic) ─── */
function damageHp(amt) {
  state.hp = Math.max(5, state.hp - amt);
  ui.updateHpBar();
  ui.updateHpState();
}
function healHp(amt) {
  state.hp = Math.min(state.maxHp, state.hp + amt);
  ui.updateHpBar();
  ui.updateHpState();
}

/* ─── LEVEL UP ─── */
function triggerLevelUp(oldLvl, newLvl) {
  const rank = getCurrentRank(newLvl);
  const rankWithReward = RANKS.find(r => r.level === newLvl && r.reward);
  if (rankWithReward && rankWithReward.reward) {
    state.inventory.push({ ...rankWithReward.reward, uid: Date.now(), used: false });
    saveState();
  }
  ui.applyTheme();
  ui.updateAvatar();
  fx.sound('levelup');
  fx.haptic('heavy');
  modals.openLevelUp(newLvl, rank);
}

/* ─── DAY RESET ─── */
function toDateStr(d) {
  d = d || new Date();
  return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
}
function getWeekKey(d) {
  d = d || new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + week;
}

function checkDayReset() {
  const now = new Date();
  const resetHour = parseInt(state.settings.dayResetTime) || 6;
  const today = toDateStr(now);
  if (state.todayDate === today) return;
  if (now.getHours() < resetHour) return;

  if (state.todayDate) {
    const yTasks  = state.tasks.filter(t => t.date === state.todayDate);
    const yDone   = yTasks.filter(t => t.completed);
    const yMissed = yTasks.filter(t => !t.completed && state.todayLocked);
    const yXp     = yDone.reduce((a,t)=>a+t.xp, 0);

    state.calendarData[state.todayDate] = { xp:yXp, completed:yDone.length, total:yTasks.length };

    yMissed.forEach(t => {
      const pens = getSmartPenalties(t.category, 2);
      state.pendingPenalties.push({ taskId:t.id, taskName:t.name, penalties:pens, announced:false });
      state.totalXp = Math.max(0, state.totalXp - Math.floor(t.xp*0.3));
      damageHp(10);
    });

    if (yDone.length > 0 && yMissed.length === 0) {
      state.streak++;
      if (state.streak > state.lifetimeStats.streakBest) state.lifetimeStats.streakBest = state.streak;
    } else if (yMissed.length > 0) {
      state.streak = 0;
    }
    if (yDone.length > 0) state.lifetimeStats.daysActive++;

    // Weekly review check (Sunday)
    if (now.getDay() === 0) {
      const wk = getWeekKey(now);
      if (state.weeklyReviewDone !== wk) {
        state.weeklyReviewDone = wk;
        setTimeout(() => modals.openWeeklyReview(), 1200);
      }
    }
  }

  state.todayDate   = today;
  state.todayLocked = false;
  state.usedDayOff  = false;

  const existingIds = new Set(state.tasks.filter(t=>t.date===today).map(t=>t.templateId));
  state.recurringTemplates.forEach(t => {
    if (!existingIds.has(t.id)) {
      state.tasks.push({
        ...t,
        id: 'task_'+Date.now()+'_'+Math.random().toString(36).slice(2),
        templateId: t.id, date: today, completed: false, progress: 0,
      });
    }
  });

  recalcLevel();
  saveState();
}

/* ─── SMART PENALTIES (match category) ─── */
function getSmartPenalties(failedCategory, count) {
  const matching   = PENALTIES.filter(p => p.category === failedCategory);
  const fallback   = PENALTIES.filter(p => p.category !== failedCategory);
  const pool       = [...matching, ...fallback];
  const shuffled   = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(p => ({ ...p, done: false }));
}

function normalizePenalties() {
  state.pendingPenalties.forEach(pen => {
    if (pen.announced === undefined) pen.announced = true;
  });
}

/* ─── XP CALC ─── */
function calcTaskXp(diff, category, desc) {
  let xp    = XP_BY_DIFF[diff] || 45;
  let bonus = CATEGORY_XP_BONUS[category] || 0;
  const len = (desc||'').trim().length;
  if (len > 40)  bonus += 8;
  if (len > 100) bonus += 8;
  if (state.settings.streakBonus && state.streak >= 7) bonus += Math.min(state.streak*2, 20);
  // HP penalty: below 50% hp, XP gains are normal but show warning
  return xp + bonus;
}

/* ─── INSIGHTS ENGINE ─── */
function generateInsights() {
  const insights = [];
  const today    = state.todayDate;
  const todayT   = state.tasks.filter(t=>t.date===today);
  const done     = todayT.filter(t=>t.completed);

  // All done today
  if (todayT.length > 0 && done.length === todayT.length) {
    insights.push({ type:'success', icon:'✅', text:'All quests completed today! You\'re operating at 100%.' });
  }

  // Streak insight
  if (state.streak >= 7) {
    insights.push({ type:'streak', icon:'🔥', text: state.streak+'-day streak! You are building an unbreakable habit.' });
  } else if (state.streak >= 3) {
    insights.push({ type:'streak', icon:'🔥', text: state.streak+'-day streak. Keep the momentum going!' });
  }

  // HP warning
  const hpPct = (state.hp / state.maxHp) * 100;
  if (hpPct < 30) {
    insights.push({ type:'danger', icon:'💔', text:'Critical HP! Complete penalties and avoid missing quests to recover.' });
  } else if (hpPct < 55) {
    insights.push({ type:'warning', icon:'❤️', text:'HP is below 50% — XP gains are at half efficiency. Complete tasks to heal.' });
  }

  // Category stats
  const cats = Object.keys(state.categoryStats).filter(c => state.categoryStats[c] > 0);
  if (cats.length >= 2) {
    const sorted = cats.sort((a,b) => state.categoryStats[b] - state.categoryStats[a]);
    insights.push({ type:'info', icon:'📊', text:'Your strongest skill is '+sorted[0]+'. Your weakest is '+sorted[sorted.length-1]+'. Consider balancing your quests.' });
  }

  // Pending penalties
  if (state.pendingPenalties.length > 0) {
    insights.push({ type:'penalty', icon:'⚠️', text: state.pendingPenalties.length+' active penalt'+(state.pendingPenalties.length>1?'ies':'y')+'. Check the Quests tab to complete them and recover XP.' });
  }

  return insights.slice(0, 3);
}
