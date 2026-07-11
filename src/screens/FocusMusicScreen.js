import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, Easing, interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { GlassCard, FadeInView } from '../components/MedievalUI';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const CATEGORIES = [
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'ambient', label: 'Ambient', icon: 'cloud-outline' },
  { id: 'lofi', label: 'Lo-Fi', icon: 'musical-notes-outline' },
  { id: 'classical', label: 'Classical', icon: 'piano-outline' },
];

const SOUNDS = [
  { id: 'rain', name: 'Rain', emoji: '🌧️', category: 'nature', duration: '60 min' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', category: 'nature', duration: '∞ Loop' },
  { id: 'forest', name: 'Forest', emoji: '🌲', category: 'nature', duration: '∞ Loop' },
  { id: 'coffee', name: 'Coffee Shop', emoji: '☕', category: 'ambient', duration: '45 min' },
  { id: 'thunder', name: 'Thunder', emoji: '⛈️', category: 'nature', duration: '30 min' },
  { id: 'birds', name: 'Birds', emoji: '🐦', category: 'nature', duration: '∞ Loop' },
  { id: 'fireplace', name: 'Fireplace', emoji: '🔥', category: 'ambient', duration: '90 min' },
  { id: 'wind', name: 'Wind', emoji: '💨', category: 'ambient', duration: '∞ Loop' },
  { id: 'piano', name: 'Piano', emoji: '🎹', category: 'classical', duration: '60 min' },
  { id: 'strings', name: 'Strings', emoji: '🎻', category: 'classical', duration: '45 min' },
  { id: 'lofi', name: 'Lo-Fi Beats', emoji: '🎧', category: 'lofi', duration: '∞ Loop' },
  { id: 'night', name: 'Night Sounds', emoji: '🌙', category: 'ambient', duration: '∞ Loop' },
];

const TIMER_OPTIONS = [
  { id: '15', label: '15 min' },
  { id: '30', label: '30 min' },
  { id: '60', label: '60 min' },
  { id: 'unlimited', label: 'Unlimited' },
];

function PulsingRings({ isPlaying, theme }) {
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      ring1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false,
      );
      ring2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false,
      );
      ring3.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false,
      );
    } else {
      ring1.value = withTiming(0, { duration: 400 });
      ring2.value = withTiming(0, { duration: 400 });
      ring3.value = withTiming(0, { duration: 400 });
    }
  }, [isPlaying]);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring1.value, [0, 1], [0.05, 0.2]),
    transform: [{ scale: interpolate(ring1.value, [0, 1], [0.85, 1.25]) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring2.value, [0, 1], [0.04, 0.16]),
    transform: [{ scale: interpolate(ring2.value, [0, 1], [0.9, 1.35]) }],
  }));

  const ring3Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring3.value, [0, 1], [0.03, 0.12]),
    transform: [{ scale: interpolate(ring3.value, [0, 1], [0.95, 1.45]) }],
  }));

  const color = theme.colors.primary;

  return (
    <View style={pulsingStyles.container}>
      <Animated.View style={[pulsingStyles.ring, { borderColor: color }, ring3Style]} />
      <Animated.View style={[pulsingStyles.ring, { borderColor: color }, ring2Style]} />
      <Animated.View style={[pulsingStyles.ring, { borderColor: color }, ring1Style]} />
      <View style={[pulsingStyles.centerDot, { backgroundColor: color + '40' }]}>
        <Ionicons name="headset-outline" size={40} color={color} />
      </View>
    </View>
  );
}

