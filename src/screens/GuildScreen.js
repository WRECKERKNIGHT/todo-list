import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, getLevel } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn, BounceIn,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
  withTiming, withRepeat, Easing, interpolate, Layout,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const SIMULATED_GUILD = {
  name: 'The Iron Vanguard',
  emblem: 'shield',
  level: 7,
  xp: 4250,
  maxXp: 5000,
  members: [
    { id: '1', name: 'You', level: 8, xp: 3200, isPlayer: true, online: true },
    { id: '2', name: 'Sir_Galahad', level: 12, xp: 5800, online: true },
    { id: '3', name: 'Lady_Artemis', level: 10, xp: 4100, online: true },
    { id: '4', name: 'ShadowNinja', level: 9, xp: 3600, online: false },
    { id: '5', name: 'DragonSlayer', level: 11, xp: 5200, online: true },
    { id: '6', name: 'MoonWhisper', level: 7, xp: 2800, online: false },
  ],
  weeklyGoal: { title: 'Complete 50 Guild Quests', target: 50, progress: 32, reward: { xp: 200, coins: 100 } },
  guildChallenge: { title: 'Guild vs Guild: Productivity War', desc: 'Earn the most XP this week against the Shadow Legion', endsIn: '2d 14h', ourScore: 4250, theirScore: 3800 },
  announcements: [
    { id: '1', from: 'Sir_Galahad', text: 'Great work everyone! We moved up to rank 3!', time: '2h ago' },
    { id: '2', from: 'Lady_Artemis', text: 'Guild raid tonight at 8pm. Be ready!', time: '5h ago' },
  ],
};

const GUILD_RANKS = [
  { rank: 1, name: 'Shadow Legion', xp: 6200, color: '#8B3A3A' },
  { rank: 2, name: 'Crimson Blades', xp: 5100, color: '#C25B4E' },
  { rank: 3, name: 'The Iron Vanguard', xp: 4250, color: '#C9A84C', isPlayer: true },
  { rank: 4, name: 'Emerald Keep', xp: 3800, color: '#5B9A6F' },
  { rank: 5, name: 'Frost Guard', xp: 2900, color: '#5B8AC2' },
];

function GuildHeader({ guild, theme }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(guild.xp / guild.maxXp, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.guildHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary + '20' }]}>
      <View style={[styles.guildEmblem, { backgroundColor: theme.colors.primary + '15' }]}>
        <Ionicons name="shield" size={32} color={theme.colors.primary} />
      </View>
      <View style={styles.guildInfo}>
        <Text style={[styles.guildName, { color: theme.colors.text }]}>{guild.name}</Text>
        <Text style={[styles.guildLevel, { color: theme.colors.textMuted }]}>Guild Level {guild.level}</Text>
      </View>
      <View style={styles.guildXpWrap}>
        <Text style={[styles.guildXpText, { color: theme.colors.primary }]}>{guild.xp}/{guild.maxXp} XP</Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceLight }]}>
          <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: theme.colors.primary }]} />
        </View>
      </View>
    </Animated.View>
  );
}

function MemberCard({ member, index, theme }) {
  const level = getLevel(member.xp);
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(16)}
      style={[styles.memberCard, { backgroundColor: theme.colors.surface }, s]}
    >
      <View style={[styles.memberAvatar, { backgroundColor: member.isPlayer ? theme.colors.primary + '20' : theme.colors.surfaceLight }]}>
        <Ionicons name={member.isPlayer ? 'person' : 'skull'} size={18} color={member.isPlayer ? theme.colors.primary : theme.colors.textMuted} />
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={[styles.memberName, { color: member.isPlayer ? theme.colors.primary : theme.colors.text }]} numberOfLines={1}>
            {member.name}
          </Text>
          {member.online && <View style={[styles.onlineDot, { backgroundColor: theme.colors.success }]} />}
        </View>
        <Text style={[styles.memberLevel, { color: theme.colors.textMuted }]}>Lv.{level.level} · {member.xp} XP</Text>
      </View>
    </Animated.View>
  );
}

