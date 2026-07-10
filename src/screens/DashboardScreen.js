import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Platform, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, getLevel } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import {
  formatDate, getGreeting, getDaysRemaining, getTimeRemaining,
  getTodayStr, getMotivationalQuote,
} from '../utils/dateHelpers';
import { FadeInView, ScaleInView, OrnamentalDivider } from '../components/MedievalUI';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function StatCard({ title, value, color, icon, delay, onPress }) {
  const { theme } = useTheme();
  return (
    <FadeInView delay={delay} style={{ width: CARD_W, marginHorizontal: 6, marginBottom: 12 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderLeftColor: color }]}>
        <View style={[styles.statIconWrap, { backgroundColor: color + '12' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.colors.textMuted }]}>{title}</Text>
      </TouchableOpacity>
    </FadeInView>
  );
}

function QuickLink({ title, subtitle, icon, color, count, onPress }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.linkCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.linkIconWrap, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.linkInfo}>
        <Text style={[styles.linkTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.linkSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      </View>
      {count !== undefined && (
        <Text style={[styles.linkCount, { color }]}>{count}</Text>
      )}
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
}

function CountdownPreview({ countdown }) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(countdown.targetDate));
  const days = getDaysRemaining(countdown.targetDate);
  const color = countdown.color || theme.colors.primary;

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining(countdown.targetDate)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={[styles.countdownCard, { backgroundColor: theme.colors.surface, borderLeftColor: color }]}>
      <Text style={[styles.countdownTitle, { color: theme.colors.text }]}>{countdown.title}</Text>
      <Text style={[styles.countdownTime, { color }]}>
        {days > 0 ? `${days} days · ` : 'Today · '}
        {timeLeft.hours}h {timeLeft.minutes}m
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
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
        <FadeInView duration={600} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>{getGreeting()}</Text>
            <Text style={[styles.date, { color: theme.colors.textMuted }]}>{formatDate(new Date())}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.badge, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('Stats')}>
              <Ionicons name="shield-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Lv.{level.level}</Text>
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="diamond-outline" size={14} color={theme.colors.gold} />
              <Text style={[styles.badgeText, { color: theme.colors.gold }]}>{state.coins}</Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={150} style={[styles.quoteCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.quoteText, { color: theme.colors.textSecondary }]}>"{quote.text}"</Text>
          <Text style={[styles.quoteAuthor, { color: theme.colors.textMuted }]}>— {quote.author}</Text>
        </FadeInView>

        <View style={styles.statsRow}>
          <StatCard title="Pending" value={todos.pending} color={theme.colors.primary} icon="scroll-outline" delay={200} onPress={() => navigation.navigate('Quests')} />
          <StatCard title="Done" value={todos.completed} color={theme.colors.success} icon="checkmark-circle-outline" delay={250} onPress={() => navigation.navigate('Stats')} />
          <StatCard title="Rituals" value={`${habits.completedToday}/${habits.total}`} color={theme.colors.accent} icon="flame-outline" delay={300} onPress={() => navigation.navigate('Rituals')} />
          <StatCard title="Overdue" value={todos.overdue} color={theme.colors.error} icon="alert-circle-outline" delay={350} onPress={() => navigation.navigate('Quests')} />
        </View>

        <OrnamentalDivider />

        <FadeInView delay={400}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Access</Text>
        </FadeInView>

        <View style={styles.linksContainer}>
          <QuickLink title="Quests" subtitle={`${todayTodos.length} today`} icon="scroll-outline" color={theme.colors.primary} count={todayTodos.length} onPress={() => navigation.navigate('Quests')} />
          <QuickLink title="Focus Timer" subtitle="Pomodoro session" icon="timer-outline" color={theme.colors.accent} onPress={() => navigation.navigate('Pomodoro')} />
          <QuickLink title="Journal" subtitle="Daily reflections" icon="book-outline" color={theme.colors.secondary} count={state.notes.length} onPress={() => navigation.navigate('Notes')} />
          <QuickLink title="Trophies" subtitle="Your achievements" icon="trophy-outline" color={theme.colors.gold} count={state.achievements.filter(a => a.unlocked).length} onPress={() => navigation.navigate('Achievements')} />
          <QuickLink title="Statistics" subtitle="Track progress" icon="stats-chart-outline" color={theme.colors.success} onPress={() => navigation.navigate('Stats')} />
          <QuickLink title="Settings" subtitle="Configure realm" icon="settings-outline" color={theme.colors.textMuted} onPress={() => navigation.navigate('Settings')} />
        </View>

        {upcomingCountdowns.length > 0 && (
          <>
            <OrnamentalDivider />
            <FadeInView delay={500}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Approaching Events</Text>
            </FadeInView>
            {upcomingCountdowns.slice(0, 2).map(cd => (
              <CountdownPreview key={cd.id} countdown={cd} />
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
