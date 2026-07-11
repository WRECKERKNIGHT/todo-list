import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Dimensions,
} from 'react-native';
import { Svg, Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeInLeft,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, Easing, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard, FadeInView } from '../components/MedievalUI';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const DISCIPLINE_RANKS = [
  { name: 'Undisciplined', icon: 'skull-outline', minAvg: 0, color: '#8B3A3A' },
  { name: 'Struggling', icon: 'warning-outline', minAvg: 30, color: '#C25B4E' },
  { name: 'Wavering', icon: 'hand-left-outline', minAvg: 50, color: '#D68910' },
  { name: 'Disciplined', icon: 'shield-checkmark-outline', minAvg: 70, color: '#27AE60' },
  { name: 'Elite', icon: 'diamond-outline', minAvg: 85, color: '#3498DB' },
  { name: 'Legendary', icon: 'flame-outline', minAvg: 95, color: '#C9A84C' },
];

const SCORE_COLORS = {
  red: '#E74C3C',
  orange: '#E67E22',
  yellow: '#F1C40F',
  green: '#27AE60',
  gold: '#C9A84C',
};

function getScoreColor(score) {
  if (score >= 90) return SCORE_COLORS.gold;
  if (score >= 75) return SCORE_COLORS.green;
  if (score >= 60) return SCORE_COLORS.yellow;
  if (score >= 40) return SCORE_COLORS.orange;
  return SCORE_COLORS.red;
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function getGradeColor(grade) {
  const map = { 'A+': '#C9A84C', A: '#27AE60', B: '#3498DB', C: '#F1C40F', D: '#E67E22', F: '#E74C3C' };
  return map[grade] || '#8A8298';
}

const GAUGE_SIZE = 200;
const GAUGE_STROKE = 14;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

function ConsistencyGauge({ score }) {
  const { theme } = useTheme();
  const animProgress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    animProgress.value = withTiming(score, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        const diff = score - prev;
        if (Math.abs(diff) < 1) return score;
        return Math.round(prev + diff * 0.1);
      });
    }, 16);
    return () => clearInterval(interval);
  }, [score]);

  const color = getScoreColor(score);
  const dashOffset = GAUGE_CIRCUMFERENCE - (score / 100) * GAUGE_CIRCUMFERENCE;

  return (
    <View style={gaugeStyles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
        <Circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          stroke={theme.colors.surfaceLight}
          strokeWidth={GAUGE_STROKE}
          fill="none"
        />
        <Circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          stroke={color}
          strokeWidth={GAUGE_STROKE}
          fill="none"
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
        />
        <G>
          <SvgText
            x={GAUGE_SIZE / 2}
            y={GAUGE_SIZE / 2 - 6}
            textAnchor="middle"
            fontSize={38}
            fontWeight="300"
            fill={theme.colors.text}
            fontFamily={serifFont}
          >
            {displayScore}%
          </SvgText>
          <SvgText
            x={GAUGE_SIZE / 2}
            y={GAUGE_SIZE / 2 + 20}
            textAnchor="middle"
            fontSize={11}
            fontWeight="600"
            letterSpacing={1.5}
            fill={color}
          >
            CONSISTENCY
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
});