function GuildChallenge({ challenge, theme }) {
  const ourWidth = useSharedValue(0);
  const theirWidth = useSharedValue(0);
  const total = challenge.ourScore + challenge.theirScore;

  useEffect(() => {
    ourWidth.value = withTiming((challenge.ourScore / total) * 100, { duration: 1200, easing: Easing.out(Easing.cubic) });
    theirWidth.value = withTiming((challenge.theirScore / total) * 100, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, []);

  const ourStyle = useAnimatedStyle(() => ({ width: `${ourWidth.value}%` }));
  const theirStyle = useAnimatedStyle(() => ({ width: `${theirWidth.value}%` }));

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.challengeCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.challengeHeader}>
        <Ionicons name="flash" size={18} color={theme.colors.accent} />
        <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>{challenge.title}</Text>
      </View>
      <Text style={[styles.challengeDesc, { color: theme.colors.textSecondary }]}>{challenge.desc}</Text>

      <View style={styles.versusBar}>
        <View style={styles.versusSide}>
          <Text style={[styles.versusLabel, { color: theme.colors.primary }]}>Us</Text>
          <Text style={[styles.versusScore, { color: theme.colors.primary }]}>{challenge.ourScore.toLocaleString()}</Text>
        </View>
        <View style={styles.versusBarWrap}>
          <View style={[styles.versusTrack, { backgroundColor: theme.colors.surfaceLight }]}>
            <Animated.View style={[styles.versusFill, ourStyle, { backgroundColor: theme.colors.primary }]} />
          </View>
          <View style={[styles.versusTrack, { backgroundColor: theme.colors.surfaceLight, marginTop: 4 }]}>
            <Animated.View style={[styles.versusFill, theirStyle, { backgroundColor: theme.colors.error }]} />
          </View>
        </View>
        <View style={styles.versusSide}>
          <Text style={[styles.versusLabel, { color: theme.colors.error }]}>Them</Text>
          <Text style={[styles.versusScore, { color: theme.colors.error }]}>{challenge.theirScore.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={[styles.challengeEnds, { color: theme.colors.textMuted }]}>Ends in {challenge.endsIn}</Text>
    </Animated.View>
  );
}

function WeeklyGoal({ goal, theme }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(goal.progress / goal.target, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.goalCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.goalHeader}>
        <Ionicons name="flag" size={18} color={theme.colors.success} />
        <Text style={[styles.goalTitle, { color: theme.colors.text }]}>{goal.title}</Text>
      </View>
      <View style={styles.goalProgress}>
        <View style={[styles.goalBar, { backgroundColor: theme.colors.surfaceLight }]}>
          <Animated.View style={[styles.goalFill, progressStyle, { backgroundColor: theme.colors.success }]} />
        </View>
        <Text style={[styles.goalCount, { color: theme.colors.textMuted }]}>{goal.progress}/{goal.target}</Text>
      </View>
      <View style={styles.goalReward}>
        <Ionicons name="diamond" size={12} color={theme.colors.gold} />
        <Text style={[styles.goalRewardText, { color: theme.colors.gold }]}>{goal.reward.xp} XP · {goal.reward.coins} Coins</Text>
      </View>
    </Animated.View>
  );
}

function AnnouncementCard({ announcement, theme }) {
  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.announcementCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.announcementHeader}>
        <Ionicons name="chatbubble-ellipses" size={14} color={theme.colors.secondary} />
        <Text style={[styles.announcementFrom, { color: theme.colors.secondary }]}>{announcement.from}</Text>
        <Text style={[styles.announcementTime, { color: theme.colors.textMuted }]}>{announcement.time}</Text>
      </View>
      <Text style={[styles.announcementText, { color: theme.colors.textSecondary }]}>{announcement.text}</Text>
    </Animated.View>
  );
}

