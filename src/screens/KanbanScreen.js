import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Platform, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInRight, FadeOutLeft, FadeOutRight,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  Layout, ZoomIn, BounceIn,
} from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 3;
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const COLUMNS = [
  { key: 'todo', label: 'To Do', icon: 'ellipse-outline', color: '#C9A84C' },
  { key: 'inProgress', label: 'In Progress', icon: 'time', color: '#5B8AC2' },
  { key: 'done', label: 'Done', icon: 'checkmark-circle', color: '#5B9A6F' },
];

const CATEGORIES = [
  { label: 'War', value: 'work', icon: 'briefcase' },
  { label: 'Self', value: 'personal', icon: 'person' },
  { label: 'Health', value: 'health', icon: 'heart' },
  { label: 'Learn', value: 'education', icon: 'book' },
  { label: 'Gold', value: 'finance', icon: 'diamond' },
  { label: 'Other', value: 'other', icon: 'bookmark' },
];

function KanbanCard({ todo, onMoveRight, onMoveLeft, onToggle, tags }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const categoryInfo = CATEGORIES.find(c => c.value === todo.category);
  const todoTags = (todo.tagIds || []).map(id => tags.find(t => t.id === id)).filter(Boolean);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(16)}
      exiting={FadeOutLeft.duration(200)}
      layout={Layout.springify().damping(18)}
      style={[styles.kanbanCard, { backgroundColor: theme.colors.surface, borderLeftColor: todo.completed ? theme.colors.success : theme.colors.primary }, s]}
    >
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(todo.id); }}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        activeOpacity={1}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>{todo.title}</Text>
          {todo.priority === 'high' && <Ionicons name="flash" size={12} color="#C25B4E" />}
        </View>

        {todoTags.length > 0 && (
          <View style={styles.tagsRow}>
            {todoTags.map(tag => (
              <View key={tag.id} style={[styles.tagDot, { backgroundColor: tag.color }]} />
            ))}
          </View>
        )}

        {categoryInfo && (
          <View style={styles.cardMeta}>
            <Ionicons name={categoryInfo.icon} size={10} color={theme.colors.textMuted} />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{categoryInfo.label}</Text>
          </View>
        )}

        {todo.subtasks && todo.subtasks.length > 0 && (
          <Text style={[styles.subtaskCount, { color: theme.colors.textMuted }]}>
            {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length} subtasks
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.cardActions}>
        {todo.status !== 'todo' && (
          <TouchableOpacity style={[styles.moveBtn, { backgroundColor: theme.colors.surfaceLight }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMoveLeft(todo.id); }}>
            <Ionicons name="arrow-back" size={12} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
        {todo.status !== 'done' && (
          <TouchableOpacity style={[styles.moveBtn, { backgroundColor: theme.colors.primary + '15' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMoveRight(todo.id); }}>
            <Ionicons name="arrow-forward" size={12} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function KanbanScreen() {
  const { theme } = useTheme();
  const { state, setTodoStatus, toggleTodo } = useApp();

  const getTodosForColumn = (colKey) => {
    return state.todos
      .filter(t => (t.status || 'todo') === colKey)
      .sort((a, b) => {
        const po = { high: 0, medium: 1, low: 2 };
        return (po[a.priority] || 3) - (po[b.priority] || 3);
      });
  };

  const moveRight = (todoId) => {
    const todo = state.todos.find(t => t.id === todoId);
    if (!todo) return;
    const order = ['todo', 'inProgress', 'done'];
    const currentIdx = order.indexOf(todo.status || 'todo');
    if (currentIdx < order.length - 1) {
      setTodoStatus(todoId, order[currentIdx + 1]);
    }
  };

  const moveLeft = (todoId) => {
    const todo = state.todos.find(t => t.id === todoId);
    if (!todo) return;
    const order = ['todo', 'inProgress', 'done'];
    const currentIdx = order.indexOf(todo.status || 'todo');
    if (currentIdx > 0) {
      setTodoStatus(todoId, order[currentIdx - 1]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Board</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{state.todos.length} quests</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardContent}>
        {COLUMNS.map((col, i) => {
          const todos = getTodosForColumn(col.key);
          return (
            <Animated.View key={col.key} entering={FadeIn.duration(400).delay(i * 100).springify().damping(16)} style={[styles.column, { width: COLUMN_WIDTH }]}>
              <View style={[styles.columnHeader, { borderBottomColor: col.color + '30' }]}>
                <View style={[styles.columnDot, { backgroundColor: col.color }]} />
                <Text style={[styles.columnTitle, { color: theme.colors.text }]}>{col.label}</Text>
                <View style={[styles.columnCount, { backgroundColor: col.color + '15' }]}>
                  <Text style={[styles.columnCountText, { color: col.color }]}>{todos.length}</Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.columnContent}>
                {todos.length === 0 ? (
                  <View style={styles.emptyColumn}>
                    <Ionicons name="ellipse-outline" size={20} color={theme.colors.textMuted} />
                    <Text style={[styles.emptyColumnText, { color: theme.colors.textMuted }]}>No quests</Text>
                  </View>
                ) : (
                  todos.map(todo => (
                    <KanbanCard
                      key={todo.id}
                      todo={todo}
                      onMoveRight={moveRight}
                      onMoveLeft={moveLeft}
                      onToggle={toggleTodo}
                      tags={state.tags}
                    />
                  ))
                )}
              </ScrollView>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  subtitle: { fontSize: 13 },

  boardContent: { paddingHorizontal: 18, paddingBottom: 20 },

  column: { marginRight: 12 },
  columnHeader: {
    flexDirection: 'row', alignItems: 'center', paddingBottom: 10,
    borderBottomWidth: 1, marginBottom: 10,
  },
  columnDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  columnTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  columnCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  columnCountText: { fontSize: 12, fontWeight: '700' },

  columnContent: { paddingBottom: 40 },

  kanbanCard: {
    borderRadius: 10, padding: 12, marginBottom: 8,
    borderLeftWidth: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, fontWeight: '600', flex: 1, marginRight: 4 },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 10, marginLeft: 4 },
  subtaskCount: { fontSize: 10, marginTop: 4 },

  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 8 },
  moveBtn: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },

  emptyColumn: { alignItems: 'center', paddingTop: 20 },
  emptyColumnText: { fontSize: 11, marginTop: 4 },
});
