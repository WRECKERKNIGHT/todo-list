import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { loadData, saveData, KEYS } from '../utils/storage';
import { scheduleTodoReminder, scheduleHabitReminder, cancelNotification } from '../utils/notifications';

const AppContext = createContext();

const XP_PER_TASK = 25;
const XP_PER_HABIT = 15;
const XP_PER_POMODORO = 10;
const XP_PER_CHALLENGE = 50;
const COINS_PER_TASK = 5;
const COINS_PER_HABIT = 3;
const COINS_PER_CHALLENGE = 20;
const PUNISHMENT_FINE = 10;

const OVERDUE_FINES = { 1: 5, 2: 10, 3: 20, 7: 50 }; // days overdue: fine amount
const CONSISTENCY_BONUS_THRESHOLD = 80; // % needed for bonus
const CONSISTENCY_BONUS_XP = 50;
const CONSISTENCY_BONUS_COINS = 25;

const DAILY_REWARDS = [10, 15, 20, 25, 30, 40, 50];
const MYSTERY_BOX_CHANCES = { common: 0.60, rare: 0.25, epic: 0.10, legendary: 0.05 };
const MYSTERY_BOX_REWARDS = {
  common: [{ type: 'coins', amount: 10 }, { type: 'coins', amount: 15 }, { type: 'xp', amount: 20 }],
  rare: [{ type: 'coins', amount: 30 }, { type: 'xp', amount: 50 }, { type: 'xp_boost', amount: 1 }],
  epic: [{ type: 'coins', amount: 75 }, { type: 'xp', amount: 100 }, { type: 'protection', amount: 1 }],
  legendary: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 200 }, { type: 'xp_boost', amount: 3 }],
};
const SEASONAL_EVENTS = [
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete 5 tasks in 1 hour', icon: 'flash', reward: { xp: 100, coins: 50 }, duration: 3600000 },
  { id: 'habit_marathon', name: 'Habit Marathon', desc: 'Complete all habits 3 days in a row', icon: 'trophy', reward: { xp: 150, coins: 75 }, duration: 259200000 },
  { id: 'focus_master', name: 'Focus Master', desc: 'Complete 5 pomodoro sessions today', icon: 'timer', reward: { xp: 80, coins: 40 }, duration: 86400000 },
  { id: 'night_warrior', name: 'Night Warrior', desc: 'Complete 3 tasks after 9 PM', icon: 'moon', reward: { xp: 60, coins: 30 }, duration: 86400000 },
];

const LEVELS = [
  { level: 1, xp: 0, title: 'Peasant' },
  { level: 2, xp: 100, title: 'Squire' },
  { level: 3, xp: 300, title: 'Knight' },
  { level: 4, xp: 600, title: 'Baron' },
  { level: 5, xp: 1000, title: 'Viscount' },
  { level: 6, xp: 1500, title: 'Earl' },
  { level: 7, xp: 2200, title: 'Marquis' },
  { level: 8, xp: 3000, title: 'Duke' },
  { level: 9, xp: 4000, title: 'Archduke' },
  { level: 10, xp: 5500, title: 'King' },
];

const SHOP_ITEMS = [
  { id: 'theme_royal_purple', name: 'Royal Purple', desc: 'Deep purple accent color', type: 'theme', price: 100, color: '#9B59B6' },
  { id: 'theme_forest_green', name: 'Forest Emerald', desc: 'Rich green accent color', type: 'theme', price: 100, color: '#27AE60' },
  { id: 'theme_ocean_blue', name: 'Ocean Sapphire', desc: 'Deep blue accent color', type: 'theme', price: 100, color: '#2980B9' },
  { id: 'theme_crimson', name: 'Crimson Blaze', desc: 'Fiery red accent color', type: 'theme', price: 120, color: '#E74C3C' },
  { id: 'theme_golden', name: 'Golden Hour', desc: 'Warm golden accent', type: 'theme', price: 150, color: '#F39C12' },
  { id: 'title_champion', name: 'Champion', desc: 'Title: Champion of the Realm', type: 'title', price: 200, value: 'Champion of the Realm' },
  { id: 'title_sage', name: 'Wise Sage', desc: 'Title: The Wise Sage', type: 'title', price: 200, value: 'The Wise Sage' },
  { id: 'title_legend', name: 'Living Legend', desc: 'Title: Living Legend', type: 'title', price: 300, value: 'Living Legend' },
  { id: 'shield_dragon', name: 'Dragon Shield', desc: 'Epic dragon crest icon', type: 'shield', price: 250, icon: 'flame' },
  { id: 'shield_lion', name: 'Lion Crest', desc: 'Noble lion emblem', type: 'shield', price: 250, icon: 'paw' },
  { id: 'shield_phoenix', name: 'Phoenix Badge', desc: 'Rising phoenix icon', type: 'shield', price: 300, icon: 'rocket' },
  { id: 'boost_2x', name: '2x XP Boost', desc: 'Double XP for 24 hours', type: 'boost', price: 150, duration: 86400000 },
  { id: 'protection', name: 'Punishment Shield', desc: 'Block next punishment', type: 'protection', price: 200 },
  { id: 'extra_reminder', name: 'Extra Reminder', desc: 'Add second reminder to any task', type: 'feature', price: 100 },
];

const DEFAULT_TAGS = [
  { id: 'tag_urgent', name: 'Urgent', color: '#E74C3C' },
  { id: 'tag_important', name: 'Important', color: '#F39C12' },
  { id: 'tag_quick', name: 'Quick Win', color: '#27AE60' },
  { id: 'tag_deep', name: 'Deep Work', color: '#8E44AD' },
  { id: 'tag_errand', name: 'Errand', color: '#3498DB' },
];

