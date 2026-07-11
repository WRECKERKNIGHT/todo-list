import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
  Alert, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, getLevel } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView } from '../components/MedievalUI';
import { ACCENT_PRESETS, CARD_STYLES, BG_STYLES } from '../theme/theme';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const COLOR_SWATCH_SIZE = (width - 80) / 5;

function SettingRow({ icon, title, subtitle, onPress, rightComponent, color }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={[styles.settingRow, theme.cardStyle, { borderWidth: 1 }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIconWrap, { backgroundColor: (color || theme.colors.primary) + '15' }]}>
        <Ionicons name={icon} size={18} color={color || theme.colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {rightComponent}
    </TouchableOpacity>
  );
}

function ColorSwatch({ colorKey, label, isActive, onPress }) {
  const { theme, isDark } = useTheme();
  const preset = ACCENT_PRESETS[colorKey];
  const scale = useSharedValue(isActive ? 1 : 0.9);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.9, { damping: 12, stiffness: 300 });
  }, [isActive]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.swatchWrap, style]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        style={[styles.swatch, { backgroundColor: preset.primary }, isActive && { borderWidth: 3, borderColor: theme.colors.text }]}
      />
      <Text style={[styles.swatchLabel, { color: isActive ? theme.colors.text : theme.colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

function BgSwatch({ bgKey, label, isActive, onPress }) {
  const { theme, isDark } = useTheme();
  const bg = BG_STYLES[bgKey];
  const colors = isDark ? bg.dark : bg.light;
  const scale = useSharedValue(isActive ? 1 : 0.9);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.9, { damping: 12, stiffness: 300 });
  }, [isActive]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.bgSwatchWrap, style]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        style={[styles.bgSwatch, { backgroundColor: colors.bg }, isActive && { borderWidth: 2, borderColor: theme.colors.primary }]}
      >
        <View style={[styles.bgSwatchInner, { backgroundColor: colors.surface }]} />
        <View style={[styles.bgSwatchDot, { backgroundColor: colors.surfaceLight }]} />
      </TouchableOpacity>
      <Text style={[styles.swatchLabel, { color: isActive ? theme.colors.text : theme.colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

function CardStyleOption({ cardKey, label, description, isActive, onPress }) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(isActive ? 1 : 0.97);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.97, { damping: 12, stiffness: 300 });
  }, [isActive]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.cardOptionWrap, style]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        style={[
          styles.cardOption,
          { backgroundColor: theme.colors.surfaceLight, borderColor: isActive ? theme.colors.primary : 'transparent' },
          isActive && { borderWidth: 2 },
        ]}
      >
        <Ionicons
          name={cardKey === 'glass' ? 'cube-outline' : cardKey === 'neumorph' ? 'layers-outline' : cardKey === 'fluid' ? 'water-outline' : 'square-outline'}
          size={24}
          color={isActive ? theme.colors.primary : theme.colors.textMuted}
        />
        <Text style={[styles.cardOptionTitle, { color: isActive ? theme.colors.text : theme.colors.textMuted }]}>{label}</Text>
        <Text style={[styles.cardOptionDesc, { color: theme.colors.textMuted }]}>{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ThemeModeSelector() {
  const { mode, setMode, isDark, theme } = useTheme();
  const modes = [
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
  ];

  return (
    <View style={styles.modeRow}>
      {modes.map(m => {
        const active = mode === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode(m.key); }}
            style={[styles.modeBtn, { backgroundColor: active ? theme.colors.primary + '20' : theme.colors.surfaceLight }, active && { borderWidth: 1.5, borderColor: theme.colors.primary }]}
          >
            <Ionicons name={m.icon} size={18} color={active ? theme.colors.primary : theme.colors.textMuted} />
            <Text style={[styles.modeLabel, { color: active ? theme.colors.primary : theme.colors.textMuted }]}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { theme, isDark, accentKey, bgKey, cardStyleKey, layoutView, cardDensity, setAccent, setBgStyle, setCardStyle, setLayoutView, setCardDensity } = useTheme();
  const { state, togglePunishment, exportData } = useApp();
  const level = getLevel(state.xp);
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);

  const handleExport = async () => {
    try {
      const data = exportData();
      await Share.share({ message: `LifeFlow Report\n\n${JSON.stringify(data, null, 2)}`, title: 'Export' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { Alert.alert('Error', 'Failed to export'); }
  };

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This cannot be undone!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Done', 'Restart the app.');
      }},
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceLight }]}>
            <Ionicons name="close" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <FadeInView style={[styles.profileCard, theme.cardStyle, { borderWidth: 1 }]}>
          <View style={[styles.profileIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="shield-outline" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>{level.title}</Text>
            <Text style={[styles.profileLevel, { color: theme.colors.textMuted }]}>Level {level.level} · {state.xp} XP</Text>
          </View>
          <View style={styles.coinsWrap}>
            <Ionicons name="diamond-outline" size={14} color={theme.colors.gold} />
            <Text style={[styles.coinsText, { color: theme.colors.gold }]}>{state.coins}</Text>
          </View>
        </FadeInView>

        {/* Theme Mode */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Appearance</Text>
          <ThemeModeSelector />
        </Animated.View>

        {/* Accent Color */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity
            onPress={() => setShowAccentPicker(!showAccentPicker)}
            style={[styles.pickerToggle, { backgroundColor: theme.colors.surfaceLight }]}
          >
            <View style={styles.pickerToggleLeft}>
              <View style={[styles.accentPreview, { backgroundColor: ACCENT_PRESETS[accentKey].primary }]} />
              <Text style={[styles.pickerToggleText, { color: theme.colors.text }]}>Accent Color</Text>
            </View>
            <Ionicons name={showAccentPicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
          {showAccentPicker && (
            <View style={styles.swatchGrid}>
              {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
                <ColorSwatch
                  key={key}
                  colorKey={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  isActive={accentKey === key}
                  onPress={() => setAccent(key)}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Background Style */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <TouchableOpacity
            onPress={() => setShowBgPicker(!showBgPicker)}
            style={[styles.pickerToggle, { backgroundColor: theme.colors.surfaceLight }]}
          >
            <View style={styles.pickerToggleLeft}>
              <Ionicons name="color-palette-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.pickerToggleText, { color: theme.colors.text }]}>Background</Text>
            </View>
            <Ionicons name={showBgPicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
          {showBgPicker && (
            <View style={styles.bgSwatchGrid}>
              {Object.entries(BG_STYLES).map(([key, bg]) => (
                <BgSwatch
                  key={key}
                  bgKey={key}
                  label={bg.name}
                  isActive={bgKey === key}
                  onPress={() => setBgStyle(key)}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Card Style */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <TouchableOpacity
            onPress={() => setShowCardPicker(!showCardPicker)}
            style={[styles.pickerToggle, { backgroundColor: theme.colors.surfaceLight }]}
          >
            <View style={styles.pickerToggleLeft}>
              <Ionicons name="square-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.pickerToggleText, { color: theme.colors.text }]}>Card Style</Text>
            </View>
            <Ionicons name={showCardPicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
          {showCardPicker && (
            <View style={styles.cardOptionGrid}>
              {Object.entries(CARD_STYLES).map(([key, cs]) => (
                <CardStyleOption
                  key={key}
                  cardKey={key}
                  label={cs.name}
                  description={cs.description}
                  isActive={cardStyleKey === key}
                  onPress={() => setCardStyle(key)}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Layout Options */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, marginTop: 20 }]}>Layout</Text>
          <View style={styles.layoutRow}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLayoutView('list'); }}
              style={[styles.layoutBtn, { backgroundColor: layoutView === 'list' ? theme.colors.primary + '20' : theme.colors.surfaceLight }, layoutView === 'list' && { borderWidth: 1.5, borderColor: theme.colors.primary }]}
            >
              <Ionicons name="list" size={18} color={layoutView === 'list' ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.layoutLabel, { color: layoutView === 'list' ? theme.colors.primary : theme.colors.textMuted }]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLayoutView('grid'); }}
              style={[styles.layoutBtn, { backgroundColor: layoutView === 'grid' ? theme.colors.primary + '20' : theme.colors.surfaceLight }, layoutView === 'grid' && { borderWidth: 1.5, borderColor: theme.colors.primary }]}
            >
              <Ionicons name="grid" size={18} color={layoutView === 'grid' ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.layoutLabel, { color: layoutView === 'grid' ? theme.colors.primary : theme.colors.textMuted }]}>Grid</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.layoutRow}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCardDensity('comfortable'); }}
              style={[styles.layoutBtn, { backgroundColor: cardDensity === 'comfortable' ? theme.colors.primary + '20' : theme.colors.surfaceLight }, cardDensity === 'comfortable' && { borderWidth: 1.5, borderColor: theme.colors.primary }]}
            >
              <Ionicons name="expand" size={18} color={cardDensity === 'comfortable' ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.layoutLabel, { color: cardDensity === 'comfortable' ? theme.colors.primary : theme.colors.textMuted }]}>Comfortable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCardDensity('compact'); }}
              style={[styles.layoutBtn, { backgroundColor: cardDensity === 'compact' ? theme.colors.primary + '20' : theme.colors.surfaceLight }, cardDensity === 'compact' && { borderWidth: 1.5, borderColor: theme.colors.primary }]}
            >
              <Ionicons name="contract" size={18} color={cardDensity === 'compact' ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.layoutLabel, { color: cardDensity === 'compact' ? theme.colors.primary : theme.colors.textMuted }]}>Compact</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, marginTop: 20 }]}>Gamification</Text>
        <SettingRow
          icon="skull-outline"
          title="Punishment Mode"
          subtitle={state.punishmentEnabled ? 'Active · -10 coins for missed tasks' : 'Disabled'}
          color={theme.colors.error}
          rightComponent={
            <Switch value={state.punishmentEnabled} onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); togglePunishment(); }}
              trackColor={{ false: theme.colors.surfaceLight, true: theme.colors.error + '40' }}
              thumbColor={state.punishmentEnabled ? theme.colors.error : theme.colors.textMuted} />
          }
        />

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Data</Text>
        <SettingRow icon="download-outline" title="Export" subtitle="Share as JSON" color={theme.colors.success} onPress={handleExport}
          rightComponent={<Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />} />
        <SettingRow icon="trash-outline" title="Clear All" subtitle="Delete everything" color={theme.colors.error} onPress={handleClearData}
          rightComponent={<Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />} />

        <View style={[styles.aboutCard, theme.cardStyle, { borderWidth: 1, alignItems: 'center' }]}>
          <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>LifeFlow</Text>
          <Text style={[styles.aboutVersion, { color: theme.colors.textMuted }]}>v3.0.0</Text>
          <Text style={[styles.aboutDesc, { color: theme.colors.textSecondary }]}>
            Glassmorphism productivity with fluid design.
          </Text>
        </View>

        <Text style={[styles.copyright, { color: theme.colors.textMuted }]}>Forged with determination</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 24, padding: 18, borderRadius: 16,
  },
  profileIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', fontFamily: serifFont },
  profileLevel: { fontSize: 12, marginTop: 2 },
  coinsWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  coinsText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },

  sectionTitle: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 10, marginTop: 8,
  },

  modeRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 16 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12, gap: 6,
  },
  modeLabel: { fontSize: 13, fontWeight: '600' },

  pickerToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 24, marginBottom: 8, padding: 14, borderRadius: 12,
  },
  pickerToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerToggleText: { fontSize: 14, fontWeight: '600' },
  accentPreview: { width: 20, height: 20, borderRadius: 10 },

  swatchGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 8, marginBottom: 16,
  },
  swatchWrap: { alignItems: 'center', width: COLOR_SWATCH_SIZE },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  swatchLabel: { fontSize: 10, marginTop: 4, fontWeight: '500' },

  bgSwatchGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10, marginBottom: 16,
  },
  bgSwatchWrap: { alignItems: 'center', width: (width - 80) / 3 },
  bgSwatch: {
    width: 60, height: 60, borderRadius: 14, borderWidth: 2, borderColor: 'transparent',
    overflow: 'hidden', padding: 6,
  },
  bgSwatchInner: { flex: 1, borderRadius: 6 },
  bgSwatchDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: 6, right: 6 },

  cardOptionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 8, marginBottom: 16,
  },
  cardOptionWrap: { width: (width - 64) / 2 },
  cardOption: {
    padding: 14, borderRadius: 14, alignItems: 'center', gap: 6,
  },
  cardOptionTitle: { fontSize: 13, fontWeight: '600' },
  cardOptionDesc: { fontSize: 10, textAlign: 'center' },

  layoutRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 8 },
  layoutBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12, gap: 6,
  },
  layoutLabel: { fontSize: 13, fontWeight: '600' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 8, padding: 14, borderRadius: 12,
  },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600' },
  settingSubtitle: { fontSize: 11, marginTop: 1 },

  aboutCard: {
    marginHorizontal: 24, marginBottom: 16, padding: 20, borderRadius: 16,
  },
  aboutTitle: { fontSize: 18, fontWeight: '700', fontFamily: serifFont },
  aboutVersion: { fontSize: 12, marginTop: 4 },
  aboutDesc: { fontSize: 13, textAlign: 'center', marginTop: 8 },

  copyright: { textAlign: 'center', fontSize: 11, marginTop: 8 },
});