function WeeklyTrendChart({ history }) {
  const { theme } = useTheme();
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const weekData = useMemo(() => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = history.find((h) => h.date === dateStr);
      data.push({
        day: days[d.getDay()],
        score: entry ? entry.score : 0,
        isToday: i === 0,
      });
    }
    return data;
  }, [history]);

  const maxBarHeight = 100;

  return (
    <View style={styles.trendBarRow}>
      {weekData.map((item, i) => {
        const barH = maxBarHeight * (item.score / 100);
        const barColor = getScoreColor(item.score);
        return (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(400).delay(200 + i * 60).springify().damping(14)}
            style={styles.trendBarColumn}
          >
            <Text style={[styles.trendBarValue, { color: theme.colors.textMuted }]}>
              {item.score > 0 ? item.score : ''}
            </Text>
            <View style={[styles.trendBarBg, { backgroundColor: theme.colors.surfaceLight, height: maxBarHeight }]}>
              <Animated.View
                entering={FadeInUp.duration(500).delay(400 + i * 60).springify().damping(14)}
                style={[
                  styles.trendBarFill,
                  { height: Math.max(2, barH), backgroundColor: barColor },
                ]}
              />
            </View>
            <Text
              style={[
                styles.trendBarDay,
                { color: item.isToday ? theme.colors.primary : theme.colors.textMuted },
                item.isToday && styles.trendBarDayActive,
              ]}
            >
              {item.day}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function ReportCard({ report, theme }) {
  if (!report || report.daysLogged === 0) {
    return (
      <View style={styles.reportEmpty}>
        <Ionicons name="document-text-outline" size={28} color={theme.colors.textMuted} />
        <Text style={[styles.reportEmptyText, { color: theme.colors.textMuted }]}>
          No data yet this week
        </Text>
      </View>
    );
  }

  const gradeColor = getGradeColor(report.grade);

  return (
    <View style={styles.reportContent}>
      <View style={styles.reportGradeSection}>
        <View style={[styles.reportGradeCircle, { borderColor: gradeColor }]}>
          <Text style={[styles.reportGradeText, { color: gradeColor }]}>{report.grade}</Text>
        </View>
        <View style={styles.reportGradeInfo}>
          <Text style={[styles.reportAvgLabel, { color: theme.colors.textMuted }]}>Weekly Average</Text>
          <Text style={[styles.reportAvgScore, { color: theme.colors.text }]}>{report.avgScore}%</Text>
          <Text style={[styles.reportDaysLogged, { color: theme.colors.textSecondary }]}>
            {report.daysLogged} of 7 days logged
          </Text>
        </View>
      </View>
      <View style={[styles.reportDivider, { backgroundColor: theme.colors.border }]} />
      <View style={styles.reportStatsGrid}>
        {[
          { label: 'Tasks Done', value: `${report.totalCompleted}/${report.totalTasks}`, icon: 'checkmark-circle-outline', color: theme.colors.success },
          { label: 'Habits Done', value: `${report.habitsDone}/${report.totalHabits}`, icon: 'repeat-outline', color: theme.colors.primary },
          { label: 'Overdue', value: report.totalOverdue, icon: 'alert-circle-outline', color: theme.colors.error },
          { label: 'Days Active', value: report.daysLogged, icon: 'calendar-outline', color: theme.colors.accent },
        ].map((stat) => (
          <View key={stat.label} style={styles.reportStatCell}>
            <Ionicons name={stat.icon} size={16} color={stat.color} />
            <Text style={[styles.reportStatValue, { color: theme.colors.text }]}>{stat.value}</Text>
            <Text style={[styles.reportStatLabel, { color: theme.colors.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PunishmentDashboard({ state, togglePunishment, theme }) {
  const recentPunishments = useMemo(() => {
    return [...state.punishmentReasons]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [state.punishmentReasons]);

  return (
    <View>
      <View style={styles.punishToggleRow}>
        <View style={styles.punishToggleInfo}>
          <Ionicons
            name={state.punishmentEnabled ? 'flash-outline' : 'flash-off-outline'}
            size={18}
            color={state.punishmentEnabled ? theme.colors.warning : theme.colors.textMuted}
          />
          <Text style={[styles.punishToggleLabel, { color: theme.colors.text }]}>Auto-Punishment</Text>
        </View>
        <TouchableOpacity
          onPress={togglePunishment}
          style={[
            styles.toggleTrack,
            { backgroundColor: state.punishmentEnabled ? theme.colors.primary : theme.colors.surfaceLight },
          ]}
        >
          <View
            style={[
              styles.toggleThumb,
              {
                backgroundColor: '#fff',
                transform: [{ translateX: state.punishmentEnabled ? 20 : 2 }],
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.punishStatsRow}>
        {[
          { label: 'Current Streak', value: state.streakDays, icon: 'flame-outline', color: theme.colors.accent },
          { label: 'Longest Streak', value: state.longestStreak, icon: 'trophy-outline', color: theme.colors.gold },
          { label: 'Total Fines', value: state.totalFinesPaid, icon: 'wallet-outline', color: theme.colors.error },
          { label: 'Punishments', value: state.punishmentCount, icon: 'skull-outline', color: theme.colors.textSecondary },
        ].map((stat) => (
          <View key={stat.label} style={styles.punishStatCell}>
            <Ionicons name={stat.icon} size={14} color={stat.color} />
            <Text style={[styles.punishStatValue, { color: theme.colors.text }]}>{stat.value}</Text>
            <Text style={[styles.punishStatLabel, { color: theme.colors.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {recentPunishments.length > 0 && (
        <View style={styles.punishHistorySection}>
          <Text style={[styles.punishHistoryTitle, { color: theme.colors.textMuted }]}>Recent Punishments</Text>
          {recentPunishments.map((p, i) => (
            <Animated.View
              key={i}
              entering={FadeInLeft.duration(300).delay(i * 60).springify().damping(16)}
              style={[styles.punishHistoryRow, { borderBottomColor: theme.colors.border }]}
            >
              <View style={styles.punishHistoryLeft}>
                <Ionicons name="alert-circle-outline" size={14} color={theme.colors.error} />
                <Text style={[styles.punishHistoryReason, { color: theme.colors.text }]} numberOfLines={1}>
                  {p.reason}
                </Text>
              </View>
              <View style={styles.punishHistoryRight}>
                {p.coinsLost > 0 && (
                  <Text style={[styles.punishHistoryFine, { color: theme.colors.error }]}>-{p.coinsLost}</Text>
                )}
                <Text style={[styles.punishHistoryDate, { color: theme.colors.textMuted }]}>
                  {new Date(p.date).toLocaleDateString()}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}

function RankProgression({ currentRank }) {
  const { theme } = useTheme();
  const currentIdx = DISCIPLINE_RANKS.findIndex((r) => r.name === currentRank);

  return (
    <View style={styles.rankList}>
      {DISCIPLINE_RANKS.map((rank, i) => {
        const isCurrent = rank.name === currentRank;
        const isPast = i <= currentIdx;
        return (
          <Animated.View
            key={rank.name}
            entering={FadeInLeft.duration(350).delay(i * 50).springify().damping(16)}
            style={[
              styles.rankRow,
              isCurrent && { backgroundColor: rank.color + '15', borderColor: rank.color + '40' },
              !isCurrent && { borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.rankIconWrap,
                { backgroundColor: isPast ? rank.color + '20' : theme.colors.surfaceLight },
              ]}
            >
              <Ionicons
                name={rank.icon}
                size={18}
                color={isPast ? rank.color : theme.colors.textMuted}
              />
            </View>
            <View style={styles.rankInfo}>
              <Text
                style={[
                  styles.rankName,
                  { color: isPast ? rank.color : theme.colors.textMuted },
                  isCurrent && styles.rankNameActive,
                ]}
              >
                {rank.name}
              </Text>
              <Text style={[styles.rankThreshold, { color: theme.colors.textMuted }]}>
                {rank.minAvg}%+ avg
              </Text>
            </View>
            {isCurrent && (
              <Animated.View
                entering={FadeIn.duration(300).delay(300).springify()}
                style={[styles.rankCurrentBadge, { backgroundColor: rank.color + '20' }]}
              >
                <Text style={[styles.rankCurrentText, { color: rank.color }]}>CURRENT</Text>
              </Animated.View>
            )}
            {isPast && !isCurrent && (
              <Ionicons name="checkmark-circle" size={16} color={rank.color} />
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function DisciplineScreen() {
  const { theme } = useTheme();
  const {
    state, togglePunishment,
    calculateConsistency, logDailyConsistency,
    generateWeeklyReport, addWeeklyReport,
  } = useApp();

  const [todayScore, setTodayScore] = useState(0);

  useEffect(() => {
    const result = calculateConsistency();
    setTodayScore(result.score);
    logDailyConsistency({
      date: new Date().toISOString().split('T')[0],
      score: result.score,
      tasksCompleted: result.tasksCompleted,
      tasksTotal: result.tasksTotal,
      habitsCompleted: result.habitsCompleted,
      habitsTotal: result.habitsTotal,
      overdueCount: result.overdueCount,
    });
  }, []);

  const weeklyReport = useMemo(() => generateWeeklyReport(), [state.consistencyHistory, state.todos, state.habits]);

  const rankInfo = useMemo(() => {
    return DISCIPLINE_RANKS.find((r) => r.name === state.disciplineRank) || DISCIPLINE_RANKS[0];
  }, [state.disciplineRank]);

  const headerFade = useSharedValue(0);
  useEffect(() => {
    headerFade.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, []);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerFade.value }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIconWrap, { backgroundColor: rankInfo.color + '18' }]}>
              <Ionicons name={rankInfo.icon} size={22} color={rankInfo.color} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Discipline Center</Text>
              <Text style={[styles.headerRank, { color: rankInfo.color }]}>{state.disciplineRank}</Text>
            </View>
          </View>
        </Animated.View>

        <FadeInView delay={100}>
          <GlassCard delay={0} style={styles.gaugeCard}>
            <ConsistencyGauge score={todayScore} />
          </GlassCard>
        </FadeInView>

        <FadeInView delay={200}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Weekly Trend</Text>
          <GlassCard delay={100} style={styles.trendCard}>
            <WeeklyTrendChart history={state.consistencyHistory} />
          </GlassCard>
        </FadeInView>

        <FadeInView delay={300}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Report Card</Text>
          <GlassCard delay={200} style={styles.reportCard}>
            <ReportCard report={weeklyReport} theme={theme} />
          </GlassCard>
        </FadeInView>

        <FadeInView delay={400}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Punishment Dashboard</Text>
          <GlassCard delay={300} style={styles.punishCard}>
            <PunishmentDashboard
              state={state}
              togglePunishment={togglePunishment}
              theme={theme}
            />
          </GlassCard>
        </FadeInView>

        <FadeInView delay={500}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Rank Progression</Text>
          <GlassCard delay={400} style={styles.rankCard}>
            <RankProgression currentRank={state.disciplineRank} />
          </GlassCard>
        </FadeInView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 30, paddingTop: 60 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', fontFamily: serifFont },
  headerRank: { fontSize: 12, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

  gaugeCard: { marginHorizontal: 24, marginBottom: 8, alignItems: 'center' },

  sectionLabel: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 10, marginTop: 12,
  },

  trendCard: { marginHorizontal: 24, marginBottom: 8 },
  trendBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8 },
  trendBarColumn: { alignItems: 'center', width: (SCREEN_WIDTH - 96) / 7 },
  trendBarValue: { fontSize: 10, marginBottom: 4, fontWeight: '600' },
  trendBarBg: { width: (SCREEN_WIDTH - 96) / 7 - 6, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  trendBarFill: { borderRadius: 4 },
  trendBarDay: { fontSize: 10, marginTop: 6, fontWeight: '500' },
  trendBarDayActive: { fontWeight: '700' },

  reportCard: { marginHorizontal: 24, marginBottom: 8 },
  reportEmpty: { alignItems: 'center', paddingVertical: 24 },
  reportEmptyText: { fontSize: 13, marginTop: 8 },
  reportContent: {},
  reportGradeSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  reportGradeCircle: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  reportGradeText: { fontSize: 24, fontWeight: '700', fontFamily: serifFont },
  reportGradeInfo: { flex: 1 },
  reportAvgLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  reportAvgScore: { fontSize: 28, fontWeight: '700', fontFamily: serifFont, marginTop: 2 },
  reportDaysLogged: { fontSize: 12, marginTop: 2 },
  reportDivider: { height: 1, marginVertical: 12 },
  reportStatsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  reportStatCell: { alignItems: 'center', flex: 1 },
  reportStatValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  reportStatLabel: { fontSize: 10, fontWeight: '500', marginTop: 2, textAlign: 'center' },

  punishCard: { marginHorizontal: 24, marginBottom: 8 },
  punishToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  punishToggleInfo: { flexDirection: 'row', alignItems: 'center' },
  punishToggleLabel: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  toggleTrack: {
    width: 44, height: 24, borderRadius: 12, padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: { width: 20, height: 20, borderRadius: 10 },

  punishStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  punishStatCell: { alignItems: 'center', flex: 1 },
  punishStatValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  punishStatLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2, textAlign: 'center' },

  punishHistorySection: { marginTop: 4 },
  punishHistoryTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  punishHistoryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  punishHistoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  punishHistoryReason: { fontSize: 13, marginLeft: 8, flex: 1 },
  punishHistoryRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  punishHistoryFine: { fontSize: 13, fontWeight: '700', marginRight: 8 },
  punishHistoryDate: { fontSize: 11 },

  rankCard: { marginHorizontal: 24, marginBottom: 8 },
  rankList: {},
  rankRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 10, marginBottom: 6, borderWidth: 1,
  },
  rankIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '600' },
  rankNameActive: { fontWeight: '700' },
  rankThreshold: { fontSize: 11, marginTop: 1 },
  rankCurrentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rankCurrentText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
});