const pulsingStyles = StyleSheet.create({
  container: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  centerDot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function ProgressBar({ progress, theme }) {
  return (
    <View style={[progressStyles.track, { backgroundColor: theme.colors.surfaceLight }]}>
      <View style={[progressStyles.fill, {
        width: `${progress * 100}%`,
        backgroundColor: theme.colors.primary,
      }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});

export default function FocusMusicScreen() {
  const { theme } = useTheme();
  const { } = useApp();

  const [activeCategory, setActiveCategory] = useState('nature');
  const [selectedSound, setSelectedSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTimer, setActiveTimer] = useState('30');
  const [elapsed, setElapsed] = useState(0);
  const [totalDuration] = useState(3600);
  const intervalRef = useRef(null);

  const playBtnScale = useSharedValue(1);
  const playBtnGlow = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      playBtnGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false,
      );
    } else {
      playBtnGlow.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => (prev < totalDuration ? prev + 1 : prev));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (!isPlaying) setElapsed(0);
  }, [isPlaying]);

  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playBtnScale.value }],
    shadowOpacity: interpolate(playBtnGlow.value, [0, 1], [0.2, 0.5]),
  }));

  const filteredSounds = SOUNDS.filter(s => s.category === activeCategory);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalFmt = formatTime(totalDuration);

  const handlePlayPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playBtnScale.value = withSequence(
      withSpring(0.9, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    setIsPlaying(!isPlaying);
  };

  const handleSoundSelect = (sound) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedSound(sound);
    setIsPlaying(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={0}>
          <View style={styles.headerRow}>
            <Ionicons name="headset-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Focus Zone</Text>
          </View>
        </FadeInView>

        <Animated.View entering={FadeInDown.duration(600).delay(100).springify().damping(18)}>
          <GlassCard delay={100} style={styles.nowPlayingCard}>
            <PulsingRings isPlaying={isPlaying} theme={theme} />
            <View style={styles.nowPlayingInfo}>
              <Text style={[styles.trackName, { color: theme.colors.text }]}>
                {selectedSound ? selectedSound.name : 'Deep Focus'}
              </Text>
              <Text style={[styles.artistName, { color: theme.colors.textSecondary }]}>
                LifeFlow Sounds
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePlayPress}
              style={[
                styles.playBtn,
                {
                  backgroundColor: isPlaying ? theme.colors.primary : theme.colors.surfaceLight,
                  shadowColor: theme.colors.primary,
                },
              ]}
            >
              <Animated.View style={playBtnStyle}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color={isPlaying ? '#FFF' : theme.colors.text}
                  style={isPlaying ? {} : { marginLeft: 3 }}
                />
              </Animated.View>
            </TouchableOpacity>

            <ProgressBar progress={totalDuration > 0 ? elapsed / totalDuration : 0} theme={theme} />
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
                {formatTime(elapsed)}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
                {totalFmt}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        <FadeInView delay={200}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Sound Categories</Text>
        </FadeInView>

        <Animated.View entering={FadeInDown.duration(500).delay(250).springify().damping(18)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat, i) => {
              const isActive = activeCategory === cat.id;
              return (
                <Animated.View key={cat.id} entering={FadeInDown.duration(400).delay(300 + i * 60).springify().damping(16)}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setActiveCategory(cat.id);
                    }}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceLight,
                        borderColor: isActive ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={16}
                      color={isActive ? '#FFF' : theme.colors.textSecondary}
                    />
                    <Text style={[
                      styles.categoryLabel,
                      { color: isActive ? '#FFF' : theme.colors.textSecondary },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>

        <FadeInView delay={350}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Sound Library</Text>
        </FadeInView>

        <View style={styles.soundGrid}>
          {filteredSounds.map((sound, i) => {
            const isSelected = selectedSound?.id === sound.id;
            return (
              <Animated.View
                key={sound.id}
                entering={FadeInDown.duration(400).delay(400 + i * 70).springify().damping(16)}
                style={styles.soundCardWrapper}
              >
                <GlassCard
                  delay={0}
                  onPress={() => handleSoundSelect(sound)}
                  style={[
                    styles.soundCard,
                    isSelected && {
                      borderColor: theme.colors.primary,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.soundCardHeader}>
                    <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                    {isSelected && isPlaying && (
                      <View style={styles.playingBadge}>
                        <View style={[styles.playingDot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={[styles.playingLabel, { color: '#4CAF50' }]}>Playing</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.soundName, { color: theme.colors.text }]}>{sound.name}</Text>
                  <Text style={[styles.soundDuration, { color: theme.colors.textMuted }]}>{sound.duration}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSoundSelect(sound)}
                    style={[
                      styles.soundSelectBtn,
                      { backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surfaceLight },
                    ]}
                  >
                    <Ionicons
                      name={isSelected && isPlaying ? 'pause-circle' : 'play-circle-outline'}
                      size={22}
                      color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </GlassCard>
              </Animated.View>
            );
          })}
        </View>

        <FadeInView delay={600}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Auto-stop after</Text>
        </FadeInView>

        <Animated.View entering={FadeInUp.duration(500).delay(650).springify().damping(18)}>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((opt) => {
              const isActive = activeTimer === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setActiveTimer(opt.id);
                  }}
                  style={[
                    styles.timerOption,
                    {
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceLight,
                      borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.timerLabel,
                    { color: isActive ? '#FFF' : theme.colors.textSecondary },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <FadeInView delay={700}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Focus Stats</Text>
        </FadeInView>

        <Animated.View entering={FadeInUp.duration(600).delay(750).springify().damping(18)}>
          <GlassCard delay={0} style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>12.5 hrs</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>This week</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>23</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Sessions</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>2h 15m</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Best session</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons name="trending-up-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>45 min</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Average</Text>
              </View>
            </View>
          </GlassCard>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: SERIF_FONT,
    letterSpacing: -0.3,
  },
  nowPlayingCard: {
    marginBottom: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  nowPlayingInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  trackName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: SERIF_FONT,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '500',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryRow: {
    paddingRight: 24,
    gap: 10,
    marginBottom: 28,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  soundCardWrapper: {
    width: (SCREEN_WIDTH - 60) / 2,
  },
  soundCard: {
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  soundCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  soundEmoji: {
    fontSize: 32,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  playingLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soundName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  soundDuration: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  soundSelectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  timerOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsCard: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: SERIF_FONT,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
  },
});
