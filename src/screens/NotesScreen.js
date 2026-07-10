import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOutLeft,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
  BounceIn, Layout, ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const MOODS = [
  { emoji: '😄', label: 'Great', value: 5, color: '#5B9A6F' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#8BC34A' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#C9A84C' },
  { emoji: '😔', label: 'Low', value: 2, color: '#C27A5B' },
  { emoji: '😢', label: 'Bad', value: 1, color: '#C25B4E' },
];

function NoteCard({ note, onEdit, onDelete, index }) {
  const { theme } = useTheme();
  const moodInfo = MOODS.find(m => m.value === note.mood);
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 50).springify().damping(16).stiffness(110)}
      exiting={FadeOutLeft.duration(300)}
      layout={Layout.springify().damping(18)}
      style={s}
    >
      <TouchableOpacity
        onPress={() => onEdit(note)}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        activeOpacity={1}
      >
        <View style={[styles.noteCard, { backgroundColor: theme.colors.surface, borderLeftColor: moodInfo?.color || theme.colors.primary }]}>
          <View style={styles.noteHeader}>
            {moodInfo && <Text style={styles.noteMood}>{moodInfo.emoji}</Text>}
            <Text style={[styles.noteTitle, { color: theme.colors.text }]} numberOfLines={1}>{note.title}</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onDelete(note.id); }}>
              <Ionicons name="trash-outline" size={14} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.notePreview, { color: theme.colors.textSecondary }]} numberOfLines={2}>{note.content}</Text>
          <View style={styles.noteFooter}>
            <Text style={[styles.noteDate, { color: theme.colors.textMuted }]}>{new Date(note.createdAt).toLocaleDateString()}</Text>
            {note.tags && note.tags.length > 0 && (
              <View style={styles.tagRow}>
                {note.tags.slice(0, 2).map(tag => (
                  <View key={tag} style={[styles.tag, { backgroundColor: theme.colors.primary + '12' }]}>
                    <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AddNoteModal({ visible, onClose, onSave, initialData }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const isEditing = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) { setTitle(initialData.title || ''); setContent(initialData.content || ''); setMood(initialData.mood || null); setTags(initialData.tags || []); }
      else { setTitle(''); setContent(''); setMood(null); setTags([]); }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) { Alert.alert('Error', 'Enter a title or content'); return; }
    const data = { title: title.trim() || 'Untitled', content: content.trim(), mood, tags };
    if (isEditing) data.id = initialData.id;
    onSave(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const addTag = () => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(''); } };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View entering={FadeIn.duration(200)} style={styles.modalOverlay}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120)} style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{isEditing ? 'Edit Entry' : 'New Entry'}</Text>

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Mood</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => {
              const isActive = mood === m.value;
              const btnScale = useSharedValue(1);
              const btnS = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
              return (
                <Animated.View key={m.value} style={btnS}>
                  <TouchableOpacity
                    style={[styles.moodBtn, { backgroundColor: theme.colors.surfaceLight }, isActive && { backgroundColor: m.color + '15', borderColor: m.color }]}
                    onPress={() => { btnScale.value = withSequence(withSpring(0.85, { damping: 10, stiffness: 400 }), withSpring(1, { damping: 10, stiffness: 400 })); setMood(m.value); }}
                    activeOpacity={1}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, { color: theme.colors.textMuted }, isActive && { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Title" placeholderTextColor={theme.colors.textMuted} value={title} onChangeText={setTitle} autoFocus />
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Write your thoughts..." placeholderTextColor={theme.colors.textMuted} value={content} onChangeText={setContent} multiline textAlignVertical="top" />

          <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Tags</Text>
          <View style={styles.tagInputRow}>
            <TextInput style={[styles.tagInput, { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text, borderColor: theme.colors.border }]} placeholder="Add tag..." placeholderTextColor={theme.colors.textMuted} value={tagInput} onChangeText={setTagInput} onSubmitEditing={addTag} />
            <TouchableOpacity style={[styles.tagAddBtn, { backgroundColor: theme.colors.primary }]} onPress={addTag}>
              <Ionicons name="add" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsList}>
              {tags.map(tag => (
                <Animated.View key={tag} entering={BounceIn.duration(200)}>
                  <TouchableOpacity style={[styles.tagChip, { backgroundColor: theme.colors.primary + '12' }]} onPress={() => setTags(tags.filter(t => t !== tag))}>
                    <Text style={[styles.tagChipText, { color: theme.colors.primary }]}>{tag}</Text>
                    <Ionicons name="close-circle" size={12} color={theme.colors.primary} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.saveBtn, { borderColor: theme.colors.primary + '30' }]} onPress={handleSave}>
            <Text style={[styles.saveBtnText, { color: theme.colors.primary }]}>{isEditing ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function NotesScreen() {
  const { theme } = useTheme();
  const { state, addNote, updateNote, deleteNote } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const todayMood = state.notes.find(n => new Date(n.createdAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0])?.mood;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Journal</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {state.notes.length} entries · {todayMood ? MOODS.find(m => m.value === todayMood)?.emoji : '—'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {state.notes.length === 0 ? (
          <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.emptyState}>
            <Ionicons name="book-outline" size={40} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No entries</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>Start writing</Text>
          </Animated.View>
        ) : (
          state.notes.map((note, i) => (
            <NoteCard key={note.id} note={note} index={i} onEdit={(n) => { setEditingNote(n); setModalVisible(true); }} onDelete={deleteNote} />
          ))
        )}
      </ScrollView>

      <Animated.View entering={ZoomIn.duration(400).delay(200).springify().damping(10)}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.secondary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditingNote(null); setModalVisible(true); }} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      <AddNoteModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditingNote(null); }} onSave={(d) => { d.id ? updateNote(d) : addNote(d); setEditingNote(null); }} initialData={editingNote} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  subtitle: { fontSize: 13, marginTop: 4 },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },

  noteCard: {
    borderRadius: 10, padding: 14, marginBottom: 8,
    borderLeftWidth: 3,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  noteMood: { fontSize: 16, marginRight: 6 },
  noteTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  notePreview: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteDate: { fontSize: 10 },
  tagRow: { flexDirection: 'row' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  tagText: { fontSize: 9, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 30, right: 24,
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHandle: { width: 32, height: 3, borderRadius: 1.5, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '700', fontFamily: serifFont, marginBottom: 16 },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  moodBtn: { alignItems: 'center', padding: 8, borderRadius: 10, width: (width - 100) / 5, borderWidth: 1, borderColor: 'transparent' },
  moodEmoji: { fontSize: 20, marginBottom: 2 },
  moodLabel: { fontSize: 9, fontWeight: '600' },

  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, marginBottom: 12, borderWidth: 1 },
  textArea: { minHeight: 100 },
  modalLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  tagInputRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  tagInput: { flex: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, borderWidth: 1 },
  tagAddBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 6 },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagChipText: { fontSize: 11, fontWeight: '600', marginRight: 3 },

  saveBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 16, alignItems: 'center', borderWidth: 1 },
  saveBtnText: { fontSize: 15, fontWeight: '600' },
});
