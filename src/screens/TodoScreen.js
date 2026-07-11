import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { formatDate, getPriorityColor, getCategoryColor, isOverdue } from '../utils/dateHelpers';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInRight, FadeOutLeft, FadeOutRight,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  Easing, interpolate, Layout, runOnJS,
  SlideInDown, ZoomIn, BounceIn,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import VoiceCommandModal from '../components/VoiceCommandModal';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const getPriorityOptions = (theme) => [
  { label: 'Low', value: 'low', color: theme.colors.success, icon: 'leaf' },
  { label: 'Med', value: 'medium', color: theme.colors.primary, icon: 'flame' },
  { label: 'High', value: 'high', color: theme.colors.error, icon: 'flash' },
];

const CATEGORIES = [
  { label: 'War', value: 'work', icon: 'briefcase' },
  { label: 'Self', value: 'personal', icon: 'person' },
  { label: 'Health', value: 'health', icon: 'heart' },
  { label: 'Learn', value: 'education', icon: 'book' },
  { label: 'Gold', value: 'finance', icon: 'diamond' },
  { label: 'Other', value: 'other', icon: 'bookmark' },
];

const FILTER_OPTIONS = [
  { label: 'All', value: 'all', icon: 'apps' },
  { label: 'Active', value: 'active', icon: 'play' },
  { label: 'Done', value: 'completed', icon: 'checkmark' },
  { label: 'Overdue', value: 'overdue', icon: 'warning' },
];

