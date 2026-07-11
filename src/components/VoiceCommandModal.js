import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, ZoomIn,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
  withTiming, withRepeat, Easing, interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const QUICK_COMMANDS = [
  { label: 'Add task', icon: 'add-circle', command: 'add ' },
  { label: 'Add habit', icon: 'flame', command: 'habit ' },
  { label: 'Start timer', icon: 'timer', command: 'timer ' },
  { label: 'Add note', icon: 'document-text', command: 'note ' },
];

export default function VoiceCommandModal({ visible, onClose, onExecute }) {
  const { theme } = useTheme();
  const { addTodo, addHabit, addNote, startTimeTracking, state } = useApp();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState(null);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false,
      );
    } else {
      pulse.value = 0;
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.6]),
  }));

  const processCommand = (text) => {
    const lower = text.toLowerCase().trim();

    if (lower.startsWith('add ') || lower.startsWith('task ')) {
      const taskText = text.replace(/^(add|task)\s+/i, '').trim();
      if (taskText) {
        addTodo({ title: taskText, priority: 'medium', category: 'personal' });
        setResult({ type: 'success', message: `Added task: "${taskText}"` });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (lower.startsWith('habit ')) {
      const habitName = text.replace(/^habit\s+/i, '').trim();
      if (habitName) {
        addHabit({ name: habitName, description: '', icon: 'star', color: theme.colors.primary });
        setResult({ type: 'success', message: `Added habit: "${habitName}"` });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (lower.startsWith('note ') || lower.startsWith('journal ')) {
      const noteText = text.replace(/^(note|journal)\s+/i, '').trim();
      if (noteText) {
        addNote({ title: noteText.split(' ').slice(0, 5).join(' '), content: noteText });
        setResult({ type: 'success', message: `Added note` });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (lower.startsWith('timer ') || lower.startsWith('track ')) {
      const taskName = text.replace(/^(timer|track)\s+/i, '').trim();
      const todo = state.todos.find(t => t.title.toLowerCase().includes(taskName.toLowerCase()));
      if (todo) {
        startTimeTracking(todo.id);
        setResult({ type: 'success', message: `Started timer for: "${todo.title}"` });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setResult({ type: 'error', message: `Task "${taskName}" not found` });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      addTodo({ title: text, priority: 'medium', category: 'personal' });
      setResult({ type: 'success', message: `Added task: "${text}"` });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setTimeout(() => { setResult(null); }, 2500);
  };

  const handleQuickCommand = (cmd) => {
    setInput(cmd.command);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSimulateVoice = () => {
    setIsListening(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      setIsListening(false);
      const samples = [
        'Buy groceries for dinner',
        'Finish project report',
        'Call dentist for appointment',
        'Read 20 pages of current book',
        'Morning meditation 10 minutes',
      ];
      const random = samples[Math.floor(Math.random() * samples.length)];
      setInput(random);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    processCommand(input.trim());
    setInput('');
  };

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
      <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />
      <Animated.View entering={ZoomIn.springify().damping(14).stiffness(120)} style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />

        <View style={styles.micSection}>
          <TouchableOpacity
            onPress={handleSimulateVoice}
            style={[styles.micBtn, { backgroundColor: isListening ? theme.colors.error : theme.colors.primary }]}
          >
            {isListening && <Animated.View style={[styles.micPulse, { backgroundColor: theme.colors.error }, pulseStyle]} />}
            <Ionicons name={isListening ? 'radio' : 'mic'} size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.micLabel, { color: theme.colors.textMuted }]}>
            {isListening ? 'Listening...' : 'Tap to simulate voice'}
          </Text>
        </View>

        {result && (
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={[styles.resultBadge, { backgroundColor: (result.type === 'success' ? theme.colors.success : theme.colors.error) + '15' }]}
          >
            <Ionicons name={result.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={16} color={result.type === 'success' ? theme.colors.success : theme.colors.error} />
            <Text style={[styles.resultText, { color: result.type === 'success' ? theme.colors.success : theme.colors.error }]}>{result.message}</Text>
          </Animated.View>
        )}

        <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.border }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Or type a command..."
            placeholderTextColor={theme.colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={handleSubmit} style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickRow}>
          {QUICK_COMMANDS.map((cmd, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleQuickCommand(cmd)}
              style={[styles.quickBtn, { backgroundColor: theme.colors.surfaceLight }]}
            >
              <Ionicons name={cmd.icon} size={14} color={theme.colors.primary} />
              <Text style={[styles.quickLabel, { color: theme.colors.textMuted }]}>{cmd.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.hint, { color: theme.colors.textMuted + '80' }]}>
          Try: "Add buy milk" or "Habit meditate 10 minutes"
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  modal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
  },
  handle: { width: 32, height: 3, borderRadius: 1.5, alignSelf: 'center', marginBottom: 16 },

  micSection: { alignItems: 'center', marginBottom: 20 },
  micBtn: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    shadowOpacity: 0.3, shadowRadius: 12, shadowColor: '#000', elevation: 6,
  },
  micPulse: {
    position: 'absolute', width: 72, height: 72, borderRadius: 36,
  },
  micLabel: { fontSize: 12, marginTop: 10 },

  resultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 12,
  },
  resultText: { fontSize: 13, fontWeight: '600', flex: 1 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
  },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  sendBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  quickLabel: { fontSize: 11, fontWeight: '600' },

  hint: { fontSize: 10, textAlign: 'center' },
});
