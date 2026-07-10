import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { loadData, saveData, KEYS } from '../utils/storage';
import { scheduleTodoReminder, scheduleHabitReminder, cancelNotification } from '../utils/notifications';

const AppContext = createContext();

const XP_PER_TASK = 25;
const XP_PER_HABIT = 15;
const XP_PER_POMODORO = 10;
const COINS_PER_TASK = 5;
const COINS_PER_HABIT = 3;
const PUNISHMENT_FINE = 10;

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
        isLoading: false,
      };

    case 'ADD_TODO':
      return { ...state, todos: [action.payload, ...state.todos] };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      };

    case 'DELETE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : null,
          } : t
        ),
      };

    case 'ADD_SUBTASK':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload.todoId
            ? { ...t, subtasks: [...(t.subtasks || []), action.payload.subtask] }
            : t
        ),
      };

    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        todos: state.todos.map(t => {
          if (t.id === action.payload.todoId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map(s =>
                s.id === action.payload.subtaskId ? { ...s, completed: !s.completed } : s
              ),
            };
          }
          return t;
        }),
      };

    case 'DELETE_SUBTASK':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload.todoId
            ? { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== action.payload.subtaskId) }
            : t
        ),
      };

    case 'ADD_HABIT':
      return { ...state, habits: [action.payload, ...state.habits] };

    case 'TOGGLE_HABIT_DATE': {
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id === action.payload.habitId) {
            const dateStr = action.payload.dateStr;
            const exists = h.completedDates.includes(dateStr);
            return {
              ...h,
              completedDates: exists
                ? h.completedDates.filter(d => d !== dateStr)
                : [...h.completedDates, dateStr],
            };
          }
          return h;
        }),
      };
    }

    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => h.id === action.payload.id ? { ...h, ...action.payload } : h),
      };

    case 'ADD_COUNTDOWN':
      return { ...state, countdowns: [action.payload, ...state.countdowns] };

    case 'UPDATE_COUNTDOWN':
      return {
        ...state,
        countdowns: state.countdowns.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c),
      };

    case 'DELETE_COUNTDOWN':
      return { ...state, countdowns: state.countdowns.filter(c => c.id !== action.payload) };

    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] };

    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n),
      };

    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };

    case 'ADD_XP':
      return { ...state, xp: state.xp + action.payload };

    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload };

    case 'SPEND_COINS':
      return { ...state, coins: Math.max(0, state.coins - action.payload) };

    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(a =>
          a.id === action.payload ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a
        ),
      };

    case 'TOGGLE_PUNISHMENT':
      return { ...state, punishmentEnabled: !state.punishmentEnabled };

    case 'APPLY_PUNISHMENT':
      return {
        ...state,
        punishmentCount: state.punishmentCount + 1,
        coins: Math.max(0, state.coins - PUNISHMENT_FINE),
        punishmentReasons: [...state.punishmentReasons, {
          reason: action.payload.reason,
          date: new Date().toISOString(),
          coinsLost: PUNISHMENT_FINE,
        }],
      };

    case 'UPDATE_STREAK':
      return { ...state, streakDays: action.payload.streakDays, lastActiveDate: action.payload.lastActiveDate };

    case 'INCREMENT_POMODORO':
      return { ...state, pomodoroSessions: state.pomodoroSessions + 1 };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      const data = {
        todos: state.todos,
        habits: state.habits,
        countdowns: state.countdowns,
        notes: state.notes,
        pomodoroSessions: state.pomodoroSessions,
        xp: state.xp,
        coins: state.coins,
        achievements: state.achievements,
        punishmentEnabled: state.punishmentEnabled,
        punishmentCount: state.punishmentCount,
        punishmentReasons: state.punishmentReasons,
        streakDays: state.streakDays,
        lastActiveDate: state.lastActiveDate,
      };
      saveData(KEYS.APP_DATA, data);
    }
  }, [state.todos, state.habits, state.countdowns, state.notes, state.isLoading]);

  useEffect(() => {
    state.todos.forEach(todo => {
      if (todo.reminderTime && !todo.completed) {
        scheduleTodoReminder(todo);
      }
    });
    state.habits.forEach(habit => {
      if (habit.reminderTime) {
        scheduleHabitReminder(habit);
      }
    });
  }, [state.todos, state.habits]);

  const loadInitialData = async () => {
    try {
      const data = await loadData(KEYS.APP_DATA);
      if (data) {
        dispatch({ type: 'LOAD_DATA', payload: data });
      } else {
        dispatch({ type: 'LOAD_DATA', payload: {} });
      }
    } catch (e) {
      console.error('Failed to load data:', e);
      dispatch({ type: 'LOAD_DATA', payload: {} });
    }
  };

  const addTodo = useCallback((todo) => {
    const newTodo = {
      ...todo,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      subtasks: todo.subtasks || [],
      recurring: todo.recurring || null,
    };
    dispatch({ type: 'ADD_TODO', payload: newTodo });
    if (newTodo.reminderTime) scheduleTodoReminder(newTodo);
    return newTodo;
  }, []);

  const updateTodo = useCallback((todo) => {
    dispatch({ type: 'UPDATE_TODO', payload: todo });
  }, []);

  const deleteTodo = useCallback((id) => {
    dispatch({ type: 'DELETE_TODO', payload: id });
    cancelNotification(id);
  }, []);

  const toggleTodo = useCallback((id) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo && !todo.completed) {
      dispatch({ type: 'ADD_XP', payload: XP_PER_TASK });
      dispatch({ type: 'ADD_COINS', payload: COINS_PER_TASK });
      checkAchievements(state.xp + XP_PER_TASK, state);
    }
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  }, [state.todos, state.xp, state]);

  const addSubtask = useCallback((todoId, subtask) => {
    const newSubtask = { id: Date.now().toString(), title: subtask.title, completed: false };
    dispatch({ type: 'ADD_SUBTASK', payload: { todoId, subtask: newSubtask } });
  }, []);

  const toggleSubtask = useCallback((todoId, subtaskId) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { todoId, subtaskId } });
  }, []);

  const deleteSubtask = useCallback((todoId, subtaskId) => {
    dispatch({ type: 'DELETE_SUBTASK', payload: { todoId, subtaskId } });
  }, []);

  const addHabit = useCallback((habit) => {
    const newHabit = {
      ...habit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completedDates: [],
    };
    dispatch({ type: 'ADD_HABIT', payload: newHabit });
    if (newHabit.reminderTime) scheduleHabitReminder(newHabit);
    return newHabit;
  }, []);

  const toggleHabitDate = useCallback((habitId, dateStr) => {
    const habit = state.habits.find(h => h.id === habitId);
    if (habit && !habit.completedDates.includes(dateStr)) {
      dispatch({ type: 'ADD_XP', payload: XP_PER_HABIT });
      dispatch({ type: 'ADD_COINS', payload: COINS_PER_HABIT });
    }
    dispatch({ type: 'TOGGLE_HABIT_DATE', payload: { habitId, dateStr } });
  }, [state.habits, state.xp]);

  const deleteHabit = useCallback((id) => {
    dispatch({ type: 'DELETE_HABIT', payload: id });
    cancelNotification(id);
  }, []);

  const updateHabit = useCallback((habit) => {
    dispatch({ type: 'UPDATE_HABIT', payload: habit });
  }, []);

  const addCountdown = useCallback((countdown) => {
    const newCountdown = { ...countdown, id: Date.now().toString(), createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_COUNTDOWN', payload: newCountdown });
    return newCountdown;
  }, []);

  const updateCountdown = useCallback((countdown) => {
    dispatch({ type: 'UPDATE_COUNTDOWN', payload: countdown });
  }, []);

  const deleteCountdown = useCallback((id) => {
    dispatch({ type: 'DELETE_COUNTDOWN', payload: id });
  }, []);

  const addNote = useCallback((note) => {
    const newNote = { ...note, id: Date.now().toString(), createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
    return newNote;
  }, []);

  const updateNote = useCallback((note) => {
    dispatch({ type: 'UPDATE_NOTE', payload: note });
  }, []);

  const deleteNote = useCallback((id) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
  }, []);

  const completePomodoro = useCallback(() => {
    dispatch({ type: 'INCREMENT_POMODORO' });
    dispatch({ type: 'ADD_XP', payload: XP_PER_POMODORO });
    checkAchievements(state.xp + XP_PER_POMODORO, state);
  }, [state.xp, state]);

  const applyPunishment = useCallback((reason) => {
    dispatch({ type: 'APPLY_PUNISHMENT', payload: { reason } });
  }, []);

  const togglePunishment = useCallback(() => {
    dispatch({ type: 'TOGGLE_PUNISHMENT' });
  }, []);

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
  };

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

  const getUpcomingCountdowns = useCallback(() => {
    return state.countdowns
      .filter(c => new Date(c.targetDate) >= new Date())
      .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
      .slice(0, 3);
  }, [state.countdowns]);

  const getTodosForDate = useCallback((dateStr) => {
    return state.todos.filter(t => {
      if (!t.dueDate) return false;
      const todoDate = new Date(t.dueDate).toISOString().split('T')[0];
      return todoDate === dateStr;
    });
  }, [state.todos]);

  const searchAll = useCallback((query) => {
    const q = query.toLowerCase();
    return {
      todos: state.todos.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)),
      habits: state.habits.filter(h => h.name.toLowerCase().includes(q) || (h.description || '').toLowerCase().includes(q)),
      notes: state.notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)),
      countdowns: state.countdowns.filter(c => c.title.toLowerCase().includes(q)),
    };
  }, [state.todos, state.habits, state.notes, state.countdowns]);

  const exportData = useCallback(() => {
    return {
      todos: state.todos,
      habits: state.habits,
      countdowns: state.countdowns,
      notes: state.notes,
      xp: state.xp,
      coins: state.coins,
      achievements: state.achievements,
      exportedAt: new Date().toISOString(),
    };
  }, [state]);

  const value = {
    state,
    dispatch,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addHabit,
    toggleHabitDate,
    deleteHabit,
    updateHabit,
    addCountdown,
    updateCountdown,
    deleteCountdown,
    addNote,
    updateNote,
    deleteNote,
    completePomodoro,
    applyPunishment,
    togglePunishment,
    getTodoStats,
    getHabitStats,
    getUpcomingCountdowns,
    getTodosForDate,
    searchAll,
    exportData,
    getLevel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export { getLevel, LEVELS };
