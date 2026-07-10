import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
  Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, getLevel } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView } from '../components/MedievalUI';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function SettingRow({ icon, title, subtitle, onPress, rightComponent, color }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.colors.surface }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIconWrap, { backgroundColor: (color || theme.colors.primary) + '10' }]}>
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

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { state, togglePunishment, exportData } = useApp();
  const level = getLevel(state.xp);

  const handleExport = async () => {
    try {
      const data = exportData();
      await Share.share({ message: `Royal Task Report\n\n${JSON.stringify(data, null, 2)}`, title: 'Export' });
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>

        <FadeInView style={[styles.profileCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}>
          <View style={[styles.profileIcon, { backgroundColor: theme.colors.primary + '12' }]}>
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

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Gamification</Text>
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

        <View style={[styles.aboutCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>Royal Task</Text>
          <Text style={[styles.aboutVersion, { color: theme.colors.textMuted }]}>v2.0.0</Text>
          <Text style={[styles.aboutDesc, { color: theme.colors.textSecondary }]}>
            Medieval productivity with gamification.
          </Text>
        </View>

        <Text style={[styles.copyright, { color: theme.colors.textMuted }]}>Forged with determination</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 30, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont, paddingHorizontal: 24, marginBottom: 20 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 24, padding: 18, borderRadius: 12,
    borderLeftWidth: 3,
  },
  profileIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', fontFamily: serifFont },
  profileLevel: { fontSize: 12, marginTop: 2 },
  coinsWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  coinsText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },

  sectionTitle: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 10, marginTop: 8,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 8, padding: 14, borderRadius: 10,
  },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600' },
  settingSubtitle: { fontSize: 11, marginTop: 1 },

  aboutCard: {
    marginHorizontal: 24, marginBottom: 16, padding: 20, borderRadius: 12, alignItems: 'center',
  },
  aboutTitle: { fontSize: 18, fontWeight: '700', fontFamily: serifFont },
  aboutVersion: { fontSize: 12, marginTop: 4 },
  aboutDesc: { fontSize: 13, textAlign: 'center', marginTop: 8 },

  copyright: { textAlign: 'center', fontSize: 11, marginTop: 8 },
});
