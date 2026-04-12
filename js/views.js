/* =====================================================
   SOLO LEVEL UP — js/views.js
   All view rendering + onboarding + weekly review
   ===================================================== */
'use strict';

const views = {

  /* ─── TAB SWITCHING ─── */
  switchQuestTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
    document.querySelectorAll('.quest-tab-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
  },

  getDynamicCategories() {
    const used = new Set();
    state.tasks.forEach(t => { if(t.category) used.add(t.category); });
    state.recurringTemplates.forEach(t => { if(t.category) used.add(t.category); });
    return used.size > 0 ? Array.from(used) : ALL_CATEGORIES;
  },

  /* ═══════════════════════════════════
     ONBOARDING WIZARD  (#2 suggestion)
     ═══════════════════════════════════ */
  openOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.classList.add('open');
    views._onboardStep = 0;
    views.renderOnboardStep();
  },

  _onboardStep: 0,
  _onboardName: '',
  _onboardPacks: [],

  renderOnboardStep() {
    const body = document.getElementById('onboardBody');
    const prog = document.getElementById('onboardProg');
    const step = views._onboardStep;
    const steps = 3;
    if (prog) {
      prog.innerHTML = [0,1,2].map(i =>
        '<div class="ob-dot '+(i<=step?'active':'')+'"></div>'
      ).join('');
    }
    if (!body) return;

    if (step === 0) {
      body.innerHTML =
        '<div class="ob-icon">⚔️</div>' +
        '<div class="ob-title">Welcome, Hunter</div>' +
        '<div class="ob-subtitle">The System has chosen you. Set your identity before your journey begins.</div>' +
        '<div class="form-group" style="margin-top:20px;">' +
          '<label class="form-label">Your Hunter Name</label>' +
          '<input class="form-input" id="obNameInput" type="text" placeholder="e.g. SUNG JINWOO" maxlength="20" style="font-size:16px;text-align:center;letter-spacing:0.1em;">' +
        '</div>' +
        '<button class="btn btn-primary" style="margin-top:8px;" onclick="views.onboardNext()">ENTER THE SYSTEM →</button>';
      setTimeout(() => { const i=document.getElementById('obNameInput'); if(i) i.focus(); }, 100);
    }

    else if (step === 1) {
      body.innerHTML =
        '<div class="ob-icon">🎯</div>' +
        '<div class="ob-title">Choose Your Focus</div>' +
        '<div class="ob-subtitle">Select a quest pack to load your first missions. You can add more later.</div>' +
        '<div class="ob-packs">' +
          QUEST_PACKS.map(pack =>
            '<div class="ob-pack '+(views._onboardPacks.includes(pack.id)?'selected':'')+'" onclick="views.onboardTogglePack(\''+pack.id+'\')">' +
              '<div class="ob-pack-icon">'+pack.icon+'</div>' +
              '<div class="ob-pack-name">'+pack.name+'</div>' +
              '<div class="ob-pack-desc">'+pack.description+'</div>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<button class="btn btn-primary" style="margin-top:16px;" onclick="views.onboardNext()">'+
          (views._onboardPacks.length?'LOAD PACKS →':'SKIP →')+
        '</button>';
    }

    else if (step === 2) {
      const name = views._onboardName || 'HUNTER';
      body.innerHTML =
        '<div class="ob-icon" style="animation:lvlBounce 0.7s ease infinite alternate;">🌟</div>' +
        '<div class="ob-title">Rise, '+ name +'</div>' +
        '<div class="ob-subtitle">Your journey as a hunter begins now. Complete daily quests, earn XP, and rise through the ranks.</div>' +
        '<div class="ob-tips">' +
          '<div class="ob-tip"><span>⚔️</span> Add quests and lock them in daily</div>' +
          '<div class="ob-tip"><span>⚡</span> Complete tasks to earn XP and level up</div>' +
          '<div class="ob-tip"><span>🔥</span> Build streaks for bonus XP</div>' +
          '<div class="ob-tip"><span>⚠️</span> Missing quests triggers penalties</div>' +
        '</div>' +
        '<button class="btn btn-primary" style="margin-top:20px;" onclick="views.onboardFinish()">BEGIN QUEST ⚔️</button>';
    }
  },

  onboardTogglePack(packId) {
    const idx = views._onboardPacks.indexOf(packId);
    if (idx >= 0) views._onboardPacks.splice(idx, 1);
    else           views._onboardPacks.push(packId);
    views.renderOnboardStep();
  },

  onboardNext() {
    if (views._onboardStep === 0) {
      const inp = document.getElementById('obNameInput');
      const name = (inp ? inp.value : '').trim().toUpperCase();
      if (!name) { ui.showToast('Please enter your hunter name!','danger','⚠️'); return; }
      views._onboardName = name;
      state.playerName   = name;
      saveState();
      ui.updateHeader();
    }
    views._onboardStep++;
    views.renderOnboardStep();
    fx.haptic('light');
    fx.sound('unlock');
  },

  onboardFinish() {
    // Load selected packs
    const today = state.todayDate;
    views._onboardPacks.forEach(packId => {
      const pack = QUEST_PACKS.find(p => p.id === packId);
      if (!pack) return;
      pack.quests.forEach(q => {
        const xp = calcTaskXp(q.difficulty, q.category, q.desc||'');
        state.tasks.push({
          id: 'task_'+Date.now()+'_'+Math.random().toString(36).slice(2),
          name: q.name, desc: q.desc||'', category: q.category,
          difficulty: q.difficulty, tracking: q.tracking||'checkbox',
          recur: 'daily', counterGoal: q.counterGoal||10,
          xp, date: today, completed: false, progress: 0,
        });
      });
    });

    state.onboardingDone = true;
    saveState();
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.classList.remove('open');
    fx.sound('levelup');
    fx.haptic('heavy');
    ui.showToast('Welcome, '+state.playerName+'! Your journey begins!','success','⚔️');
    showView('quests');
    views.renderTodayTasks();
  },

  /* ═══════════════════════════════════
     QUEST TEMPLATE PACKS  (#3 suggestion)
     ═══════════════════════════════════ */
  renderTemplatePacks() {
    const wrap = document.getElementById('templatePacksWrap');
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="section-title" style="padding:14px 0 10px;">⚡ Quick-Load Quest Packs</div>' +
      '<div class="packs-scroll">' +
        QUEST_PACKS.map(pack =>
          '<div class="pack-card" onclick="views.previewPack(\''+pack.id+'\')">'+
            '<div class="pack-card-icon">'+pack.icon+'</div>'+
            '<div class="pack-card-name">'+pack.name+'</div>'+
            '<div class="pack-card-count">'+pack.quests.length+' quests</div>'+
          '</div>'
        ).join('') +
      '</div>';
  },

  previewPack(packId) {
    const pack = QUEST_PACKS.find(p => p.id === packId);
    if (!pack) return;
    const overlay = document.getElementById('packPreviewOverlay');
    const body    = document.getElementById('packPreviewBody');
    if (!overlay || !body) return;

    document.getElementById('packPreviewTitle').textContent = pack.icon+' '+pack.name;
    body.innerHTML = pack.quests.map(q => {
      const xp = calcTaskXp(q.difficulty, q.category, q.desc||'');
      return '<div class="pack-preview-item">'+
        '<span class="pack-preview-icon">'+CATEGORY_ICONS[q.category]+'</span>'+
        '<div class="pack-preview-info">'+
          '<div class="pack-preview-name">'+escapeHtml(q.name)+'</div>'+
          '<div class="pack-preview-meta">'+
            '<span class="tag tag-accent">'+q.category+'</span>'+
            '<span class="tag tag-gold">+'+xp+' XP</span>'+
            '<span class="tag tag-ghost">'+DIFF_LABELS[q.difficulty]+'</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');

    document.getElementById('packLoadBtn').onclick = () => views.loadPack(packId);
    overlay.classList.add('open');
  },

  closePackPreview() {
    document.getElementById('packPreviewOverlay')?.classList.remove('open');
  },

  loadPack(packId) {
    const pack  = QUEST_PACKS.find(p => p.id === packId);
    if (!pack) return;
    const today = state.todayDate;
    let added   = 0;
    pack.quests.forEach(q => {
      const exists = state.tasks.some(t => t.date===today && t.name===q.name);
      if (!exists) {
        const xp = calcTaskXp(q.difficulty, q.category, q.desc||'');
        state.tasks.push({
          id: 'task_'+Date.now()+'_'+Math.random().toString(36).slice(2),
          name: q.name, desc: q.desc||'', category: q.category,
          difficulty: q.difficulty, tracking: q.tracking||'checkbox',
          recur: 'none', counterGoal: q.counterGoal||10,
          xp, date: today, completed: false, progress: 0,
        });
        added++;
      }
    });
    saveState();
    views.closePackPreview();
    views.renderTodayTasks();
    views.switchQuestTab('today');
    ui.showToast('Loaded '+added+' quests from '+pack.name+'!','success', pack.icon);
    fx.sound('unlock');
    fx.haptic('medium');
  },

  /* ─── TODAY'S TASKS ─── */
  renderTodayTasks() {
    const today     = state.todayDate;
    const todayT    = state.tasks.filter(t => t.date === today);
    const container = document.getElementById('taskListToday');
    const submitW   = document.getElementById('submitBtnWrap');
    const lockW     = document.getElementById('lockBannerWrap');
    const emptyEl   = document.getElementById('emptyTasks');
    if (!container) return;
    container.innerHTML = '';

    if (!todayT.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (submitW) submitW.innerHTML = '';
      if (lockW)   lockW.innerHTML   = '';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    if (!state.todayLocked) {
      if (submitW) submitW.innerHTML =
        '<div style="padding:12px 16px 4px;">' +
          '<button class="btn btn-primary" onclick="tasks.submitDaily()" style="width:100%;">⚔️ LOCK IN DAILY QUESTS</button>' +
        '</div>';
      if (lockW) lockW.innerHTML = '';
    } else {
      if (submitW) submitW.innerHTML = '';
      const hasEdit = state.inventory.find(i => i.effect==='edit' && !i.used);
      if (lockW) lockW.innerHTML =
        '<div class="lock-banner">' +
          '<span class="lock-icon">🔒</span>' +
          '<span>Daily quests locked' +
            (hasEdit?' — <span style="color:var(--accent);cursor:pointer;text-decoration:underline;" onclick="modals.openReward(state.inventory.find(i=>i.effect===\'edit\'&&!i.used))">Use Edit Pass?</span>':'') +
          '</span>' +
        '</div>';
    }

    todayT.forEach((task, idx) => container.appendChild(views._buildTaskEl(task, idx)));
    views.renderDashTasks();
    ui.updateSummary();
  },

  _buildTaskEl(task, idx) {
    const locked = state.todayLocked;
    const el     = document.createElement('div');
    el.className = 'task-item '+(task.completed?'done':'');
    el.style.animationDelay = (idx*0.04)+'s';
    el.dataset.taskId = task.id;

    // Swipe hint layers
    const swipeR = '<div class="swipe-hint-right">✓ Complete</div>';
    const swipeL = '<div class="swipe-hint-left">✕ Options</div>';

    let progressHTML = '';
    if (locked && !task.completed) {
      if (task.tracking === 'slider') {
        progressHTML =
          '<div class="task-progress-wrap">' +
            '<input type="range" min="0" max="100" value="'+(task.progress||0)+'" aria-label="Task progress"' +
              ' oninput="this.nextElementSibling.textContent=this.value+\'%\'"' +
              ' onchange="tasks.setProgress(\''+task.id+'\',parseInt(this.value))">' +
            '<div style="font-size:10px;color:var(--text3);text-align:right;margin-top:2px;">'+(task.progress||0)+'%</div>' +
          '</div>';
      } else if (task.tracking === 'counter') {
        const goal = task.counterGoal || 10;
        const cur  = Math.round(((task.progress||0)/100)*goal);
        progressHTML =
          '<div class="counter-row">' +
            '<button class="btn btn-ghost btn-sm" onclick="tasks.counter(\''+task.id+'\',-1)">−</button>' +
            '<div class="counter-val">'+cur+' / '+goal+'</div>' +
            '<button class="btn btn-ghost btn-sm" onclick="tasks.counter(\''+task.id+'\',1)">+</button>' +
          '</div>';
      }
    }

    // Difficulty rank color
    const diffColors = { easy:'var(--green)', medium:'var(--accent2)', hard:'var(--gold)', epic:'var(--orange)', legendary:'var(--red)' };
    const diffCol = diffColors[task.difficulty] || 'var(--text3)';

    el.innerHTML = swipeR + swipeL +
      '<div class="task-row">' +
        '<div class="task-check '+(task.completed?'checked':'')+'" role="checkbox" aria-checked="'+task.completed+'"' +
          ' onclick="tasks.toggle(\''+task.id+'\')" tabindex="0"' +
          ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')tasks.toggle(\''+task.id+'\')">' +
        '</div>' +
        '<div class="task-info">' +
          '<div class="task-name">'+escapeHtml(task.name)+'</div>' +
          (task.desc?'<div class="task-desc">'+escapeHtml(task.desc.substring(0,70))+(task.desc.length>70?'…':'')+'</div>':'') +
          '<div class="task-tags">' +
            '<span class="tag tag-accent">'+CATEGORY_ICONS[task.category]+' '+task.category+'</span>' +
            '<span class="tag tag-gold">+'+task.xp+' XP</span>' +
            (task.recur!=='none'?'<span class="tag tag-green">🔄 '+task.recur+'</span>':'') +
            '<span class="tag" style="background:transparent;border-color:'+diffCol+';color:'+diffCol+';">'+DIFF_LABELS[task.difficulty]+'</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      progressHTML;
    return el;
  },

  renderDashTasks() {
    const el    = document.getElementById('dashTaskList');
    if (!el) return;
    const today = state.todayDate;
    const list  = state.tasks.filter(t=>t.date===today).slice(0,5);
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = '<div class="empty-state" style="padding:24px 0"><div class="empty-icon">⚔️</div><p>No quests today</p></div>';
      return;
    }
    list.forEach((t,i) => el.appendChild(views._buildTaskEl(t,i)));
  },

  /* ─── RECURRING ─── */
  renderRecurring() {
    const list  = document.getElementById('recurringList');
    const empty = document.getElementById('emptyRecurring');
    if (!list) return;
    list.innerHTML = '';
    if (!state.recurringTemplates.length) { if(empty) empty.style.display='block'; return; }
    if (empty) empty.style.display = 'none';
    state.recurringTemplates.forEach(t => {
      const el = document.createElement('div');
      el.className = 'task-item';
      el.innerHTML =
        '<div class="task-row">' +
          '<div class="task-info">' +
            '<div class="task-name">'+escapeHtml(t.name)+'</div>' +
            '<div class="task-tags">' +
              '<span class="tag tag-green">🔄 '+t.recur+'</span>' +
              '<span class="tag tag-accent">'+CATEGORY_ICONS[t.category]+' '+t.category+'</span>' +
              '<span class="tag tag-gold">+'+t.xp+' XP</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn btn-danger btn-xs" onclick="tasks.deleteRecurring(\''+t.id+'\')">✕</button>' +
        '</div>';
      list.appendChild(el);
    });
  },

  /* ─── PENALTY TRACKER ─── */
  renderPenaltyTracker() {
    const wrap = document.getElementById('penaltyTrackerWrap');
    if (!wrap) return;
    const all = state.pendingPenalties;
    if (!all.length) { wrap.innerHTML = ''; ui._updatePenaltyIndicators(); return; }

    let html = '<div class="section-title" style="padding-top:14px;">⚠️ Active Penalties</div>';
    all.forEach(pen => {
      const total    = pen.penalties.length;
      const done     = pen.penalties.filter(p=>p.done).length;
      const allDone  = done === total;
      const xpEarned = pen.penalties.filter(p=>p.done).reduce((a,p)=>a+p.xp,0);
      const xpTotal  = pen.penalties.reduce((a,p)=>a+p.xp,0);
      const pct      = total ? Math.round((done/total)*100) : 0;

      html +=
        '<div class="penalty-tracker-card'+(allDone?' pen-all-done':'')+'">' +
          '<div class="pen-tracker-header">' +
            '<div class="pen-tracker-left">' +
              '<span class="pen-tracker-icon">'+(allDone?'✅':'💀')+'</span>' +
              '<div>' +
                '<div class="pen-tracker-task">'+escapeHtml(pen.taskName)+'</div>' +
                '<div class="pen-tracker-sub">'+done+'/'+total+' done · +'+xpEarned+'/'+xpTotal+' XP</div>' +
              '</div>' +
            '</div>' +
            '<button class="btn '+(allDone?'btn-primary':'btn-ghost')+' btn-sm" onclick="modals.dismissPenalty(\''+pen.taskId+'\')">'+
              (allDone?'✓ CLEAR':'SKIP')+
            '</button>' +
          '</div>' +
          '<div class="bar-track thin" style="margin:8px 0 10px;">' +
            '<div class="bar-fill" style="width:'+pct+'%;background:'+(allDone?'var(--green)':'var(--red)')+'"></div>' +
          '</div>';

      pen.penalties.forEach((p,idx) => {
        html +=
          '<label class="pen-tracker-item'+(p.done?' done':'')+'">' +
            '<input type="checkbox" '+(p.done?'checked':'')+
              ' onchange="modals.completePenaltyItem(\''+pen.taskId+'\','+idx+',this.checked)">' +
            '<span class="pen-tracker-text">'+escapeHtml(p.text)+'</span>' +
            '<span class="pen-xp-badge">+'+p.xp+' XP</span>' +
          '</label>';
      });
      html += '</div>';
    });
    wrap.innerHTML = html;
    ui._updatePenaltyIndicators();
  },

  /* ═══════════════════════════════════
     WEEKLY REVIEW  (#6 suggestion)
     ═══════════════════════════════════ */
  openWeeklyReview() {
    modals.openWeeklyReview();
  },

  /* ─── CALENDAR ─── */
  _calYear: new Date().getFullYear(),
  _calMonth: new Date().getMonth(),

  renderCalendar() {
    const yr=views._calYear, mo=views._calMonth;
    const now=new Date(), todayStr=toDateStr(now);
    document.getElementById('calMonthLabel').textContent =
      new Date(yr,mo,1).toLocaleString('default',{month:'long',year:'numeric'});
    const firstDay=new Date(yr,mo,1).getDay();
    const daysInMonth=new Date(yr,mo+1,0).getDate();
    const prevLast=new Date(yr,mo,0).getDate();
    const grid=document.getElementById('calDays');
    if (!grid) return;
    grid.innerHTML='';
    for (let i=firstDay-1;i>=0;i--) grid.appendChild(views._calDay(prevLast-i,'',true,false));
    for (let d=1;d<=daysInMonth;d++) {
      const ds=yr+'-'+(mo+1)+'-'+d;
      const data=state.calendarData[ds];
      const isToday=ds===todayStr;
      let xp = data?data.xp:0;
      if (isToday) xp=state.tasks.filter(t=>t.date===ds&&t.completed).reduce((a,t)=>a+t.xp,0);
      let heat=0;
      if(xp>0)heat=1; if(xp>60)heat=2; if(xp>150)heat=3; if(xp>300)heat=4; if(xp>500)heat=5;
      const el=views._calDay(d,ds,false,isToday,heat);
      el.onclick=()=>views.showCalDay(ds,d);
      grid.appendChild(el);
    }
    const rem=(firstDay+daysInMonth)%7;
    if (rem) for(let i=1;i<=7-rem;i++) grid.appendChild(views._calDay(i,'',true,false));
  },
  _calDay(num,ds,other,isToday,heat) {
    const el=document.createElement('div');
    el.className='cal-day'+(other?' other':'')+(isToday?' today':'');
    el.innerHTML='<div class="d-heat heat-'+(heat||0)+'"></div><span class="d-num">'+num+'</span>';
    return el;
  },
  calNav(dir) {
    views._calMonth+=dir;
    if(views._calMonth>11){views._calMonth=0;views._calYear++;}
    if(views._calMonth<0){views._calMonth=11;views._calYear--;}
    views.renderCalendar();
  },
  showCalDay(ds,day) {
    const detail=document.getElementById('calDetail');
    const title=document.getElementById('calDetailTitle');
    const body=document.getElementById('calDetailBody');
    if(!detail) return;
    const now=new Date(), todayStr=toDateStr(now), isToday=ds===todayStr;
    title.textContent=new Date(views._calYear,views._calMonth,day).toLocaleString('default',{month:'long',day:'numeric'})+(isToday?' (Today)':'');
    let completed=0,total=0,xp=0;
    if (isToday) {
      const tt=state.tasks.filter(t=>t.date===ds);
      completed=tt.filter(t=>t.completed).length; total=tt.length; xp=tt.filter(t=>t.completed).reduce((a,t)=>a+t.xp,0);
    } else if (state.calendarData[ds]) {
      ({completed,total,xp}=state.calendarData[ds]);
    }
    body.innerHTML = total>0
      ? '<div style="display:flex;gap:20px;"><div><div style="font-family:var(--font-heading);font-size:20px;color:var(--accent2);">'+completed+'/'+total+'</div><div class="label-xs">Completed</div></div><div><div style="font-family:var(--font-heading);font-size:20px;color:var(--gold);">'+xp+'</div><div class="label-xs">XP Earned</div></div></div>'
      : '<div class="label-xs" style="padding:4px 0;">No data recorded.</div>';
    detail.style.display='block';
    detail.scrollIntoView({behavior:'smooth',block:'nearest'});
  },

  /* ─── INVENTORY ─── */
  renderInventory() {
    const grid=document.getElementById('invGrid');
    const empty=document.getElementById('emptyInv');
    if(!grid) return;
    grid.innerHTML='';
    if(!state.inventory.length){if(empty) empty.style.display='block'; return;}
    if(empty) empty.style.display='none';
    state.inventory.forEach(item=>{
      const el=document.createElement('div');
      el.className='inv-card '+(item.used?'used':'');
      el.innerHTML='<div class="inv-icon">'+item.icon+'</div><div class="inv-name">'+item.name+'</div><div class="inv-desc">'+item.desc+'</div>';
      if(!item.used) el.onclick=()=>modals.openReward(item);
      grid.appendChild(el);
    });
  },

  /* ─── RANK ROAD ─── */
  renderRankRoad() {
    const road=document.getElementById('rankRoad');
    if(!road) return;
    road.innerHTML='';
    RANKS.forEach((rank,i)=>{
      const achieved=state.level>rank.level, current=state.level===rank.level, locked=state.level<rank.level;
      const el=document.createElement('div');
      el.className='rank-step '+(achieved?'achieved':'')+(current?' current':'')+(locked?' locked':'');
      el.style.animationDelay=(i*0.03)+'s';
      el.innerHTML='<div class="r-dot"></div><span class="r-icon">'+rank.icon+'</span><span class="r-name">'+rank.name+'</span><span class="r-xp">Lv.'+rank.level+(rank.reward?' 🎁':'')+'</span>';
      road.appendChild(el);
    });
  },

  /* ─── SETTINGS ─── */
  renderSettings() {
    const set=(id,fn)=>{const e=document.getElementById(id);if(e)fn(e);};
    set('darkModeToggle',  e=>e.classList.toggle('on',!!state.settings.darkMode));
    set('streakToggle',    e=>e.classList.toggle('on',state.settings.streakBonus!==false));
    set('soundsToggle',    e=>e.classList.toggle('on',state.settings.sounds!==false));
    set('hapticsToggle',   e=>e.classList.toggle('on',state.settings.haptics!==false));
    set('dayResetSel',     e=>e.value=state.settings.dayResetTime||6);
    set('playerNameInput', e=>{ if(state.playerName!=='PLAYER') e.value=state.playerName; });
    document.querySelectorAll('.swatch').forEach(s=>s.classList.toggle('active',s.dataset.color===state.settings.colorTheme));
  },
};

/* ─── TASK ACTIONS ─── */
const tasks = {
  add() {
    const name=document.getElementById('taskNameInput').value.trim();
    if(!name){ui.showToast('Enter a quest name!','danger','⚠️');return;}
    const diff=document.getElementById('taskDiff').value;
    const cat=document.getElementById('taskCat').value;
    const desc=document.getElementById('taskDesc').value.trim();
    const tracking=document.getElementById('taskTracking').value;
    const recur=document.getElementById('taskRecur').value;
    const cg=parseInt(document.getElementById('taskCounterGoal').value)||10;
    const xp=calcTaskXp(diff,cat,desc);
    const today=state.todayDate;
    const task={id:'task_'+Date.now(),name,desc,category:cat,difficulty:diff,tracking,recur,counterGoal:cg,xp,date:today,completed:false,progress:0};
    state.tasks.push(task);
    if(recur!=='none'){
      state.recurringTemplates.push({...task,id:'rt_'+Date.now()});
      ui.showToast('Recurring quest added!','success','🔄');
      views.renderRecurring();
    } else {
      ui.showToast('Quest added — +'+xp+' XP on completion','success','⚔️');
    }
    document.getElementById('taskNameInput').value='';
    document.getElementById('taskDesc').value='';
    document.getElementById('xpPreviewVal').textContent='—';
    saveState();
    views.renderTodayTasks();
    views.switchQuestTab('today');
    fx.sound('unlock');
    fx.haptic('light');
  },

  toggle(id) {
    const task=state.tasks.find(t=>t.id===id);
    if(!task) return;
    if(!state.todayLocked){ui.showToast('Lock in your quests first!','warning','🔒');fx.sound('error');fx.haptic('error');return;}
    if(task.tracking!=='checkbox'&&!task.completed) return;
    if(task.completed){
      task.completed=false;task.progress=0;
      loseXp(task.xp,'Quest uncompleted');
      state.categoryStats[task.category]=Math.max(0,(state.categoryStats[task.category]||0)-task.xp);
    } else {
      tasks._complete(id);
    }
    saveState();views.renderTodayTasks();ui.renderStats();ui.renderRadar();
  },

  _complete(id) {
    const task=state.tasks.find(t=>t.id===id);
    if(!task||task.completed) return;
    task.completed=true;task.progress=100;
    let xp=task.xp;
    if(state.settings.streakBonus&&state.streak>=3) xp+=Math.floor(task.xp*0.1*Math.min(state.streak,10));
    // HP mechanic: below 20% HP, XP is halved
    const hpPct=(state.hp/state.maxHp)*100;
    if(hpPct<20) xp=Math.floor(xp*0.5);
    awardXp(xp,task.name);
    state.categoryStats[task.category]=(state.categoryStats[task.category]||0)+xp;
    state.lifetimeStats.tasksCompleted++;
    healHp(5);
    saveState();
    fx.sound('complete');
    fx.haptic('success');
    ui.renderStats();ui.renderRadar();ui.renderInsights();
  },

  setProgress(id,val) {
    const task=state.tasks.find(t=>t.id===id);
    if(!task||!state.todayLocked) return;
    task.progress=val;
    if(val>=100&&!task.completed) tasks._complete(id);
    else saveState();
  },

  counter(id,delta) {
    const task=state.tasks.find(t=>t.id===id);
    if(!task) return;
    const goal=task.counterGoal||10;
    const cur=Math.round(((task.progress||0)/100)*goal);
    const next=Math.max(0,Math.min(goal,cur+delta));
    task.progress=Math.round((next/goal)*100);
    if(task.progress>=100&&!task.completed) tasks._complete(id);
    else saveState();
    views.renderTodayTasks();
    fx.haptic('light');
  },

  submitDaily() {
    const today=state.todayDate;
    const tt=state.tasks.filter(t=>t.date===today);
    if(!tt.length){ui.showToast('Add quests before locking!','danger','⚠️');return;}
    state.todayLocked=true;
    saveState();views.renderTodayTasks();
    ui.showToast('Daily quests locked! Time to grind! 🔥','success','⚔️');
    fx.sound('submit');fx.haptic('medium');
  },

  deleteRecurring(id) {
    state.recurringTemplates=state.recurringTemplates.filter(t=>t.id!==id);
    saveState();views.renderRecurring();
    ui.showToast('Recurring quest removed.','info','🔄');
  },

  updateXpPreview() {
    const diff=document.getElementById('taskDiff')?.value;
    const cat=document.getElementById('taskCat')?.value;
    const desc=document.getElementById('taskDesc')?.value;
    const xp=calcTaskXp(diff,cat,desc);
    const el=document.getElementById('xpPreviewVal');
    if(el) el.textContent=xp+' XP on completion';
  },
};

/* ─── REWARDS ─── */
const rewards = {
  apply(item) {
    const inv=state.inventory.find(i=>i.uid===item.uid);
    if(!inv||inv.used) return;
    inv.used=true;
    if(item.effect==='edit'){
      state.todayLocked=false;
      ui.showToast('Edit pass used! Quests unlocked for 5 min.','success','✏️');
      setTimeout(()=>{state.todayLocked=true;views.renderTodayTasks();saveState();},5*60*1000);
    } else if(item.effect==='dayoff'){
      state.usedDayOff=true;
      ui.showToast('Day Off activated! No tracking today.','success','😴');
    } else if(item.effect==='nopen'){
      ui.showToast('No Penalty shield saved!','success','🛡️');
    }
    modals.closeReward();saveState();views.renderInventory();views.renderTodayTasks();
    fx.sound('unlock');fx.haptic('medium');
  },
};

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
