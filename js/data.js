/* =====================================================
   SOLO LEVEL UP — js/data.js
   All static data: ranks, XP, categories, penalties,
   quest templates, sounds, insights
   ===================================================== */
'use strict';

/* ─── RANKS ─── */
const RANKS = [
  { level:0,  name:'PLAYER',     icon:'👤', tier:'novice',  reward:null },
  { level:1,  name:'PLAYER E',   icon:'👤', tier:'novice',  reward:null },
  { level:3,  name:'PLAYER D',   icon:'🔰', tier:'novice',  reward:null },
  { level:5,  name:'PRIVATE',    icon:'🪖', tier:'novice',  reward:{id:'edit',   name:'Quest Edit',  icon:'✏️', desc:'Unlock & edit one locked quest', effect:'edit'} },
  { level:7,  name:'CORPORAL',   icon:'⭐', tier:'warrior', reward:{id:'dayoff', name:'Day Off',      icon:'😴', desc:'Skip tracking for one day',      effect:'dayoff'} },
  { level:10, name:'SERGEANT',   icon:'🎖️', tier:'warrior', reward:{id:'nopen',  name:'No Penalty',  icon:'🛡️', desc:'Cancel your next penalty',        effect:'nopen'} },
  { level:13, name:'LIEUTENANT', icon:'🌟', tier:'warrior', reward:{id:'edit',   name:'Quest Edit',  icon:'✏️', desc:'Unlock & edit one locked quest', effect:'edit'} },
  { level:15, name:'CAPTAIN',    icon:'🏅', tier:'elite',   reward:{id:'dayoff', name:'Day Off',      icon:'😴', desc:'Skip tracking for one day',      effect:'dayoff'} },
  { level:20, name:'MAJOR',      icon:'💎', tier:'elite',   reward:{id:'nopen',  name:'No Penalty',  icon:'🛡️', desc:'Cancel your next penalty',        effect:'nopen'} },
  { level:25, name:'COLONEL',    icon:'⚡', tier:'elite',   reward:{id:'edit',   name:'Quest Edit',  icon:'✏️', desc:'Unlock & edit one locked quest', effect:'edit'} },
  { level:30, name:'BRIGADIER',  icon:'🔥', tier:'master',  reward:{id:'dayoff', name:'Day Off',      icon:'😴', desc:'Skip tracking for one day',      effect:'dayoff'} },
  { level:40, name:'GENERAL',    icon:'👑', tier:'master',  reward:{id:'nopen',  name:'No Penalty',  icon:'🛡️', desc:'Cancel your next penalty',        effect:'nopen'} },
  { level:50, name:'MARSHAL',    icon:'🌌', tier:'legend',  reward:{id:'dayoff', name:'Day Off',      icon:'😴', desc:'Skip tracking for one day',      effect:'dayoff'} },
];

/* ─── XP TABLE ─── */
const XP_TABLE = [
    0,   100,  250,  450,  700,
 1000,  1350, 1750, 2200, 2700,
 3200,  3800, 4500, 5300, 6200,
 7500,  9000,10700,12600,14700,
17000, 19500,22200,25100,28200,
32000, 36000,40200,44800,49800,
55200, 61000,67200,73800,80800,
88200, 96000,104200,112800,121800,
132000,142800,154200,166200,178800,
192000,206000,221000,237000,254000,272000
];

function getXpForLevel(lvl) {
  if (lvl >= XP_TABLE.length) return XP_TABLE[XP_TABLE.length-1] + (lvl-XP_TABLE.length+1)*20000;
  return XP_TABLE[lvl] || 0;
}

/* ─── CATEGORIES ─── */
const CATEGORY_COLORS = {
  physical:'#e05030', mental:'#1d8fdd', financial:'#d4a800',
  creative:'#c030a0', social:'#20bbdd', learning:'#20c878',
};
const CATEGORY_ICONS = {
  physical:'⚔️', mental:'🧠', financial:'💰',
  creative:'🎨', social:'🤝', learning:'📚',
};
const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

/* ─── XP FORMULAS ─── */
const XP_BY_DIFF = { easy:20, medium:45, hard:85, epic:140, legendary:220 };
const DIFF_LABELS = { easy:'D-Rank', medium:'C-Rank', hard:'B-Rank', epic:'A-Rank', legendary:'S-Rank' };
const CATEGORY_XP_BONUS = { physical:5, mental:12, financial:15, creative:10, social:6, learning:12 };

