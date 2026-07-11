import React, { useEffect, useState, useCallback } from 'react';
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
  ZoomIn, SlideInDown, Layout,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useApp, getLevel } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import {
  formatDate, getGreeting, getDaysRemaining, getTimeRemaining,
  getTodayStr, getMotivationalQuote,
} from '../utils/dateHelpers';
import { OrnamentalDivider, GlassCard } from '../components/MedievalUI';
import SmartReminderCard from '../components/SmartReminderCard';

const { width, height } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const WIDGET_LABELS = {
  stats: { title: 'Stats', icon: 'stats-chart-outline' },
  quote: { title: 'Quote', icon: 'chatbubble-outline' },
  quicklinks: { title: 'Quick Access', icon: 'grid-outline' },
  countdowns: { title: 'Countdowns', icon: 'hourglass-outline' },
  mood: { title: 'Mood Tracker', icon: 'heart-outline' },
  smartReminder: { title: 'Smart Reminders', icon: 'bulb-outline' },
};

const MOOD_OPTIONS = [
  { emoji: '😢', label: 'Awful', value: 1, color: '#C25B4E' },
  { emoji: '😐', label: 'Meh', value: 2, color: '#C9A84C' },
  { emoji: '🙂', label: 'Good', value: 3, color: '#5B9A6F' },
  { emoji: '😊', label: 'Great', value: 4, color: '#5B8AC2' },
  { emoji: '🔥', label: 'Amazing', value: 5, color: '#9B59B6' },
];

const ENERGY_LEVELS = [
  { label: 'Drained', value: 1, color: '#C25B4E' },
  { label: 'Low', value: 2, color: '#C9A84C' },
  { label: 'Normal', value: 3, color: '#5B9A6F' },
  { label: 'High', value: 4, color: '#5B8AC2' },
  { label: 'Peak', value: 5, color: '#9B59B6' },
];

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
      <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }} onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }} onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }} activeOpacity={1} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderLeftColor: color }, theme.shadows.small]}>
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
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }} onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }} onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }} activeOpacity={1} style={[styles.linkCard, { backgroundColor: theme.colors.surface }, theme.shadows.small]}>
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

