import { Platform } from 'react-native';

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const ACCENT_PRESETS = {
  gold: { primary: '#C9A84C', primaryLight: '#E2CC7E', primaryDark: '#8B6914', gradient: ['#C9A84C', '#A08830'], glow: '#C9A84C' },
  purple: { primary: '#9B59B6', primaryLight: '#C39BD3', primaryDark: '#6C3483', gradient: ['#9B59B6', '#7D3C98'], glow: '#9B59B6' },
  blue: { primary: '#3498DB', primaryLight: '#85C1E9', primaryDark: '#21618C', gradient: ['#3498DB', '#2471A3'], glow: '#3498DB' },
  emerald: { primary: '#27AE60', primaryLight: '#82E0AA', primaryDark: '#1E8449', gradient: ['#27AE60', '#229954'], glow: '#27AE60' },
  crimson: { primary: '#E74C3C', primaryLight: '#F1948A', primaryDark: '#B03A2E', gradient: ['#E74C3C', '#CB4335'], glow: '#E74C3C' },
  ocean: { primary: '#2980B9', primaryLight: '#7FB3D8', primaryDark: '#1A5276', gradient: ['#2980B9', '#2471A3'], glow: '#2980B9' },
  sunset: { primary: '#F39C12', primaryLight: '#F8C471', primaryDark: '#B7950B', gradient: ['#F39C12', '#D68910'], glow: '#F39C12' },
  rose: { primary: '#E91E63', primaryLight: '#F48FB1', primaryDark: '#AD1457', gradient: ['#E91E63', '#C2185B'], glow: '#E91E63' },
  teal: { primary: '#009688', primaryLight: '#80CBC4', primaryDark: '#00695C', gradient: ['#009688', '#00897B'], glow: '#009688' },
  lavender: { primary: '#7E57C2', primaryLight: '#B39DDB', primaryDark: '#512DA8', gradient: ['#7E57C2', '#673AB7'], glow: '#7E57C2' },
};

const CARD_STYLES = {
  glass: {
    name: 'Glassmorphism',
    description: 'Frosted translucent cards',
    dark: {
      backgroundColor: 'rgba(23, 20, 28, 0.65)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      backdropBlur: true,
    },
    light: {
      backgroundColor: 'rgba(255, 252, 247, 0.72)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      backdropBlur: true,
    },
  },
  neumorph: {
    name: 'Neumorphism',
    description: 'Soft embossed shadows',
    dark: {
      backgroundColor: '#17141C',
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 6,
      innerShadow: { color: 'rgba(255,255,255,0.03)', offset: { width: -2, height: -2 }, blur: 4 },
    },
    light: {
      backgroundColor: '#FFFCF7',
      borderColor: 'transparent',
      shadowColor: '#D5CFC5',
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 6,
      innerShadow: { color: 'rgba(255,255,255,0.8)', offset: { width: -3, height: -3 }, blur: 6 },
    },
  },
  fluid: {
    name: 'Organic',
    description: 'Soft blob-like rounded shapes',
    dark: {
      backgroundColor: '#1F1C26',
      borderColor: 'rgba(255,255,255,0.04)',
      borderRadius: 24,
    },
    light: {
      backgroundColor: '#FFFCF7',
      borderColor: 'rgba(0,0,0,0.04)',
      borderRadius: 24,
    },
  },
  flat: {
    name: 'Minimal',
    description: 'Clean flat cards',
    dark: {
      backgroundColor: '#1F1C26',
      borderColor: '#262230',
    },
    light: {
      backgroundColor: '#FFFCF7',
      borderColor: '#DDD5C8',
    },
  },
};

const BG_STYLES = {
  deep: { name: 'Deep Space', dark: { bg: '#0A0810', surface: '#12101A', surfaceLight: '#1A1724' }, light: { bg: '#F5EDE0', surface: '#FFFCF7', surfaceLight: '#EDE5D8' } },
  midnight: { name: 'Midnight', dark: { bg: '#0E0C14', surface: '#16141E', surfaceLight: '#1E1C28' }, light: { bg: '#F0E8DA', surface: '#FBF8F3', surfaceLight: '#E8E0D2' } },
  ocean: { name: 'Deep Ocean', dark: { bg: '#0B1120', surface: '#131B2E', surfaceLight: '#1B253C' }, light: { bg: '#E8F0F8', surface: '#F5FAFF', surfaceLight: '#DCE8F2' } },
  forest: { name: 'Dark Forest', dark: { bg: '#0A1210', surface: '#121E1A', surfaceLight: '#1A2A24' }, light: { bg: '#E8F2EC', surface: '#F5FFF9', surfaceLight: '#D8EDE2' } },
  ember: { name: 'Ember Glow', dark: { bg: '#120A0A', surface: '#1E1212', surfaceLight: '#2A1A1A' }, light: { bg: '#F8EDE8', surface: '#FFF5F2', surfaceLight: '#F0DDD6' } },
  royal: { name: 'Royal Court', dark: { bg: '#0E0A14', surface: '#181220', surfaceLight: '#221C2C' }, light: { bg: '#F0E8F5', surface: '#FBF5FF', surfaceLight: '#E5DCF0' } },
};

