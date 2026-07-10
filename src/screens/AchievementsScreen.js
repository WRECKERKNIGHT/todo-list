import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeInRight,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function AchievementCard({ achievement, index, theme }) {
  const isUnlocked = achievement.unlocked;
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 50).springify().damping(16).stiffness(110)}
      style={s}
    >
      <View style={[styles.achievementCard, { backgroundColor: isUnlocked ? theme.colors.surface : theme.colors.surfaceLight, borderLeftColor: isUnlocked ? theme.colors.primary : theme.colors.border }]}>
        <View style={[styles.achievementIconWrap, { backgroundColor: isUnlocked ? theme.colors.primary + '12' : theme.colors.surfaceHighlight }]}>
          <Ionicons name={achievement.icon} size={22} color={isUnlocked ? theme.colors.primary : theme.colors.textMuted} />
          {isUnlocked && (
            <View style={[styles.unlockedBadge, { backgroundColor: theme.colors.success, borderColor: isUnlocked ? theme.colors.surface : theme.colors.surfaceLight }]}>
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
      </View>
    </Animated.View>
  );
}

function ProgressBar({ count, total, theme }) {
  const fillSv = useSharedValue(0);

  React.useEffect(() => {
    fillSv.value = withSpring(total > 0 ? (count / total) * 100 : 0, { damping: 18, stiffness: 60 });
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillSv.value.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
  }));

  return (
    <Animated.View entering={FadeIn.duration(500).delay(200).springify().damping(16)} style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceLight }]}>
        <Animated.View style={[styles.progressBar, { backgroundColor: theme.colors.primary }, fillStyle]} />
      </View>
      <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>{total - count} more to unlock all</Text>
    </Animated.View>
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

        <ProgressBar count={unlockedCount} total={totalCount} theme={theme} />

        {unlockedCount > 0 && (
          <>
            <Animated.View entering={FadeIn.duration(400).delay(250)}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Unlocked</Text>
            </Animated.View>
            {state.achievements.filter(a => a.unlocked).map((achievement, i) => (
              <AchievementCard key={achievement.id} achievement={achievement} index={i} theme={theme} />
            ))}
          </>
        )}

        <Animated.View entering={FadeIn.duration(400).delay(300)}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Locked</Text>
        </Animated.View>
        {state.achievements.filter(a => !a.unlocked).map((achievement, i) => (
          <AchievementCard key={achievement.id} achievement={achievement} index={i} theme={theme} />
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