function MoodWidget({ delay }) {
  const { theme, isDark } = useTheme();
  const { state, addMoodEntry } = useApp();
  const today = getTodayStr();
  const todayMood = state.moodEntries?.find(e => e.date === today);
  const [selectedMood, setSelectedMood] = useState(todayMood?.mood || null);
  const [selectedEnergy, setSelectedEnergy] = useState(todayMood?.energy || null);

  const handleMoodSelect = (value) => {
    setSelectedMood(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addMoodEntry({ date: today, mood: value, energy: selectedEnergy || 3 });
  };

  const handleEnergySelect = (value) => {
    setSelectedEnergy(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addMoodEntry({ date: today, mood: selectedMood || 3, energy: value });
  };

  const recentMoods = (state.moodEntries || []).slice(-7).reverse();

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay).springify().damping(18)}>
      <View style={[styles.widgetCard, { backgroundColor: theme.colors.surface, borderRadius: 16 }, theme.shadows.small]}>
        <View style={styles.widgetHeader}>
          <Ionicons name="heart-outline" size={18} color={theme.colors.accent} />
          <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>How are you?</Text>
        </View>

        <Text style={[styles.moodSectionLabel, { color: theme.colors.textMuted }]}>MOOD</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map(m => {
            const active = selectedMood === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                onPress={() => handleMoodSelect(m.value)}
                style={[styles.moodBtn, { backgroundColor: active ? m.color + '20' : theme.colors.surfaceLight }, active && { borderWidth: 1.5, borderColor: m.color }]}
              >
                <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, { color: active ? m.color : theme.colors.textMuted }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.moodSectionLabel, { color: theme.colors.textMuted }]}>ENERGY</Text>
        <View style={styles.energyRow}>
          {ENERGY_LEVELS.map(e => {
            const active = selectedEnergy === e.value;
            return (
              <TouchableOpacity
                key={e.value}
                onPress={() => handleEnergySelect(e.value)}
                style={[styles.energyBtn, { backgroundColor: active ? e.color + '20' : theme.colors.surfaceLight }, active && { borderWidth: 1.5, borderColor: e.color }]}
              >
                <View style={[styles.energyBar, { height: 4 + e.value * 4, backgroundColor: active ? e.color : theme.colors.textMuted + '40' }]} />
                <Text style={[styles.energyLabel, { color: active ? e.color : theme.colors.textMuted }]}>{e.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {recentMoods.length > 0 && (
          <>
            <Text style={[styles.moodSectionLabel, { color: theme.colors.textMuted, marginTop: 12 }]}>THIS WEEK</Text>
            <View style={styles.weekMoodRow}>
              {recentMoods.map((entry, i) => {
                const moodOpt = MOOD_OPTIONS.find(m => m.value === entry.mood);
                return (
                  <View key={entry.date + i} style={styles.weekMoodItem}>
                    <Text style={{ fontSize: 16 }}>{moodOpt?.emoji || '❓'}</Text>
                    <Text style={[styles.weekMoodDay, { color: theme.colors.textMuted }]}>
                      {new Date(entry.date).toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
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

function DraggableWidget({ id, index, onMoveUp, onMoveDown, isFirst, isLast, children }) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const translateY = useSharedValue(0);
  const widgetScale = useSharedValue(1);

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setEditing(true);
      widgetScale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
    });

  const pan = Gesture.Pan()
    .enabled(editing)
    .onUpdate((e) => { translateY.value = e.translationY; })
    .onEnd(() => {
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      widgetScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });

  const composed = Gesture.Race(longPress, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: widgetScale.value }],
    opacity: interpolate(widgetScale.value, [1, 1.02], [1, 0.95]),
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, { marginBottom: 12 }]}>
        {editing && (
          <View style={[styles.editBar, { backgroundColor: theme.colors.primary + '20' }]}>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (!isFirst) onMoveUp(index); }} disabled={isFirst} style={styles.editBtn}>
              <Ionicons name="arrow-up" size={16} color={isFirst ? theme.colors.textMuted + '40' : theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.editLabel, { color: theme.colors.primary }]}>Drag to reorder</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (!isLast) onMoveDown(index); }} disabled={isLast} style={styles.editBtn}>
              <Ionicons name="arrow-down" size={16} color={isLast ? theme.colors.textMuted + '40' : theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)} style={[styles.editBtn, { marginLeft: 8 }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            </TouchableOpacity>
          </View>
        )}
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

function StatsWidget({ todos, habits, delay }) {
  const { theme } = useTheme();
  return (
    <View style={styles.statsRow}>
      <AnimatedStatCard title="Pending" value={todos.pending} color={theme.colors.primary} icon="scroll-outline" delay={delay} onPress={() => {}} />
      <AnimatedStatCard title="Done" value={todos.completed} color={theme.colors.success} icon="checkmark-circle-outline" delay={delay + 60} onPress={() => {}} />
      <AnimatedStatCard title="Rituals" value={`${habits.completedToday}/${habits.total}`} color={theme.colors.accent} icon="flame-outline" delay={delay + 120} onPress={() => {}} />
      <AnimatedStatCard title="Overdue" value={todos.overdue} color={theme.colors.error} icon="alert-circle-outline" delay={delay + 180} onPress={() => {}} />
    </View>
  );
}

function QuickLinksWidget({ todayTodos, state, navigation, delay }) {
  const { theme } = useTheme();
  return (
    <View style={styles.linksContainer}>
      <QuickLink title="Quests" subtitle={`${todayTodos.length} today`} icon="scroll-outline" color={theme.colors.gold} count={todayTodos.length} delay={delay} onPress={() => navigation.navigate('Main', { screen: 'Quests' })} />
      <QuickLink title="Kanban Board" subtitle="Drag & organize" icon="columns-outline" color={theme.colors.secondary} delay={delay + 20} onPress={() => navigation.navigate('Kanban')} />
      <QuickLink title="Daily Challenge" subtitle="Earn rewards" icon="flash-outline" color={theme.colors.error} delay={delay + 40} onPress={() => navigation.navigate('Challenges')} />
      <QuickLink title="Discipline" subtitle="Consistency & rank" icon="shield-checkmark-outline" color={theme.colors.primary} delay={delay + 50} onPress={() => navigation.navigate('Discipline')} />
      <QuickLink title="Focus Timer" subtitle="Pomodoro" icon="timer-outline" color={theme.colors.secondary} delay={delay + 60} onPress={() => navigation.navigate('Pomodoro')} />
      <QuickLink title="Time Tracking" subtitle="Track time" icon="stopwatch-outline" color={theme.colors.success} delay={delay + 80} onPress={() => navigation.navigate('TimeTracking')} />
      <QuickLink title="Heatmap" subtitle="365-day view" icon="grid-outline" color={theme.colors.gold} delay={delay + 100} onPress={() => navigation.navigate('Heatmap')} />
      <QuickLink title="Journal" subtitle="Reflections" icon="book-outline" color={theme.colors.gold} count={state.notes.length} delay={delay + 120} onPress={() => navigation.navigate('Notes')} />
      <QuickLink title="Trophies" subtitle="Achievements" icon="trophy-outline" color={theme.colors.gold} count={state.achievements.filter(a => a.unlocked).length} delay={delay + 140} onPress={() => navigation.navigate('Achievements')} />
      <QuickLink title="Guild Hall" subtitle="Join forces" icon="people-outline" color={theme.colors.secondary} delay={delay + 150} onPress={() => navigation.navigate('Guild')} />
      <QuickLink title="Shop" subtitle="Spend coins" icon="storefront-outline" color={theme.colors.gold} delay={delay + 160} onPress={() => navigation.navigate('Shop')} />
      <QuickLink title="Eisenhower" subtitle="Priority matrix" icon="grid-outline" color={theme.colors.error} delay={delay + 170} onPress={() => navigation.navigate('EisenhowerMatrix')} />
      <QuickLink title="Analytics" subtitle="Productivity data" icon="bar-chart-outline" color={theme.colors.success} delay={delay + 180} onPress={() => navigation.navigate('Analytics')} />
      <QuickLink title="Rewards Hub" subtitle="Daily rewards & boxes" icon="gift-outline" color={theme.colors.gold} delay={delay + 190} onPress={() => navigation.navigate('GamificationHub')} />
      <QuickLink title="Widgets" subtitle="Dashboard widgets" icon="apps-outline" color={theme.colors.secondary} delay={delay + 200} onPress={() => navigation.navigate('Widgets')} />
      <QuickLink title="Focus Music" subtitle="Ambient sounds" icon="headset-outline" color={theme.colors.secondary} delay={delay + 210} onPress={() => navigation.navigate('FocusMusic')} />
      <QuickLink title="Weekly Plan" subtitle="Plan your week" icon="calendar-outline" color={theme.colors.primary} delay={delay + 220} onPress={() => navigation.navigate('WeeklyPlanner')} />
      <QuickLink title="Settings" subtitle="Configure" icon="settings-outline" color={theme.colors.textMuted} delay={delay + 230} onPress={() => navigation.navigate('Settings')} />
    </View>
  );
}

export default function DashboardScreen() {
  const { theme, widgetOrder, setWidgetOrder } = useTheme();
  const { getTodoStats, getHabitStats, getUpcomingCountdowns, state } = useApp();
  const navigation = useNavigation();
  const level = getLevel(state.xp);
  const [quote] = useState(getMotivationalQuote());
  const [customizing, setCustomizing] = useState(false);

  const todos = getTodoStats();
  const habits = getHabitStats();
  const upcomingCountdowns = getUpcomingCountdowns();
  const todayTodos = state.todos.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toISOString().split('T')[0] === getTodayStr();
  });

  const moveWidget = useCallback((fromIndex, toIndex) => {
    const order = [...widgetOrder];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    setWidgetOrder(order);
  }, [widgetOrder, setWidgetOrder]);

  const renderWidget = (widgetId, index) => {
    const props = { key: widgetId, delay: 200 + index * 100 };
    const isFirst = index === 0;
    const isLast = index === widgetOrder.length - 1;

    let content;
    switch (widgetId) {
      case 'stats':
        content = <StatsWidget todos={todos} habits={habits} delay={200 + index * 100} />;
        break;
      case 'quote':
        content = <QuoteCard quote={quote} delay={200 + index * 100} />;
        break;
      case 'quicklinks':
        content = <QuickLinksWidget todayTodos={todayTodos} state={state} navigation={navigation} delay={200 + index * 100} />;
        break;
      case 'countdowns':
        content = upcomingCountdowns.length > 0 ? (
          <View>
            <Animated.View entering={FadeIn.duration(500).delay(200 + index * 100)}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Approaching Events</Text>
            </Animated.View>
            {upcomingCountdowns.slice(0, 2).map((cd, i) => (
              <CountdownPreview key={cd.id} countdown={cd} delay={300 + index * 100 + i * 80} />
            ))}
          </View>
        ) : null;
        break;
      case 'mood':
        content = <MoodWidget delay={200 + index * 100} />;
        break;
      case 'smartReminder':
        content = <SmartReminderCard delay={200 + index * 100} />;
        break;
      default:
        return null;
    }

    if (!content) return null;

    if (customizing) {
      return (
        <DraggableWidget
          key={widgetId}
          id={widgetId}
          index={index}
          onMoveUp={(i) => moveWidget(i, i - 1)}
          onMoveDown={(i) => moveWidget(i, i + 1)}
          isFirst={isFirst}
          isLast={isLast}
        >
          {content}
        </DraggableWidget>
      );
    }

    return <View key={widgetId}>{content}</View>;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GreetingHeader />

        {widgetOrder.map((id, i) => renderWidget(id, i))}
      </ScrollView>

      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCustomizing(!customizing); }}
        style={[styles.customizeFab, { backgroundColor: customizing ? theme.colors.primary : theme.colors.surface }, theme.shadows.medium]}
      >
        <Ionicons name={customizing ? 'checkmark' : 'reorder-three'} size={20} color={customizing ? theme.colors.surface : theme.colors.primary} />
      </TouchableOpacity>
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
    marginHorizontal: 24, marginBottom: 12, padding: 20, borderRadius: 16,
  },
  quoteText: { fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 11, marginTop: 8, textAlign: 'right' },

  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  statCard: {
    padding: 16, borderRadius: 14, borderLeftWidth: 3,
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
    padding: 14, borderRadius: 14, marginBottom: 8,
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
    marginHorizontal: 24, padding: 14, borderRadius: 14,
    borderLeftWidth: 3, marginBottom: 8,
  },
  countdownTitle: { fontSize: 15, fontWeight: '600' },
  countdownTime: { fontSize: 13, marginTop: 4 },

  widgetCard: { marginHorizontal: 24, padding: 18 },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  widgetTitle: { fontSize: 16, fontWeight: '700', fontFamily: serifFont },

  moodSectionLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1.2, marginBottom: 8,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  moodBtn: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 12, minWidth: 54,
  },
  moodLabel: { fontSize: 9, fontWeight: '600', marginTop: 4 },

  energyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  energyBtn: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 10, flex: 1, marginHorizontal: 2,
  },
  energyBar: { width: 6, borderRadius: 3, marginBottom: 4 },
  energyLabel: { fontSize: 8, fontWeight: '600' },

  weekMoodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekMoodItem: { alignItems: 'center' },
  weekMoodDay: { fontSize: 9, marginTop: 2, fontWeight: '500' },

  editBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, borderRadius: 8, marginBottom: 6, gap: 12,
  },
  editBtn: { padding: 4 },
  editLabel: { fontSize: 11, fontWeight: '600' },

  customizeFab: {
    position: 'absolute', bottom: 30, left: 24,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
});
