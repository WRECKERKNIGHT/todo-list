import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function PomodoroScreen() {
  const { theme } = useTheme();
  const { completePomodoro } = useApp();
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRunning]);

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
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Focus</Text>
        <View style={[styles.sessionBadge, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="hourglass-outline" size={14} color={theme.colors.accent} />
          <Text style={[styles.sessionText, { color: theme.colors.accent }]}>{sessions} sessions</Text>
        </View>
      </View>

      <View style={styles.timerContainer}>
        <Animated.View style={[styles.timerRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.timerOuter, { borderColor: isBreak ? theme.colors.success + '25' : theme.colors.primary + '25' }]}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { backgroundColor: isBreak ? theme.colors.success : theme.colors.primary, width: `${progress * 100}%` }]} />
            </View>
            <View style={[styles.timerInner, { backgroundColor: theme.colors.background }]}>
              <Ionicons name={isBreak ? 'cafe-outline' : 'flame-outline'} size={24} color={isBreak ? theme.colors.success : theme.colors.primary} style={{ marginBottom: 12 }} />
              <Text style={[styles.timerText, { color: theme.colors.text }]}>{formatTime(timeLeft)}</Text>
              <Text style={[styles.timerLabel, { color: theme.colors.textMuted }]}>{isBreak ? 'Break' : 'Focus'}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.progressDots}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i < (sessions % 4) ? theme.colors.primary : theme.colors.surfaceLight }]} />
          ))}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.colors.surface }]} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsRunning(false);
          setTimeLeft(isBreak ? BREAK_DURATION : WORK_DURATION);
        }}>
          <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mainControl, { backgroundColor: isRunning ? theme.colors.accent : theme.colors.primary }]} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsRunning(!isRunning);
        }}>
          <Ionicons name={isRunning ? 'pause' : 'play'} size={28} color="#FFF" style={{ marginLeft: isRunning ? 0 : 3 }} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.colors.surface }]} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsBreak(false); setTimeLeft(WORK_DURATION); setIsRunning(false);
        }}>
          <Ionicons name="stop" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
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
      </View>
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
  },
  progressTrack: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    borderRadius: 1.5, overflow: 'hidden', backgroundColor: 'transparent',
  },
  progressFill: { height: 3, borderRadius: 1.5 },
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
