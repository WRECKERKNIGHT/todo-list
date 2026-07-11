import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function analyzeCompletionPatterns(todos) {
  const hourCounts = {};
  const dayCounts = {};
  let totalCompleted = 0;

  todos.forEach(todo => {
    if (todo.completedAt) {
      const date = new Date(todo.completedAt);
      const hour = date.getHours();
      const day = date.getDay();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      totalCompleted++;
    }
  });

  if (totalCompleted === 0) {
    return {
      peakHour: 9,
      peakDay: 1,
      bestTimeLabel: 'Morning',
      confidence: 0,
      suggestions: [
        { time: '09:00', label: '9:00 AM', reason: 'Default productive hour', confidence: 0 },
        { time: '14:00', label: '2:00 PM', reason: 'Afternoon focus window', confidence: 0 },
        { time: '20:00', label: '8:00 PM', reason: 'Evening reflection time', confidence: 0 },
      ],
    };
  }

  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0];
  const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0];

  const suggestions = [];
  const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
  const topHours = sortedHours.slice(0, 3);

  topHours.forEach(([hour, count]) => {
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    suggestions.push({
      time: `${hour.padStart(2, '0')}:00`,
      label: `${h12}:00 ${ampm}`,
      reason: `You complete ${count} task${count > 1 ? 's' : ''} around this time`,
      confidence: Math.min(count / totalCompleted, 1),
    });
  });

  if (suggestions.length < 3) {
    const defaults = [
      { time: '09:00', label: '9:00 AM', reason: 'Morning energy boost' },
      { time: '14:00', label: '2:00 PM', reason: 'Afternoon focus' },
      { time: '20:00', label: '8:00 PM', reason: 'Evening wrap-up' },
    ];
    defaults.forEach(d => {
      if (!suggestions.find(s => s.time === d.time)) {
        suggestions.push({ ...d, confidence: 0 });
      }
    });
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bestTimeLabel = parseInt(peakHour) < 12 ? 'Morning' : parseInt(peakHour) < 17 ? 'Afternoon' : 'Evening';

  return {
    peakHour: parseInt(peakHour),
    peakDay: parseInt(peakDay),
    peakDayName: dayNames[parseInt(peakDay)],
    bestTimeLabel,
    confidence: totalCompleted > 10 ? 0.8 : totalCompleted > 5 ? 0.5 : 0.2,
    totalCompleted,
    suggestions: suggestions.slice(0, 3),
  };
}

function SuggestionCard({ suggestion, index, theme }) {
  const confidenceWidth = Math.max(suggestion.confidence * 100, 20);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify().damping(16)}
      style={[styles.suggestionCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}
    >
      <View style={styles.suggestionHeader}>
        <Ionicons name="time" size={16} color={theme.colors.primary} />
        <Text style={[styles.suggestionTime, { color: theme.colors.primary }]}>{suggestion.label}</Text>
      </View>
      <Text style={[styles.suggestionReason, { color: theme.colors.textSecondary }]}>{suggestion.reason}</Text>
      <View style={styles.confidenceRow}>
        <View style={[styles.confidenceBg, { backgroundColor: theme.colors.surfaceLight }]}>
          <View style={[styles.confidenceFill, { width: `${confidenceWidth}%`, backgroundColor: theme.colors.primary }]} />
        </View>
        <Text style={[styles.confidenceLabel, { color: theme.colors.textMuted }]}>
          {suggestion.confidence > 0.6 ? 'Strong' : suggestion.confidence > 0.3 ? 'Moderate' : 'Low'} match
        </Text>
      </View>
    </Animated.View>
  );
}

export default function SmartReminderCard({ style }) {
  const { theme } = useTheme();
  const { state } = useApp();

  const analysis = useMemo(() => analyzeCompletionPatterns(state.todos), [state.todos]);

  const dayColors = ['#C25B4E', '#C9A84C', '#5B9A6F', '#5B8AC2', '#9B59B6', '#5B8AC2', '#C9A84C'];

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.container, style]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: 16 }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="bulb" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Smart Reminders</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {analysis.confidence > 0.5 ? 'Based on your patterns' : 'Learning your habits...'}
            </Text>
          </View>
        </View>

        <View style={[styles.insightRow, { backgroundColor: theme.colors.primary + '08' }]}>
          <Ionicons name="trending-up" size={16} color={theme.colors.primary} />
          <Text style={[styles.insightText, { color: theme.colors.text }]}>
            You're most productive in the <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{analysis.bestTimeLabel}</Text>
            {analysis.peakDayName && (
              <>, especially on <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{analysis.peakDayName}s</Text></>
            )}
          </Text>
        </View>

        <View style={styles.dayRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View
              key={i}
              style={[styles.dayDot, { backgroundColor: i === analysis.peakDay ? dayColors[i] : theme.colors.surfaceLight }]}
            >
              <Text style={[styles.dayLetter, { color: i === analysis.peakDay ? '#fff' : theme.colors.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.suggestionsTitle, { color: theme.colors.textMuted }]}>Optimal Reminder Times</Text>
        {analysis.suggestions.map((s, i) => (
          <SuggestionCard key={s.time} suggestion={s} index={i} theme={theme} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  card: { padding: 18 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', fontFamily: serifFont },
  subtitle: { fontSize: 11, marginTop: 1 },

  insightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 12,
  },
  insightText: { fontSize: 13, flex: 1, lineHeight: 18 },

  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 4 },
  dayDot: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dayLetter: { fontSize: 11, fontWeight: '600' },

  suggestionsTitle: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },

  suggestionCard: {
    padding: 12, borderRadius: 10, borderLeftWidth: 3, marginBottom: 6,
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  suggestionTime: { fontSize: 15, fontWeight: '700', fontFamily: serifFont },
  suggestionReason: { fontSize: 12, marginBottom: 6 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confidenceBg: { flex: 1, height: 3, borderRadius: 1.5 },
  confidenceFill: { height: 3, borderRadius: 1.5 },
  confidenceLabel: { fontSize: 9, fontWeight: '600' },
});
