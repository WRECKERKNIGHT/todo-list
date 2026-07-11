import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn, BounceIn,
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withRepeat, withTiming,
  Easing, interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function ProgressRing({ progress, size = 120, strokeWidth = 6, color }) {
  const { theme } = useTheme();
  const ringColor = color || theme.colors.primary;
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withSpring(progress, { damping: 18, stiffness: 60 });
  }, [progress]);

  const bgOpacity = interpolate(sv.value, [0, 1], [0.1, 0.05]);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderColor: ringColor + '15' }]} />
      <View style={[styles.ringProgress, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: ringColor,
        borderTopColor: progress < 1 ? 'transparent' : ringColor,
        borderRightColor: progress < 0.25 ? 'transparent' : ringColor,
        borderBottomColor: progress < 0.5 ? 'transparent' : ringColor,
        borderLeftColor: progress < 0.75 ? 'transparent' : ringColor,
        transform: [{ rotate: '-45deg' }],
      }]} />
    </View>
  );
}

export default function ChallengesScreen() {
  const { theme } = useTheme();
  const { state, completeDailyChallenge } = useApp();
  const challenge = state.dailyChallenge;
  const today = new Date().toISOString().split('T')[0];
  const isTodayCompleted = state.challengesCompleted.some(c => c.date === today);

  const getProgress = () => {
    if (!challenge) return 0;
    if (challenge.completed || isTodayCompleted) return 1;
    switch (challenge.type) {
      case 'tasks': return Math.min(1, state.todos.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === today).length / challenge.target);
      case 'habits': {
        const total = state.habits.length;
        if (total === 0) return 0;
        const done = state.habits.filter(h => h.completedDates.includes(today)).length;
        return done / total;
      }
      case 'pomodoros': return Math.min(1, (state.pomodoroSessions % 4) / challenge.target);
      case 'notes': return Math.min(1, state.notes.filter(n => new Date(n.createdAt).toISOString().split('T')[0] === today).length / challenge.target);
      default: return 0;
    }
  };

  const handleComplete = () => {
    if (!challenge || challenge.completed || isTodayCompleted) return;
    const progress = getProgress();
    if (progress >= 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeDailyChallenge();
      Alert.alert('Challenge Complete!', `+${challenge.reward.xp} XP, +${challenge.reward.coins} coins`);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Not Yet', `Progress: ${Math.round(progress * 100)}%`);
    }
  };

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'tasks': return 'scroll';
      case 'habits': return 'flame';
      case 'pomodoros': return 'timer';
      case 'early': return 'sunny';
      case 'notes': return 'book';
      case 'high_priority': return 'flash';
      default: return 'trophy';
    }
  };

  const progress = getProgress();
  const isCompleted = challenge?.completed || isTodayCompleted;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Challenges</Text>
        <View style={[styles.streakBadge, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="flame" size={14} color={theme.colors.accent} />
          <Text style={[styles.streakText, { color: theme.colors.accent }]}>{state.challengeStreak} streak</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={ZoomIn.duration(600).springify().damping(12)} style={styles.ringContainer}>
          <ProgressRing progress={progress} size={160} strokeWidth={8} color={isCompleted ? theme.colors.success : theme.colors.primary} />
          <View style={styles.ringOverlay}>
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={36} color={theme.colors.success} />
            ) : (
              <Text style={[styles.progressPercent, { color: theme.colors.text }]}>{Math.round(progress * 100)}%</Text>
            )}
          </View>
        </Animated.View>

        {challenge ? (
          <Animated.View entering={FadeInDown.duration(500).delay(200).springify().damping(16)} style={[styles.challengeCard, { backgroundColor: theme.colors.surface, borderColor: isCompleted ? theme.colors.success + '30' : theme.colors.border }]}>
            <View style={[styles.challengeIconWrap, { backgroundColor: (isCompleted ? theme.colors.success : theme.colors.primary) + '12' }]}>
              <Ionicons name={getChallengeIcon(challenge.type)} size={24} color={isCompleted ? theme.colors.success : theme.colors.primary} />
            </View>

            <View style={styles.challengeInfo}>
              <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>{challenge.title}</Text>
              <Text style={[styles.challengeDesc, { color: theme.colors.textSecondary }]}>{challenge.desc}</Text>
              <View style={styles.rewardRow}>
                <View style={[styles.rewardBadge, { backgroundColor: theme.colors.gold + '12' }]}>
                  <Ionicons name="star" size={10} color={theme.colors.gold} />
                  <Text style={[styles.rewardText, { color: theme.colors.gold }]}>+{challenge.reward.xp} XP</Text>
                </View>
                <View style={[styles.rewardBadge, { backgroundColor: theme.colors.gold + '12' }]}>
                  <Ionicons name="diamond" size={10} color={theme.colors.gold} />
                  <Text style={[styles.rewardText, { color: theme.colors.gold }]}>+{challenge.reward.coins}</Text>
                </View>
              </View>
            </View>

            {isCompleted && (
              <Animated.View entering={BounceIn.duration(400)}>
                <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
              </Animated.View>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(400).delay(200)} style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="trophy-outline" size={32} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>All challenges completed today!</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>Come back tomorrow for a new quest</Text>
          </Animated.View>
        )}

        {!isCompleted && progress >= 1 && (
          <Animated.View entering={ZoomIn.duration(400).delay(300).springify().damping(10)}>
            <TouchableOpacity style={[styles.completeBtn, { backgroundColor: theme.colors.success }]} onPress={handleComplete}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.completeBtnText}>Claim Reward</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeIn.duration(400).delay(400)} style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Challenges</Text>
          {state.challengesCompleted.length === 0 ? (
            <Text style={[styles.noHistory, { color: theme.colors.textMuted }]}>No completed challenges yet</Text>
          ) : (
            state.challengesCompleted.slice(-7).reverse().map((c, i) => (
              <Animated.View key={i} entering={FadeInDown.duration(300).delay(i * 50)} style={[styles.historyItem, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>{c.date}</Text>
                <Ionicons name="trophy" size={12} color={theme.colors.primary} />
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  streakBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  streakText: { fontSize: 13, fontWeight: '600', marginLeft: 5 },

  scroll: { paddingBottom: 30, alignItems: 'center' },

  ringContainer: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  ringBg: { position: 'absolute', borderWidth: 6, borderStyle: 'solid' },
  ringProgress: { position: 'absolute' },
  ringOverlay: { justifyContent: 'center', alignItems: 'center' },
  progressPercent: { fontSize: 32, fontWeight: '300', fontFamily: serifFont },

  challengeCard: {
    flexDirection: 'row', alignItems: 'center', width: width - 48,
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16,
  },
  challengeIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  challengeDesc: { fontSize: 12, marginBottom: 6 },
  rewardRow: { flexDirection: 'row', gap: 8 },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rewardText: { fontSize: 10, fontWeight: '700', marginLeft: 3 },

  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: width - 48, paddingVertical: 16, borderRadius: 12, marginBottom: 16,
  },
  completeBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF', marginLeft: 8 },

  emptyCard: {
    width: width - 48, padding: 24, borderRadius: 14, alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  emptySubtext: { fontSize: 12, marginTop: 4 },

  historySection: { width: width - 48 },
  sectionTitle: { fontSize: 16, fontWeight: '700', fontFamily: serifFont, marginBottom: 12 },
  noHistory: { fontSize: 13 },

  historyItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6,
  },
  historyDate: { flex: 1, fontSize: 13, marginLeft: 8 },
});
