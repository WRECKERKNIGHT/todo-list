import React, { useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Animated, Easing, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, getLevel } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, ScaleInView } from '../components/MedievalUI';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - 72) / 7;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function LevelCard() {
  const { theme } = useTheme();
  const { state } = useApp();
  const level = getLevel(state.xp);
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, { toValue: level.progress, tension: 20, friction: 8, useNativeDriver: false }).start();
  }, []);

  return (
    <FadeInView style={[styles.levelCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}>
      <View style={styles.levelHeader}>
        <View style={[styles.levelIconWrap, { backgroundColor: theme.colors.primary + '12' }]}>
          <Ionicons name="shield-outline" size={28} color={theme.colors.primary} />
        </View>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelTitle, { color: theme.colors.text }]}>{level.title}</Text>
          <Text style={[styles.levelSubtitle, { color: theme.colors.textMuted }]}>Level {level.level}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="star-outline" size={12} color={theme.colors.gold} />
          <Text style={[styles.xpText, { color: theme.colors.gold }]}>{state.xp} XP</Text>
        </View>
      </View>
      <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceLight }]}>
        <Animated.View style={[styles.progressBar, { backgroundColor: theme.colors.primary, width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
        {level.nextXp ? `${state.xp}/${level.nextXp} XP` : 'MAX'}
      </Text>
    </FadeInView>
  );
}

function StatBox({ icon, value, label, color }) {
  const { theme } = useTheme();
  return (
    <ScaleInView style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={[styles.statBoxLabel, { color: theme.colors.textMuted }]}>{label}</Text>
    </ScaleInView>
  );
}

function WeeklyChart({ data, maxValue }) {
  const { theme } = useTheme();
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <View style={styles.chartBars}>
      {data.map((value, i) => {
        const h = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const isToday = i === today;
        return (
          <View key={i} style={styles.barColumn}>
            <Text style={[styles.barValue, { color: theme.colors.textMuted }]}>{value}</Text>
            <View style={[styles.barBg, { backgroundColor: theme.colors.surfaceLight, height: 100 }]}>
              <View style={[styles.barFill, { height: Math.max(3, h), backgroundColor: isToday ? theme.colors.primary : theme.colors.primary + '40' }]} />
            </View>
            <Text style={[styles.barDay, { color: isToday ? theme.colors.primary : theme.colors.textMuted }]}>{days[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function StatsScreen() {
  const { theme } = useTheme();
  const { state, getTodoStats, getHabitStats } = useApp();
  const todoStats = getTodoStats();
  const habitStats = getHabitStats();

  const weeklyData = useMemo(() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    state.todos.forEach(t => {
      if (t.completedAt) {
        const d = new Date(t.completedAt);
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff < 7) data[d.getDay()]++;
      }
    });
    return data;
  }, [state.todos]);

  const maxWeekly = Math.max(...weeklyData, 1);
  const completionRate = todoStats.total > 0 ? Math.round((todoStats.completed / todoStats.total) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Statistics</Text>
          <View style={styles.coinsBadge}>
            <Ionicons name="diamond-outline" size={14} color={theme.colors.gold} />
            <Text style={[styles.coinsText, { color: theme.colors.gold }]}>{state.coins}</Text>
          </View>
        </View>

        <LevelCard />

        <FadeInView delay={100}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Overview</Text>
        </FadeInView>
        <View style={styles.statsGrid}>
          {[
            { icon: 'checkmark-circle-outline', value: todoStats.completed, label: 'Done', color: theme.colors.success },
            { icon: 'scroll-outline', value: todoStats.pending, label: 'Pending', color: theme.colors.primary },
            { icon: 'alert-circle-outline', value: todoStats.overdue, label: 'Overdue', color: theme.colors.error },
            { icon: 'flame-outline', value: habitStats.completedToday, label: 'Today', color: theme.colors.accent },
          ].map((s, i) => (
            <FadeInView key={s.label} delay={150 + i * 50} style={styles.statBoxWrap}>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
                <Text style={[styles.statBoxValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statBoxLabel, { color: theme.colors.textMuted }]}>{s.label}</Text>
              </View>
            </FadeInView>
          ))}
        </View>

        <FadeInView delay={300}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Completion</Text>
        </FadeInView>
        <FadeInView delay={350} style={[styles.rateCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.rateBarBg, { backgroundColor: theme.colors.surfaceLight }]}>
            <View style={[styles.rateBarFill, { width: `${completionRate}%`, backgroundColor: theme.colors.primary }]} />
          </View>
          <Text style={[styles.rateText, { color: theme.colors.textMuted }]}>{completionRate}% overall</Text>
        </FadeInView>

        <FadeInView delay={400}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Weekly Activity</Text>
        </FadeInView>
        <FadeInView delay={450} style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <WeeklyChart data={weeklyData} maxValue={maxWeekly} />
        </FadeInView>

        <FadeInView delay={500}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>By Category</Text>
        </FadeInView>
        <FadeInView delay={550} style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}>
          {['work', 'personal', 'health', 'education', 'finance', 'other'].map(cat => {
            const count = state.todos.filter(t => t.category === cat).length;
            const pct = todoStats.total > 0 ? Math.round((count / todoStats.total) * 100) : 0;
            const colors = { work: '#7A6B8A', personal: '#C25B4E', health: '#5B9A6F', education: '#C9A84C', finance: '#5B8AC2', other: '#A89EB8' };
            return (
              <View key={cat} style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: colors[cat] }]} />
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                <Text style={[styles.categoryCount, { color: theme.colors.textMuted }]}>{count}</Text>
                <View style={[styles.categoryBarBg, { backgroundColor: theme.colors.surfaceLight }]}>
                  <View style={[styles.categoryBarFill, { width: `${pct}%`, backgroundColor: colors[cat] }]} />
                </View>
              </View>
            );
          })}
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 30, paddingTop: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  coinsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  coinsText: { fontSize: 14, fontWeight: '600', marginLeft: 5 },

  levelCard: {
    marginHorizontal: 24, marginBottom: 20, padding: 18, borderRadius: 12,
    borderLeftWidth: 3,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  levelIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 18, fontWeight: '700', fontFamily: serifFont },
  levelSubtitle: { fontSize: 12, marginTop: 2 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  xpText: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBar: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 11, textAlign: 'right' },

  sectionTitle: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 10, marginTop: 8,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, marginBottom: 16 },
  statBoxWrap: { width: (width - 60) / 2, marginHorizontal: 6, marginBottom: 8 },
  statBox: { padding: 16, borderRadius: 12, alignItems: 'center' },
  statBoxValue: { fontSize: 24, fontWeight: '700', marginTop: 6, marginBottom: 2 },
  statBoxLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  rateCard: { marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 12 },
  rateBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  rateBarFill: { height: 6, borderRadius: 3 },
  rateText: { fontSize: 11, textAlign: 'right' },

  chartCard: { marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 12 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8 },
  barColumn: { alignItems: 'center', width: BAR_WIDTH },
  barValue: { fontSize: 10, marginBottom: 4, fontWeight: '600' },
  barBg: { width: BAR_WIDTH - 6, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { borderRadius: 4 },
  barDay: { fontSize: 10, marginTop: 4, fontWeight: '500' },

  categoryCard: { marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  categoryName: { fontSize: 12, fontWeight: '600', width: 60 },
  categoryCount: { fontSize: 12, fontWeight: '700', width: 24, textAlign: 'right', marginRight: 8 },
  categoryBarBg: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  categoryBarFill: { height: 4, borderRadius: 2 },
});
