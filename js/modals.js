/* =====================================================
   SOLO LEVEL UP — js/modals.js
   All modals: level-up, penalty, reward, weekly review
   ===================================================== */
'use strict';

const modals = {
  _open(id)  { document.getElementById(id)?.classList.add('open'); },
  _close(id) { document.getElementById(id)?.classList.remove('open'); },

  /* ─── LEVEL UP ─── */
  openLevelUp(newLevel, rank) {
    document.getElementById('luIcon').textContent  = rank.icon;
    document.getElementById('luRank').textContent  = rank.name;
    document.getElementById('luLevel').textContent = 'Level '+newLevel;
    const rr = RANKS.find(r=>r.level===newLevel&&r.reward);
    const box = document.getElementById('luRewardBox');
    if (rr&&rr.reward) {
      const r=rr.reward;
      box.innerHTML='<div class="reward-box-lbl">🎁 REWARD UNLOCKED</div><div style="font-size:28px;margin:6px 0;">'+r.icon+'</div><div style="font-size:15px;font-weight:700;color:var(--text);">'+r.name+'</div><div style="font-size:12px;color:var(--text3);margin-top:4px;">'+r.desc+'</div>';
    } else {
      box.innerHTML='<div class="reward-box-lbl">KEEP CLIMBING</div><div style="font-size:13px;color:var(--text2);margin-top:4px;">Next reward at a higher rank. You\'ve got this!</div>';
    }
    modals._open('levelUpOverlay');
  },
  closeLevelUp() { modals._close('levelUpOverlay'); },

  /* ─── PENALTY ANNOUNCE ─── */
  announcePenalty(penData) {
    const shield=state.inventory.find(i=>i.effect==='nopen'&&!i.used);
    document.getElementById('penTaskName').textContent=penData.taskName;
    const list=document.getElementById('penAnnounceList');
    list.innerHTML='';
    if (shield) {
      list.innerHTML='<div class="pen-shield-offer"><div style="font-size:40px;margin-bottom:8px;">🛡️</div><div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;">No Penalty Shield Available!</div><div style="font-size:12px;color:var(--text3);margin-bottom:14px;">Use it to cancel this penalty entirely.</div><div style="display:flex;gap:8px;"><button class="btn btn-ghost" style="flex:1;" onclick="modals._skipShield(\''+penData.taskId+'\')">Take Penalty</button><button class="btn btn-primary" style="flex:2;" onclick="modals.useShield(\''+penData.taskId+'\')">🛡️ USE SHIELD</button></div></div>';
    } else {
      penData.penalties.forEach(p=>{
        const div=document.createElement('div');
        div.className='pen-announce-item';
        div.innerHTML='<span class="pen-announce-icon">⚠️</span><span class="pen-announce-text">'+escapeHtml(p.text)+'</span><span class="pen-xp-badge">+'+p.xp+' XP</span>';
        list.appendChild(div);
      });
    }
    document.body.classList.add('danger-flash');
    setTimeout(()=>document.body.classList.remove('danger-flash'),1500);
    fx.sound('penalty');fx.haptic('error');
    modals._open('penaltyAnnounceOverlay');
  },

  dismissPenaltyAnnounce() {
    modals._close('penaltyAnnounceOverlay');
    if(currentView==='quests') views.renderPenaltyTracker();
    const next=state.pendingPenalties.find(p=>!p.announced);
    if(next){next.announced=true;saveState();setTimeout(()=>modals.announcePenalty(next),500);}
  },

  _skipShield(taskId) {
    modals._close('penaltyAnnounceOverlay');
    const pen=state.pendingPenalties.find(p=>p.taskId===taskId);
    if(pen) pen.announced=true;
    saveState();
    if(currentView==='quests') views.renderPenaltyTracker();
    const next=state.pendingPenalties.find(p=>!p.announced);
    if(next){next.announced=true;saveState();setTimeout(()=>modals.announcePenalty(next),400);}
  },

  useShield(taskId) {
    const shield=state.inventory.find(i=>i.effect==='nopen'&&!i.used);
    if(!shield) return;
    shield.used=true;
    state.pendingPenalties=state.pendingPenalties.filter(p=>p.taskId!==taskId);
    ui.showToast('Shield activated! Penalty cancelled.','success','🛡️');
    modals._close('penaltyAnnounceOverlay');
    saveState();views.renderInventory();views.renderPenaltyTracker();
    fx.sound('unlock');fx.haptic('heavy');
  },

  completePenaltyItem(taskId,idx,checked) {
    const pen=state.pendingPenalties.find(p=>p.taskId===taskId);
    if(!pen||!pen.penalties[idx]) return;
    const item=pen.penalties[idx];
    if(checked&&!item.done){
      item.done=true;awardXp(item.xp,'Penalty completed ✓');
      state.lifetimeStats.penaltiesCompleted++;fx.sound('complete');fx.haptic('success');
    } else if(!checked&&item.done){
      item.done=false;loseXp(item.xp,'Penalty unmarked');
    }
    saveState();views.renderPenaltyTracker();
  },

  dismissPenalty(taskId) {
    const pen=state.pendingPenalties.find(p=>p.taskId===taskId);
    if(!pen) return;
    const incomplete=pen.penalties.filter(p=>!p.done).length;
    if(incomplete>0){loseXp(incomplete*15,incomplete+' penalt'+(incomplete>1?'ies':'y')+' skipped');damageHp(incomplete*5);}
    state.pendingPenalties=state.pendingPenalties.filter(p=>p.taskId!==taskId);
    saveState();views.renderPenaltyTracker();
    ui.showToast(incomplete>0?'Penalty dismissed (XP deducted)':'All penalties cleared! ✓',incomplete>0?'warning':'success',incomplete>0?'⚠️':'✅');
  },

  /* ─── REWARD ─── */
  _pendingReward: null,
  openReward(item) {
    if(!item||item.used) return;
    modals._pendingReward=item;
    document.getElementById('rewIcon').textContent=item.icon;
    document.getElementById('rewName').textContent=item.name;
    document.getElementById('rewDesc').textContent=item.desc;
    modals._open('rewardOverlay');
  },
  confirmReward() { if(modals._pendingReward) rewards.apply(modals._pendingReward); },
  closeReward() { modals._pendingReward=null; modals._close('rewardOverlay'); },

  /* ═══════════════════════════════════
     WEEKLY REVIEW  (#6 suggestion)
     ═══════════════════════════════════ */
  openWeeklyReview() {
    const body=document.getElementById('weeklyReviewBody');
    if(!body) return;

    // Collect last 7 days of data
    const now=new Date();
    let totalXp=0, totalDone=0, totalTasks=0, bestDay='', bestDayXp=0;
    const catXp={};

    for(let i=1;i<=7;i++){
      const d=new Date(now);d.setDate(d.getDate()-i);
      const ds=toDateStr(d);
      const data=state.calendarData[ds];
      if(data){
        totalXp+=data.xp||0;totalDone+=data.completed||0;totalTasks+=data.total||0;
        if((data.xp||0)>bestDayXp){bestDayXp=data.xp;bestDay=d.toLocaleString('default',{weekday:'long'});}
      }
    }
    // Today's partial data
    const todayT=state.tasks.filter(t=>t.date===state.todayDate);
    const todayDone=todayT.filter(t=>t.completed);
    totalXp+=todayDone.reduce((a,t)=>a+t.xp,0);
    totalDone+=todayDone.length;totalTasks+=todayT.length;

    const completionRate=totalTasks>0?Math.round((totalDone/totalTasks)*100):0;
    const cats=Object.entries(state.categoryStats).sort((a,b)=>b[1]-a[1]);
    const bestCat=cats[0]?cats[0][0]:'—';
    const worstCat=cats[cats.length-1]?cats[cats.length-1][0]:'—';

    body.innerHTML=
      '<div class="wr-stats">' +
        '<div class="wr-stat"><div class="wr-val" style="color:var(--gold)">'+totalXp+'</div><div class="wr-lbl">XP EARNED</div></div>' +
        '<div class="wr-stat"><div class="wr-val" style="color:var(--green)">'+totalDone+'</div><div class="wr-lbl">TASKS DONE</div></div>' +
        '<div class="wr-stat"><div class="wr-val" style="color:var(--accent2)">'+completionRate+'%</div><div class="wr-lbl">COMPLETION</div></div>' +
        '<div class="wr-stat"><div class="wr-val" style="color:var(--accent3)">'+state.streak+'</div><div class="wr-lbl">STREAK</div></div>' +
      '</div>' +
      '<div class="wr-insights">' +
        '<div class="wr-insight"><span>🏆</span> Best day: <strong>'+(bestDay||'Today')+'</strong> with '+bestDayXp+' XP</div>' +
        '<div class="wr-insight"><span>💪</span> Strongest category: <strong>'+bestCat+'</strong></div>' +
        (worstCat!==bestCat?'<div class="wr-insight"><span>📈</span> Needs work: <strong>'+worstCat+'</strong> — try adding more quests there</div>':'') +
        (completionRate>=80?'<div class="wr-insight insight-success"><span>⭐</span> Outstanding week! You completed '+completionRate+'% of all quests.</div>':
         completionRate>=50?'<div class="wr-insight insight-info"><span>👊</span> Solid effort. Push for 80%+ next week.</div>':
         '<div class="wr-insight insight-warning"><span>⚠️</span> Tough week. Start with easier quests to build momentum.</div>') +
      '</div>' +
      '<div class="wr-next">' +
        '<div class="label-xs" style="margin-bottom:8px;">NEXT WEEK CHALLENGE</div>' +
        '<div class="wr-challenge">'+
          (completionRate>=80?'🔥 Increase difficulty on your top quests':'💪 Aim for at least 70% completion on all quests')+
        '</div>'+
      '</div>';

    modals._open('weeklyReviewOverlay');
    fx.sound('levelup');fx.haptic('heavy');
  },
  closeWeeklyReview() { modals._close('weeklyReviewOverlay'); },
};