const ACHIEVEMENTS = [
  { id: 'first_task', title: 'First Quest', desc: 'Complete your first task', icon: 'scroll', unlocked: false },
  { id: 'ten_tasks', title: 'Deca Warrior', desc: 'Complete 10 tasks', icon: 'ribbon', unlocked: false },
  { id: 'fifty_tasks', title: 'Half Century', desc: 'Complete 50 tasks', icon: 'trophy', unlocked: false },
  { id: 'hundred_tasks', title: 'Century Master', desc: 'Complete 100 tasks', icon: 'medal', unlocked: false },
  { id: 'streak_3', title: 'Streak Starter', desc: '3-day habit streak', icon: 'flame', unlocked: false },
  { id: 'streak_7', title: 'Week Warrior', desc: '7-day habit streak', icon: 'flash', unlocked: false },
  { id: 'streak_30', title: 'Monthly Legend', desc: '30-day habit streak', icon: 'star', unlocked: false },
  { id: 'pomodoro_5', title: 'Focus Apprentice', desc: 'Complete 5 pomodoros', icon: 'timer', unlocked: false },
  { id: 'pomodoro_25', title: 'Focus Master', desc: 'Complete 25 pomodoros', icon: 'hourglass', unlocked: false },
  { id: 'level_5', title: 'Rising Noble', desc: 'Reach level 5', icon: 'shield', unlocked: false },
  { id: 'level_10', title: 'True Monarch', desc: 'Reach level 10', icon: 'diamond', unlocked: false },
  { id: 'perfect_week', title: 'Perfect Week', desc: 'Complete all habits for 7 days', icon: 'checkmark-done', unlocked: false },
  { id: 'early_bird', title: 'Early Bird', desc: 'Complete a task before 8 AM', icon: 'sunny', unlocked: false },
  { id: 'night_owl', title: 'Night Owl', desc: 'Complete a task after 11 PM', icon: 'moon', unlocked: false },
  { id: 'rich', title: 'Royal Treasury', desc: 'Accumulate 500 coins', icon: 'cash', unlocked: false },
  { id: 'no_punishment', title: 'Untouchable', desc: 'Go 7 days without punishment', icon: 'heart', unlocked: false },
  { id: 'first_challenge', title: 'Challenger', desc: 'Complete your first daily challenge', icon: 'trophy', unlocked: false },
  { id: 'five_challenges', title: 'Challenge Veteran', desc: 'Complete 5 daily challenges', icon: 'ribbon', unlocked: false },
  { id: 'shop_first', title: 'First Purchase', desc: 'Buy your first shop item', icon: 'cart', unlocked: false },
  { id: 'time_10h', title: 'Time Lord', desc: 'Track 10 hours of work', icon: 'hourglass', unlocked: false },
  { id: 'kanban_user', title: 'Board Master', desc: 'Move 10 tasks through Kanban columns', icon: 'grid', unlocked: false },
  { id: 'tagger', title: 'Tag Master', desc: 'Apply tags to 20 tasks', icon: 'pricetag', unlocked: false },
];

const initialState = {
  todos: [],
  habits: [],
  countdowns: [],
  notes: [],
  pomodoroSessions: 0,
  xp: 0,
  coins: 100,
  achievements: ACHIEVEMENTS,
  punishmentEnabled: false,
  punishmentCount: 0,
  punishmentReasons: [],
  streakDays: 0,
  lastActiveDate: null,
  isLoading: true,
  tags: DEFAULT_TAGS,
  dailyChallenge: null,
  challengesCompleted: [],
  challengeStreak: 0,
  timeEntries: [],
  activeTimeEntry: null,
  shopItems: SHOP_ITEMS,
  unlockedShopItems: [],
  activeThemeAccent: null,
  activeTitle: null,
  activeShield: null,
  xpBoostEnd: null,
  hasProtection: false,
  kanbanMoved: 0,
  tagsApplied: 0,
  viewMode: 'list',
  moodEntries: [],
  consistencyHistory: [],
  weeklyReportCards: [],
  totalFinesPaid: 0,
  longestStreak: 0,
  disciplineRank: 'Unranked',
  lastDisciplineCheck: null,
  dailyLoginStreak: 0,
  lastLoginDate: null,
  dailyRewardClaimed: false,
  mysteryBoxes: 0,
  openedBoxes: [],
  seasonalEvent: null,
  seasonalEventProgress: 0,
  seasonalEventCompleted: false,
  xpLeaderboard: [],
};

function getLevel(xp) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xp) current = level;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.xp > current.xp);
  const progress = nextLevel ? (xp - current.xp) / (nextLevel.xp - current.xp) : 1;
  return { ...current, progress, nextXp: nextLevel ? nextLevel.xp : null };
}

function generateDailyChallenge(todos, habits) {
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const challenges = [
    { id: 'complete_3', title: 'Complete 3 Quests', desc: 'Finish any 3 tasks today', target: 3, type: 'tasks', reward: { xp: 50, coins: 20 } },
    { id: 'complete_5', title: 'Quest Marathon', desc: 'Complete 5 tasks in one day', target: 5, type: 'tasks', reward: { xp: 100, coins: 40 } },
    { id: 'habit_all', title: 'Ritual Master', desc: 'Complete all your rituals today', target: -1, type: 'habits', reward: { xp: 75, coins: 30 } },
    { id: 'focus_2', title: 'Deep Focus', desc: 'Complete 2 pomodoro sessions', target: 2, type: 'pomodoros', reward: { xp: 40, coins: 15 } },
    { id: 'early_start', title: 'Dawn Raider', desc: 'Complete a task before 10 AM', target: 1, type: 'early', reward: { xp: 30, coins: 10 } },
    { id: 'journal', title: 'Chronicler', desc: 'Write a journal entry today', target: 1, type: 'notes', reward: { xp: 25, coins: 10 } },
    { id: 'high_priority', title: 'Critical Mission', desc: 'Complete a high priority task', target: 1, type: 'high_priority', reward: { xp: 60, coins: 25 } },
  ];
  return { ...challenges[seed % challenges.length], date: today, progress: 0, completed: false };
}

