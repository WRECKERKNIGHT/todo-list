import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn, BounceIn,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
} from 'react-native-reanimated';

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function ActiveTimer({ activeTimeEntry, onStop, onClear, theme }) {
  const [elapsed, setElapsed] = useState(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!activeTimeEntry) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - activeTimeEntry.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  useEffect(() => {
    if (activeTimeEntry) {
      pulse.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
    }
  }, [activeTimeEntry, elapsed]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!activeTimeEntry) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[styles.activeTimerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary + '40' }]}
    >
      <Animated.View style={[styles.pulseDot, { backgroundColor: theme.colors.primary }, pulseStyle]} />
      <Text style={[styles.activeTimerLabel, { color: theme.colors.textMuted }]}>Timer Running</Text>
      <Text style={[styles.activeTimerTime, { color: theme.colors.primary }]}>{formatDuration(elapsed)}</Text>
      <View style={styles.activeTimerActions}>
        <TouchableOpacity
          style={[styles.timerBtn, { backgroundColor: theme.colors.error || '#E85D5D' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStop();
          }}
        >
          <Ionicons name="stop-circle" size={20} color="#fff" />
          <Text style={styles.timerBtnText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timerBtn, { backgroundColor: theme.colors.surfaceLight }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClear();
          }}
        >
          <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          <Text style={[styles.timerBtnText, { color: theme.colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function TimeEntryRow({ entry, todo, theme, index }) {
  const opacity = useSharedValue(0);
  useEffect(() => { opacity.value = withSpring(1, { delay: index * 50 }); }, []);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify()}
      style={[styles.entryRow, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary }]}
    >
      <View style={styles.entryInfo}>
        <Text style={[styles.entryTask, { color: theme.colors.text }]} numberOfLines={1}>
          {todo?.text || 'Unknown Task'}
        </Text>
        <Text style={[styles.entryDate, { color: theme.colors.textMuted }]}>
          {entry.startTime ? new Date(entry.startTime).toLocaleDateString() : ''}
        </Text>
      </View>
      <Text style={[styles.entryDuration, { color: theme.colors.primary }]}>
        {formatDuration(entry.duration)}
      </Text>
    </Animated.View>
  );
}

function SelectTaskModal({ visible, todos, onSelect, onClose, theme }) {
  if (!visible) return null;

  const incompleteTodos = todos.filter(t => !t.completed);

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select a Task</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={incompleteTodos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.modalTaskItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(item.id);
              }}
            >
              <Ionicons name="play-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.modalTaskText, { color: theme.colors.text }]} numberOfLines={1}>
                {item.text}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No incomplete tasks</Text>
          }
        />
      </View>
    </View>
  );
}

export default function TimeTrackingScreen({ navigation }) {
  const { todos, activeTimeEntry, timeEntries, startTimeTracking, stopTimeTracking, clearTimeEntry } = useApp();
  const { theme } = useTheme();
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const totalTimeTracked = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const sessionCount = timeEntries.length;

  const handleStart = (taskId) => {
    if (activeTimeEntry) {
      Alert.alert('Timer Active', 'Stop the current timer before starting a new one.');
      return;
    }
    startTimeTracking(taskId);
    setShowTaskPicker(false);
  };

  const handleStop = () => {
    const entry = stopTimeTracking();
    if (entry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const recentEntries = [...timeEntries].reverse().slice(0, 20);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Time Tracking</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ActiveTimer
          activeTimeEntry={activeTimeEntry}
          onStop={handleStop}
          onClear={clearTimeEntry}
          theme={theme}
        />

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatDuration(totalTimeTracked)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Total Tracked</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="list-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{sessionCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Sessions</Text>
          </View>
        </Animated.View>

        {!activeTimeEntry && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowTaskPicker(true);
              }}
            >
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={styles.startBtnText}>Start Timer</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Sessions</Text>
        </Animated.View>

        {recentEntries.length === 0 ? (
          <Animated.View entering={FadeIn.delay(400)} style={styles.emptyContainer}>
            <Ionicons name="hourglass-outline" size={48} color={theme.colors.textMuted + '60'} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textMuted }]}>No sessions yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted + '99' }]}>
              Start a timer on any task to begin tracking
            </Text>
          </Animated.View>
        ) : (
          recentEntries.map((entry, i) => (
            <TimeEntryRow
              key={entry.id || i}
              entry={entry}
              todo={todos.find(t => t.id === entry.taskId)}
              theme={theme}
              index={i}
            />
          ))
        )}
      </ScrollView>

      <SelectTaskModal
        visible={showTaskPicker}
        todos={todos}
        onSelect={handleStart}
        onClose={() => setShowTaskPicker(false)}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: serifFont, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  activeTimerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 12,
  },
  activeTimerLabel: { fontSize: 13, fontFamily: serifFont, marginBottom: 4 },
  activeTimerTime: { fontSize: 42, fontFamily: serifFont, fontWeight: '700', marginBottom: 20 },
  activeTimerActions: { flexDirection: 'row', gap: 12 },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  timerBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 20, fontFamily: serifFont, fontWeight: '700' },
  statLabel: { fontSize: 12, fontFamily: serifFont },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 24,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: serifFont },
  sectionTitle: { fontSize: 16, fontFamily: serifFont, fontWeight: '700', marginBottom: 12 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  entryInfo: { flex: 1, marginRight: 12 },
  entryTask: { fontSize: 14, fontFamily: serifFont, fontWeight: '600' },
  entryDate: { fontSize: 11, fontFamily: serifFont, marginTop: 2 },
  entryDuration: { fontSize: 15, fontFamily: serifFont, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontFamily: serifFont, fontWeight: '600', marginTop: 12 },
  emptySubtitle: { fontSize: 13, fontFamily: serifFont, marginTop: 4, textAlign: 'center' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  modalContent: { borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: serifFont, fontWeight: '700' },
  modalTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  modalTaskText: { fontSize: 14, fontFamily: serifFont, flex: 1 },
  emptyText: { fontSize: 14, fontFamily: serifFont, textAlign: 'center', paddingVertical: 20 },
});
