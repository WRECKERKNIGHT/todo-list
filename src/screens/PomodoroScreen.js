import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, Easing, interpolate,
} from 'react-native-reanimated';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function TimerRing({ progress, isBreak, theme, timeLeft, formatTime }) {
  const ringSv = useSharedValue(0);

  useEffect(() => {
    ringSv.value = withTiming(progress, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const pulseSv = useSharedValue(1);

  useEffect(() => {
    pulseSv.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseSv.value }],
  }));

  const glowOpacity = interpolate(progress, [0, 1], [0.05, 0.2]);

  return (
    <Animated.View entering={ZoomIn.duration(600).springify().damping(12).stiffness(80)} style={styles.timerRing}>
      <Animated.View style={[{ width: 260, height: 260, borderRadius: 130, justifyContent: 'center', alignItems: 'center' }, pulseStyle]}>
        <View style={[styles.timerOuter, { borderColor: isBreak ? theme.colors.success + '25' : theme.colors.primary + '25' }]}>
          <View style={[styles.glow, { backgroundColor: isBreak ? theme.colors.success : theme.colors.primary, opacity: glowOpacity }]} />
          <View style={[styles.timerInner, { backgroundColor: theme.colors.background }]}>
            <Ionicons name={isBreak ? 'cafe-outline' : 'flame-outline'} size={24} color={isBreak ? theme.colors.success : theme.colors.primary} style={{ marginBottom: 12 }} />
            <AnimatedTimerText isBreak={isBreak} theme={theme} timeLeft={timeLeft} formatTime={formatTime} />
            <Text style={[styles.timerLabel, { color: theme.colors.textMuted }]}>{isBreak ? 'Break' : 'Focus'}</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function AnimatedTimerText({ isBreak, theme, timeLeft, formatTime }) {
  return (
    <Text style={[styles.timerText, { color: theme.colors.text }]}>
      {formatTime(timeLeft)}
    </Text>
  );
}

function ProgressDots({ sessions, theme }) {
  return (
    <View style={styles.progressDots}>
      {[0, 1, 2, 3].map(i => {
        const active = i < (sessions % 4);
        return (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 100).duration(300)}
          >
            <View style={[styles.progressDot, {
              backgroundColor: active ? theme.colors.primary : theme.colors.surfaceLight,
              transform: [{ scale: active ? 1.15 : 1 }],
            }]} />
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function PomodoroScreen() {
  const { theme } = useTheme();
  const { completePomodoro } = useApp();
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);

  const playBtnScale = useSharedValue(1);
  const controlBtnScale = useSharedValue(1);

  const playBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: playBtnScale.value }] }));
  const controlBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: controlBtnScale.value }] }));

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!isBreak) {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      completePomodoro();
      Alert.alert('Session Complete', 'Time for a break.');
      setTimeLeft(newSessions % 4 === 0 ? LONG_BREAK_DURATION : BREAK_DURATION);
      setIsBreak(true);
    } else {
      Alert.alert('Break Over', 'Ready to focus?');
      setTimeLeft(WORK_DURATION);
      setIsBreak(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = isBreak ? 1 - (timeLeft / (sessions % 4 === 0 ? LONG_BREAK_DURATION : BREAK_DURATION)) : 1 - (timeLeft / WORK_DURATION);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Focus</Text>
        <View style={[styles.sessionBadge, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="hourglass-outline" size={14} color={theme.colors.accent} />
          <Text style={[styles.sessionText, { color: theme.colors.accent }]}>{sessions} sessions</Text>
        </View>
      </Animated.View>

      <View style={styles.timerContainer}>
        <TimerRing progress={progress} isBreak={isBreak} theme={theme} timeLeft={timeLeft} formatTime={formatTime} />
        <ProgressDots sessions={sessions} theme={theme} />
      </View>

      <Animated.View entering={FadeInUp.duration(500).delay(300).springify().damping(16)} style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.colors.surface }]} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          controlBtnScale.value = withSequence(withSpring(0.85, { damping: 10, stiffness: 400 }), withSpring(1, { damping: 10, stiffness: 400 }));
          setIsRunning(false);
          setTimeLeft(isBreak ? BREAK_DURATION : WORK_DURATION);
        }}>
          <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Animated.View style={playBtnStyle}>
          <TouchableOpacity style={[styles.mainControl, { backgroundColor: isRunning ? theme.colors.accent : theme.colors.primary }]} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            playBtnScale.value = withSequence(withSpring(0.88, { damping: 10, stiffness: 300 }), withSpring(1, { damping: 10, stiffness: 300 }));
            setIsRunning(!isRunning);
          }}>
            <Ionicons name={isRunning ? 'pause' : 'play'} size={28} color={theme.colors.text} style={{ marginLeft: isRunning ? 0 : 3 }} />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.colors.surface }]} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          controlBtnScale.value = withSequence(withSpring(0.85, { damping: 10, stiffness: 400 }), withSpring(1, { damping: 10, stiffness: 400 }));
          setIsBreak(false); setTimeLeft(WORK_DURATION); setIsRunning(false);
        }}>
          <Ionicons name="stop" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(400).springify().damping(16)} style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
        {[
          { icon: 'flame-outline', label: 'Work', value: '25 min', color: theme.colors.primary },
          { icon: 'cafe-outline', label: 'Break', value: '5 min', color: theme.colors.success },
          { icon: 'moon-outline', label: 'Long Break', value: '15 min', color: theme.colors.secondary },
        ].map(item => (
          <View key={item.label} style={styles.settingRow}>
            <Ionicons name={item.icon} size={16} color={item.color} />
            <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.settingValue, { color: theme.colors.text }]}>{item.value}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sessionText: { fontSize: 13, fontWeight: '600', marginLeft: 5 },

  timerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerRing: { marginBottom: 24 },
  timerOuter: {
    width: 240, height: 240, borderRadius: 120,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    top: -20, left: -20,
  },
  timerInner: {
    width: 210, height: 210, borderRadius: 105,
    justifyContent: 'center', alignItems: 'center',
  },
  timerText: { fontSize: 48, fontWeight: '300', fontFamily: serifFont, letterSpacing: -2 },
  timerLabel: { fontSize: 13, marginTop: 4, fontWeight: '500' },

  progressDots: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },

  controls: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, marginBottom: 32, gap: 24,
  },
  controlBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  mainControl: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },

  settingsCard: { marginHorizontal: 24, marginBottom: 30, padding: 16, borderRadius: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  settingLabel: { flex: 1, marginLeft: 10, fontSize: 13 },
  settingValue: { fontSize: 13, fontWeight: '600' },
});
