/* =====================================================
   SOLO LEVEL UP — js/fx.js
   Effects: floating XP, sounds (Web Audio API),
   haptics, swipe gesture handler
   ===================================================== */
'use strict';

/* ══════════════════════════════════════════════════════
   FLOATING XP ANIMATION  (#1 suggestion)
   Shows "+45 XP" flying up from completed tasks
   ══════════════════════════════════════════════════════ */
const fx = {

  floatXp(amount, type) {
    // Find the last interacted task or use header bar as anchor
    const anchor = document.querySelector('.task-check.checked') ||
                   document.getElementById('xpFill') ||
                   document.getElementById('headerBar');
    if (!anchor) return;

    const rect   = anchor.getBoundingClientRect();
    const label  = document.createElement('div');
    label.className  = 'xp-float ' + (type === 'danger' ? 'xp-float-neg' : 'xp-float-pos');
    label.textContent = (type === 'danger' ? '-' : '+') + amount + ' XP';
    label.style.cssText = [
      'left:' + (rect.left + rect.width/2) + 'px',
      'top:' + (rect.top + window.scrollY - 10) + 'px',
    ].join(';');
    document.body.appendChild(label);
    // Remove after animation
    setTimeout(() => label.remove(), 1100);
  },

  /* ══════════════════════════════════════════════════════
     SOUND ENGINE  (#12 suggestion)
     Uses Web Audio API — no files needed
     ══════════════════════════════════════════════════════ */
  _ctx: null,

  _getCtx() {
    if (!this._ctx) {
      try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { return null; }
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  },

  _beep(freq, type, vol, duration, delay) {
    if (!state.settings.sounds) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    delay = delay || 0;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  },

  sound(name) {
    if (!state.settings.sounds) return;
    switch(name) {
      case 'complete':
        // Satisfying chime chord
        this._beep(523, 'sine', 0.18, 0.15, 0);
        this._beep(659, 'sine', 0.15, 0.15, 0.08);
        this._beep(784, 'sine', 0.12, 0.25, 0.16);
        break;
      case 'levelup':
        // Rising triumphant fanfare
        this._beep(330, 'triangle', 0.2, 0.12, 0);
        this._beep(415, 'triangle', 0.2, 0.12, 0.1);
        this._beep(523, 'triangle', 0.2, 0.12, 0.2);
        this._beep(659, 'triangle', 0.25, 0.3,  0.3);
        this._beep(784, 'sine',     0.3, 0.5,  0.45);
        break;
      case 'penalty':
        // Low ominous warning
        this._beep(200, 'sawtooth', 0.2, 0.12, 0);
        this._beep(160, 'sawtooth', 0.2, 0.12, 0.15);
        this._beep(120, 'sawtooth', 0.25, 0.3, 0.3);
        break;
      case 'unlock':
        // Short positive ding
        this._beep(880, 'sine', 0.15, 0.1, 0);
        this._beep(1046,'sine', 0.12, 0.2, 0.1);
        break;
      case 'error':
        // Short buzz
        this._beep(160, 'square', 0.15, 0.1, 0);
        this._beep(140, 'square', 0.15, 0.1, 0.12);
        break;
      case 'swipe':
        this._beep(600, 'sine', 0.07, 0.06, 0);
        break;
      case 'submit':
        this._beep(440, 'sine', 0.15, 0.1, 0);
        this._beep(554, 'sine', 0.12, 0.2, 0.12);
        break;
    }
  },

  /* ══════════════════════════════════════════════════════
     HAPTIC FEEDBACK  (#11 suggestion)
     ══════════════════════════════════════════════════════ */
  haptic(type) {
    if (!state.settings.haptics) return;
    if (!navigator.vibrate) return;
    switch(type) {
      case 'light':  navigator.vibrate(18);           break;
      case 'medium': navigator.vibrate(35);           break;
      case 'heavy':  navigator.vibrate([40, 30, 60]); break;
      case 'error':  navigator.vibrate([20, 15, 20, 15, 20]); break;
      case 'success':navigator.vibrate([15, 10, 30]); break;
    }
  },

  /* ══════════════════════════════════════════════════════
     SWIPE GESTURES  (#10 suggestion)
     Swipe right on task = complete
     Swipe left on task = options menu
     ══════════════════════════════════════════════════════ */
  _swipeStart: null,
  _swipeEl:    null,
  _swipeThreshold: 60,

  initSwipe() {
    document.addEventListener('touchstart', (e) => {
      const taskEl = e.target.closest('.task-item[data-task-id]');
      if (!taskEl) return;
      this._swipeStart = e.touches[0].clientX;
      this._swipeEl    = taskEl;
      taskEl.style.transition = 'none';
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!this._swipeStart || !this._swipeEl) return;
      const dx = e.touches[0].clientX - this._swipeStart;
      if (Math.abs(dx) < 8) return;
      // Clamp movement
      const clamped = Math.max(-110, Math.min(110, dx));
      this._swipeEl.style.transform = 'translateX(' + clamped + 'px)';

      // Show hint background
      const hint = this._swipeEl.querySelector('.swipe-hint-right');
      const hintL= this._swipeEl.querySelector('.swipe-hint-left');
      if (hint)  hint.style.opacity  = dx > 20 ? Math.min(1, (dx-20)/50) : '0';
      if (hintL) hintL.style.opacity = dx < -20? Math.min(1, (-dx-20)/50): '0';
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!this._swipeStart || !this._swipeEl) return;
      const dx    = e.changedTouches[0].clientX - this._swipeStart;
      const taskId= this._swipeEl.dataset.taskId;
      this._swipeEl.style.transition = '';
      this._swipeEl.style.transform  = '';
      const hint  = this._swipeEl.querySelector('.swipe-hint-right');
      const hintL = this._swipeEl.querySelector('.swipe-hint-left');
      if (hint)  hint.style.opacity  = '0';
      if (hintL) hintL.style.opacity = '0';

      if (dx > this._swipeThreshold && taskId) {
        // Swipe right → complete
        fx.sound('swipe');
        fx.haptic('success');
        tasks.toggle(taskId);
      } else if (dx < -this._swipeThreshold && taskId) {
        // Swipe left → show options (delete/edit hint)
        fx.sound('swipe');
        fx.haptic('light');
        fx.showTaskOptions(taskId, this._swipeEl);
      }

      this._swipeStart = null;
      this._swipeEl    = null;
    }, { passive: true });
  },

  showTaskOptions(taskId, el) {
    // Brief visual flash then reset
    el.style.background = 'rgba(240,48,84,0.12)';
    setTimeout(() => { el.style.background = ''; }, 500);
    // Could open a small action sheet — for now just toast the hint
    ui.showToast('Swipe right to complete · Hold to delete', 'info', '💡');
  },
};
