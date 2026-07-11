import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard, FadeInView } from '../components/MedievalUI';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function getWeekDates(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    week.push(day);
  }
  return week;
}

function formatDateRange(weekDates) {
  const start = weekDates[0];
  const end = weekDates[6];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const PRIORITY_COLORS = {
  high: '#FF4D4D',
  medium: '#FFB800',
  low: '#4CAF50',
};

const PRIORITY_LABELS = ['Low', 'Med', 'High'];

const CATEGORY_ICONS = {
  work: 'briefcase-outline',
  personal: 'person-outline',
  health: 'fitness-outline',
  shopping: 'cart-outline',
  learning: 'book-outline',
  other: 'ellipse-outline',
};

export default function WeeklyPlannerScreen() {
  const { todos, addTodo, updateTodo, deleteTodo } = useApp();
  const { theme } = useTheme();

  const today = new Date();
  const weekDates = getWeekDates(today);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const idx = weekDates.findIndex((d) => isSameDay(d, today));
    return idx >= 0 ? idx : 0;
  });

  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddPriority, setQuickAddPriority] = useState('medium');

  const selectedDate = weekDates[selectedDayIndex];

  const getTasksForDay = useCallback(
    (date) => {
      const dateStr = toISODate(date);
      return todos
        .filter((t) => t.dueDate === dateStr && !t.completed)
        .sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return (order[a.priority] || 1) - (order[b.priority] || 1);
        });
    },
    [todos]
  );

  const selectedDayTasks = getTasksForDay(selectedDate);

  const weekOverview = weekDates.map((d) => {
    const tasks = getTasksForDay(d);
    return {
      date: d,
      tasks,
      count: tasks.length,
    };
  });

  const totalWeekTasks = weekOverview.reduce((sum, d) => sum + d.count, 0);

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const dateStr = toISODate(selectedDate);
    addTodo({
      id: Date.now().toString(),
      title: quickAddText.trim(),
      completed: false,
      priority: quickAddPriority,
      dueDate: dateStr,
      category: 'other',
      createdAt: new Date().toISOString(),
    });

    setQuickAddText('');
  };

  const handleRemoveFromDay = async (taskId) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateTodo(taskId, { dueDate: null });
  };

  const handleToggleTask = async (taskId) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const task = todos.find((t) => t.id === taskId);
    if (task) {
      updateTodo(taskId, { completed: !task.completed });
    }
  };

  const handleDayPress = (index) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedDayIndex(index);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Weekly Planner
            </Text>
          </View>
          <Text style={[styles.dateRange, { color: theme.colors.textSecondary || theme.colors.text + '99' }]}>
            {formatDateRange(weekDates)}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabsContainer}
        >
          {weekDates.map((date, index) => {
            const isSelected = index === selectedDayIndex;
            const isToday = isSameDay(date, today);
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleDayPress(index)}
                style={[
                  styles.dayTab,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.card || theme.colors.surface,
                    borderColor: isToday && !isSelected
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayTabAbbr,
                    { color: isSelected ? '#FFFFFF' : theme.colors.text },
                  ]}
                >
                  {DAY_NAMES[index]}
                </Text>
                <Text
                  style={[
                    styles.dayTabDate,
                    { color: isSelected ? '#FFFFFFcc' : theme.colors.textSecondary || theme.colors.text + '99' },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.selectedDaySection}
        >
          <Text style={[styles.selectedDayTitle, { color: theme.colors.text }]}>
            {DAY_FULL_NAMES[selectedDayIndex]}
          </Text>
          <Text style={[styles.taskCount, { color: theme.colors.textSecondary || theme.colors.text + '99' }]}>
            {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''} planned
          </Text>
        </Animated.View>

        {selectedDayTasks.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassCard>
              <View style={[styles.emptyState, { borderColor: theme.colors.primary + '44' }]}>
                <Ionicons name="add-circle-outline" size={48} color={theme.colors.primary + '66'} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary || theme.colors.text + '99' }]}>
                  Plan your day
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                  }}
                  style={[styles.emptyAddButton, { backgroundColor: theme.colors.primary + '22' }]}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        ) : (
          selectedDayTasks.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={FadeInRight.delay(index * 50).springify()}
            >
              <GlassCard>
                <View style={styles.taskItem}>
                  <TouchableOpacity
                    onPress={() => handleToggleTask(task.id)}
                    style={styles.checkboxArea}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: PRIORITY_COLORS[task.priority] || theme.colors.primary,
                          backgroundColor: task.completed
                            ? PRIORITY_COLORS[task.priority] || theme.colors.primary
                            : 'transparent',
                        },
                      ]}
                    >
                      {task.completed && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.taskContent,
                      { borderLeftColor: PRIORITY_COLORS[task.priority] || theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: task.completed
                            ? (theme.colors.textSecondary || theme.colors.text + '99')
                            : theme.colors.text,
                          textDecorationLine: task.completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: PRIORITY_COLORS[task.priority] || theme.colors.primary },
                        ]}
                      />
                      <Text style={[styles.priorityLabel, { color: theme.colors.textSecondary || theme.colors.text + '99' }]}>
                        {task.priority}
                      </Text>
                      <Ionicons
                        name={CATEGORY_ICONS[task.category] || 'ellipse-outline'}
                        size={14}
                        color={theme.colors.textSecondary || theme.colors.text + '99'}
                        style={styles.categoryIcon}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveFromDay(task.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={theme.colors.textSecondary || theme.colors.text + '99'} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>
          ))
        )}

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <GlassCard>
            <View style={styles.quickAddSection}>
              <Text style={[styles.quickAddLabel, { color: theme.colors.text }]}>
                Add task for this day
              </Text>
              <View style={styles.quickAddRow}>
                <TextInput
                  style={[
                    styles.quickAddInput,
                    {
                      backgroundColor: (theme.colors.background === '#1a1a2e' || theme.colors.background === '#0d1117' || theme.colors.dark)
                        ? '#ffffff0d'
                        : '#0000000a',
                      color: theme.colors.text,
                      borderColor: theme.colors.primary + '33',
                    },
                  ]}
                  placeholder="Task title..."
                  placeholderTextColor={(theme.colors.textSecondary || theme.colors.text) + '66'}
                  value={quickAddText}
                  onChangeText={setQuickAddText}
                  onSubmitEditing={handleQuickAdd}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={handleQuickAdd}
                  style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.prioritySelector}>
                {PRIORITY_LABELS.map((label) => {
                  const key = label.toLowerCase();
                  const isActive = quickAddPriority === key;
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        setQuickAddPriority(key);
                      }}
                      style={[
                        styles.priorityOption,
                        {
                          backgroundColor: isActive
                            ? PRIORITY_COLORS[key] + '22'
                            : 'transparent',
                          borderColor: isActive
                            ? PRIORITY_COLORS[key]
                            : theme.colors.primary + '33',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.priorityOptionDot,
                          { backgroundColor: PRIORITY_COLORS[key] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.priorityOptionText,
                          {
                            color: isActive ? PRIORITY_COLORS[key] : (theme.colors.textSecondary || theme.colors.text + '99'),
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <GlassCard>
            <View style={styles.weekOverviewSection}>
              <View style={styles.overviewHeader}>
                <Text style={[styles.overviewTitle, { color: theme.colors.text }]}>
                  Week Overview
                </Text>
                <Text style={[styles.overviewTotal, { color: theme.colors.primary }]}>
                  {totalWeekTasks} total
                </Text>
              </View>

              <View style={styles.overviewGrid}>
                {weekOverview.map((day, dayIndex) => {
                  const maxDots = Math.min(day.count, 8);
                  return (
                    <View key={dayIndex} style={styles.overviewColumn}>
                      <View style={styles.dotsContainer}>
                        {Array.from({ length: maxDots }).map((_, dotIndex) => {
                          const task = day.tasks[dotIndex];
                          const dotColor = task
                            ? PRIORITY_COLORS[task.priority] || theme.colors.primary
                            : (theme.colors.textSecondary || theme.colors.text) + '22';
                          return (
                            <Animated.View
                              key={dotIndex}
                              entering={FadeInDown.delay(dayIndex * 30 + dotIndex * 40).springify()}
                              style={[styles.dot, { backgroundColor: dotColor }]}
                            />
                          );
                        })}
                      </View>
                      <Text
                        style={[
                          styles.overviewDayLabel,
                          {
                            color: isSameDay(day.date, today)
                              ? theme.colors.primary
                              : (theme.colors.textSecondary || theme.colors.text + '99'),
                            fontWeight: isSameDay(day.date, today) ? '700' : '400',
                          },
                        ]}
                      >
                        {DAY_NAMES[dayIndex]}
                      </Text>
                      <Text
                        style={[
                          styles.overviewDayCount,
                          { color: theme.colors.textSecondary || theme.colors.text + '99' },
                        ]}
                      >
                        {day.count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <View style={{ height: 40 }} />
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  dateRange: {
    fontSize: 14,
    marginTop: 4,
  },
  dayTabsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  dayTab: {
    width: 40,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayTabAbbr: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayTabDate: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  selectedDaySection: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  selectedDayTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  taskCount: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyState: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
  },
  emptyAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxArea: {
    padding: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginLeft: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  categoryIcon: {
    marginLeft: 4,
  },
  removeButton: {
    padding: 8,
  },
  quickAddSection: {
    gap: 12,
  },
  quickAddLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAddInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  addButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  priorityOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  weekOverviewSection: {
    gap: 12,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  overviewTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewColumn: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 48 - 12 * 6) / 7,
  },
  dotsContainer: {
    alignItems: 'center',
    gap: 4,
    height: 80,
    justifyContent: 'flex-end',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  overviewDayLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  overviewDayCount: {
    fontSize: 11,
    marginTop: 2,
  },
});
