import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView } from '../components/MedievalUI';

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function AchievementCard({ achievement, index }) {
  const { theme } = useTheme();
  const isUnlocked = achievement.unlocked;

  return (
    <FadeInView delay={index * 60} style={[styles.achievementCard, { backgroundColor: isUnlocked ? theme.colors.surface : theme.colors.surfaceLight, borderLeftColor: isUnlocked ? theme.colors.primary : theme.colors.border }]}>
      <View style={[styles.achievementIconWrap, { backgroundColor: isUnlocked ? theme.colors.primary + '12' : theme.colors.surfaceHighlight }]}>
        <Ionicons name={achievement.icon} size={22} color={isUnlocked ? theme.colors.primary : theme.colors.textMuted} />
        {isUnlocked && (
          <View style={[styles.unlockedBadge, { backgroundColor: theme.colors.success }]}>
            <Ionicons name="checkmark" size={8} color="#FFF" />
          </View>
        )}
      </View>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, { color: isUnlocked ? theme.colors.text : theme.colors.textMuted }]}>{achievement.title}</Text>
        <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary }]}>{achievement.desc}</Text>
        {isUnlocked && achievement.unlockedAt && (
          <Text style={[styles.unlockedDate, { color: theme.colors.primary }]}>
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </FadeInView>
  );
}

export default function AchievementsScreen() {
  const { theme } = useTheme();
  const { state } = useApp();
  const unlockedCount = state.achievements.filter(a => a.unlocked).length;
  const totalCount = state.achievements.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Trophies</Text>
          <View style={[styles.countBadge, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="trophy-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.countText, { color: theme.colors.primary }]}>{unlockedCount}/{totalCount}</Text>
          </View>
        </View>

        <FadeInView style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceLight }]}>
            <View style={[styles.progressBar, { width: `${(unlockedCount / totalCount) * 100}%`, backgroundColor: theme.colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>{totalCount - unlockedCount} more to unlock all</Text>
        </FadeInView>

        {unlockedCount > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Unlocked</Text>
            {state.achievements.filter(a => a.unlocked).map((achievement, i) => (
              <AchievementCard key={achievement.id} achievement={achievement} index={i} />
            ))}
          </>
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Locked</Text>
        {state.achievements.filter(a => !a.unlocked).map((achievement, i) => (
          <AchievementCard key={achievement.id} achievement={achievement} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 30, paddingTop: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  countBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  countText: { fontSize: 14, fontWeight: '600', marginLeft: 5 },

  progressCard: { marginHorizontal: 24, marginBottom: 20, padding: 16, borderRadius: 12 },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 11, textAlign: 'right' },

  sectionTitle: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 10, marginTop: 8,
  },

  achievementCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 8, padding: 14, borderRadius: 10,
    borderLeftWidth: 3,
  },
  achievementIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  unlockedBadge: {
    position: 'absolute', bottom: -3, right: -3,
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
  },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: 14, fontWeight: '600' },
  achievementDesc: { fontSize: 12, marginTop: 2 },
  unlockedDate: { fontSize: 10, marginTop: 3, fontWeight: '600' },
});
