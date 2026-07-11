import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme, typography, spacing, borderRadius, animations, ACCENT_PRESETS, CARD_STYLES, BG_STYLES } from './theme';

const THEME_STORAGE_KEY = '@lifeflow_theme_prefs';
const ThemeContext = createContext();

const DEFAULT_PREFS = {
  accentKey: 'gold',
  bgKey: 'midnight',
  cardStyleKey: 'glass',
  mode: 'system',
  layoutView: 'list',
  cardDensity: 'comfortable',
  widgetOrder: ['stats', 'quote', 'quicklinks', 'countdowns', 'mood', 'smartReminder'],
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(raw => {
      if (raw) {
        try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const savePrefs = useCallback((next) => {
    setPrefs(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const isDark = prefs.mode === 'system'
    ? systemColorScheme === 'dark'
    : prefs.mode === 'dark';

  const theme = buildTheme(prefs.accentKey, prefs.bgKey, prefs.cardStyleKey, isDark);

  const setAccent = useCallback((key) => savePrefs({ ...prefs, accentKey: key }), [prefs, savePrefs]);
  const setBgStyle = useCallback((key) => savePrefs({ ...prefs, bgKey: key }), [prefs, savePrefs]);
  const setCardStyle = useCallback((key) => savePrefs({ ...prefs, cardStyleKey: key }), [prefs, savePrefs]);

  const setMode = useCallback((mode) => savePrefs({ ...prefs, mode }), [prefs, savePrefs]);
  const setLayoutView = useCallback((v) => savePrefs({ ...prefs, layoutView: v }), [prefs, savePrefs]);
  const setCardDensity = useCallback((d) => savePrefs({ ...prefs, cardDensity: d }), [prefs, savePrefs]);
  const setWidgetOrder = useCallback((o) => savePrefs({ ...prefs, widgetOrder: o }), [prefs, savePrefs]);
  const toggleTheme = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  const value = {
    theme,
    mode: prefs.mode,
    isDark,
    loaded,
    accentKey: prefs.accentKey,
    bgKey: prefs.bgKey,
    cardStyleKey: prefs.cardStyleKey,
    layoutView: prefs.layoutView,
    cardDensity: prefs.cardDensity,
    widgetOrder: prefs.widgetOrder,
    setAccent,
    setBgStyle,
    setCardStyle,
    setMode,
    setLayoutView,
    setCardDensity,
    setWidgetOrder,
    toggleTheme,
    typography,
    spacing,
    borderRadius,
    animations,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
