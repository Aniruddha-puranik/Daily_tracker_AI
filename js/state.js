/* =====================================================
   SOLO LEVEL UP — js/state.js
   State management: load/save, XP, leveling, HP
   ===================================================== */

'use strict';

const STORAGE_KEY = 'sluState_v2';

/* ─── PERSISTENCE ─── */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

/* Deep-merge saved state with defaults so new fields appear without reset */
function mergeState(saved) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_STATE));
  for (const key of Object.keys(merged)) {
    if (saved[key] !== undefined) {
      if (typeof merged[key] === 'object' && !Array.isArray(merged[key]) && merged[key] !== null) {
        Object.assign(merged[key], saved[key]);
      } else {
        merged[key] = saved[key];
      }
    }
  }
  // Preserve arrays as-is
  if (Array.isArray(saved.tasks))               merged.tasks               = saved.tasks;
  if (Array.isArray(saved.recurringTemplates))  merged.recurringTemplates  = saved.recurringTemplates;
  if (Array.isArray(saved.inventory))           merged.inventory           = saved.inventory;
  if (Array.isArray(saved.pendingPenalties))    merged.pendingPenalties    = saved.pendingPenalties;
  if (saved.calendarData)                       merged.calendarData        = saved.calendarData;
  return merged;
}

const savedRaw = loadState();
let state = savedRaw ? mergeState(savedRaw) : JSON.parse(JSON.stringify(DEFAULT_STATE));

/* ─── RANK HELPERS ─── */
function getCurrentRank(level = state.level) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.level) rank = r;
  }
  return rank;
}

function getTier(level = state.level) {
  return getCurrentRank(level).tier;
}

/* ─── XP HELPERS ─── */
function calcLevel(totalXp) {
  let lvl = 0;
  while (getXpForLevel(lvl + 1) <= totalXp) lvl++;
  return lvl;
}

function recalcLevel() {
  state.level = calcLevel(state.totalXp);
}

function xpProgress() {
  const lvlStart = getXpForLevel(state.level);
  const lvlEnd   = getXpForLevel(state.level + 1);
  const current  = state.totalXp - lvlStart;
  const needed   = lvlEnd - lvlStart;
  return { current, needed, pct: Math.min(100, (current / needed) * 100) };
}

/* ─── AWARD / LOSE XP ─── */
function awardXp(amount, source = '') {
  const oldLevel = state.level;
  state.totalXp += amount;
  state.lifetimeStats.totalXpEarned += amount;
  recalcLevel();
  saveState();
  ui.showToast(`+${amount} XP${source ? ' — ' + source : ''}`, 'success', '⚡');
  ui.updateXpBar();
  if (state.level > oldLevel) {
    triggerLevelUp(oldLevel, state.level);
  }
}

function loseXp(amount, reason = '') {
  const oldLevel = state.level;
  state.totalXp  = Math.max(0, state.totalXp - amount);
  recalcLevel();
  saveState();
  ui.showToast(`-${amount} XP — ${reason}`, 'danger', '💀');
  ui.updateXpBar();
  ui.updateHpBar();
}

/* ─── HP ─── */
function damageHp(amount) {
  state.hp = Math.max(5, state.hp - amount);
  ui.updateHpBar();
}

function healHp(amount) {
  state.hp = Math.min(state.maxHp, state.hp + amount);
  ui.updateHpBar();
}

/* ─── LEVEL UP ─── */
function triggerLevelUp(oldLevel, newLevel) {
  const rank = getCurrentRank(newLevel);

  // Find reward for this exact level
  const rankWithReward = RANKS.find(r => r.level === newLevel && r.reward);
  if (rankWithReward && rankWithReward.reward) {
    const reward = { ...rankWithReward.reward, uid: Date.now(), used: false };
    state.inventory.push(reward);
    saveState();
  }

  ui.applyTheme();
  ui.updateAvatar();
  modals.openLevelUp(newLevel, rank);
}

/* ─── DAY RESET ─── */
function checkDayReset() {
  const now        = new Date();
  const resetHour  = parseInt(state.settings.dayResetTime) || 6;
  const today      = toDateStr(now);

  if (state.todayDate === today) return; // Same day, nothing to do
  if (now.getHours() < resetHour) return; // Haven't hit reset time yet

  // ── Archive yesterday ──
  if (state.todayDate) {
    const yTasks  = state.tasks.filter(t => t.date === state.todayDate);
    const yDone   = yTasks.filter(t => t.completed);
    const yXp     = yDone.reduce((a, t) => a + t.xp, 0);
    const yMissed = yTasks.filter(t => !t.completed && state.todayLocked);

    // Save calendar entry
    state.calendarData[state.todayDate] = {
      xp: yXp,
      completed: yDone.length,
      total: yTasks.length,
    };

    // Penalties for missed tasks
    yMissed.forEach(t => {
      const pens = getRandomPenalties(2);
      state.pendingPenalties.push({ taskId: t.id, taskName: t.name, penalties: pens, announced: false });
      state.totalXp = Math.max(0, state.totalXp - Math.floor(t.xp * 0.3));
      damageHp(10);
    });

    // Streak logic
    if (yDone.length > 0 && yMissed.length === 0) {
      state.streak++;
      if (state.streak > state.lifetimeStats.streakBest) {
        state.lifetimeStats.streakBest = state.streak;
      }
    } else if (yMissed.length > 0) {
      state.streak = 0;
    }

    if (yDone.length > 0) state.lifetimeStats.daysActive++;
  }

  // ── Start new day ──
  state.todayDate   = today;
  state.todayLocked = false;
  state.usedDayOff  = false;

  // Add recurring tasks
  const existingIds = new Set(state.tasks.filter(t => t.date === today).map(t => t.templateId));
  state.recurringTemplates.forEach(t => {
    if (!existingIds.has(t.id)) {
      state.tasks.push({
        ...t,
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        templateId: t.id,
        date: today,
        completed: false,
        progress: 0,
      });
    }
  });

  recalcLevel();
  saveState();
}

function toDateStr(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getRandomPenalties(count) {
  const shuffled = [...PENALTIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(p => ({ ...p, done: false }));
}

function normalizePenalties() {
  state.pendingPenalties.forEach(function(pen) {
    if (pen.announced === undefined) pen.announced = true;
  });
}
}

/* ─── TASK XP CALC ─── */
function calcTaskXp(diff, category, desc) {
  let xp    = XP_BY_DIFF[diff] || 45;
  let bonus = CATEGORY_XP_BONUS[category] || 0;
  const len = (desc || '').trim().length;
  if (len > 40)  bonus += 8;
  if (len > 100) bonus += 8;
  if (state.settings.streakBonus && state.streak >= 7) bonus += Math.min(state.streak * 2, 20);
  return xp + bonus;
}