function LeaderboardCard({ ranks, theme }) {
  return (
    <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.leaderboardCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Guild Leaderboard</Text>
      {ranks.map((r, i) => (
        <View key={r.rank} style={[styles.rankRow, r.isPlayer && { backgroundColor: theme.colors.primary + '08', borderRadius: 8, padding: 4 }]}>
          <Text style={[styles.rankNumber, { color: r.rank <= 3 ? theme.colors.gold : theme.colors.textMuted }]}>
            {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}
          </Text>
          <Text style={[styles.rankName, { color: r.isPlayer ? theme.colors.primary : theme.colors.text }]} numberOfLines={1}>
            {r.name}
          </Text>
          <Text style={[styles.rankXp, { color: theme.colors.textMuted }]}>{r.xp.toLocaleString()} XP</Text>
        </View>
      ))}
    </Animated.View>
  );
}

export default function GuildScreen({ navigation }) {
  const { theme } = useTheme();
  const { state } = useApp();
  const guild = SIMULATED_GUILD;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Guild Hall</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <GuildHeader guild={guild} theme={theme} />

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Weekly Goal</Text>
        </Animated.View>
        <WeeklyGoal goal={guild.weeklyGoal} theme={theme} />

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Guild Challenge</Text>
        </Animated.View>
        <GuildChallenge challenge={guild.guildChallenge} theme={theme} />

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Members ({guild.members.length})</Text>
        </Animated.View>
        {guild.members.map((member, i) => (
          <MemberCard key={member.id} member={member} index={i} theme={theme} />
        ))}

        <LeaderboardCard ranks={GUILD_RANKS} theme={theme} />

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Announcements</Text>
        </Animated.View>
        {guild.announcements.map(a => (
          <AnnouncementCard key={a.id} announcement={a} theme={theme} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: serifFont },

  scrollContent: { paddingBottom: 40 },

  guildHeader: {
    marginHorizontal: 24, marginBottom: 16, padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center',
  },
  guildEmblem: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  guildInfo: { alignItems: 'center', marginBottom: 12 },
  guildName: { fontSize: 20, fontWeight: '700', fontFamily: serifFont },
  guildLevel: { fontSize: 12, marginTop: 2 },
  guildXpWrap: { width: '100%' },
  guildXpText: { fontSize: 12, fontWeight: '600', marginBottom: 6, textAlign: 'right' },
  progressBar: { height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },

  goalCard: { marginHorizontal: 24, marginBottom: 12, padding: 16, borderRadius: 14 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  goalTitle: { fontSize: 15, fontWeight: '700', fontFamily: serifFont, flex: 1 },
  goalProgress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalBar: { flex: 1, height: 8, borderRadius: 4 },
  goalFill: { height: 8, borderRadius: 4 },
  goalCount: { fontSize: 12, fontWeight: '600', minWidth: 50, textAlign: 'right' },
  goalReward: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  goalRewardText: { fontSize: 12, fontWeight: '600' },

  challengeCard: { marginHorizontal: 24, marginBottom: 12, padding: 16, borderRadius: 14 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  challengeTitle: { fontSize: 15, fontWeight: '700', fontFamily: serifFont, flex: 1 },
  challengeDesc: { fontSize: 12, marginBottom: 12 },
  versusBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  versusSide: { alignItems: 'center', minWidth: 40 },
  versusLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  versusScore: { fontSize: 13, fontWeight: '700' },
  versusBarWrap: { flex: 1 },
  versusTrack: { height: 8, borderRadius: 4 },
  versusFill: { height: 8, borderRadius: 4 },
  challengeEnds: { fontSize: 10, textAlign: 'center', marginTop: 8 },

  memberCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 6, padding: 12, borderRadius: 12,
  },
  memberAvatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 14, fontWeight: '600' },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  memberLevel: { fontSize: 11, marginTop: 2 },

  leaderboardCard: { marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 14 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  rankNumber: { fontSize: 14, width: 30, textAlign: 'center' },
  rankName: { flex: 1, fontSize: 14, fontWeight: '600' },
  rankXp: { fontSize: 12 },

  announcementCard: { marginHorizontal: 24, marginBottom: 8, padding: 14, borderRadius: 12 },
  announcementHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  announcementFrom: { fontSize: 12, fontWeight: '600', flex: 1 },
  announcementTime: { fontSize: 10 },
  announcementText: { fontSize: 13, lineHeight: 18 },

  sectionTitle: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 10, marginTop: 8,
  },
});
