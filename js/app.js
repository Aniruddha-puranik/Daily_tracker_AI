/* =====================================================
   SOLO LEVEL UP — js/app.js
   Main init, routing, PWA setup
   ===================================================== */
'use strict';

let currentView = 'dashboard';

/* ─── PWA MANIFEST (#4 suggestion) ─── */
function initPWA() {
  // Inject manifest dynamically
  const manifest = {
    name: 'Solo Level Up',
    short_name: 'SLU',
    description: 'Gamified habit tracker — level up your life',
    start_url: './',
    display: 'standalone',
    background_color: '#07080f',
    theme_color: '#1d6fdd',
    orientation: 'portrait-primary',
    icons: [
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2307080f"/><text y=".9em" font-size="80" x="10">⚔️</text></svg>', sizes: '192x192', type: 'image/svg+xml' },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('link');
  link.rel   = 'manifest';
  link.href  = url;
  document.head.appendChild(link);

  // Install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn) {
      btn.style.display = 'flex';
      btn.onclick = async () => {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          ui.showToast('App installed! Find it on your home screen.','success','📱');
        }
        deferredPrompt = null;
        btn.style.display = 'none';
      };
    }
  });

  // Service worker for offline support
  if ('serviceWorker' in navigator) {
    const swCode = `
      const CACHE = 'slu-v1';
      const ASSETS = ['./', './index.html', './css/main.css', './css/components.css',
        './js/data.js','./js/state.js','./js/avatars.js','./js/ui.js',
        './js/views.js','./js/modals.js','./js/fx.js','./js/app.js'];
      self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
      self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
    `;
    const swBlob = new Blob([swCode], {type:'application/javascript'});
    const swUrl  = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl).catch(() => {});
  }
}

/* ─── NAVIGATION ─── */
function showView(name) {
  currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-'+name);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-btn, .sidebar-nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view===name));

  switch(name) {
    case 'dashboard':
      ui.updateSummary();ui.renderStats();ui.renderRadar();
      views.renderDashTasks();ui.renderInsights();
      break;
    case 'quests':
      views.renderTodayTasks();views.renderRecurring();
      views.renderPenaltyTracker();views.renderTemplatePacks();
      break;
    case 'calendar':
      views.renderCalendar();
      break;
    case 'profile':
      views.renderRankRoad();views.renderInventory();
      views.renderSettings();ui.renderLifetimeStats();
      break;
  }
}

/* ─── SETTINGS ─── */
function setPlayerName(val) {
  if(!val.trim()) return;
  state.playerName=val.trim().toUpperCase();
  saveState();ui.updateHeader();
}
function setSetting(key,value) { state.settings[key]=value; saveState(); }

/* ─── CARD TOGGLE ─── */
function toggleCard(headerEl) {
  const content=headerEl.nextElementSibling;
  const chevron=headerEl.querySelector('.card-chevron');
  const closed=content.classList.contains('closed');
  content.classList.toggle('closed',!closed);
  if(chevron) chevron.classList.toggle('open',closed);
}

/* ─── SWATCHES ─── */
function buildSwatches(id) {
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=COLOR_PALETTES.map(p=>
    '<div class="swatch'+(state.settings.colorTheme===p.id?' active':'')+'"'+
    ' data-color="'+p.id+'" title="'+p.label+'" style="background:'+p.hex+';"'+
    ' onclick="ui.setColorTheme(\''+p.id+'\')" role="radio" aria-label="'+p.label+'" tabindex="0"'+
    ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')ui.setColorTheme(\''+p.id+'\')"></div>'
  ).join('');
}

/* ─── OVERLAYS CLOSE ON BACKDROP ─── */
function initOverlayClose() {
  ['levelUpOverlay','rewardOverlay','weeklyReviewOverlay','packPreviewOverlay'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('click',e=>{
      if(e.target!==el) return;
      if(id==='rewardOverlay') modals.closeReward();
      else if(id==='weeklyReviewOverlay') modals.closeWeeklyReview();
      else if(id==='packPreviewOverlay') views.closePackPreview();
    });
  });
}

/* ─── KEYBOARD ─── */
function initKeyboard() {
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(document.getElementById('rewardOverlay')?.classList.contains('open')) modals.closeReward();
      if(document.getElementById('weeklyReviewOverlay')?.classList.contains('open')) modals.closeWeeklyReview();
      if(document.getElementById('packPreviewOverlay')?.classList.contains('open')) views.closePackPreview();
    }
  });
}

/* ─── MAIN INIT ─── */
function init() {
  checkDayReset();
  normalizePenalties();

  ui.applyTheme();
  ui.initParticles();
  ui.updateHeader();
  ui.updateXpBar();
  ui.updateHpBar();
  ui.updateHpState();
  ui.updateMeta();

  buildSwatches('profileSwatches');
  buildSwatches('sidebarSwatches');

  showView('dashboard');
  fx.initSwipe();
  initOverlayClose();
  initKeyboard();
  initPWA();
  setInterval(()=>ui.updateMeta(), 60000);

  // Pending penalty announcements
  const unannounced=state.pendingPenalties.filter(p=>!p.announced);
  if(unannounced.length>0){
    unannounced[0].announced=true;saveState();
    setTimeout(()=>modals.announcePenalty(unannounced[0]),900);
  }

  // Onboarding: show if first time
  if(!state.onboardingDone){
    setTimeout(()=>views.openOnboarding(),400);
  }

  // Sync penalty indicators periodically
  setInterval(()=>ui._updatePenaltyIndicators(), 3000);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
