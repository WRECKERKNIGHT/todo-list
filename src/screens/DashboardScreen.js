import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeInLeft,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  Easing, interpolate, withDelay, withRepeat, withSequence,
  ZoomIn, SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp, getLevel } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import {
  formatDate, getGreeting, getDaysRemaining, getTimeRemaining,
  getTodayStr, getMotivationalQuote,
} from '../utils/dateHelpers';
import { OrnamentalDivider } from '../components/MedievalUI';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function AnimatedStatCard({ title, value, color, icon, delay, onPress }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const countSv = useSharedValue(0);

  useEffect(() => {
    countSv.value = withDelay(delay, withTiming(value, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [value]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const countStyle = useAnimatedStyle(() => ({
    opacity: interpolate(countSv.value, [0, 0.3], [0, 1]),
  }));

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay).springify().damping(16).stiffness(100)} style={[{ width: CARD_W, marginHorizontal: 6, marginBottom: 12 }, cardStyle]}>
      <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }} onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }} onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }} activeOpacity={1} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderLeftColor: color }]}>
        <View style={[styles.statIconWrap, { backgroundColor: color + '12' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Animated.View style={countStyle}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        </Animated.View>
        <Text style={[styles.statTitle, { color: theme.colors.textMuted }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function QuickLink({ title, subtitle, icon, color, count, onPress, delay }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay).springify().damping(18)}>
      <Animated.View style={s}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }} onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }} onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }} activeOpacity={1} style={[styles.linkCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.linkIconWrap, { backgroundColor: color + '10' }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View style={styles.linkInfo}>
            <Text style={[styles.linkTitle, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.linkSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
          </View>
          {count !== undefined && <Text style={[styles.linkCount, { color }]}>{count}</Text>}
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function QuoteCard({ quote, delay }) {
  const { theme } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(delay + 500, withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    ));
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5], [0.85, 1]),
  }));

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay).springify().damping(18)} style={[styles.quoteCard, { backgroundColor: theme.colors.surface }]}>
      <Animated.View style={shimmerStyle}>
        <Text style={[styles.quoteText, { color: theme.colors.textSecondary }]}>"{quote.text}"</Text>
        <Text style={[styles.quoteAuthor, { color: theme.colors.textMuted }]}>— {quote.author}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function CountdownPreview({ countdown, delay }) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(countdown.targetDate));
  const days = getDaysRemaining(countdown.targetDate);
  const color = countdown.color || theme.colors.primary;

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining(countdown.targetDate)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay).springify().damping(18)} style={[styles.countdownCard, { backgroundColor: theme.colors.surface, borderLeftColor: color }]}>
      <Text style={[styles.countdownTitle, { color: theme.colors.text }]}>{countdown.title}</Text>
      <Text style={[styles.countdownTime, { color }]}>
        {days > 0 ? `${days} days · ` : 'Today · '}
        {timeLeft.hours}h {timeLeft.minutes}m
      </Text>
    </Animated.View>
  );
}