function getTodayActivity(todos, habits, notes) {
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  todos.forEach(t => {
    if (t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === today) count++;
  });
  habits.forEach(h => {
    if (h.completedDates.includes(today)) count++;
  });
  notes.forEach(n => {
    if (new Date(n.createdAt).toISOString().split('T')[0] === today) count++;
  });
  return count;
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOAD_DATA':
      return {
        ...state,
        todos: action.payload.todos || [],
        habits: action.payload.habits || [],
        countdowns: action.payload.countdowns || [],
        notes: action.payload.notes || [],
        pomodoroSessions: action.payload.pomodoroSessions || 0,
        xp: action.payload.xp || 0,
        coins: action.payload.coins || 100,
        achievements: action.payload.achievements || ACHIEVEMENTS,
        punishmentEnabled: action.payload.punishmentEnabled || false,
        punishmentCount: action.payload.punishmentCount || 0,
        punishmentReasons: action.payload.punishmentReasons || [],
        streakDays: action.payload.streakDays || 0,
        lastActiveDate: action.payload.lastActiveDate || null,
        tags: action.payload.tags || DEFAULT_TAGS,
        dailyChallenge: action.payload.dailyChallenge || null,
        challengesCompleted: action.payload.challengesCompleted || [],
        challengeStreak: action.payload.challengeStreak || 0,
        timeEntries: action.payload.timeEntries || [],
        activeTimeEntry: action.payload.activeTimeEntry || null,
        unlockedShopItems: action.payload.unlockedShopItems || [],
        activeThemeAccent: action.payload.activeThemeAccent || null,
        activeTitle: action.payload.activeTitle || null,
        activeShield: action.payload.activeShield || null,
        xpBoostEnd: action.payload.xpBoostEnd || null,
        hasProtection: action.payload.hasProtection || false,
        kanbanMoved: action.payload.kanbanMoved || 0,
        tagsApplied: action.payload.tagsApplied || 0,
        viewMode: action.payload.viewMode || 'list',
        moodEntries: action.payload.moodEntries || [],
        consistencyHistory: action.payload.consistencyHistory || [],
        weeklyReportCards: action.payload.weeklyReportCards || [],
        totalFinesPaid: action.payload.totalFinesPaid || 0,
        longestStreak: action.payload.longestStreak || 0,
        disciplineRank: action.payload.disciplineRank || 'Unranked',
        dailyLoginStreak: action.payload.dailyLoginStreak || 0,
        lastLoginDate: action.payload.lastLoginDate || null,
        dailyRewardClaimed: action.payload.dailyRewardClaimed || false,
        mysteryBoxes: action.payload.mysteryBoxes || 0,
        openedBoxes: action.payload.openedBoxes || [],
        seasonalEvent: action.payload.seasonalEvent || null,
        seasonalEventProgress: action.payload.seasonalEventProgress || 0,
        seasonalEventCompleted: action.payload.seasonalEventCompleted || false,
        isLoading: false,
      };

    // --- Todo ---
    case 'ADD_TODO':
      return { ...state, todos: [action.payload, ...state.todos] };
    case 'UPDATE_TODO':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case 'DELETE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null, status: !t.completed ? 'done' : (t.status || 'todo') } : t
        ),
      };
    case 'SET_TODO_STATUS':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload.id ? { ...t, status: action.payload.status, completed: action.payload.status === 'done', completedAt: action.payload.status === 'done' ? (t.completedAt || new Date().toISOString()) : null } : t
        ),
        kanbanMoved: state.kanbanMoved + 1,
      };

    // --- Subtasks ---
    case 'ADD_SUBTASK':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.todoId ? { ...t, subtasks: [...(t.subtasks || []), action.payload.subtask] } : t) };
    case 'TOGGLE_SUBTASK':
      return { ...state, todos: state.todos.map(t => { if (t.id === action.payload.todoId) { return { ...t, subtasks: (t.subtasks || []).map(s => s.id === action.payload.subtaskId ? { ...s, completed: !s.completed } : s) }; } return t; }) };
    case 'DELETE_SUBTASK':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.todoId ? { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== action.payload.subtaskId) } : t) };

    // --- Habits ---
    case 'ADD_HABIT':
      return { ...state, habits: [action.payload, ...state.habits] };
    case 'TOGGLE_HABIT_DATE': {
      return { ...state, habits: state.habits.map(h => { if (h.id === action.payload.habitId) { const dateStr = action.payload.dateStr; const exists = h.completedDates.includes(dateStr); return { ...h, completedDates: exists ? h.completedDates.filter(d => d !== dateStr) : [...h.completedDates, dateStr] }; } return h; }) };
    }
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };
    case 'UPDATE_HABIT':
      return { ...state, habits: state.habits.map(h => h.id === action.payload.id ? { ...h, ...action.payload } : h) };

    // --- Countdowns ---
    case 'ADD_COUNTDOWN':
      return { ...state, countdowns: [action.payload, ...state.countdowns] };
    case 'UPDATE_COUNTDOWN':
      return { ...state, countdowns: state.countdowns.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c) };
    case 'DELETE_COUNTDOWN':
      return { ...state, countdowns: state.countdowns.filter(c => c.id !== action.payload) };

    // --- Notes ---
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'UPDATE_NOTE':
      return { ...state, notes: state.notes.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n) };
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };

    // --- Tags ---
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.payload] };
    case 'DELETE_TAG':
      return { ...state, tags: state.tags.filter(t => t.id !== action.payload), todos: state.todos.map(t => ({ ...t, tagIds: (t.tagIds || []).filter(id => id !== action.payload) })) };
    case 'ASSIGN_TAG':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.todoId ? { ...t, tagIds: [...new Set([...(t.tagIds || []), action.payload.tagId])] } : t), tagsApplied: state.tagsApplied + 1 };
    case 'REMOVE_TAG_FROM_TASK':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.todoId ? { ...t, tagIds: (t.tagIds || []).filter(id => id !== action.payload.tagId) } : t) };

    // --- XP / Coins ---
    case 'ADD_XP':
      return { ...state, xp: state.xp + action.payload };
    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload };
    case 'SPEND_COINS':
      return { ...state, coins: Math.max(0, state.coins - action.payload) };

    // --- Achievements ---
    case 'UNLOCK_ACHIEVEMENT':
      return { ...state, achievements: state.achievements.map(a => a.id === action.payload ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a) };

    // --- Punishment ---
    case 'TOGGLE_PUNISHMENT':
      return { ...state, punishmentEnabled: !state.punishmentEnabled };
    case 'APPLY_PUNISHMENT':
      if (state.hasProtection) return { ...state, hasProtection: false, punishmentReasons: [...state.punishmentReasons, { reason: action.payload.reason + ' (shielded)', date: new Date().toISOString(), coinsLost: 0 }] };
      return { ...state, punishmentCount: state.punishmentCount + 1, coins: Math.max(0, state.coins - PUNISHMENT_FINE), punishmentReasons: [...state.punishmentReasons, { reason: action.payload.reason, date: new Date().toISOString(), coinsLost: PUNISHMENT_FINE }] };

    // --- Streak ---
    case 'UPDATE_STREAK':
      return { ...state, streakDays: action.payload.streakDays, lastActiveDate: action.payload.lastActiveDate };

    // --- Pomodoro ---
    case 'INCREMENT_POMODORO':
      return { ...state, pomodoroSessions: state.pomodoroSessions + 1 };

    // --- Daily Challenge ---
    case 'SET_DAILY_CHALLENGE':
      return { ...state, dailyChallenge: action.payload };
    case 'UPDATE_CHALLENGE_PROGRESS':
      return { ...state, dailyChallenge: state.dailyChallenge ? { ...state.dailyChallenge, progress: action.payload } : null };
    case 'COMPLETE_DAILY_CHALLENGE':
      return {
        ...state,
        dailyChallenge: state.dailyChallenge ? { ...state.dailyChallenge, completed: true } : null,
        challengesCompleted: [...state.challengesCompleted, { id: state.dailyChallenge?.id, date: new Date().toISOString().split('T')[0] }],
        challengeStreak: state.challengeStreak + 1,
      };

    // --- Time Tracking ---
    case 'START_TIME_ENTRY':
      return { ...state, activeTimeEntry: action.payload };
    case 'STOP_TIME_ENTRY':
      return {
        ...state,
        activeTimeEntry: null,
        timeEntries: [...state.timeEntries, action.payload],
      };
    case 'CLEAR_TIME_ENTRY':
      return { ...state, activeTimeEntry: null };

    // --- Shop ---
    case 'PURCHASE_SHOP_ITEM': {
      const item = SHOP_ITEMS.find(i => i.id === action.payload);
      if (!item || state.coins < item.price) return state;
      const newState = { ...state, coins: state.coins - item.price, unlockedShopItems: [...state.unlockedShopItems, action.payload] };
      if (item.type === 'theme') newState.activeThemeAccent = item.color;
      if (item.type === 'title') newState.activeTitle = item.value;
      if (item.type === 'shield') newState.activeShield = item.icon;
      if (item.type === 'boost') newState.xpBoostEnd = Date.now() + item.duration;
      if (item.type === 'protection') newState.hasProtection = true;
      return newState;
    }

    // --- View Mode ---
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    // --- Mood ---
    case 'ADD_MOOD_ENTRY': {
      const { date, mood, energy } = action.payload;
      const existing = state.moodEntries.findIndex(e => e.date === date);
      const entries = [...state.moodEntries];
      if (existing >= 0) {
        entries[existing] = { ...entries[existing], mood, energy };
      } else {
        entries.push({ date, mood, energy });
      }
      return { ...state, moodEntries: entries };
    }

    case 'LOG_DAILY_CONSISTENCY': {
  const { date, score, tasksCompleted, tasksTotal, habitsCompleted, habitsTotal, overdueCount } = action.payload;
  const history = [...state.consistencyHistory];
  const existing = history.findIndex(h => h.date === date);
  const entry = { date, score, tasksCompleted, tasksTotal, habitsCompleted, habitsTotal, overdueCount };
  if (existing >= 0) history[existing] = entry; else history.push(entry);
  const recentScores = history.slice(-30).map(h => h.score);
  const avgScore = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
  let rank = 'Unranked';
  if (avgScore >= 95) rank = 'Legendary';
  else if (avgScore >= 85) rank = 'Elite';
  else if (avgScore >= 70) rank = 'Disciplined';
  else if (avgScore >= 50) rank = 'Wavering';
  else if (avgScore >= 30) rank = 'Struggling';
  else if (history.length > 0) rank = 'Undisciplined';
  return { ...state, consistencyHistory: history, disciplineRank: rank, lastDisciplineCheck: new Date().toISOString() };
}
case 'APPLY_OVERDUE_FINE': {
  if (state.hasProtection) return { ...state, hasProtection: false };
  const fine = action.payload.amount;
  return { ...state, coins: Math.max(0, state.coins - fine), totalFinesPaid: state.totalFinesPaid + fine, punishmentCount: state.punishmentCount + 1, punishmentReasons: [...state.punishmentReasons, { reason: action.payload.reason, date: new Date().toISOString(), coinsLost: fine }] };
}
case 'UPDATE_LONGEST_STREAK': {
  const newLongest = Math.max(state.longestStreak, action.payload);
  return { ...state, longestStreak: newLongest, streakDays: action.payload };
}
case 'ADD_WEEKLY_REPORT': {
  const reports = [...state.weeklyReportCards];
  const exists = reports.findIndex(r => r.weekStart === action.payload.weekStart);
  if (exists >= 0) reports[exists] = action.payload; else reports.push(action.payload);
  return { ...state, weeklyReportCards: reports.slice(-12) };
}

    case 'CLAIM_DAILY_REWARD': {
  const streak = state.dailyLoginStreak;
  const rewardIndex = Math.min(streak, DAILY_REWARDS.length - 1);
  const coins = DAILY_REWARDS[rewardIndex];
  const mysteryChance = Math.random();
  let newBox = 0;
  if (mysteryChance < 0.15) newBox = 1;
  return {
    ...state,
    coins: state.coins + coins + (newBox > 0 ? 0 : 0),
    mysteryBoxes: state.mysteryBoxes + newBox,
    dailyLoginStreak: streak + 1,
    lastLoginDate: new Date().toISOString().split('T')[0],
    dailyRewardClaimed: true,
    xp: state.xp + (streak + 1) * 5,
  };
}
case 'OPEN_MYSTERY_BOX': {
  if (state.mysteryBoxes <= 0) return state;
  const roll = Math.random();
  let tier = 'common';
  let cumulative = 0;
  for (const [t, chance] of Object.entries(MYSTERY_BOX_CHANCES)) {
    cumulative += chance;
    if (roll < cumulative) { tier = t; break; }
  }
  const possibleRewards = MYSTERY_BOX_REWARDS[tier];
  const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
  let newState = { ...state, mysteryBoxes: state.mysteryBoxes - 1, openedBoxes: [...state.openedBoxes, { tier, reward, date: new Date().toISOString() }].slice(-20) };
  if (reward.type === 'coins') newState.coins = (newState.coins || 0) + reward.amount;
  if (reward.type === 'xp') newState.xp = (newState.xp || 0) + reward.amount;
  if (reward.type === 'xp_boost') newState.xpBoostEnd = Date.now() + reward.amount * 3600000;
  if (reward.type === 'protection') newState.hasProtection = true;
  return newState;
}
case 'SET_SEASONAL_EVENT': {
  return { ...state, seasonalEvent: action.payload, seasonalEventProgress: 0, seasonalEventCompleted: false };
}
case 'UPDATE_SEASONAL_PROGRESS': {
  return { ...state, seasonalEventProgress: action.payload };
}
case 'COMPLETE_SEASONAL_EVENT': {
  if (!state.seasonalEvent) return state;
  return { ...state, seasonalEventCompleted: true, coins: state.coins + (state.seasonalEvent.reward?.coins || 0), xp: state.xp + (state.seasonalEvent.reward?.xp || 0) };
}

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (!state.isLoading) {
      const data = {
        todos: state.todos, habits: state.habits, countdowns: state.countdowns, notes: state.notes,
        pomodoroSessions: state.pomodoroSessions, xp: state.xp, coins: state.coins,
        achievements: state.achievements, punishmentEnabled: state.punishmentEnabled,
        punishmentCount: state.punishmentCount, punishmentReasons: state.punishmentReasons,
        streakDays: state.streakDays, lastActiveDate: state.lastActiveDate,
        tags: state.tags, dailyChallenge: state.dailyChallenge,
        challengesCompleted: state.challengesCompleted, challengeStreak: state.challengeStreak,
        timeEntries: state.timeEntries, activeTimeEntry: state.activeTimeEntry,
        unlockedShopItems: state.unlockedShopItems, activeThemeAccent: state.activeThemeAccent,
        activeTitle: state.activeTitle, activeShield: state.activeShield,
        xpBoostEnd: state.xpBoostEnd, hasProtection: state.hasProtection,
        kanbanMoved: state.kanbanMoved, tagsApplied: state.tagsApplied,
        viewMode: state.viewMode, moodEntries: state.moodEntries,
        consistencyHistory: state.consistencyHistory, weeklyReportCards: state.weeklyReportCards,
        totalFinesPaid: state.totalFinesPaid, longestStreak: state.longestStreak, disciplineRank: state.disciplineRank,
        dailyLoginStreak: state.dailyLoginStreak, lastLoginDate: state.lastLoginDate,
        dailyRewardClaimed: state.dailyRewardClaimed, mysteryBoxes: state.mysteryBoxes,
        openedBoxes: state.openedBoxes, seasonalEvent: state.seasonalEvent,
        seasonalEventProgress: state.seasonalEventProgress, seasonalEventCompleted: state.seasonalEventCompleted,
      };
      saveData(KEYS.APP_DATA, data);
    }
  }, [state.todos, state.habits, state.countdowns, state.notes, state.isLoading, state.xp, state.coins, state.tags, state.dailyChallenge, state.timeEntries, state.unlockedShopItems, state.activeThemeAccent, state.activeTitle, state.activeShield, state.viewMode, state.moodEntries, state.consistencyHistory, state.weeklyReportCards]);

  useEffect(() => {
    state.todos.forEach(todo => {
      if (todo.reminderTime && !todo.completed) scheduleTodoReminder(todo);
    });
    state.habits.forEach(habit => {
      if (habit.reminderTime) scheduleHabitReminder(habit);
    });
  }, [state.todos, state.habits]);

  useEffect(() => {
    if (!state.isLoading && !state.dailyChallenge) {
      const today = new Date().toISOString().split('T')[0];
      const alreadyDone = state.challengesCompleted.some(c => c.date === today);
      if (!alreadyDone) {
        dispatch({ type: 'SET_DAILY_CHALLENGE', payload: generateDailyChallenge(state.todos, state.habits) });
      }
    }
  }, [state.isLoading]);

  const loadInitialData = async () => {
    try {
      const data = await loadData(KEYS.APP_DATA);
      if (data) dispatch({ type: 'LOAD_DATA', payload: data });
      else dispatch({ type: 'LOAD_DATA', payload: {} });
    } catch (e) {
      console.error('Failed to load data:', e);
      dispatch({ type: 'LOAD_DATA', payload: {} });
    }
  };

  const getEffectiveXp = useCallback((amount) => {
    if (state.xpBoostEnd && Date.now() < state.xpBoostEnd) return amount * 2;
    return amount;
  }, [state.xpBoostEnd]);

  // --- Todo actions ---
  const addTodo = useCallback((todo) => {
    const newTodo = { ...todo, id: Date.now().toString(), createdAt: new Date().toISOString(), completed: false, subtasks: todo.subtasks || [], recurring: todo.recurring || null, tagIds: todo.tagIds || [], status: 'todo', timeSpent: 0 };
    dispatch({ type: 'ADD_TODO', payload: newTodo });
    if (newTodo.reminderTime) scheduleTodoReminder(newTodo);
    return newTodo;
  }, []);

  const updateTodo = useCallback((todo) => dispatch({ type: 'UPDATE_TODO', payload: todo }), []);
  const deleteTodo = useCallback((id) => { dispatch({ type: 'DELETE_TODO', payload: id }); cancelNotification(id); }, []);

  const toggleTodo = useCallback((id) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo && !todo.completed) {
      const xpGain = getEffectiveXp(XP_PER_TASK);
      dispatch({ type: 'ADD_XP', payload: xpGain });
      dispatch({ type: 'ADD_COINS', payload: COINS_PER_TASK });
      checkAchievements(state.xp + xpGain, { ...state, coins: state.coins + COINS_PER_TASK });
    }
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  }, [state.todos, state.xp, state.coins, getEffectiveXp]);

  const setTodoStatus = useCallback((id, status) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo && !todo.completed && status === 'done') {
      const xpGain = getEffectiveXp(XP_PER_TASK);
      dispatch({ type: 'ADD_XP', payload: xpGain });
      dispatch({ type: 'ADD_COINS', payload: COINS_PER_TASK });
    }
    dispatch({ type: 'SET_TODO_STATUS', payload: { id, status } });
  }, [state.todos, state.xp, state.coins, getEffectiveXp]);

  const addSubtask = useCallback((todoId, subtask) => {
    dispatch({ type: 'ADD_SUBTASK', payload: { todoId, subtask: { id: Date.now().toString(), title: subtask.title, completed: false } } });
  }, []);
  const toggleSubtask = useCallback((todoId, subtaskId) => dispatch({ type: 'TOGGLE_SUBTASK', payload: { todoId, subtaskId } }), []);
  const deleteSubtask = useCallback((todoId, subtaskId) => dispatch({ type: 'DELETE_SUBTASK', payload: { todoId, subtaskId } }), []);

  // --- Tag actions ---
  const addTag = useCallback((tag) => dispatch({ type: 'ADD_TAG', payload: { ...tag, id: 'tag_' + Date.now().toString() } }), []);
  const deleteTag = useCallback((id) => dispatch({ type: 'DELETE_TAG', payload: id }), []);
  const assignTag = useCallback((todoId, tagId) => dispatch({ type: 'ASSIGN_TAG', payload: { todoId, tagId } }), []);
  const removeTagFromTask = useCallback((todoId, tagId) => dispatch({ type: 'REMOVE_TAG_FROM_TASK', payload: { todoId, tagId } }), []);

  // --- Habit actions ---
  const addHabit = useCallback((habit) => {
    const newHabit = { ...habit, id: Date.now().toString(), createdAt: new Date().toISOString(), completedDates: [] };
    dispatch({ type: 'ADD_HABIT', payload: newHabit });
    if (newHabit.reminderTime) scheduleHabitReminder(newHabit);
    return newHabit;
  }, []);

  const toggleHabitDate = useCallback((habitId, dateStr) => {
    const habit = state.habits.find(h => h.id === habitId);
    if (habit && !habit.completedDates.includes(dateStr)) {
      const xpGain = getEffectiveXp(XP_PER_HABIT);
      dispatch({ type: 'ADD_XP', payload: xpGain });
      dispatch({ type: 'ADD_COINS', payload: COINS_PER_HABIT });
    }
    dispatch({ type: 'TOGGLE_HABIT_DATE', payload: { habitId, dateStr } });
  }, [state.habits, state.xp, getEffectiveXp]);

  const deleteHabit = useCallback((id) => { dispatch({ type: 'DELETE_HABIT', payload: id }); cancelNotification(id); }, []);
  const updateHabit = useCallback((habit) => dispatch({ type: 'UPDATE_HABIT', payload: habit }), []);

  // --- Countdown actions ---
  const addCountdown = useCallback((countdown) => {
    const newCountdown = { ...countdown, id: Date.now().toString(), createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_COUNTDOWN', payload: newCountdown });
    return newCountdown;
  }, []);
  const updateCountdown = useCallback((countdown) => dispatch({ type: 'UPDATE_COUNTDOWN', payload: countdown }), []);
  const deleteCountdown = useCallback((id) => dispatch({ type: 'DELETE_COUNTDOWN', payload: id }), []);

  // --- Note actions ---
  const addNote = useCallback((note) => {
    const newNote = { ...note, id: Date.now().toString(), createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
    return newNote;
  }, []);
  const updateNote = useCallback((note) => dispatch({ type: 'UPDATE_NOTE', payload: note }), []);
  const deleteNote = useCallback((id) => dispatch({ type: 'DELETE_NOTE', payload: id }), []);

  // --- Pomodoro ---
  const completePomodoro = useCallback(() => {
    dispatch({ type: 'INCREMENT_POMODORO' });
    const xpGain = getEffectiveXp(XP_PER_POMODORO);
    dispatch({ type: 'ADD_XP', payload: xpGain });
    checkAchievements(state.xp + xpGain, state);
  }, [state.xp, state, getEffectiveXp]);

  // --- Punishment ---
  const applyPunishment = useCallback((reason) => dispatch({ type: 'APPLY_PUNISHMENT', payload: { reason } }), []);
  const togglePunishment = useCallback(() => dispatch({ type: 'TOGGLE_PUNISHMENT' }), []);

  // --- Daily Challenge ---
  const updateChallengeProgress = useCallback((progress) => dispatch({ type: 'UPDATE_CHALLENGE_PROGRESS', payload: progress }), []);

  const completeDailyChallenge = useCallback(() => {
    if (!state.dailyChallenge || state.dailyChallenge.completed) return;
    dispatch({ type: 'COMPLETE_DAILY_CHALLENGE' });
    const xpGain = getEffectiveXp(state.dailyChallenge.reward.xp);
    dispatch({ type: 'ADD_XP', payload: xpGain });
    dispatch({ type: 'ADD_COINS', payload: state.dailyChallenge.reward.coins });
    checkAchievements(state.xp + xpGain, { ...state, coins: state.coins + state.dailyChallenge.reward.coins });
  }, [state.dailyChallenge, state.xp, state.coins, getEffectiveXp]);

  // --- Time Tracking ---
  const startTimeTracking = useCallback((taskId) => {
    dispatch({ type: 'START_TIME_ENTRY', payload: { id: Date.now().toString(), taskId, startTime: Date.now() } });
  }, []);

  const stopTimeTracking = useCallback(() => {
    if (!state.activeTimeEntry) return;
    const entry = { ...state.activeTimeEntry, endTime: Date.now(), duration: Date.now() - state.activeTimeEntry.startTime };
    dispatch({ type: 'STOP_TIME_ENTRY', payload: entry });
    const todo = state.todos.find(t => t.id === entry.taskId);
    if (todo) {
      dispatch({ type: 'UPDATE_TODO', payload: { id: entry.taskId, timeSpent: (todo.timeSpent || 0) + entry.duration } });
    }
    return entry;
  }, [state.activeTimeEntry, state.todos]);

  const clearTimeEntry = useCallback(() => dispatch({ type: 'CLEAR_TIME_ENTRY' }), []);

  // --- Shop ---
  const purchaseShopItem = useCallback((itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || state.coins < item.price) return false;
    dispatch({ type: 'PURCHASE_SHOP_ITEM', payload: itemId });
    checkAchievements(state.xp, { ...state, coins: state.coins - item.price });
    return true;
  }, [state.coins, state.xp]);

  // --- View Mode ---
  const setViewMode = useCallback((mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }), []);

  // --- Achievement Checker ---
  const checkAchievements = (currentXp, currentState) => {
    const level = getLevel(currentXp);
    if (level.level >= 5) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'level_5' });
    if (level.level >= 10) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'level_10' });

    const completed = currentState.todos.filter(t => t.completed).length;
    if (completed >= 1) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'first_task' });
    if (completed >= 10) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'ten_tasks' });
    if (completed >= 50) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'fifty_tasks' });
    if (completed >= 100) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'hundred_tasks' });

    const hour = new Date().getHours();
    if (hour < 8) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'early_bird' });
    if (hour >= 23) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'night_owl' });

    if (currentState.coins >= 500) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'rich' });
    if (currentState.pomodoroSessions >= 5) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'pomodoro_5' });
    if (currentState.pomodoroSessions >= 25) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'pomodoro_25' });
    if (currentState.challengesCompleted?.length >= 1) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'first_challenge' });
    if (currentState.challengesCompleted?.length >= 5) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'five_challenges' });
    if (currentState.unlockedShopItems?.length >= 1) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'shop_first' });
    const totalTime = currentState.timeEntries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;
    if (totalTime >= 36000000) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'time_10h' });
    if (currentState.kanbanMoved >= 10) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'kanban_user' });
    if (currentState.tagsApplied >= 20) dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'tagger' });
  };

  // --- Stats ---
  const getTodoStats = useCallback(() => {
    const total = state.todos.length;
    const completed = state.todos.filter(t => t.completed).length;
    const overdue = state.todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    return { total, completed, overdue, pending: total - completed };
  }, [state.todos]);

  const getHabitStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = state.habits.length;
    const completedToday = state.habits.filter(h => h.completedDates.includes(today)).length;
    return { total, completedToday };
  }, [state.habits]);

  const getUpcomingCountdowns = useCallback(() => state.countdowns.filter(c => new Date(c.targetDate) >= new Date()).sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)).slice(0, 3), [state.countdowns]);

  const getTodosForDate = useCallback((dateStr) => state.todos.filter(t => { if (!t.dueDate) return false; return new Date(t.dueDate).toISOString().split('T')[0] === dateStr; }), [state.todos]);

  const getHeatmapData = useCallback(() => {
    const data = {};
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      data[key] = 0;
    }
    state.todos.forEach(t => {
      if (t.completedAt) {
        const key = new Date(t.completedAt).toISOString().split('T')[0];
        if (data[key] !== undefined) data[key]++;
      }
    });
    state.habits.forEach(h => {
      h.completedDates?.forEach(d => {
        if (data[d] !== undefined) data[d]++;
      });
    });
    state.notes.forEach(n => {
      const key = new Date(n.createdAt).toISOString().split('T')[0];
      if (data[key] !== undefined) data[key]++;
    });
    return data;
  }, [state.todos, state.habits, state.notes]);

  const getTotalTimeTracked = useCallback(() => state.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0), [state.timeEntries]);

  const addMoodEntry = useCallback((entry) => {
    dispatch({ type: 'ADD_MOOD_ENTRY', payload: entry });
  }, []);

  const logDailyConsistency = useCallback((data) => dispatch({ type: 'LOG_DAILY_CONSISTENCY', payload: data }), []);
  const applyOverdueFine = useCallback((reason, amount) => dispatch({ type: 'APPLY_OVERDUE_FINE', payload: { reason, amount } }), []);
  const addWeeklyReport = useCallback((report) => dispatch({ type: 'ADD_WEEKLY_REPORT', payload: report }), []);

  const calculateConsistency = useCallback(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const todayTasks = state.todos.filter(t => t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] === todayStr);
    const completedToday = todayTasks.filter(t => t.completed).length;
    const totalToday = todayTasks.length || 1;
    
    const todayHabits = state.habits.length;
    const habitsDone = state.habits.filter(h => h.completedDates.includes(todayStr)).length;
    
    const overdue = state.todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).length;
    
    const taskScore = totalToday > 0 ? (completedToday / totalToday) * 100 : (completedToday > 0 ? 100 : 0);
    const habitScore = todayHabits > 0 ? (habitsDone / todayHabits) * 100 : (habitsDone > 0 ? 100 : 0);
    const penaltyScore = Math.max(0, 100 - (overdue * 10));
    
    const score = Math.round((taskScore * 0.4 + habitScore * 0.4 + penaltyScore * 0.2));
    
    return { score: Math.min(100, Math.max(0, score)), tasksCompleted: completedToday, tasksTotal: todayTasks.length, habitsCompleted: habitsDone, habitsTotal: todayHabits, overdueCount: overdue };
  }, [state.todos, state.habits]);

  const generateWeeklyReport = useCallback(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const weekHistory = state.consistencyHistory.filter(h => h.date >= weekStartStr);
    const avgScore = weekHistory.length > 0 ? Math.round(weekHistory.reduce((s, h) => s + h.score, 0) / weekHistory.length) : 0;
    
    let grade = 'F';
    if (avgScore >= 90) grade = 'A+';
    else if (avgScore >= 80) grade = 'A';
    else if (avgScore >= 70) grade = 'B';
    else if (avgScore >= 60) grade = 'C';
    else if (avgScore >= 50) grade = 'D';
    
    const totalTasks = weekHistory.reduce((s, h) => s + h.tasksTotal, 0);
    const totalCompleted = weekHistory.reduce((s, h) => s + h.tasksCompleted, 0);
    const totalHabits = weekHistory.reduce((s, h) => s + h.habitsTotal, 0);
    const habitsDone = weekHistory.reduce((s, h) => s + h.habitsCompleted, 0);
    const totalOverdue = weekHistory.reduce((s, h) => s + h.overdueCount, 0);
    
    return { weekStart: weekStartStr, avgScore, grade, totalTasks, totalCompleted, totalHabits, habitsDone, totalOverdue, daysLogged: weekHistory.length };
  }, [state.consistencyHistory, state.todos, state.habits]);

  const claimDailyReward = useCallback(() => dispatch({ type: 'CLAIM_DAILY_REWARD' }), []);
  const openMysteryBox = useCallback(() => dispatch({ type: 'OPEN_MYSTERY_BOX' }), []);
  const setSeasonalEvent = useCallback((event) => dispatch({ type: 'SET_SEASONAL_EVENT', payload: event }), []);
  const updateSeasonalProgress = useCallback((progress) => dispatch({ type: 'UPDATE_SEASONAL_PROGRESS', payload: progress }), []);
  const completeSeasonalEvent = useCallback(() => dispatch({ type: 'COMPLETE_SEASONAL_EVENT' }), []);

  const searchAll = useCallback((query) => {
    const q = query.toLowerCase();
    return {
      todos: state.todos.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)),
      habits: state.habits.filter(h => h.name.toLowerCase().includes(q) || (h.description || '').toLowerCase().includes(q)),
      notes: state.notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)),
      countdowns: state.countdowns.filter(c => c.title.toLowerCase().includes(q)),
    };
  }, [state.todos, state.habits, state.notes, state.countdowns]);

  const exportData = useCallback(() => ({
    todos: state.todos, habits: state.habits, countdowns: state.countdowns, notes: state.notes,
    xp: state.xp, coins: state.coins, achievements: state.achievements, exportedAt: new Date().toISOString(),
  }), [state]);

  const value = {
    state, dispatch,
    addTodo, updateTodo, deleteTodo, toggleTodo, setTodoStatus,
    addSubtask, toggleSubtask, deleteSubtask,
    addTag, deleteTag, assignTag, removeTagFromTask,
    addHabit, toggleHabitDate, deleteHabit, updateHabit,
    addCountdown, updateCountdown, deleteCountdown,
    addNote, updateNote, deleteNote,
    completePomodoro, applyPunishment, togglePunishment,
    updateChallengeProgress, completeDailyChallenge,
    startTimeTracking, stopTimeTracking, clearTimeEntry,
    purchaseShopItem, setViewMode,
    getTodoStats, getHabitStats, getUpcomingCountdowns, getTodosForDate,
    getHeatmapData, getTotalTimeTracked,
    addMoodEntry,
    logDailyConsistency, applyOverdueFine, calculateConsistency, generateWeeklyReport, addWeeklyReport,
    claimDailyReward, openMysteryBox, setSeasonalEvent, updateSeasonalProgress, completeSeasonalEvent,
    searchAll, exportData, getLevel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export { getLevel, LEVELS, SHOP_ITEMS };
