import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, ScrollView,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function GlobalSearch({ visible, onClose }) {
  const { theme } = useTheme();
  const { searchAll } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ todos: [], habits: [], notes: [], countdowns: [] });
  const slideAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      slideAnim.setValue(0);
      setQuery('');
      setResults({ todos: [], habits: [], notes: [], countdowns: [] });
    }
  }, [visible]);

  useEffect(() => {
    if (query.length >= 2) {
      setResults(searchAll(query));
    } else {
      setResults({ todos: [], habits: [], notes: [], countdowns: [] });
    }
  }, [query]);

  const totalResults = results.todos.length + results.habits.length + results.notes.length + results.countdowns.length;

  const ResultSection = ({ title, icon, data, color }) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.resultSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon} size={16} color={color} />
          <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          <Text style={[styles.sectionCount, { color: theme.colors.textMuted }]}>{data.length}</Text>
        </View>
        {data.map(item => (
          <View key={item.id} style={[styles.resultItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.resultTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.title || item.name}</Text>
            {item.description && (
              <Text style={[styles.resultDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={[styles.overlay, { backgroundColor: theme.colors.background + 'F0' }]}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
            { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] },
          ]}
        >
          <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={20} color={theme.colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search everything..."
              placeholderTextColor={theme.colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {query.length >= 2 && (
            <Text style={[styles.resultSummary, { color: theme.colors.textSecondary }]}>
              {totalResults} result{totalResults !== 1 ? 's' : ''} found
            </Text>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <ResultSection title="Quests" icon="scroll" data={results.todos} color={theme.colors.primary} />
            <ResultSection title="Rituals" icon="flame" data={results.habits} color={theme.colors.accent} />
            <ResultSection title="Journal" icon="book" data={results.notes} color={theme.colors.royal} />
            <ResultSection title="Countdowns" icon="hourglass" data={results.countdowns} color={theme.colors.gold} />

            {query.length >= 2 && totalResults === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color={theme.colors.textMuted + '40'} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No results found</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.colors.surface }]} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: theme.colors.textSecondary }]}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 50,
    marginLeft: 10,
  },
  resultSummary: {
    paddingHorizontal: 20,
    fontSize: 12,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
  },
  resultItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  closeBtn: {
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
