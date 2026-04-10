/* =====================================================
   SOLO LEVEL UP — js/app.js
   Main init, routing, nav, settings wiring
   ===================================================== */

'use strict';

/* ─── NAVIGATION ─── */
let currentView = 'dashboard';

function showView(name) {
  currentView = name;
  document.querySelectorAll('.view').forEach(function(v){ v.classList.remove('active'); });
  const el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.view === name);
  });
  document.querySelectorAll('.sidebar-nav-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.view === name);
  });

  switch (name) {
    case 'dashboard':
      ui.updateSummary();
      ui.renderStats();
      ui.renderRadar();
      views.renderDashTasks();
      break;
    case 'quests':
      views.renderTodayTasks();
      views.renderRecurring();
      views.renderPenaltyTracker();
      break;
    case 'calendar':
      views.renderCalendar();
      break;
    case 'profile':
      views.renderRankRoad();
      views.renderInventory();
      views.renderSettings();
      ui.renderLifetimeStats();
      break;
  }
}

/* ─── SETTINGS ─── */
function setPlayerName(val) {
  if (!val.trim()) return;
  state.playerName = val.trim().toUpperCase();
  saveState();
  ui.updateHeader();
}

function setSetting(key, value) {
  state.settings[key] = value;
  saveState();
}

/* ─── CARD COLLAPSE ─── */
function toggleCard(headerEl) {
  const content = headerEl.nextElementSibling;
  const chevron = headerEl.querySelector('.card-chevron');
  const isClosed = content.classList.contains('closed');
  content.classList.toggle('closed', !isClosed);
  if (chevron) chevron.classList.toggle('open', isClosed);
}

/* ─── OVERLAY CLOSE ON BACKDROP ─── */
function initOverlayClose() {
  ['levelUpOverlay','penaltyAnnounceOverlay','rewardOverlay'].forEach(function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function(e) {
      if (e.target !== el) return;
      if (id === 'penaltyAnnounceOverlay') {
        // Don't close on backdrop — user must acknowledge
      } else if (id === 'rewardOverlay') {
        modals.closeReward();
      }
      // Level-up must use button
    });
  });
}

/* ─── KEYBOARD ─── */
function initKeyboard() {
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (document.getElementById('rewardOverlay')?.classList.contains('open')) {
        modals.closeReward();
      }
    }
  });
}

/* ─── TIME TICK ─── */
function initTimeTick() {
  ui.updateMeta();
  setInterval(function(){ ui.updateMeta(); }, 60000);
}

/* ─── MAIN INIT ─── */
function init() {
  checkDayReset();
  normalizePenalties();     // ensure legacy data has flags

  ui.applyTheme();
  ui.initParticles();
  ui.updateHeader();
  ui.updateXpBar();
  ui.updateHpBar();
  ui.updateMeta();

  showView('dashboard');

  initOverlayClose();
  initKeyboard();
  initTimeTick();

  // Show pending penalty announcements (only unannounced ones)
  const unannounced = state.pendingPenalties.filter(function(p){ return !p.announced; });
  if (unannounced.length > 0) {
    unannounced[0].announced = true;
    saveState();
    setTimeout(function(){ modals.announcePenalty(unannounced[0]); }, 900);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
