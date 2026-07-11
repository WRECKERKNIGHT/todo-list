import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard, FadeInView } from '../components/MedievalUI';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH - 96;

const AnimatedBar = ({ progress, color, delay }) => {
  const widthAnim = useSharedValue(0);

  React.useEffect(() => {
    widthAnim.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${interpolate(widthAnim.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <View style={[styles.barTrack]}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
};

const StatCard = ({ icon, label, value, color, theme }) => (
  <GlassCard
    style={[
      styles.statCard,
      { borderColor: color ? color + '40' : theme.colors.border },
    ]}
  >
    <Ionicons name={icon} size={22} color={color || theme.colors.primary} />
    <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
  </GlassCard>
);

export default function AnalyticsScreen() {
  const { state } = useApp();
  const { theme } = useTheme();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const totalCompleted = useMemo(
    () => state.todos.filter((t) => t.completed).length,
    [state.todos]
  );

  const totalHabitsLogged = useMemo(
    () =>
      state.habits
        ? state.habits.reduce((sum, h) => sum + (h.completedDates ? h.completedDates.length : 0), 0)
        : 0,
    [state.habits]
  );

  const weeklyData = useMemo(() => {
    const now = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const count = state.todos.filter((t) => {
        if (!t.completed || !t.completedAt) return false;
        const ca = new Date(t.completedAt);
        return ca >= dayStart && ca <= dayEnd;
      }).length;
      last7.push({
        label: dayNames[d.getDay()],
        dayIndex: d.getDay(),
        count,
      });
    }
    return last7;
  }, [state.todos]);

  const weeklyMax = useMemo(() => Math.max(...weeklyData.map((d) => d.count), 1), [weeklyData]);

  const bestWorstDay = useMemo(() => {
    const weekdayCounts = new Array(7).fill(0);
    const hourCounts = new Array(24).fill(0);
    state.todos.forEach((t) => {
      if (t.completed && t.completedAt) {
        const ca = new Date(t.completedAt);
        weekdayCounts[ca.getDay()]++;
        hourCounts[ca.getHours()]++;
      }
    });
    const maxDay = weekdayCounts.indexOf(Math.max(...weekdayCounts));
    const minDay = weekdayCounts.indexOf(Math.min(...weekdayCounts));
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    return {
      bestDay: { name: dayNamesFull[maxDay], count: weekdayCounts[maxDay] },
      worstDay: { name: dayNamesFull[minDay], count: weekdayCounts[minDay] },
      peakHour: { hour: peakHour, count: hourCounts[peakHour], label: `${peakHour}:00` },
    };
  }, [state.todos]);

  const categoryData = useMemo(() => {
    const categories = ['work', 'personal', 'health', 'education', 'finance', 'other'];
    const counts = {};
    categories.forEach((c) => (counts[c] = 0));
    state.todos.forEach((t) => {
      if (t.completed) {
        const cat = (t.category || 'other').toLowerCase();
        if (counts[cat] !== undefined) {
          counts[cat]++;
        } else {
          counts.other++;
        }
      }
    });
    return categories.map((c) => ({
      name: c,
      count: counts[c],
      pct: totalCompleted > 0 ? (counts[c] / totalCompleted) * 100 : 0,
    }));
  }, [state.todos, totalCompleted]);

  const categoryColors = {
    work: '#6C63FF',
    personal: '#FF6B6B',
    health: '#51CF66',
    education: '#FCC419',
    finance: '#22B8CF',
    other: '#ADB5BD',
  };

  const completionRate = useMemo(
    () => (state.todos.length > 0 ? Math.round((totalCompleted / state.todos.length) * 100) : 0),
    [state.todos.length, totalCompleted]
  );

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      const count = state.todos.filter((t) => {
        if (!t.completed || !t.completedAt) return false;
        const ca = new Date(t.completedAt);
        return ca >= weekStart && ca <= weekEnd;
      }).length;
      weeks.push({ label: `Week ${4 - i}`, count });
    }
    return weeks;
  }, [state.todos]);

  const completionColor =
    completionRate >= 70 ? '#51CF66' : completionRate >= 40 ? '#FCC419' : '#FF6B6B';

  const getBarColor = (count) => {
    if (count <= 2) return '#FF6B6B';
    if (count <= 5) return '#FCC419';
    return '#51CF66';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Ionicons name="bar-chart" size={28} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Analytics</Text>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <View style={styles.statGrid}>
          <StatCard
            icon="checkmark-circle"
            label="Tasks Done"
            value={totalCompleted}
            color="#51CF66"
            theme={theme}
          />
          <StatCard
            icon="flame"
            label="Habits Logged"
            value={totalHabitsLogged}
            color="#FF6B6B"
            theme={theme}
          />
          <StatCard
            icon="flash"
            label="Current Streak"
            value={state.streakDays || 0}
            color="#FCC419"
            theme={theme}
          />
          <StatCard
            icon="shield-checkmark"
            label="Discipline Rank"
            value={state.disciplineRank || 'N/A'}
            color="#6C63FF"
            theme={theme}
          />
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <GlassCard style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Weekly Activity
          </Text>
          <View style={styles.chartContainer}>
            {weeklyData.map((day, i) => (
              <View key={i} style={styles.barWrapper}>
                <View style={styles.barRow}>
                  <AnimatedBar
                    progress={day.count / weeklyMax}
                    color={getBarColor(day.count)}
                    delay={i * 100}
                  />
                  <Text style={[styles.barCount, { color: theme.colors.textSecondary }]}>
                    {day.count}
                  </Text>
                </View>
                <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>
                  {day.label}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={300}>
        <GlassCard style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Day Analysis
          </Text>
          <View style={styles.analysisRow}>
            <View style={[styles.analysisCard, { backgroundColor: '#51CF6615' }]}>
              <Ionicons name="trophy" size={22} color="#51CF66" />
              <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>
                Most Productive Day
              </Text>
              <Text style={[styles.analysisValue, { color: '#51CF66' }]}>
                {bestWorstDay.bestDay.name}
              </Text>
              <Text style={[styles.analysisSub, { color: theme.colors.textSecondary }]}>
                {bestWorstDay.bestDay.count} tasks completed
              </Text>
            </View>
            <View style={[styles.analysisCard, { backgroundColor: '#FF6B6B15' }]}>
              <Ionicons name="hourglass-outline" size={22} color="#FF6B6B" />
              <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>
                Least Productive Day
              </Text>
              <Text style={[styles.analysisValue, { color: '#FF6B6B' }]}>
                {bestWorstDay.worstDay.name}
              </Text>
              <Text style={[styles.analysisSub, { color: theme.colors.textSecondary }]}>
                {bestWorstDay.worstDay.count} tasks completed
              </Text>
            </View>
          </View>
          <View style={[styles.peakHourCard, { backgroundColor: '#FCC41915' }]}>
            <Ionicons name="time" size={22} color="#FCC419" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>
                Peak Hour
              </Text>
              <Text style={[styles.analysisValue, { color: '#FCC419' }]}>
                {bestWorstDay.peakHour.label}
              </Text>
            </View>
            <Text style={[styles.analysisSub, { color: theme.colors.textSecondary }]}>
              {bestWorstDay.peakHour.count} completions
            </Text>
          </View>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={400}>
        <GlassCard style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Time Distribution
          </Text>
          {categoryData.map((cat) => (
            <View key={cat.name} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColors[cat.name] }]} />
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                </Text>
                <Text style={[styles.categoryPct, { color: theme.colors.textSecondary }]}>
                  {Math.round(cat.pct)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${cat.pct}%`,
                      backgroundColor: categoryColors[cat.name],
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </GlassCard>
      </FadeInView>

      <FadeInView delay={500}>
        <GlassCard style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Completion Rate
          </Text>
          <View style={styles.completionContainer}>
            <Text style={[styles.completionNumber, { color: completionColor }]}>
              {completionRate}%
            </Text>
            <Text style={[styles.completionSub, { color: theme.colors.textSecondary }]}>
              {totalCompleted} of {state.todos.length} tasks
            </Text>
          </View>
          <View style={[styles.completionTrack, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.completionFill,
                {
                  width: `${completionRate}%`,
                  backgroundColor: completionColor,
                },
              ]}
            />
          </View>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={600}>
        <GlassCard style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Monthly Trend
          </Text>
          <View style={styles.weeklyGrid}>
            {monthlyTrend.map((week, i) => (
              <View key={i} style={[styles.weekCard, { borderColor: theme.colors.border }]}>
                <Text style={[styles.weekLabel, { color: theme.colors.textSecondary }]}>
                  {week.label}
                </Text>
                <Text style={[styles.weekCount, { color: theme.colors.text }]}>
                  {week.count}
                </Text>
                <Text style={[styles.weekSub, { color: theme.colors.textSecondary }]}>
                  tasks
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </FadeInView>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    gap: 8,
  },
  barWrapper: {
    gap: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff10',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barCount: {
    fontSize: 12,
    width: 20,
    textAlign: 'right',
  },
  barLabel: {
    fontSize: 11,
    marginLeft: 4,
  },
  analysisRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analysisCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  peakHourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  analysisTitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  analysisSub: {
    fontSize: 10,
  },
  categoryRow: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  categoryPct: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  completionNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  completionSub: {
    fontSize: 14,
    marginTop: 4,
  },
  completionTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 6,
  },
  weeklyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  weekCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  weekCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  weekSub: {
    fontSize: 10,
    marginTop: 2,
  },
});