/* ─── PENALTIES ─── */
const PENALTIES = [
  { id:'p1',  text:'No Instagram / social media for 1 hour',    xp:10, type:'time',      category:'social' },
  { id:'p2',  text:'No device screen for 30 minutes',           xp:15, type:'time',      category:'mental' },
  { id:'p3',  text:'Read 10 pages of any book',                 xp:20, type:'task',      category:'learning' },
  { id:'p4',  text:'No entertainment until 1 task is done',     xp:25, type:'block',     category:'mental' },
  { id:'p5',  text:'20 push-ups or 5 minutes of exercise',      xp:15, type:'physical',  category:'physical' },
  { id:'p6',  text:'Write 3 things you are grateful for',       xp:10, type:'reflective',category:'mental' },
  { id:'p7',  text:'No YouTube / streaming for 2 hours',        xp:20, type:'time',      category:'social' },
  { id:'p8',  text:'Drink 2 glasses of water & meditate 5 min', xp:12, type:'health',    category:'physical' },
  { id:'p9',  text:'Go for a 10-minute walk outside',           xp:14, type:'physical',  category:'physical' },
  { id:'p10', text:'No social media for the rest of the day',   xp:30, type:'block',     category:'social' },
  { id:'p11', text:'Write down tomorrow\'s top 3 priorities',   xp:10, type:'reflective',category:'mental' },
  { id:'p12', text:'Do 10 minutes of stretching or yoga',       xp:12, type:'physical',  category:'physical' },
];

