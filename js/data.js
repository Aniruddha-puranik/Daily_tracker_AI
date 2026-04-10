/* =====================================================
   SOLO LEVEL UP — js/data.js
   All static data: ranks, XP table, categories, penalties
   ===================================================== */

'use strict';

/* ─── RANK DEFINITIONS ─── */
const RANKS = [
  { level:0,  name:'PLAYER',      icon:'👤', tier:'novice',  reward:null },
  { level:1,  name:'PLAYER E',    icon:'👤', tier:'novice',  reward:null },
  { level:3,  name:'PLAYER D',    icon:'🔰', tier:'novice',  reward:null },
  { level:5,  name:'PRIVATE',     icon:'🪖', tier:'novice',  reward:{id:'edit',   name:'Quest Edit',   icon:'✏️', desc:'Unlock & edit one locked quest',  effect:'edit'} },
  { level:7,  name:'CORPORAL',    icon:'⭐', tier:'warrior', reward:{id:'dayoff', name:'Day Off',       icon:'😴', desc:'Skip tracking for one day',       effect:'dayoff'} },
  { level:10, name:'SERGEANT',    icon:'🎖️', tier:'warrior', reward:{id:'nopen',  name:'No Penalty',   icon:'🛡️', desc:'Cancel your next penalty',         effect:'nopen'} },
  { level:13, name:'LIEUTENANT',  icon:'🌟', tier:'warrior', reward:{id:'edit',   name:'Quest Edit',   icon:'✏️', desc:'Unlock & edit one locked quest',  effect:'edit'} },
  { level:15, name:'CAPTAIN',     icon:'🏅', tier:'elite',   reward:{id:'dayoff', name:'Day Off',       icon:'😴', desc:'Skip tracking for one day',       effect:'dayoff'} },
  { level:20, name:'MAJOR',       icon:'💎', tier:'elite',   reward:{id:'nopen',  name:'No Penalty',   icon:'🛡️', desc:'Cancel your next penalty',         effect:'nopen'} },
  { level:25, name:'COLONEL',     icon:'⚡', tier:'elite',   reward:{id:'edit',   name:'Quest Edit',   icon:'✏️', desc:'Unlock & edit one locked quest',  effect:'edit'} },
  { level:30, name:'BRIGADIER',   icon:'🔥', tier:'master',  reward:{id:'dayoff', name:'Day Off',       icon:'😴', desc:'Skip tracking for one day',       effect:'dayoff'} },
  { level:40, name:'GENERAL',     icon:'👑', tier:'master',  reward:{id:'nopen',  name:'No Penalty',   icon:'🛡️', desc:'Cancel your next penalty',         effect:'nopen'} },
  { level:50, name:'MARSHAL',     icon:'🌌', tier:'legend',  reward:{id:'dayoff', name:'Day Off',       icon:'😴', desc:'Skip tracking for one day',       effect:'dayoff'} },
];

/* XP required to REACH each level */
const XP_TABLE = [
    0,    100,   250,   450,   700,
 1000,   1350,  1750,  2200,  2700,
 3200,   3800,  4500,  5300,  6200,
 7500,   9000, 10700, 12600, 14700,
17000,  19500, 22200, 25100, 28200,
32000,  36000, 40200, 44800, 49800,
55200,  61000, 67200, 73800, 80800,
88200,  96000,104200,112800,121800,
132000,142800,154200,166200,178800,
192000,206000,221000,237000,254000,
272000
];

function getXpForLevel(lvl) {
  if (lvl >= XP_TABLE.length) {
    return XP_TABLE[XP_TABLE.length - 1] + (lvl - XP_TABLE.length + 1) * 20000;
  }
  return XP_TABLE[lvl] || 0;
}

/* ─── CATEGORY META ─── */
const CATEGORY_COLORS = {
  physical:  '#e05030',
  mental:    '#1d8fdd',
  financial: '#d4a800',
  creative:  '#c030a0',
  social:    '#20bbdd',
  learning:  '#20c878',
};
const CATEGORY_ICONS = {
  physical:  '⚔️',
  mental:    '🧠',
  financial: '💰',
  creative:  '🎨',
  social:    '🤝',
  learning:  '📚',
};
const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

/* ─── XP BY DIFFICULTY ─── */
const XP_BY_DIFF = {
  easy:       20,
  medium:     45,
  hard:       85,
  epic:      140,
  legendary: 220,
};
const DIFF_LABELS = {
  easy: 'D-Rank', medium: 'C-Rank', hard: 'B-Rank', epic: 'A-Rank', legendary: 'S-Rank',
};
const CATEGORY_XP_BONUS = {
  physical: 5, mental: 12, financial: 15, creative: 10, social: 6, learning: 12,
};

/* ─── PENALTIES ─── */
const PENALTIES = [
  { id:'p1', text:'No Instagram / social media for 1 hour',    xp: 10, type:'time' },
  { id:'p2', text:'No device screen for 30 minutes',            xp: 15, type:'time' },
  { id:'p3', text:'Read 10 pages of any book',                  xp: 20, type:'task' },
  { id:'p4', text:'No entertainment until 1 task completed',    xp: 25, type:'block' },
  { id:'p5', text:'20 push-ups or 5 minutes of exercise',       xp: 15, type:'physical' },
  { id:'p6', text:'Write 3 things you are grateful for',        xp: 10, type:'reflective' },
  { id:'p7', text:'No YouTube / streaming for 2 hours',         xp: 20, type:'time' },
  { id:'p8', text:'Drink 2 glasses of water & meditate 5 min',  xp: 12, type:'health' },
  { id:'p9', text:'Go for a 10-minute walk outside',            xp: 14, type:'physical' },
  { id:'p10',text:'No social media for the rest of the day',    xp: 30, type:'block' },
];

/* ─── COLOR PALETTE OPTIONS ─── */
const COLOR_PALETTES = [
  { id:'sapphire', label:'Sapphire', hex:'#1d6fdd' },
  { id:'ocean',    label:'Ocean',    hex:'#0870b8' },
  { id:'teal',     label:'Teal',     hex:'#0aa888' },
  { id:'violet',   label:'Violet',   hex:'#7030d0' },
  { id:'crimson',  label:'Crimson',  hex:'#c02840' },
  { id:'gold',     label:'Gold',     hex:'#b87800' },
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
  lifetimeStats: {
    tasksCompleted: 0,
    totalXpEarned: 0,
    penaltiesCompleted: 0,
    streakBest: 0,
    daysActive: 0,
  },
  settings: {
    dayResetTime: 6,
    streakBonus: true,
    colorTheme: 'sapphire',
    darkMode: true,
  },
  categoryStats: {
    physical: 0, mental: 0, financial: 0,
    creative: 0, social: 0, learning: 0,
  },
  pendingPenalties: [],
  usedDayOff: false,
};