function buildColors(accentKey, bgKey, isDark) {
  const accent = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.gold;
  const bg = BG_STYLES[bgKey] || BG_STYLES.midnight;
  const bgColors = isDark ? bg.dark : bg.light;

  if (isDark) {
    return {
      background: bgColors.bg,
      surface: bgColors.surface,
      surfaceLight: bgColors.surfaceLight,
      surfaceHighlight: '#272430',
      card: bgColors.surface,
      cardBorder: 'rgba(255,255,255,0.06)',
      text: '#E8E0D4',
      textSecondary: '#8A8298',
      textMuted: '#4E4860',
      primary: accent.primary,
      primaryLight: accent.primaryLight,
      primaryDark: accent.primaryDark,
      secondary: '#7A6B8A',
      secondaryLight: '#9A8FB0',
      accent: '#C25B4E',
      accentLight: '#D4796E',
      success: '#5B9A6F',
      warning: accent.primary,
      error: '#C25B4E',
      border: 'rgba(255,255,255,0.06)',
      borderLight: 'rgba(255,255,255,0.04)',
      overlay: 'rgba(0, 0, 0, 0.6)',
      gold: accent.primary,
      goldLight: accent.primaryLight,
      parchment: '#E8E0D4',
      parchmentDark: '#A89EB8',
      royal: '#7A6B8A',
      royalLight: '#9A8FB0',
      crimson: '#8B3A3A',
      crimsonLight: '#A04E4E',
      forest: '#3A6B4E',
      forestLight: '#4E8A62',
    };
  }

  return {
    background: bgColors.bg,
    surface: bgColors.surface,
    surfaceLight: bgColors.surfaceLight,
    surfaceHighlight: '#E0D8CB',
    card: bgColors.surface,
    cardBorder: 'rgba(0,0,0,0.06)',
    text: '#1A1720',
    textSecondary: '#6B637A',
    textMuted: '#A9A0B8',
    primary: accent.primaryDark,
    primaryLight: accent.primary,
    primaryDark: '#5D4509',
    secondary: '#6B5F78',
    secondaryLight: '#8A7E96',
    accent: '#A04840',
    accentLight: '#C25B4E',
    success: '#3D7A50',
    warning: accent.primaryDark,
    error: '#A04840',
    border: 'rgba(0,0,0,0.08)',
    borderLight: 'rgba(0,0,0,0.04)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    gold: accent.primaryDark,
    goldLight: accent.primary,
    parchment: '#1A1720',
    parchmentDark: '#6B637A',
    royal: '#6B5F78',
    royalLight: '#8A7E96',
    crimson: '#8B3A3A',
    crimsonLight: '#A04E4E',
    forest: '#3A6B4E',
    forestLight: '#4E8A62',
  };
}

function buildGradients(accentKey, isDark) {
  const accent = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.gold;
  if (isDark) {
    return {
      primary: accent.gradient,
      secondary: ['#5A4D6A', '#3E3450'],
      accent: ['#C25B4E', '#A04840'],
      surface: ['#17141C', '#110F16'],
      gold: [...accent.gradient, accent.primaryDark],
      royal: ['#9A8FB0', '#7A6B8A', '#5A4D6A'],
      hero: ['#0E0C11', '#14121A', '#1A1720'],
      card: ['#1F1C26', '#17141C'],
    };
  }
  return {
    primary: [accent.primaryDark, accent.primary],
    secondary: ['#6B5F78', '#524868'],
    accent: ['#A04840', '#883830'],
    surface: ['#FFFCF7', '#F5EDE0'],
    gold: [accent.primary, accent.primaryDark, '#6B5010'],
    royal: ['#8A7E96', '#6B5F78', '#524868'],
    hero: ['#F5EDE0', '#EDE5D8', '#E5DDD0'],
    card: ['#FFFCF7', '#F5EDE0'],
  };
}

function buildShadows(accentKey, isDark) {
  const accent = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.gold;
  if (isDark) {
    return {
      small: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
      medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
      large: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
      glow: { shadowColor: accent.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
    };
  }
  return {
    small: { shadowColor: '#1A1720', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
    medium: { shadowColor: '#1A1720', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4 },
    large: { shadowColor: '#1A1720', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
    glow: { shadowColor: accent.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 6 },
  };
}

export function buildTheme(accentKey = 'gold', bgKey = 'midnight', cardStyleKey = 'glass', isDark = true) {
  const accent = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.gold;
  const cardStyle = CARD_STYLES[cardStyleKey] || CARD_STYLES.glass;
  const cardColors = isDark ? cardStyle.dark : cardStyle.light;

  return {
    name: `${bgKey}_${accentKey}_${cardStyleKey}_${isDark ? 'dark' : 'light'}`,
    colors: buildColors(accentKey, bgKey, isDark),
    gradients: buildGradients(accentKey, isDark),
    shadows: buildShadows(accentKey, isDark),
    cardStyle: cardColors,
    accent: accent,
  };
}

export const typography = {
  hero: { fontSize: 44, fontWeight: '400', letterSpacing: 0.5, lineHeight: 52, fontFamily: serifFont },
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.3, lineHeight: 38, fontFamily: serifFont },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.2, lineHeight: 30, fontFamily: serifFont },
  h3: { fontSize: 18, fontWeight: '700', letterSpacing: -0.1, lineHeight: 26 },
  h4: { fontSize: 15, fontWeight: '600', letterSpacing: 0, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', letterSpacing: 0, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500', letterSpacing: 0, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600', letterSpacing: 0, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3, lineHeight: 18 },
  captionBold: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, lineHeight: 16 },
  button: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3, lineHeight: 22 },
  number: { fontSize: 36, fontWeight: '300', letterSpacing: -1, lineHeight: 44, fontFamily: serifFont },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48, massive: 64 };

export const borderRadius = { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, round: 9999 };

export const animations = {
  spring: { tension: 40, friction: 8 },
  springBouncy: { tension: 50, friction: 6 },
  springStiff: { tension: 60, friction: 10 },
  timing: { duration: 300 },
  timingSlow: { duration: 500 },
  timingFast: { duration: 150 },
};

export { ACCENT_PRESETS, CARD_STYLES, BG_STYLES };