function GreetingHeader() {
  const { theme } = useTheme();
  const { state } = useApp();
  const navigation = useNavigation();
  const level = getLevel(state.xp);

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>{getGreeting()}</Text>
        <Text style={[styles.date, { color: theme.colors.textMuted }]}>{formatDate(new Date())}</Text>
      </View>
      <View style={styles.headerRight}>
        <Animated.View entering={ZoomIn.duration(500).delay(200).springify().damping(12)}>
          <TouchableOpacity style={[styles.badge, { backgroundColor: theme.colors.surface }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Stats'); }}>
            <Ionicons name="shield-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Lv.{level.level}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={ZoomIn.duration(500).delay(350).springify().damping(12)}>
          <View style={[styles.badge, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="diamond-outline" size={14} color={theme.colors.gold} />
            <Text style={[styles.badgeText, { color: theme.colors.gold }]}>{state.coins}</Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { getTodoStats, getHabitStats, getUpcomingCountdowns, state } = useApp();
  const level = getLevel(state.xp);
  const [quote] = useState(getMotivationalQuote());

  const todos = getTodoStats();
  const habits = getHabitStats();
  const upcomingCountdowns = getUpcomingCountdowns();
  const todayTodos = state.todos.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toISOString().split('T')[0] === getTodayStr();
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GreetingHeader />
        <QuoteCard quote={quote} delay={150} />

        <View style={styles.statsRow}>
          <AnimatedStatCard title="Pending" value={todos.pending} color={theme.colors.primary} icon="scroll-outline" delay={200} onPress={() => {}} />
          <AnimatedStatCard title="Done" value={todos.completed} color={theme.colors.success} icon="checkmark-circle-outline" delay={260} onPress={() => {}} />
          <AnimatedStatCard title="Rituals" value={`${habits.completedToday}/${habits.total}`} color={theme.colors.accent} icon="flame-outline" delay={320} onPress={() => {}} />
          <AnimatedStatCard title="Overdue" value={todos.overdue} color={theme.colors.error} icon="alert-circle-outline" delay={380} onPress={() => {}} />
        </View>

        <OrnamentalDivider />

        <Animated.View entering={FadeIn.duration(500).delay(400)}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Access</Text>
        </Animated.View>

        <View style={styles.linksContainer}>
          <QuickLink title="Quests" subtitle={`${todayTodos.length} today`} icon="scroll-outline" color={theme.colors.primary} count={todayTodos.length} delay={420} onPress={() => {}} />
          <QuickLink title="Focus Timer" subtitle="Pomodoro session" icon="timer-outline" color={theme.colors.accent} delay={480} onPress={() => {}} />
          <QuickLink title="Journal" subtitle="Daily reflections" icon="book-outline" color={theme.colors.secondary} count={state.notes.length} delay={540} onPress={() => {}} />
          <QuickLink title="Trophies" subtitle="Your achievements" icon="trophy-outline" color={theme.colors.gold} count={state.achievements.filter(a => a.unlocked).length} delay={600} onPress={() => {}} />
          <QuickLink title="Statistics" subtitle="Track progress" icon="stats-chart-outline" color={theme.colors.success} delay={660} onPress={() => {}} />
          <QuickLink title="Settings" subtitle="Configure realm" icon="settings-outline" color={theme.colors.textMuted} delay={720} onPress={() => {}} />
        </View>

        {upcomingCountdowns.length > 0 && (
          <>
            <OrnamentalDivider />
            <Animated.View entering={FadeIn.duration(500).delay(700)}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Approaching Events</Text>
            </Animated.View>
            {upcomingCountdowns.slice(0, 2).map((cd, i) => (
              <CountdownPreview key={cd.id} countdown={cd} delay={750 + i * 80} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 30, paddingTop: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 24, marginBottom: 24,
  },
  greeting: { fontSize: 26, fontWeight: '700', fontFamily: serifFont },
  date: { fontSize: 13, marginTop: 4, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  badgeText: { fontSize: 13, fontWeight: '600', marginLeft: 5 },

  quoteCard: {
    marginHorizontal: 24, marginBottom: 24, padding: 20, borderRadius: 12,
  },
  quoteText: { fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 11, marginTop: 8, textAlign: 'right' },

  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  statCard: {
    padding: 16, borderRadius: 12, borderLeftWidth: 3,
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  statTitle: { fontSize: 11, marginTop: 3, letterSpacing: 0.3, textTransform: 'uppercase' },

  sectionTitle: {
    fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 12,
  },

  linksContainer: { paddingHorizontal: 24 },
  linkCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, marginBottom: 8,
  },
  linkIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 15, fontWeight: '600' },
  linkSubtitle: { fontSize: 12, marginTop: 1 },
  linkCount: { fontSize: 15, fontWeight: '700', marginRight: 8 },

  countdownCard: {
    marginHorizontal: 24, padding: 14, borderRadius: 12,
    borderLeftWidth: 3, marginBottom: 8,
  },
  countdownTitle: { fontSize: 15, fontWeight: '600' },
  countdownTime: { fontSize: 13, marginTop: 4 },
});
