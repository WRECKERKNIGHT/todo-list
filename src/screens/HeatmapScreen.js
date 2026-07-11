import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn, BounceIn,
  useSharedValue, useAnimatedStyle, withSpring,
  Layout,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 80) / 53;
const CELL_GAP = 2;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function HeatmapCell({ count, maxCount, dateStr }) {
  const { theme } = useTheme();
  const intensity = maxCount > 0 ? count / maxCount : 0;

  let bgColor = theme.colors.surfaceLight;
  if (count > 0 && intensity <= 0.25) bgColor = theme.colors.primary + '25';
  else if (intensity <= 0.5) bgColor = theme.colors.primary + '45';
  else if (intensity <= 0.75) bgColor = theme.colors.primary + '70';
  else if (intensity > 0.75) bgColor = theme.colors.primary;

  return (
    <View style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 3, backgroundColor: bgColor }]} />
  );
}

export default function HeatmapScreen() {
  const { theme } = useTheme();
  const { state, getHeatmapData } = useApp();
  const heatmapData = getHeatmapData();
  const [selectedDay, setSelectedDay] = useState(null);

  const maxCount = useMemo(() => Math.max(...Object.values(heatmapData), 1), [heatmapData]);

  const weeks = useMemo(() => {
    const allWeeks = [];
    let currentWeek = [];
    const today = new Date();

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      currentWeek.push({ key, count: heatmapData[key] || 0, date: d });

      if (d.getDay() === 6 || i === 0) {
        allWeeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    return allWeeks;
  }, [heatmapData]);

  const totalActivity = useMemo(() => Object.values(heatmapData).reduce((sum, v) => sum + v, 0), [heatmapData]);
  const activeDays = useMemo(() => Object.values(heatmapData).filter(v => v > 0).length, [heatmapData]);
  const longestStreak = useMemo(() => {
    let max = 0, current = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if ((heatmapData[key] || 0) > 0) { current++; max = Math.max(max, current); }
      else current = 0;
    }
    return max;
  }, [heatmapData]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Heatmap</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>365-day activity</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.statsRow}>
          {[
            { label: 'Total Actions', value: totalActivity, icon: 'flash', color: theme.colors.primary },
            { label: 'Active Days', value: activeDays, icon: 'calendar', color: theme.colors.success },
            { label: 'Longest Streak', value: longestStreak, icon: 'flame', color: theme.colors.accent },
          ].map((stat, i) => (
            <Animated.View key={stat.label} entering={FadeInDown.duration(400).delay(i * 80).springify().damping(16)} style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name={stat.icon} size={16} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{stat.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.duration(500).delay(200)} style={[styles.heatmapCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.monthLabels}>
            {weeks.map((week, wi) => {
              const firstDay = week[0];
              const showMonth = firstDay && firstDay.date.getDate() <= 7;
              return (
                <Text key={wi} style={[styles.monthLabel, { width: CELL_SIZE + CELL_GAP }]}>
                  {showMonth ? months[firstDay.date.getMonth()] : ''}
                </Text>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.grid}>
              {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekColumn}>
                  {week.map((day) => (
                    <TouchableOpacity key={day.key} onPress={() => setSelectedDay(day)} activeOpacity={0.6}>
                      <HeatmapCell count={day.count} maxCount={maxCount} dateStr={day.key} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.legendRow}>
            <Text style={[styles.legendLabel, { color: theme.colors.textMuted }]}>Less</Text>
            {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
              <View key={i} style={[styles.legendCell, {
                backgroundColor: level === 0 ? theme.colors.surfaceLight :
                  level <= 0.25 ? theme.colors.primary + '25' :
                  level <= 0.5 ? theme.colors.primary + '45' :
                  level <= 0.75 ? theme.colors.primary + '70' : theme.colors.primary,
              }]} />
            ))}
            <Text style={[styles.legendLabel, { color: theme.colors.textMuted }]}>More</Text>
          </View>
        </Animated.View>

        {selectedDay && (
          <Animated.View entering={FadeIn.duration(200)} style={[styles.selectedCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary + '30' }]}>
            <Text style={[styles.selectedDate, { color: theme.colors.text }]}>
              {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={[styles.selectedCount, { color: theme.colors.primary }]}>
              {selectedDay.count} action{selectedDay.count !== 1 ? 's' : ''}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.monthlySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Monthly Activity</Text>
          {months.map((month, i) => {
            let monthCount = 0;
            const today = new Date();
            for (let d = 0; d < 31; d++) {
              const date = new Date(today.getFullYear(), i, d + 1);
              if (date.getMonth() !== i) break;
              const key = date.toISOString().split('T')[0];
              monthCount += heatmapData[key] || 0;
            }
            const barWidth = maxCount > 0 ? (monthCount / maxCount) * (width - 120) : 0;
            return (
              <Animated.View key={month} entering={FadeIn.duration(300).delay(350 + i * 30)} style={styles.monthRow}>
                <Text style={[styles.monthName, { color: theme.colors.textSecondary }]}>{month}</Text>
                <View style={[styles.monthBarBg, { backgroundColor: theme.colors.surfaceLight }]}>
                  <View style={[styles.monthBarFill, { width: Math.max(2, barWidth), backgroundColor: monthCount > 0 ? theme.colors.primary + '60' : 'transparent' }]} />
                </View>
                <Text style={[styles.monthCount, { color: theme.colors.textMuted }]}>{monthCount}</Text>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  subtitle: { fontSize: 13, marginTop: 4 },

  scroll: { paddingBottom: 30 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 18, marginBottom: 16 },
  statCard: {
    flex: 1, marginHorizontal: 6, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 4, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  heatmapCard: { marginHorizontal: 18, padding: 16, borderRadius: 12, marginBottom: 16 },
  monthLabels: { flexDirection: 'row', marginBottom: 4 },
  monthLabel: { fontSize: 9, color: 'transparent' },
  grid: { flexDirection: 'row' },
  weekColumn: { flexDirection: 'column', gap: CELL_GAP },
  cell: { width: CELL_SIZE, height: CELL_SIZE },

  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 4 },
  legendLabel: { fontSize: 10, marginHorizontal: 4 },
  legendCell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 3 },

  selectedCard: {
    marginHorizontal: 18, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectedDate: { fontSize: 13, fontWeight: '600', flex: 1 },
  selectedCount: { fontSize: 14, fontWeight: '700' },

  monthlySection: { marginHorizontal: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', fontFamily: serifFont, marginBottom: 12 },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  monthName: { width: 36, fontSize: 11, fontWeight: '600' },
  monthBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  monthBarFill: { height: 8, borderRadius: 4 },
  monthCount: { width: 30, fontSize: 11, fontWeight: '600', textAlign: 'right' },
});