/* ─── QUEST TEMPLATE PACKS ─── */
const QUEST_PACKS = [
  {
    id: 'morning',
    name: 'Morning Warrior',
    icon: '🌅',
    description: 'Build an unstoppable morning routine',
    quests: [
      { name:'Wake up without snooze',    category:'mental',   difficulty:'easy',   tracking:'checkbox', desc:'Get up on first alarm' },
      { name:'Drink water (500ml)',        category:'physical', difficulty:'easy',   tracking:'checkbox', desc:'Hydrate immediately after waking' },
      { name:'10-minute meditation',       category:'mental',   difficulty:'easy',   tracking:'checkbox', desc:'Clear your mind for the day' },
      { name:'Morning exercise (20 min)',  category:'physical', difficulty:'medium', tracking:'checkbox', desc:'Workout, jog, or yoga to start strong' },
      { name:'Read for 15 minutes',        category:'learning', difficulty:'easy',   tracking:'checkbox', desc:'Non-fiction or growth mindset content' },
    ]
  },
  {
    id: 'student',
    name: 'Student Grind',
    icon: '📚',
    description: 'Maximize focus and academic output',
    quests: [
      { name:'2 hours deep study session', category:'learning', difficulty:'hard',   tracking:'checkbox', desc:'Phone off, full focus, Pomodoro technique' },
      { name:'Review yesterday\'s notes',  category:'learning', difficulty:'easy',   tracking:'checkbox', desc:'Spaced repetition for better retention' },
      { name:'Complete 1 assignment',      category:'learning', difficulty:'medium', tracking:'checkbox', desc:'Finish at least one pending task' },
      { name:'No social media until 6pm',  category:'mental',   difficulty:'hard',   tracking:'checkbox', desc:'Protect your attention and focus' },
      { name:'Solve 5 practice problems',  category:'mental',   difficulty:'medium', tracking:'counter',  counterGoal:5, desc:'Active problem-solving practice' },
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness Journey',
    icon: '💪',
    description: 'Build your body, level your health',
    quests: [
      { name:'Workout session (45 min)',   category:'physical', difficulty:'hard',   tracking:'checkbox', desc:'Gym, home workout or cardio' },
      { name:'Hit daily step goal',        category:'physical', difficulty:'medium', tracking:'counter',  counterGoal:8000, desc:'Walk or run 8000+ steps today' },
      { name:'Drink 2L of water',          category:'physical', difficulty:'easy',   tracking:'counter',  counterGoal:8, desc:'Track glasses of water throughout the day' },
      { name:'Sleep by 11pm',             category:'physical', difficulty:'medium', tracking:'checkbox', desc:'Prioritize recovery and sleep quality' },
      { name:'No junk food today',        category:'physical', difficulty:'hard',   tracking:'checkbox', desc:'Clean eating for better performance' },
    ]
  },
  {
    id: 'financial',
    name: 'Financial Discipline',
    icon: '💰',
    description: 'Build wealth and money habits',
    quests: [
      { name:'Track all expenses today',   category:'financial',difficulty:'easy',   tracking:'checkbox', desc:'Log every rupee/dollar spent' },
      { name:'No impulse purchase',        category:'financial',difficulty:'medium', tracking:'checkbox', desc:'Stick to your budget strictly' },
      { name:'Read 1 financial article',   category:'learning', difficulty:'easy',   tracking:'checkbox', desc:'Expand your money knowledge' },
      { name:'Review monthly budget',      category:'financial',difficulty:'medium', tracking:'checkbox', desc:'Check spending vs targets weekly' },
      { name:'Save target amount today',   category:'financial',difficulty:'hard',   tracking:'checkbox', desc:'Put aside your daily savings goal' },
    ]
  },
  {
    id: 'creative',
    name: 'Creative Builder',
    icon: '🎨',
    description: 'Create something every single day',
    quests: [
      { name:'Work on your project 1hr',   category:'creative', difficulty:'hard',   tracking:'checkbox', desc:'Code, design, write or build something' },
      { name:'Sketch or brainstorm ideas', category:'creative', difficulty:'easy',   tracking:'checkbox', desc:'Freeform ideation for 15 minutes' },
      { name:'Learn one new skill/tool',   category:'learning', difficulty:'medium', tracking:'checkbox', desc:'Tutorial, docs, or practice session' },
      { name:'Share your work publicly',   category:'social',   difficulty:'epic',   tracking:'checkbox', desc:'Post WIP, commit code, publish draft' },
      { name:'Write 300 words',           category:'creative', difficulty:'medium', tracking:'counter',  counterGoal:300, desc:'Journal, blog, or creative writing' },
    ]
  },
];

/* ─── COLOR PALETTES ─── */
const COLOR_PALETTES = [
  { id:'sapphire', label:'Sapphire', hex:'#1d6fdd' },
  { id:'ocean',    label:'Ocean',    hex:'#0870b8' },
  { id:'teal',     label:'Teal',     hex:'#0aa888' },
  { id:'violet',   label:'Violet',   hex:'#7030d0' },
  { id:'crimson',  label:'Crimson',  hex:'#c02840' },
  { id:'gold',     label:'Gold',     hex:'#b87800' },
];

/* ─── INSIGHT TEMPLATES ─── */
const INSIGHT_TEMPLATES = [
  { key:'best_cat',   text:(c,p)=>`You excel at ${c} quests with ${p}% completion. Keep that momentum going! ⚔️` },
  { key:'weak_cat',   text:(c,p)=>`${c} quests are your challenge zone at ${p}% completion. Try easier difficulty first.` },
  { key:'streak',     text:(s)=>s>=7 ? `🔥 ${s}-day streak! You're building a real habit now.` : s>=3 ? `3-day streak going. Consistency is the skill.` : null },
  { key:'hp_low',     text:()=>`❤️ Your HP is low. Complete penalties and avoid missing quests to recover.` },
  { key:'all_done',   text:()=>`✅ All quests done today! You're operating at 100%. Outstanding.` },
  { key:'boss_week',  text:()=>`⚔️ End of week! Your weekly Boss Battle unlocks tonight at midnight.` },
];

/* ─── DEFAULT STATE ─── */
const DEFAULT_STATE = {
  playerName: 'PLAYER',
  level: 0,
  totalXp: 0,
  hp: 100,
  maxHp: 100,
  streak: 0,
  tasks: [],
  recurringTemplates: [],
  todayDate: null,
  todayLocked: false,
  calendarData: {},
  inventory: [],
  lifetimeStats: { tasksCompleted:0, totalXpEarned:0, penaltiesCompleted:0, streakBest:0, daysActive:0 },
  settings: { dayResetTime:6, streakBonus:true, colorTheme:'sapphire', darkMode:true, sounds:true, haptics:true },
  categoryStats: { physical:0, mental:0, financial:0, creative:0, social:0, learning:0 },
  pendingPenalties: [],
  usedDayOff: false,
  onboardingDone: false,
  weeklyBoss: null,
  weeklyReviewDone: null,
  swipeStartX: null,
};
