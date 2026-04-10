/* =====================================================
   SOLO LEVEL UP — js/modals.js
   Modal controllers: level-up, penalty, reward
   ===================================================== */

'use strict';

const modals = {

  /* ─── GENERIC OPEN / CLOSE ─── */
  _open(id)  { document.getElementById(id)?.classList.add('open');    },
  _close(id) { document.getElementById(id)?.classList.remove('open'); },

  /* ══════════════════════════════════
     LEVEL UP
  ══════════════════════════════════ */
  openLevelUp(newLevel, rank) {
    document.getElementById('luIcon').textContent  = rank.icon;
    document.getElementById('luRank').textContent  = rank.name;
    document.getElementById('luLevel').textContent = 'Level ' + newLevel;

    const rewardRank = RANKS.find(r => r.level === newLevel && r.reward);
    const rewardBox  = document.getElementById('luRewardBox');
    if (rewardRank && rewardRank.reward) {
      const r = rewardRank.reward;
      rewardBox.innerHTML =
        '<div class="reward-box-lbl">🎁 REWARD UNLOCKED</div>' +
        '<div style="font-size:28px;margin:6px 0;">' + r.icon + '</div>' +
        '<div style="font-size:15px;font-weight:700;color:var(--text);">' + r.name + '</div>' +
        '<div style="font-size:12px;color:var(--text3);margin-top:4px;">' + r.desc + '</div>';
    } else {
      rewardBox.innerHTML =
        '<div class="reward-box-lbl">KEEP CLIMBING</div>' +
        '<div style="font-size:13px;color:var(--text2);margin-top:4px;">Next reward unlocks at a higher rank. You\'ve got this!</div>';
    }
    modals._open('levelUpOverlay');
  },

  closeLevelUp() { modals._close('levelUpOverlay'); },

  /* ══════════════════════════════════
     PENALTY ANNOUNCEMENT
     Shown once when penalty is first assigned.
     After dismiss, penalty lives in the persistent
     "Active Penalties" tracker on the Quests tab.
  ══════════════════════════════════ */
  announcePenalty(penData) {
    const shield = state.inventory.find(function(i){ return i.effect === 'nopen' && !i.used; });

    document.getElementById('penTaskName').textContent = penData.taskName;
    const list = document.getElementById('penAnnounceList');
    list.innerHTML = '';

    if (shield) {
      list.innerHTML =
        '<div class="pen-shield-offer">' +
          '<div style="font-size:40px;margin-bottom:8px;">🛡️</div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;">No Penalty Shield Available!</div>' +
          '<div style="font-size:12px;color:var(--text3);margin-bottom:14px;">Use it to cancel this penalty entirely.</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn-ghost" style="flex:1;" onclick="modals._skipShield(\'' + penData.taskId + '\')">Take Penalty</button>' +
            '<button class="btn btn-primary" style="flex:2;" onclick="modals.useShield(\'' + penData.taskId + '\')">🛡️ USE SHIELD</button>' +
          '</div>' +
        '</div>';
    } else {
      penData.penalties.forEach(function(p) {
        const div = document.createElement('div');
        div.className = 'pen-announce-item';
        div.innerHTML =
          '<span class="pen-announce-icon">⚠️</span>' +
          '<span class="pen-announce-text">' + escapeHtml(p.text) + '</span>' +
          '<span class="pen-xp-badge">+' + p.xp + ' XP</span>';
        list.appendChild(div);
      });
    }

    document.body.classList.add('danger-flash');
    setTimeout(function(){ document.body.classList.remove('danger-flash'); }, 1500);

    modals._open('penaltyAnnounceOverlay');
  },

  /* Dismiss announcement — penalty stays in pendingPenalties for tracking */
  dismissPenaltyAnnounce() {
    modals._close('penaltyAnnounceOverlay');
    if (currentView === 'quests') views.renderPenaltyTracker();
    const next = state.pendingPenalties.find(function(p){ return !p.announced; });
    if (next) {
      next.announced = true;
      saveState();
      setTimeout(function(){ modals.announcePenalty(next); }, 500);
    }
  },

  _skipShield(taskId) {
    modals._close('penaltyAnnounceOverlay');
    const pen = state.pendingPenalties.find(function(p){ return p.taskId === taskId; });
    if (pen) pen.announced = true;
    saveState();
    if (currentView === 'quests') views.renderPenaltyTracker();
    const next = state.pendingPenalties.find(function(p){ return !p.announced; });
    if (next) {
      next.announced = true;
      saveState();
      setTimeout(function(){ modals.announcePenalty(next); }, 400);
    }
  },

  useShield(taskId) {
    const shield = state.inventory.find(function(i){ return i.effect === 'nopen' && !i.used; });
    if (!shield) return;
    shield.used = true;
    state.pendingPenalties = state.pendingPenalties.filter(function(p){ return p.taskId !== taskId; });
    ui.showToast('Shield activated! Penalty cancelled.', 'success', '🛡️');
    modals._close('penaltyAnnounceOverlay');
    saveState();
    views.renderInventory();
    views.renderPenaltyTracker();
  },

  /* Complete a single penalty item from the tracker */
  completePenaltyItem(taskId, penaltyIdx, checked) {
    const pen = state.pendingPenalties.find(function(p){ return p.taskId === taskId; });
    if (!pen || !pen.penalties[penaltyIdx]) return;
    const item = pen.penalties[penaltyIdx];

    if (checked && !item.done) {
      item.done = true;
      awardXp(item.xp, 'Penalty completed ✓');
      state.lifetimeStats.penaltiesCompleted++;
    } else if (!checked && item.done) {
      item.done = false;
      loseXp(item.xp, 'Penalty unmarked');
    }
    saveState();
    views.renderPenaltyTracker();
  },

  /* Dismiss a penalty group (after completion or force) */
  dismissPenalty(taskId) {
    const pen = state.pendingPenalties.find(function(p){ return p.taskId === taskId; });
    if (!pen) return;
    const incomplete = pen.penalties.filter(function(p){ return !p.done; }).length;
    if (incomplete > 0) {
      loseXp(incomplete * 15, incomplete + ' penalt' + (incomplete > 1 ? 'ies' : 'y') + ' skipped');
      damageHp(incomplete * 5);
    }
    state.pendingPenalties = state.pendingPenalties.filter(function(p){ return p.taskId !== taskId; });
    saveState();
    views.renderPenaltyTracker();
    ui.showToast(
      incomplete > 0 ? 'Penalty dismissed (XP deducted)' : 'All penalties cleared! ✓',
      incomplete > 0 ? 'warning' : 'success',
      incomplete > 0 ? '⚠️' : '✅'
    );
  },

  /* ══════════════════════════════════
     REWARD USE
  ══════════════════════════════════ */
  _pendingReward: null,

  openReward(item) {
    if (!item || item.used) return;
    modals._pendingReward = item;
    document.getElementById('rewIcon').textContent = item.icon;
    document.getElementById('rewName').textContent = item.name;
    document.getElementById('rewDesc').textContent = item.desc;
    modals._open('rewardOverlay');
  },

  confirmReward() {
    if (modals._pendingReward) rewards.apply(modals._pendingReward);
  },

  closeReward() {
    modals._pendingReward = null;
    modals._close('rewardOverlay');
  },
};
