import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard, FadeInView } from '../components/MedievalUI';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 24;

const SEASONAL_EVENTS = [
  {
    id: 'spring_harvest',
    name: 'Spring Harvest',
    icon: 'leaf',
    description: 'Complete tasks to gather spring bounty',
    requiredProgress: 50,
    rewardXP: 500,
    rewardCoins: 200,
    months: [3, 4, 5],
  },
  {
    id: 'summer_tournament',
    name: 'Summer Tournament',
    icon: 'flame',
    description: 'Compete in the grand summer challenge',
    requiredProgress: 75,
    rewardXP: 800,
    rewardCoins: 350,
    months: [6, 7, 8],
  },
  {
    id: 'autumn_festival',
    name: 'Autumn Festival',
    icon: 'sparkles',
    description: 'Celebrate the harvest with festive tasks',
    requiredProgress: 60,
    rewardXP: 600,
    rewardCoins: 250,
    months: [9, 10, 11],
  },
  {
    id: 'winter_solstice',
    name: 'Winter Solstice',
    icon: 'snowflake',
    description: 'Endure the long nights with dedication',
    requiredProgress: 40,
    rewardXP: 700,
    rewardCoins: 300,
    months: [12, 1, 2],
  },
];

const DAILY_REWARDS = [10, 20, 30, 50, 75, 100, 200];

const BOX_TIERS = [
  { name: 'Common', color: '#8B8B8B', bg: 'rgba(139,139,139,0.15)', icon: 'cube', chance: 0.5 },
  { name: 'Rare', color: '#4A9EFF', bg: 'rgba(74,158,255,0.15)', icon: 'cube', chance: 0.3 },
  { name: 'Epic', color: '#A855F7', bg: 'rgba(168,85,247,0.15)', icon: 'cube', chance: 0.15 },
  { name: 'Legendary', color: '#FFD700', bg: 'rgba(255,215,0,0.15)', icon: 'cube', chance: 0.05 },
];

