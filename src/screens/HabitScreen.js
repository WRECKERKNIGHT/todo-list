import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { getTodayStr, getWeekDates, getHabitStreak } from '../utils/dateHelpers';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOutLeft,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, Easing, Layout, ZoomIn, BounceIn,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const getHabitColors = (theme) => [theme.colors.primary, theme.colors.error, theme.colors.success, theme.colors.textSecondary, theme.colors.accent, theme.colors.warning];
const HABIT_ICONS = ['flame', 'fitness', 'book', 'musical-notes', 'restaurant', 'bedtime', 'water', 'sunny', 'heart', 'brain', 'footsteps', 'bicycle'];
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function WeekCircle({ done, isToday, color, delay }) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(done ? 1 : 0.9);
  const fillScale = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(done ? 1 : 0.9, { damping: 12, stiffness: 200 });
    fillScale.value = withSpring(done ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [done]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: done ? (color || theme.colors.primary) : theme.colors.surfaceLight,
    borderColor: done ? (color || theme.colors.primary) : isToday ? (color || theme.colors.primary) + '50' : theme.colors.border,
  }));

  return (
    <Animated.View style={[styles.weekDayCircle, circleStyle]}>
      {done && (
        <Animated.View entering={BounceIn.duration(300).springify().damping(8)}>
          <Ionicons name="checkmark" size={12} color={isDark ? '#fff' : '#000'} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function WeekRow({ habit, onToggle }) {
  const { theme } = useTheme();
  const weekDates = getWeekDates();

  return (
    <View style={styles.weekRow}>
      {weekDates.map((d, i) => {
        const done = habit.completedDates.includes(d.date);
        return (
          <TouchableOpacity key={d.date} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(habit.id, d.date); }} style={styles.weekDayCell}>
            <Text style={[styles.weekDayName, { color: theme.colors.textMuted }, d.isToday && { color: theme.colors.primary }]}>{d.dayName[0]}</Text>
            <WeekCircle done={done} isToday={d.isToday} color={habit.color} delay={i * 30} />
            <Text style={[styles.weekDayNum, { color: theme.colors.textMuted }, d.isToday && { color: theme.colors.primary }]}>{d.dayNum}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HabitCard({ habit, onToggle, onDelete, onEdit, index }) {
  const { theme, isDark } = useTheme();
  const streak = getHabitStreak(habit.completedDates);
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const renderRightActions = () => (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.swipeAction, { backgroundColor: theme.colors.error }]}>
      <Ionicons name="trash" size={20} color={isDark ? '#fff' : '#000'} />
      <Text style={[styles.swipeText, { color: isDark ? '#fff' : '#000' }]}>Delete</Text>
    </Animated.View>
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(index * 60).springify().damping(16).stiffness(110)}
      exiting={FadeOutLeft.duration(300)}
      layout={Layout.springify().damping(18)}
    >
      <Swipeable renderRightActions={renderRightActions} onSwipeableRightOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onDelete(habit.id);
      }} friction={2} rightThreshold={80}>
        <Animated.View style={cardStyle}>
          <TouchableOpacity
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onEdit(habit); }}
            onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
            activeOpacity={1}
            style={[styles.habitCard, { backgroundColor: theme.colors.surface, borderLeftColor: habit.color || theme.colors.primary }]}
          >
            <View style={styles.habitTop}>
              <View style={[styles.habitIconWrap, { backgroundColor: (habit.color || theme.colors.primary) + '10' }]}>
                <Ionicons name={habit.icon || 'flame'} size={20} color={habit.color || theme.colors.primary} />
              </View>
              <View style={styles.habitInfo}>
                <Text style={[styles.habitName, { color: theme.colors.text }]}>{habit.name}</Text>
                {habit.description ? <Text style={[styles.habitDesc, { color: theme.colors.textMuted }]} numberOfLines={1}>{habit.description}</Text> : null}
              </View>
            </View>

            <WeekRow habit={habit} onToggle={onToggle} />

            <View style={styles.habitStats}>
              <View style={styles.streakContainer}>
                <Ionicons name="flame" size={12} color={theme.colors.accent} />
                <Text style={[styles.streakText, { color: theme.colors.accent }]}>{streak > 0 ? `${streak}d streak` : 'Start streak'}</Text>
              </View>
              <Text style={[styles.completedCount, { color: theme.colors.textMuted }]}>{habit.completedDates.length} total</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
}

function AddHabitModal({ visible, onClose, onSave, initialData }) {
  const { theme, isDark } = useTheme();
  const habitColors = getHabitColors(theme);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(habitColors[0]);
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const isEditing = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) { setName(initialData.name || ''); setDescription(initialData.description || ''); setColor(initialData.color || habitColors[0]); setIcon(initialData.icon || HABIT_ICONS[0]); }
      else { setName(''); setDescription(''); setColor(habitColors[Math.floor(Math.random() * habitColors.length)]); setIcon(HABIT_ICONS[Math.floor(Math.random() * HABIT_ICONS.length)]); }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a name'); return; }
    const data = { name: name.trim(), description: description.trim(), color, icon };
    if (isEditing) data.id = initialData.id;
    onSave(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View entering={FadeIn.duration(200)} style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120)} style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{isEditing ? 'Edit Ritual' : 'New Ritual'}</Text>

          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Name" placeholderTextColor={theme.colors.textMuted} value={name} onChangeText={setName} autoFocus />
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Description (optional)" placeholderTextColor={theme.colors.textMuted} value={description} onChangeText={setDescription} multiline />

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {HABIT_ICONS.map(i => (
              <TouchableOpacity key={i} style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.border }, icon === i && { backgroundColor: color + '20', borderColor: color }]} onPress={() => setIcon(i)}>
                <Ionicons name={i} size={18} color={icon === i ? color : theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Color</Text>
          <View style={styles.colorRow}>
            {habitColors.map(c => (
              <TouchableOpacity key={c} style={[styles.colorBtn, { backgroundColor: c }, color === c && { borderWidth: 2, borderColor: theme.colors.text }]} onPress={() => setColor(c)} />
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={[styles.saveBtnText, { color: color }]}>{isEditing ? 'Update' : 'Create'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function HabitScreen() {
  const { theme, isDark } = useTheme();
  const { state, addHabit, updateHabit, deleteHabit, toggleHabitDate } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const today = getTodayStr();

  const handleToggle = (habitId, dateStr) => { toggleHabitDate(habitId, dateStr); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Rituals</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{state.habits.filter(h => h.completedDates.includes(today)).length} done today</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {state.habits.length === 0 ? (
          <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.emptyState}>
            <Ionicons name="flame-outline" size={40} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No rituals</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>Create your first ritual</Text>
          </Animated.View>
        ) : (
          state.habits.map((habit, i) => (
            <HabitCard key={habit.id} habit={habit} index={i} onToggle={handleToggle} onDelete={deleteHabit} onEdit={(h) => { setEditingHabit(h); setModalVisible(true); }} />
          ))
        )}
      </ScrollView>

      <Animated.View entering={ZoomIn.duration(400).delay(200).springify().damping(10)}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.accent }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditingHabit(null); setModalVisible(true); }} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </Animated.View>

      <AddHabitModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditingHabit(null); }} onSave={(d) => { d.id ? updateHabit(d) : addHabit(d); setEditingHabit(null); }} initialData={editingHabit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  subtitle: { fontSize: 13, marginTop: 4 },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },

  habitCard: {
    borderRadius: 10, padding: 16, marginBottom: 10,
    borderLeftWidth: 3,
  },
  habitTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  habitIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 15, fontWeight: '600' },
  habitDesc: { fontSize: 12, marginTop: 2 },
  habitDelete: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekDayCell: { alignItems: 'center', width: (width - 72) / 7 },
  weekDayName: { fontSize: 10, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  weekDayCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  weekDayNum: { fontSize: 10, marginTop: 3 },

  habitStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakContainer: { flexDirection: 'row', alignItems: 'center' },
  streakText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  completedCount: { fontSize: 11 },

  swipeAction: {
    width: 80, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, marginBottom: 10, marginLeft: 4,
  },
  swipeText: { fontSize: 10, marginTop: 4, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 30, right: 24,
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 32, height: 3, borderRadius: 1.5, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '700', fontFamily: serifFont, marginBottom: 20 },

  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, marginBottom: 12, borderWidth: 1 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  modalLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1 },
  colorRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  colorBtn: { width: 30, height: 30, borderRadius: 15 },

  saveBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  saveBtnText: { fontSize: 15, fontWeight: '600' },
});
