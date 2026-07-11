import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard, FadeInView } from '../components/MedievalUI';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QUADRANT_WIDTH = (SCREEN_WIDTH - 60) / 2;
const MAX_SLOTS = 5;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const QUADRANTS = [
  {
    key: 'doFirst',
    title: 'Do First',
    subtitle: 'Urgent + Important',
    icon: 'flame',
    color: '#E74C3C',
    description: 'Act immediately. These tasks demand your attention right now.',
  },
  {
    key: 'schedule',
    title: 'Schedule',
    subtitle: 'Not Urgent + Important',
    icon: 'calendar',
    color: '#3498DB',
    description: 'Plan a time. Important tasks that need dedicated focus.',
  },
  {
    key: 'delegate',
    title: 'Delegate',
    subtitle: 'Urgent + Not Important',
    icon: 'people',
    color: '#F39C12',
    description: 'Hand off if possible. Urgent but not the best use of your time.',
  },
  {
    key: 'eliminate',
    title: 'Eliminate',
    subtitle: 'Not Urgent + Not Important',
    icon: 'trash',
    color: '#95A5A6',
    description: 'Remove or minimize. These drain your time with little return.',
  },
];

function TaskSlot({ task, color, onRemove }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!task) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(250).springify().damping(16)}
      style={[styles.taskSlot, { backgroundColor: theme.colors.surface, borderLeftColor: color }, s]}
    >
      <Text style={[styles.taskTitle, { color: theme.colors.text }]} numberOfLines={2}>
        {task.title}
      </Text>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRemove();
        }}
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptySlot({ color }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.emptySlot, { borderColor: color + '30', backgroundColor: color + '08' }]}>
      <Ionicons name="add" size={16} color={color + '60'} />
    </View>
  );
}