const SIMULATED_LEADERBOARD = [
  { name: 'DragonSlayer99', xp: 12450, badge: 'flame' },
  { name: 'QuestMaster', xp: 11200, badge: 'trophy' },
  { name: 'NightOwl', xp: 9800, badge: 'moon' },
  { name: 'StarHunter', xp: 8600, badge: 'star' },
  { name: 'IronWill', xp: 7300, badge: 'shield' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function DailyLoginSection({ theme }) {
  const [streak] = useState(Math.floor(Math.random() * 7) + 1);
  const [claimed, setClaimed] = useState(Array(7).fill(false).map((_, i) => i < streak - 1));
  const [todayClaimed, setTodayClaimed] = useState(false);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.4, 1]),
    shadowOpacity: interpolate(glowAnim.value, [0, 1], [0.2, 0.8]),
  }));

  const handleClaim = () => {
    if (todayClaimed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const newClaimed = [...claimed];
    newClaimed[streak - 1] = true;
    setClaimed(newClaimed);
    setTodayClaimed(true);
    Alert.alert('Reward Claimed!', `You earned ${DAILY_REWARDS[streak - 1]} coins!`);
  };

  const todayIndex = streak - 1;

  return (
    <GlassCard style={{ marginBottom: 20 }}>
      <View style={styles.sectionHeader}>
        <Ionicons name="flame" size={24} color="#FF6B35" />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Daily Login Streak
        </Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        style={styles.streakCard}
      >
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
        <Ionicons name="flame" size={20} color="#FF6B35" />
      </Animated.View>

      <View style={styles.rewardTrack}>
        {DAILY_REWARDS.map((amount, index) => {
          const isClaimed = claimed[index];
          const isToday = index === todayIndex;
          return (
            <View
              key={index}
              style={[
                styles.rewardDay,
                isClaimed && { backgroundColor: 'rgba(255,215,0,0.3)', borderColor: '#FFD700' },
                isToday && !isClaimed && { borderColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>
                Day {index + 1}
              </Text>
              <Ionicons
                name={isClaimed ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={isClaimed ? '#FFD700' : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.coinAmount,
                  isClaimed && { color: '#FFD700' },
                  !isClaimed && { color: theme.colors.textSecondary },
                ]}
              >
                {amount}
              </Text>
              <Ionicons name="cash" size={14} color={isClaimed ? '#FFD700' : theme.colors.textSecondary} />
            </View>
          );
        })}
      </View>

      <AnimatedTouchable
        style={[styles.claimButton, glowStyle, todayClaimed && styles.claimButtonDisabled]}
        onPress={handleClaim}
        disabled={todayClaimed}
        activeOpacity={0.7}
      >
        <Ionicons name="gift" size={18} color="#FFF" />
        <Text style={styles.claimButtonText}>
          {todayClaimed ? 'Already Claimed' : `Claim ${DAILY_REWARDS[todayIndex]} Coins`}
        </Text>
      </AnimatedTouchable>

      {!todayClaimed && (
        <Text style={[styles.nextRewardText, { color: theme.colors.textSecondary }]}>
          Next reward: {DAILY_REWARDS[todayIndex]} coins
        </Text>
      )}
    </GlassCard>
  );
}

function MysteryBoxSection({ theme }) {
  const [boxCount] = useState(Math.floor(Math.random() * 3) + 1);
  const [openedBox, setOpenedBox] = useState(null);
  const [boxHistory, setBoxHistory] = useState([]);
  const [isOpening, setIsOpening] = useState(false);
  const shakeAnim = useSharedValue(0);
  const revealScale = useSharedValue(0);
  const revealOpacity = useSharedValue(0);
  const colorFlash = useSharedValue(0);

  useEffect(() => {
    shakeAnim.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 60 })
      ),
      -1,
      true
    );
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shakeAnim.value}deg` }],
  }));

  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealScale.value }],
    opacity: revealOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255, 255, 255, ${colorFlash.value * 0.3})`,
  }));

  const rollTier = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (const tier of BOX_TIERS) {
      cumulative += tier.chance;
      if (rand <= cumulative) return tier;
    }
    return BOX_TIERS[0];
  };

  const handleOpenBox = () => {
    if (boxCount <= 0 || isOpening) return;
    setIsOpening(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    revealScale.value = 0;
    revealOpacity.value = 0;
    colorFlash.value = 0;

    setTimeout(() => {
      const tier = rollTier();
      setOpenedBox(tier);

      colorFlash.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      );
      revealScale.value = withSequence(
        withTiming(1.3, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 200 })
      );
      revealOpacity.value = withTiming(1, { duration: 300 });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setBoxHistory((prev) => [tier, ...prev].slice(0, 5));
      setIsOpening(false);
    }, 1200);
  };

  return (
    <GlassCard style={{ marginBottom: 20 }}>
      <Animated.View style={[styles.flashOverlay, flashStyle]} />
      <View style={styles.sectionHeader}>
        <Ionicons name="cube" size={24} color="#A855F7" />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Mystery Boxes
        </Text>
        <View style={styles.boxCountBadge}>
          <Text style={styles.boxCountText}>{boxCount}</Text>
        </View>
      </View>

      {!openedBox && (
        <AnimatedTouchable
          style={[styles.openBoxButton, shakeStyle]}
          onPress={handleOpenBox}
          disabled={boxCount <= 0 || isOpening}
          activeOpacity={0.8}
        >
          <Ionicons name="cube" size={32} color="#FFF" />
          <Text style={styles.openBoxText}>
            {boxCount > 0 ? 'Open Box' : 'No Boxes'}
          </Text>
        </AnimatedTouchable>
      )}

      {openedBox && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.revealCard, { backgroundColor: openedBox.bg }]}
        >
          <Animated.View style={revealStyle}>
            <Ionicons name={openedBox.icon} size={48} color={openedBox.color} />
            <Text style={[styles.tierName, { color: openedBox.color }]}>
              {openedBox.name}!
            </Text>
            <Text style={[styles.rewardText, { color: theme.colors.textSecondary }]}>
              +{openedBox.name === 'Legendary' ? 500 : openedBox.name === 'Epic' ? 200 : openedBox.name === 'Rare' ? 75 : 25} Coins
            </Text>
          </Animated.View>
          <TouchableOpacity
            style={[styles.claimButton, { marginTop: 12 }]}
            onPress={() => {
              setOpenedBox(null);
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.claimButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {boxHistory.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.historyLabel, { color: theme.colors.textSecondary }]}>
            Recent Openings
          </Text>
          <View style={styles.historyRow}>
            {boxHistory.map((tier, i) => (
              <View
                key={i}
                style={[styles.historyChip, { backgroundColor: tier.bg, borderColor: tier.color }]}
              >
                <Ionicons name={tier.icon} size={14} color={tier.color} />
                <Text style={[styles.historyChipText, { color: tier.color }]}>
                  {tier.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </GlassCard>
  );
}

function SeasonalEventSection({ theme }) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventProgress, setEventProgress] = useState(0);
  const [eventActivated, setEventActivated] = useState(false);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    const found = SEASONAL_EVENTS.find((e) => e.months.includes(currentMonth));
    if (found) {
      setActiveEvent(found);
      const progress = Math.random();
      setEventProgress(progress);
      progressAnim.value = withTiming(progress, { duration: 1500, easing: Easing.out(Easing.ease) });
    }
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`,
  }));

  const handleActivate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEventActivated(true);
    Alert.alert('Event Activated!', 'Complete tasks to progress in the event.');
  };

  return (
    <GlassCard style={{ marginBottom: 20 }}>
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar" size={24} color="#4ECDC4" />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Seasonal Events
        </Text>
      </View>

      {activeEvent ? (
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <View style={[styles.eventCard, { borderColor: theme.colors.primary }]}>
            <View style={styles.eventHeader}>
              <Ionicons name={activeEvent.icon} size={28} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.eventName, { color: theme.colors.text }]}>
                  {activeEvent.name}
                </Text>
                <Text style={[styles.eventDesc, { color: theme.colors.textSecondary }]}>
                  {activeEvent.description}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <Animated.View
                  style={[styles.progressFill, progressStyle, { backgroundColor: theme.colors.primary }]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                {Math.round(eventProgress * activeEvent.requiredProgress)} / {activeEvent.requiredProgress}
              </Text>
            </View>

            <View style={styles.rewardPreview}>
              <View style={styles.rewardPill}>
                <Ionicons name="flash" size={14} color="#FFD700" />
                <Text style={styles.rewardPillText}>{activeEvent.rewardXP} XP</Text>
              </View>
              <View style={styles.rewardPill}>
                <Ionicons name="cash" size={14} color="#4ECDC4" />
                <Text style={styles.rewardPillText}>{activeEvent.rewardCoins} Coins</Text>
              </View>
            </View>

            {!eventActivated && (
              <TouchableOpacity
                style={[styles.activateButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleActivate}
              >
                <Ionicons name="play-circle" size={18} color="#FFF" />
                <Text style={styles.activateButtonText}>Activate Event</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      ) : (
        <View style={styles.noEventContainer}>
          <Ionicons name="hourglass-outline" size={40} color={theme.colors.textSecondary} />
          <Text style={[styles.noEventText, { color: theme.colors.textSecondary }]}>
            No active seasonal event
          </Text>
          <Text style={[styles.noEventSubtext, { color: theme.colors.textSecondary }]}>
            Check back when the season changes!
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

function LeaderboardSection({ theme }) {
  const [userXP] = useState(9200);
  const userEntry = { name: 'You', xp: userXP, badge: 'star', isUser: true };

  const allEntries = [...SIMULATED_LEADERBOARD, userEntry]
    .sort((a, b) => b.xp - a.xp)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const userRank = allEntries.find((e) => e.isUser)?.rank || allEntries.length;

  return (
    <GlassCard style={{ marginBottom: 20 }}>
      <View style={styles.sectionHeader}>
        <Ionicons name="trophy" size={24} color="#FFD700" />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          XP Leaderboard
        </Text>
        <Text style={[styles.rankBadge, { color: theme.colors.primary }]}>
          #{userRank}
        </Text>
      </View>

      {allEntries.map((entry, index) => (
        <Animated.View
          key={entry.name}
          entering={FadeInDown.delay(index * 80).duration(400)}
          style={[
            styles.leaderboardRow,
            entry.isUser && { backgroundColor: 'rgba(255,215,0,0.1)', borderColor: '#FFD700', borderWidth: 1 },
          ]}
        >
          <Text
            style={[
              styles.rankNumber,
              { color: theme.colors.textSecondary },
              entry.rank <= 3 && { color: '#FFD700' },
            ]}
          >
            #{entry.rank}
          </Text>
          <Ionicons
            name={entry.badge}
            size={20}
            color={entry.rank <= 3 ? '#FFD700' : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.playerName,
              { color: theme.colors.text },
              entry.isUser && { color: '#FFD700', fontWeight: '700' },
            ]}
          >
            {entry.name}
          </Text>
          <Text style={[styles.playerXP, { color: theme.colors.textSecondary }]}>
            {entry.xp.toLocaleString()} XP
          </Text>
        </Animated.View>
      ))}
    </GlassCard>
  );
}

export default function GamificationHub() {
  const { state } = useApp();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <Ionicons name="star" size={28} color="#FFD700" />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Rewards Hub
            </Text>
          </Animated.View>
        </FadeInView>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DailyLoginSection theme={theme} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <MysteryBoxSection theme={theme} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <SeasonalEventSection theme={theme} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <LeaderboardSection theme={theme} />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  streakCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF6B35',
  },
  streakLabel: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginTop: 4,
  },
  rewardTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardDay: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - 16 * 2) / 7 - 4,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  coinAmount: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
  },
  claimButtonDisabled: {
    opacity: 0.5,
  },
  claimButtonText: {
    color: '#1A1A2E',
    fontSize: 15,
    fontWeight: '700',
  },
  nextRewardText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
  },
  openBoxButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    borderRadius: 16,
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(168,85,247,0.4)',
    borderStyle: 'dashed',
  },
  openBoxText: {
    color: '#A855F7',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  revealCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    pointerEvents: 'none',
  },
  boxCountBadge: {
    backgroundColor: '#A855F7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  boxCountText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 17,
    fontWeight: '700',
  },
  eventDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '600',
  },
  rewardPreview: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rewardPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  activateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  noEventContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noEventText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  noEventSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  rankBadge: {
    fontSize: 16,
    fontWeight: '800',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '800',
    width: 30,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  playerXP: {
    fontSize: 13,
    fontWeight: '600',
  },
});
