import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { formatDate, getTimeRemaining, getDaysRemaining } from '../utils/dateHelpers';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeOutLeft, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, Easing, interpolate,
  Layout, ZoomIn,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const COLORS = ['#C9A84C', '#C25B4E', '#5B9A6F', '#7A6B8A', '#5B8AC2'];
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function AnimatedNumber({ value, theme, fontSize = 32 }) {
  return (
    <Text style={{ fontSize, fontWeight: '300', fontFamily: serifFont, letterSpacing: -1, color: theme.colors.text }}>
      {value.toString().padStart(2, '0')}
    </Text>
  );
}

function CountdownCard({ countdown, onDelete, onEdit, index }) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(countdown.targetDate));
  const [daysRemaining, setDaysRemaining] = useState(getDaysRemaining(countdown.targetDate));
  const color = countdown.color || theme.colors.primary;
  const isPast = new Date(countdown.targetDate) < new Date();
  const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(countdown.targetDate));
      setDaysRemaining(getDaysRemaining(countdown.targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const renderRightActions = () => (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.swipeAction, { backgroundColor: theme.colors.error }]}>
      <Ionicons name="trash" size={20} color="#FFF" />
      <Text style={styles.swipeText}>Delete</Text>
    </Animated.View>
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60).springify().damping(16).stiffness(110)}
      exiting={FadeOutLeft.duration(300)}
      layout={Layout.springify().damping(18)}
    >
      <Swipeable renderRightActions={renderRightActions} onSwipeableRightOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onDelete(countdown.id);
      }} friction={2} rightThreshold={80}>
        <TouchableOpacity
          onLongPress={() => onEdit(countdown)}
          onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
          activeOpacity={1}
        >
          <Animated.View style={[styles.countdownCard, { backgroundColor: theme.colors.surface, borderLeftColor: color }, s]}>
            <View style={styles.countdownHeader}>
              <Text style={[styles.countdownTitle, { color: theme.colors.text }]}>{countdown.title}</Text>
              {isPast ? (
                <Text style={[styles.statusBadge, { color: theme.colors.textMuted }]}>Passed</Text>
              ) : isUrgent ? (
                <Text style={[styles.statusBadge, { color }]}>{daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`}</Text>
              ) : null}
            </View>

            {isPast ? (
              <Text style={[styles.pastText, { color: theme.colors.textMuted }]}>{formatDate(countdown.targetDate)}</Text>
            ) : (
              <View style={styles.countdownNumbers}>
                {[{ v: timeLeft.days, l: 'Days' }, { v: timeLeft.hours, l: 'Hrs' }, { v: timeLeft.minutes, l: 'Min' }, { v: timeLeft.seconds, l: 'Sec' }].map((item, i) => (
                  <React.Fragment key={item.l}>
                    {i > 0 && <Text style={[styles.numberSep, { color: theme.colors.textMuted }]}>:</Text>}
                    <View style={styles.numberBlock}>
                      <AnimatedNumber value={item.v} theme={theme} />
                      <Text style={[styles.numberLabel, { color: theme.colors.textMuted }]}>{item.l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
}

function AddCountdownModal({ visible, onClose, onSave, initialData }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const isEditing = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) { setTitle(initialData.title || ''); setTargetDate(initialData.targetDate ? initialData.targetDate.split('T')[0] : ''); setColor(initialData.color || COLORS[0]); }
      else { setTitle(''); setTargetDate(''); setColor(COLORS[Math.floor(Math.random() * COLORS.length)]); }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Error', 'Enter an event name'); return; }
    if (!targetDate) { Alert.alert('Error', 'Enter a date'); return; }
    const data = { title: title.trim(), targetDate: new Date(targetDate).toISOString(), color, icon: 'hourglass' };
    if (isEditing) data.id = initialData.id;
    onSave(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View entering={FadeIn.duration(200)} style={styles.modalOverlay}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120)} style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Event name" placeholderTextColor={theme.colors.textMuted} value={title} onChangeText={setTitle} autoFocus />
          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Target Date</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} value={targetDate} onChangeText={setTargetDate} />
          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorBtn, { backgroundColor: c }, color === c && { borderWidth: 2, borderColor: theme.colors.text }]} onPress={() => setColor(c)} />
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={[styles.saveBtnText, { color }]}>{isEditing ? 'Update' : 'Create'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function CountdownScreen() {
  const { theme } = useTheme();
  const { state, addCountdown, updateCountdown, deleteCountdown } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState(null);

  const sortedCountdowns = [...state.countdowns].sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Countdowns</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{sortedCountdowns.length} events</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {sortedCountdowns.length === 0 ? (
          <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.emptyState}>
            <Ionicons name="hourglass-outline" size={40} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No countdowns</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>Track important dates</Text>
          </Animated.View>
        ) : (
          sortedCountdowns.map((cd, i) => (
            <CountdownCard key={cd.id} countdown={cd} index={i} onDelete={deleteCountdown} onEdit={(d) => { setEditingCountdown(d); setModalVisible(true); }} />
          ))
        )}
      </ScrollView>

      <Animated.View entering={ZoomIn.duration(400).delay(200).springify().damping(10)}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditingCountdown(null); setModalVisible(true); }} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      <AddCountdownModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditingCountdown(null); }} onSave={(d) => { d.id ? updateCountdown(d) : addCountdown(d); setEditingCountdown(null); }} initialData={editingCountdown} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  subtitle: { fontSize: 13 },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },

  countdownCard: {
    borderRadius: 10, padding: 18, marginBottom: 10,
    borderLeftWidth: 3,
  },
  countdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countdownTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  statusBadge: { fontSize: 12, fontWeight: '600' },

  countdownNumbers: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start' },
  numberBlock: { alignItems: 'center', width: 56 },
  numberLabel: { fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  numberSep: { fontSize: 28, fontWeight: '200', marginTop: 4, marginHorizontal: 2 },

  pastText: { fontSize: 13, textAlign: 'center' },

  swipeAction: {
    width: 80, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, marginBottom: 10, marginLeft: 4,
  },
  swipeText: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 30, right: 24,
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingBottom: 40 },
  modalHandle: { width: 32, height: 3, borderRadius: 1.5, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '700', fontFamily: serifFont, marginBottom: 20 },

  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, marginBottom: 12, borderWidth: 1 },
  modalLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  colorRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  colorBtn: { width: 30, height: 30, borderRadius: 15 },

  saveBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  saveBtnText: { fontSize: 15, fontWeight: '600' },
});
