import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { medievalDark, medievalLight, typography, spacing, borderRadius, animations } from './theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState('system');

  const isDark = mode === 'system'
    ? systemColorScheme === 'dark'
    : mode === 'dark';

  const theme = isDark ? medievalDark : medievalLight;

  const toggleTheme = () => {
    setMode(prev => {
      if (prev === 'system') return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  };

  const setSystemTheme = () => setMode('system');

  const value = {
    theme,
    mode,
    isDark,
    toggleTheme,
    setSystemTheme,
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