const RECURRING_OPTIONS = [
  { label: 'None', value: null },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

function AnimatedCheckbox({ checked, color }) {
  const { theme } = useTheme();
  const scale = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, { damping: 12, stiffness: 200 });
  }, [checked]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: checked ? (color || theme.colors.success) : 'transparent',
    borderColor: checked ? (color || theme.colors.success) : theme.colors.border,
  }));

  return (
    <Animated.View style={[styles.checkbox, style]}>
      {checked && (
        <Animated.View entering={BounceIn.duration(300).springify().damping(8)}>
          <Ionicons name="checkmark" size={12} color={theme.colors.text} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function TodoItem({ todo, onToggle, onDelete, onEdit, onToggleSubtask, index, compact, isGrid }) {
  const { theme, cardStyle } = useTheme();
  const pColor = getPriorityColor(todo.priority);
  const categoryInfo = CATEGORIES.find(c => c.value === todo.category);
  const scale = useSharedValue(1);
  const padding = compact ? 10 : 14;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.97, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 400 }),
    );
    onToggle(todo.id);
  };

  const itemAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const renderRightActions = (progress, dragX) => (
    <Animated.View entering={FadeInRight.duration(200)} style={[styles.swipeAction, { backgroundColor: theme.colors.error }]}>
      <Ionicons name="trash" size={20} color={theme.colors.text} />
      <Text style={[styles.swipeText, { color: theme.colors.text }]}>Delete</Text>
    </Animated.View>
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 50).springify().damping(16).stiffness(120)}
      exiting={FadeOutLeft.duration(300)}
      layout={Layout.springify().damping(18).stiffness(150)}
    >
      <Swipeable renderRightActions={renderRightActions} onSwipeableRightOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onDelete(todo.id);
      }} friction={2} rightThreshold={80}>
        <Animated.View style={itemAnimStyle}>
          <TouchableOpacity
            onPress={handlePress}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onEdit(todo); }}
            activeOpacity={1}
            style={[styles.todoItem, cardStyle, { borderWidth: 1, borderLeftColor: pColor, borderLeftWidth: 3, padding }, isGrid && styles.todoItemGrid, itemAnimStyle]}
          >
            <AnimatedCheckbox checked={todo.completed} />

            <View style={styles.todoContent}>
              <View style={styles.todoTop}>
                <Text
                  style={[styles.todoTitle, { color: theme.colors.text, fontSize: compact ? 13 : 15 }, todo.completed && { textDecorationLine: 'line-through', color: theme.colors.textMuted }]}
                  numberOfLines={isGrid ? 2 : 1}
                >
                  {todo.title}
                </Text>
                <View style={[styles.priorityDot, { backgroundColor: pColor }]} />
              </View>

              <View style={styles.todoMeta}>
                {categoryInfo && (
                  <View style={styles.metaItem}>
                    <Ionicons name={categoryInfo.icon} size={10} color={theme.colors.textMuted} />
                    <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{categoryInfo.label}</Text>
                  </View>
                )}
                {todo.recurring && (
                  <View style={styles.metaItem}>
                    <Ionicons name="repeat" size={10} color={theme.colors.textMuted} />
                    <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{todo.recurring}</Text>
                  </View>
                )}
                {todo.dueDate && (
                  <View style={styles.metaItem}>
                    {isOverdue(todo.dueDate) && !todo.completed && <Ionicons name="alert" size={10} color={theme.colors.error} />}
                    <Text style={[styles.metaText, { color: isOverdue(todo.dueDate) && !todo.completed ? theme.colors.error : theme.colors.textMuted }]}>
                      {formatDate(todo.dueDate)}
                    </Text>
                  </View>
                )}
              </View>

              {todo.subtasks && todo.subtasks.length > 0 && (
                <View style={styles.subtasksContainer}>
                  {todo.subtasks.map(sub => (
                    <TouchableOpacity key={sub.id} style={styles.subtaskRow} onPress={() => onToggleSubtask(todo.id, sub.id)}>
                      <View style={[styles.subtaskCheck, { borderColor: sub.completed ? theme.colors.success : theme.colors.border }]}>
                        {sub.completed && <Ionicons name="checkmark" size={8} color={theme.colors.success} />}
                      </View>
                      <Text style={[styles.subtaskText, { color: theme.colors.textSecondary }, sub.completed && { textDecorationLine: 'line-through', color: theme.colors.textMuted }]} numberOfLines={1}>
                        {sub.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
}

function AddTodoModal({ visible, onClose, onSave, initialData }) {
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [recurring, setRecurring] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const isEditing = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setPriority(initialData.priority || 'medium');
        setCategory(initialData.category || 'personal');
        setDueDate(initialData.dueDate ? initialData.dueDate.split('T')[0] : '');
        setDueTime(initialData.reminderTime || '');
        setHasReminder(!!initialData.reminderTime);
        setRecurring(initialData.recurring || null);
        setSubtasks(initialData.subtasks || []);
      } else {
        setTitle(''); setDescription(''); setPriority('medium'); setCategory('personal');
        setDueDate(''); setDueTime(''); setHasReminder(false); setRecurring(null); setSubtasks([]);
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Error', 'Enter a title'); return; }
    const data = {
      title: title.trim(), description: description.trim(), priority, category,
      dueDate: dueDate || null,
      reminderTime: hasReminder && dueDate && dueTime ? `${dueDate}T${dueTime}:00` : null,
      recurring, subtasks,
    };
    if (isEditing) data.id = initialData.id;
    onSave(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, { id: Date.now().toString(), title: subtaskInput.trim(), completed: false }]);
      setSubtaskInput('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View entering={FadeIn.duration(200)} style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={SlideInDown.springify().damping(16).stiffness(120)} style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{isEditing ? 'Edit Quest' : 'New Quest'}</Text>

          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Title" placeholderTextColor={theme.colors.textMuted} value={title} onChangeText={setTitle} autoFocus />
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Description (optional)" placeholderTextColor={theme.colors.textMuted} value={description} onChangeText={setDescription} multiline />

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Priority</Text>
          <View style={styles.optionRow}>
            {getPriorityOptions(theme).map(p => (
              <TouchableOpacity key={p.value} style={[styles.optionBtn, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.border }, priority === p.value && { backgroundColor: p.color + '15', borderColor: p.color }]} onPress={() => setPriority(p.value)}>
                <Text style={[styles.optionText, { color: theme.colors.textSecondary }, priority === p.value && { color: p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Category</Text>
          <View style={styles.optionRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.value} style={[styles.optionBtn, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.border }, category === c.value && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]} onPress={() => setCategory(c.value)}>
                <Ionicons name={c.icon} size={12} color={category === c.value ? theme.colors.primary : theme.colors.textMuted} />
                <Text style={[styles.optionText, { color: theme.colors.textSecondary, marginLeft: 4 }, category === c.value && { color: theme.colors.primary }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Due Date</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} value={dueDate} onChangeText={setDueDate} />

          <TouchableOpacity style={styles.reminderToggle} onPress={() => setHasReminder(!hasReminder)}>
            <View style={[styles.modalCheckbox, hasReminder && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
              {hasReminder && <Ionicons name="checkmark" size={10} color={isDark ? '#fff' : '#000'} />}
            </View>
            <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>Set reminder</Text>
          </TouchableOpacity>

          {hasReminder && <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="HH:MM (24h)" placeholderTextColor={theme.colors.textMuted} value={dueTime} onChangeText={setDueTime} />}

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Repeat</Text>
          <View style={styles.optionRow}>
            {RECURRING_OPTIONS.map(r => (
              <TouchableOpacity key={r.value || 'none'} style={[styles.optionBtn, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.border }, recurring === r.value && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]} onPress={() => setRecurring(r.value)}>
                <Text style={[styles.optionText, { color: theme.colors.textSecondary }, recurring === r.value && { color: theme.colors.primary }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Subtasks</Text>
          <View style={styles.subtaskInputRow}>
            <TextInput style={[styles.subtaskInput, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Add subtask..." placeholderTextColor={theme.colors.textMuted} value={subtaskInput} onChangeText={setSubtaskInput} onSubmitEditing={addSubtask} />
            <TouchableOpacity style={[styles.subtaskAddBtn, { backgroundColor: theme.colors.primary }]} onPress={addSubtask}>
              <Ionicons name="add" size={18} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
          {subtasks.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              {subtasks.map(sub => (
                <Animated.View key={sub.id} entering={FadeInDown.duration(200).springify()}>
                  <View style={[styles.subtaskChip, { backgroundColor: theme.colors.surfaceLight }]}>
                    <Text style={[styles.subtaskChipText, { color: theme.colors.text }]} numberOfLines={1}>{sub.title}</Text>
                    <TouchableOpacity onPress={() => setSubtasks(subtasks.filter(s => s.id !== sub.id))}>
                      <Ionicons name="close-circle" size={14} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.saveBtn, { borderColor: theme.colors.primary + '30' }]} onPress={handleSave}>
            <Text style={[styles.saveBtnText, { color: theme.colors.primary }]}>{isEditing ? 'Update Quest' : 'Add Quest'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function FilterChip({ f, active, theme, onPress }) {
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={s}>
      <TouchableOpacity
        style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, active && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); scale.value = withSequence(withSpring(0.92, { damping: 10, stiffness: 400 }), withSpring(1, { damping: 10, stiffness: 400 })); onPress(); }}
        activeOpacity={1}
      >
        <Text style={[styles.filterChipText, { color: theme.colors.textMuted }, active && { color: theme.colors.primary }]}>{f.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TodoScreen() {
  const { theme, isDark, layoutView, cardDensity, setLayoutView, setCardDensity } = useTheme();
  const { state, addTodo, updateTodo, deleteTodo, toggleTodo, addSubtask, toggleSubtask } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceVisible, setVoiceVisible] = useState(false);
  const fabScale = useSharedValue(1);
  const isCompact = cardDensity === 'compact';
  const isGrid = layoutView === 'grid';

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const filteredTodos = state.todos
    .filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      if (filter === 'overdue') return !t.completed && isOverdue(t.dueDate);
      return true;
    })
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority': { const o = { high: 0, medium: 1, low: 2 }; return (o[a.priority] || 3) - (o[b.priority] || 3); }
        case 'dueDate': { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate) - new Date(b.dueDate); }
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Quests</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.count, { color: theme.colors.textMuted }]}>{filteredTodos.length} of {state.todos.length}</Text>
          <TouchableOpacity
            onPress={() => setLayoutView(isGrid ? 'list' : 'grid')}
            style={[styles.layoutToggle, { backgroundColor: theme.colors.surfaceLight }]}
          >
            <Ionicons name={isGrid ? 'list' : 'grid'} size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCardDensity(isCompact ? 'comfortable' : 'compact')}
            style={[styles.layoutToggle, { backgroundColor: theme.colors.surfaceLight }]}
          >
            <Ionicons name={isCompact ? 'expand' : 'contract'} size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={14} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={[styles.searchInput, { color: theme.colors.text }]} placeholder="Search..." placeholderTextColor={theme.colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
      </Animated.View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTER_OPTIONS.map((f, i) => (
            <FilterChip key={f.value} f={f} active={filter === f.value} theme={theme} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={isGrid ? styles.gridContent : styles.listContent}>
        {filteredTodos.length === 0 ? (
          <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.emptyState}>
            <Ionicons name="scroll-outline" size={40} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No quests</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>Tap + to begin</Text>
          </Animated.View>
        ) : isGrid ? (
          <View style={styles.gridRow}>
            {filteredTodos.map((todo, i) => (
              <View key={todo.id} style={styles.gridItem}>
                <TodoItem todo={todo} index={i} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={(t) => { setEditingTodo(t); setModalVisible(true); }} onToggleSubtask={toggleSubtask} compact={isCompact} isGrid />
              </View>
            ))}
          </View>
        ) : (
          filteredTodos.map((todo, i) => (
            <TodoItem key={todo.id} todo={todo} index={i} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={(t) => { setEditingTodo(t); setModalVisible(true); }} onToggleSubtask={toggleSubtask} compact={isCompact} />
          ))
        )}
      </ScrollView>

      <Animated.View entering={ZoomIn.duration(400).delay(200).springify().damping(10)} style={[styles.fabWrap, fabStyle]}>
        <TouchableOpacity
          style={[styles.voiceFab, { backgroundColor: theme.colors.surface }, theme.shadows.medium]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setVoiceVisible(true); }}
        >
          <Ionicons name="mic" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadows.glow]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditingTodo(null); setModalVisible(true); }}
          onPressIn={() => { fabScale.value = withSpring(0.88, { damping: 10, stiffness: 300 }); }}
          onPressOut={() => { fabScale.value = withSpring(1, { damping: 10, stiffness: 300 }); }}
          activeOpacity={1}
        >
          <Ionicons name="add" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </Animated.View>

      <AddTodoModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditingTodo(null); }} onSave={(d) => { d.id ? updateTodo(d) : addTodo(d); setEditingTodo(null); }} initialData={editingTodo} />
      <VoiceCommandModal visible={voiceVisible} onClose={() => setVoiceVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  count: { fontSize: 13 },
  layoutToggle: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 12,
    borderRadius: 10, paddingHorizontal: 14, height: 40, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, height: 40 },

  filterRow: { paddingHorizontal: 24, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, marginRight: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  gridContent: { paddingHorizontal: 16, paddingBottom: 100 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: (width - 48) / 2 },

  todoItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, marginBottom: 8,
  },
  todoItemGrid: {
    flexDirection: 'column', alignItems: 'flex-start',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  todoContent: { flex: 1 },
  todoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todoTitle: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  todoMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11 },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  subtasksContainer: { marginTop: 8, paddingLeft: 34 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  subtaskCheck: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  subtaskText: { fontSize: 12, flex: 1 },

  swipeAction: {
    width: 80, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, marginBottom: 8, marginLeft: 4,
  },
  swipeText: { fontSize: 10, marginTop: 4, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13 },

  fabWrap: { position: 'absolute', bottom: 30, right: 24, flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceFab: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%',
  },
  modalHandle: { width: 32, height: 3, borderRadius: 1.5, alignSelf: 'center', marginTop: 12, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.2)' },
  modalTitle: { fontSize: 22, fontWeight: '700', fontFamily: serifFont, marginBottom: 20 },

  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, marginBottom: 12, borderWidth: 1 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  modalLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 8 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  optionText: { fontSize: 12, fontWeight: '600' },

  reminderToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalCheckbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  reminderText: { fontSize: 13 },

  subtaskInputRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  subtaskInput: { flex: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, borderWidth: 1 },
  subtaskAddBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  subtaskChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 4 },
  subtaskChipText: { fontSize: 12, flex: 1, marginRight: 6 },

  saveBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 16, alignItems: 'center', borderWidth: 1 },
  saveBtnText: { fontSize: 15, fontWeight: '600' },
});
