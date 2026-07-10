import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { getMonthDays, getMonthName, formatDate } from '../utils/dateHelpers';
import { FadeInView } from '../components/MedievalUI';

const { width } = Dimensions.get('window');
const DAY_SIZE = (width - 48) / 7;
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function CalendarDay({ day, isToday, hasEvents, isSelected, onPress, disabled }) {
  const { theme } = useTheme();
  if (!day) return <View style={{ width: DAY_SIZE, height: DAY_SIZE }} />;

  return (
    <TouchableOpacity onPress={() => onPress(day)} style={[styles.dayCell, isSelected && { backgroundColor: theme.colors.primary }, isToday && !isSelected && { borderColor: theme.colors.primary + '40', borderWidth: 1, borderRadius: DAY_SIZE / 2 }]} activeOpacity={0.6}>
      <Text style={[styles.dayText, { color: theme.colors.text }, isToday && !isSelected && { color: theme.colors.primary, fontWeight: '700' }, isSelected && { color: '#FFF', fontWeight: '600' }, disabled && { color: 'transparent' }]}>{day}</Text>
      {hasEvents && !isSelected && <View style={[styles.dayDot, { backgroundColor: theme.colors.primary }]} />}
    </TouchableOpacity>
  );
}

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { state, getTodosForDate, toggleTodo } = useApp();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const selectedDayTodos = useMemo(() => getTodosForDate(selectedDate), [selectedDate, state.todos]);

  const changeMonth = (direction) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      let m = currentMonth + direction, y = currentYear;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      setCurrentMonth(m);
      setCurrentYear(y);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const todayStr = today.toISOString().split('T')[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Chronicle</Text>
        <TouchableOpacity style={[styles.todayBtn, { backgroundColor: theme.colors.surface }]} onPress={() => { setSelectedDate(todayStr); setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}>
          <Text style={[styles.todayBtnText, { color: theme.colors.primary }]}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.monthNav, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        <Animated.Text style={[styles.monthTitle, { opacity: fadeAnim, color: theme.colors.text }]}>
          {getMonthName(currentMonth)} {currentYear}
        </Animated.Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={[styles.weekdayText, { color: theme.colors.textMuted }]}>{d}</Text>
        ))}
      </View>

      <Animated.View style={[styles.calendarGrid, { opacity: fadeAnim }]}>
        {days.map((dayObj, i) => {
          if (!dayObj) return <CalendarDay key={`empty-${i}`} disabled />;
          return (
            <CalendarDay
              key={dayObj.date}
              day={dayObj.day}
              isToday={dayObj.isToday}
              isSelected={dayObj.date === selectedDate}
              hasEvents={getTodosForDate(dayObj.date).length > 0}
              onPress={(d) => setSelectedDate(dayObj.date)}
            />
          );
        })}
      </Animated.View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.eventsHeader}>
        <Text style={[styles.eventsTitle, { color: theme.colors.text }]}>{formatDate(selectedDate)}</Text>
        <Text style={[styles.eventsCount, { color: theme.colors.textMuted }]}>{selectedDayTodos.length} quest{selectedDayTodos.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.eventsList} contentContainerStyle={{ paddingBottom: 30 }}>
        {selectedDayTodos.length === 0 ? (
          <View style={styles.emptyEvents}>
            <Ionicons name="calendar-outline" size={30} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No quests this day</Text>
          </View>
        ) : (
          selectedDayTodos.map(todo => (
            <TouchableOpacity key={todo.id} onPress={() => toggleTodo(todo.id)} activeOpacity={0.7}>
              <View style={[styles.eventItem, { backgroundColor: theme.colors.surface, borderLeftColor: todo.completed ? theme.colors.success : theme.colors.primary }]}>
                <Ionicons name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={todo.completed ? theme.colors.success : theme.colors.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.eventTitle, { color: theme.colors.text }, todo.completed && { textDecorationLine: 'line-through', color: theme.colors.textMuted }]} numberOfLines={1}>{todo.title}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  todayBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  todayBtnText: { fontSize: 12, fontWeight: '600' },

  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 16, padding: 6, borderRadius: 10,
  },
  navBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  monthTitle: { fontSize: 16, fontWeight: '600' },

  weekdayRow: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 4 },
  weekdayText: { width: DAY_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24 },
  dayCell: { width: DAY_SIZE, height: DAY_SIZE, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 14, fontWeight: '500' },
  dayDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },

  divider: { height: 1, marginHorizontal: 24, marginVertical: 12 },

  eventsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 8,
  },
  eventsTitle: { fontSize: 15, fontWeight: '600' },
  eventsCount: { fontSize: 12 },

  eventsList: { paddingHorizontal: 24, flex: 1 },
  eventItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 10, marginBottom: 6,
    borderLeftWidth: 3,
  },
  eventTitle: { fontSize: 14, fontWeight: '500', flex: 1 },

  emptyEvents: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 13, marginTop: 8 },
});