function QuadrantCard({ quadrant, tasks, onAdd, onRemove, delay }) {
  const { theme } = useTheme();
  const filledSlots = tasks.length;
  const emptySlots = MAX_SLOTS - filledSlots;

  return (
    <GlassCard delay={delay} style={[styles.quadrantCard, { borderTopColor: quadrant.color, borderTopWidth: 3 }]}>
      <View style={styles.quadrantHeader}>
        <View style={[styles.quadrantIconWrap, { backgroundColor: quadrant.color + '18' }]}>
          <Ionicons name={quadrant.icon} size={20} color={quadrant.color} />
        </View>
        <View style={styles.quadrantHeaderText}>
          <Text style={[styles.quadrantTitle, { color: theme.colors.text }]}>{quadrant.title}</Text>
          <Text style={[styles.quadrantSubtitle, { color: quadrant.color }]}>{quadrant.subtitle}</Text>
        </View>
        <View style={[styles.quadrantCount, { backgroundColor: quadrant.color + '18' }]}>
          <Text style={[styles.quadrantCountText, { color: quadrant.color }]}>{filledSlots}/{MAX_SLOTS}</Text>
        </View>
      </View>

      <View style={styles.taskList}>
        {tasks.map((task) => (
          <TaskSlot key={task.id} task={task} color={quadrant.color} onRemove={() => onRemove(quadrant.key, task.id)} />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <EmptySlot key={`empty-${i}`} color={quadrant.color} />
        ))}
      </View>

      {filledSlots < MAX_SLOTS && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: quadrant.color + '15' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAdd(quadrant.key);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={18} color={quadrant.color} />
          <Text style={[styles.addButtonText, { color: quadrant.color }]}>Assign Task</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  );
}

function TaskPickerModal({ visible, onClose, onSelect, existingIds }) {
  const { theme } = useTheme();
  const { state } = useApp();
  const availableTodos = state.todos.filter(
    (t) => !t.completed && !existingIds.includes(t.id)
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Assign a Task</Text>
          <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
            {availableTodos.length} unassigned tasks available
          </Text>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {availableTodos.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="document-text-outline" size={40} color={theme.colors.textMuted} />
                <Text style={[styles.modalEmptyText, { color: theme.colors.textMuted }]}>
                  All tasks assigned or completed
                </Text>
              </View>
            ) : (
              availableTodos.map((todo, i) => (
                <Animated.View
                  key={todo.id}
                  entering={FadeInDown.duration(300).delay(i * 40).springify().damping(16)}
                >
                  <TouchableOpacity
                    style={[styles.pickerItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSelect(todo);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerDot, { backgroundColor: theme.colors.primary }]} />
                    <View style={styles.pickerTextWrap}>
                      <Text style={[styles.pickerItemTitle, { color: theme.colors.text }]} numberOfLines={1}>
                        {todo.title}
                      </Text>
                      {todo.description ? (
                        <Text style={[styles.pickerItemDesc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                          {todo.description}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: theme.colors.surfaceLight }]} onPress={onClose}>
            <Text style={[styles.modalCloseText, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function InfoModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.infoSheet, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>The Eisenhower Matrix</Text>
          <Text style={[styles.infoDesc, { color: theme.colors.textSecondary }]}>
            Named after President Dwight D. Eisenhower, this framework helps you prioritize tasks by urgency and importance.
          </Text>

          <View style={styles.infoGrid}>
            {QUADRANTS.map((q) => (
              <View key={q.key} style={[styles.infoItem, { borderLeftColor: q.color }]}>
                <View style={styles.infoItemHeader}>
                  <Ionicons name={q.icon} size={16} color={q.color} />
                  <Text style={[styles.infoItemTitle, { color: q.color }]}>{q.title}</Text>
                </View>
                <Text style={[styles.infoItemText, { color: theme.colors.textSecondary }]}>{q.description}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: theme.colors.primary + '15' }]} onPress={onClose}>
            <Text style={[styles.modalCloseText, { color: theme.colors.primary }]}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function EisenhowerMatrix() {
  const { theme } = useTheme();
  const { state } = useApp();

  const [assignments, setAssignments] = useState({
    doFirst: [],
    schedule: [],
    delegate: [],
    eliminate: [],
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeQuadrant, setActiveQuadrant] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const allAssignedIds = Object.values(assignments).flat().map((t) => t.id);

  const handleAdd = useCallback((quadrantKey) => {
    setActiveQuadrant(quadrantKey);
    setPickerVisible(true);
  }, []);

  const handleSelect = useCallback((todo) => {
    if (!activeQuadrant) return;
    setAssignments((prev) => {
      const current = prev[activeQuadrant];
      if (current.length >= MAX_SLOTS) return prev;
      return { ...prev, [activeQuadrant]: [...current, todo] };
    });
    setPickerVisible(false);
    setActiveQuadrant(null);
  }, [activeQuadrant]);

  const handleRemove = useCallback((quadrantKey, taskId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAssignments((prev) => ({
      ...prev,
      [quadrantKey]: prev[quadrantKey].filter((t) => t.id !== taskId),
    }));
  }, []);

  const totalAssigned = allAssignedIds.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Eisenhower Matrix</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {totalAssigned} task{totalAssigned !== 1 ? 's' : ''} assigned
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.infoBtn, { backgroundColor: theme.colors.primary + '15' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setInfoVisible(true);
          }}
        >
          <Ionicons name="information-circle" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.axisLabels}>
        <View style={styles.axisCol}>
          <View style={styles.axisDotRow}>
            <View style={[styles.axisDot, { backgroundColor: '#E74C3C' }]} />
            <View style={[styles.axisDot, { backgroundColor: '#3498DB' }]} />
          </View>
          <Text style={[styles.axisLabel, { color: theme.colors.textMuted }]}>Important</Text>
        </View>
        <View style={styles.axisCol}>
          <View style={styles.axisDotRow}>
            <View style={[styles.axisDot, { backgroundColor: '#F39C12' }]} />
            <View style={[styles.axisDot, { backgroundColor: '#95A5A6' }]} />
          </View>
          <Text style={[styles.axisLabel, { color: theme.colors.textMuted }]}>Not Important</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.matrixRow}>
          <View style={styles.matrixCol}>
            <View style={[styles.rowLabel, { backgroundColor: theme.colors.surfaceLight }]}>
              <Ionicons name="flash" size={14} color="#E74C3C" />
              <Text style={[styles.rowLabelText, { color: theme.colors.text }]}>Urgent</Text>
            </View>
            <QuadrantCard
              quadrant={QUADRANTS[0]}
              tasks={assignments.doFirst}
              onAdd={handleAdd}
              onRemove={handleRemove}
              delay={0}
            />
            <QuadrantCard
              quadrant={QUADRANTS[2]}
              tasks={assignments.delegate}
              onAdd={handleAdd}
              onRemove={handleRemove}
              delay={100}
            />
          </View>

          <View style={styles.matrixCol}>
            <View style={[styles.rowLabel, { backgroundColor: theme.colors.surfaceLight }]}>
              <Ionicons name="hourglass-outline" size={14} color="#3498DB" />
              <Text style={[styles.rowLabelText, { color: theme.colors.text }]}>Not Urgent</Text>
            </View>
            <QuadrantCard
              quadrant={QUADRANTS[1]}
              tasks={assignments.schedule}
              onAdd={handleAdd}
              onRemove={handleRemove}
              delay={50}
            />
            <QuadrantCard
              quadrant={QUADRANTS[3]}
              tasks={assignments.eliminate}
              onAdd={handleAdd}
              onRemove={handleRemove}
              delay={150}
            />
          </View>
        </View>

        {totalAssigned === 0 && (
          <FadeInView delay={400} style={styles.tipWrap}>
            <GlassCard delay={500}>
              <View style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={18} color={theme.colors.primary} />
                <View style={styles.tipTextWrap}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Prioritize with purpose</Text>
                  <Text style={[styles.tipBody, { color: theme.colors.textSecondary }]}>
                    Tap "Assign Task" in any quadrant to place your to-dos. Focus on the top-left first, then work clockwise.
                  </Text>
                </View>
              </View>
            </GlassCard>
          </FadeInView>
        )}
      </ScrollView>

      <TaskPickerModal
        visible={pickerVisible}
        onClose={() => { setPickerVisible(false); setActiveQuadrant(null); }}
        onSelect={handleSelect}
        existingIds={allAssignedIds}
      />

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 4,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  subtitle: { fontSize: 13, marginTop: 2 },
  infoBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },

  axisLabels: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 36, marginBottom: 8, marginTop: 4,
  },
  axisCol: { alignItems: 'center' },
  axisDotRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  axisDot: { width: 6, height: 6, borderRadius: 3 },
  axisLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  matrixRow: { flexDirection: 'row', gap: 12 },
  matrixCol: { flex: 1 },
  rowLabel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, borderRadius: 8, marginBottom: 8, gap: 5,
  },
  rowLabelText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  quadrantCard: {
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
    borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
    marginBottom: 12, padding: 12,
  },
  quadrantHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  quadrantIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  quadrantHeaderText: { flex: 1 },
  quadrantTitle: { fontSize: 14, fontWeight: '700' },
  quadrantSubtitle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  quadrantCount: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  quadrantCountText: { fontSize: 11, fontWeight: '700' },

  taskList: { gap: 6 },
  taskSlot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10,
    borderLeftWidth: 3,
  },
  taskTitle: { fontSize: 12, fontWeight: '600', flex: 1, marginRight: 6 },
  emptySlot: {
    height: 32, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },

  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, paddingVertical: 8, marginTop: 8, gap: 6,
  },
  addButtonText: { fontSize: 12, fontWeight: '700' },

  tipWrap: { marginTop: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipTextWrap: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  tipBody: { fontSize: 12, lineHeight: 18 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', fontFamily: serifFont, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 },

  modalScroll: { maxHeight: 360 },
  modalEmpty: { alignItems: 'center', paddingVertical: 40 },
  modalEmptyText: { fontSize: 14, marginTop: 10 },

  pickerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 0.5,
  },
  pickerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  pickerTextWrap: { flex: 1 },
  pickerItemTitle: { fontSize: 15, fontWeight: '600' },
  pickerItemDesc: { fontSize: 12, marginTop: 2 },

  modalCloseBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  modalCloseText: { fontSize: 15, fontWeight: '600' },

  infoSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8,
  },
  infoDesc: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  infoGrid: { gap: 12 },
  infoItem: {
    borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4,
  },
  infoItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  infoItemTitle: { fontSize: 14, fontWeight: '700' },
  infoItemText: { fontSize: 12, lineHeight: 18 },
});
