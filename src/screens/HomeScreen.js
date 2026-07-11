import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  ZoomIn,
  BounceIn,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { OrnamentalDivider, BreathingGlow, GlassCard } from '../components/MedievalUI';

const { width, height } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const FEATURES = [
  { icon: 'scroll', title: 'Quests', desc: 'Task management', color: '#C9A84C', screen: 'Main' },
  { icon: 'flame', title: 'Habits', desc: 'Daily rituals', color: '#E74C3C', screen: 'Main' },
  { icon: 'timer', title: 'Focus', desc: 'Pomodoro timer', color: '#3498DB', screen: 'Pomodoro' },
  { icon: 'shield-checkmark', title: 'Discipline', desc: 'Consistency rank', color: '#27AE60', screen: 'Discipline' },
  { icon: 'trophy', title: 'Challenges', desc: 'Daily rewards', color: '#F39C12', screen: 'Challenges' },
  { icon: 'columns', title: 'Kanban', desc: 'Board view', color: '#9B59B6', screen: 'Kanban' },
  { icon: 'bar-chart', title: 'Analytics', desc: 'Productivity data', color: '#2ECC71', screen: 'Analytics' },
  { icon: 'grid', title: 'Matrix', desc: 'Priority planning', color: '#E74C3C', screen: 'EisenhowerMatrix' },
  { icon: 'gift', title: 'Rewards', desc: 'Mystery boxes', color: '#C9A84C', screen: 'GamificationHub' },
  { icon: 'headset', title: 'Focus Music', desc: 'Ambient sounds', color: '#3498DB', screen: 'FocusMusic' },
  { icon: 'calendar', title: 'Planner', desc: 'Weekly layout', color: '#27AE60', screen: 'WeeklyPlanner' },
  { icon: 'apps', title: 'Widgets', desc: 'Custom dashboard', color: '#9B59B6', screen: 'Widgets' },
];

const STATS = [
  { number: '12+', label: 'Features', icon: 'apps' },
  { number: '∞', label: 'Theme Engine', icon: 'color-palette' },
  { number: '🏆', label: 'Gamified', icon: 'ribbon' },
  { number: '📊', label: 'Analytics', icon: 'analytics' },
];

function Particle({ index }) {
  const sv = useSharedValue(0);
  const x = useSharedValue(Math.random() * width);
  const startY = height * 0.3 + Math.random() * height * 0.5;
  const duration = 6000 + Math.random() * 6000;
  const size = 2 + Math.random() * 4;

  useEffect(() => {
    sv.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const progress = sv.value;
    return {
      opacity: interpolate(progress, [0, 0.1, 0.8, 1], [0, 0.6, 0.6, 0]),
      transform: [
        { translateY: interpolate(progress, [0, 1], [0, -height * 0.8]) },
        { translateX: Math.sin(progress * Math.PI * 3) * 30 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x.value,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(201, 168, 76, 0.8)',
          shadowColor: '#C9A84C',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 4,
        },
        style,
      ]}
    />
  );
}

function HeroSection({ theme, isDark, navigation }) {
  const btnScale = useSharedValue(1);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.15, 0.4]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [0.9, 1.1]) }],
  }));

  const handlePressIn = () => {
    btnScale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <View style={[styles.heroSection, { height: height * 0.92 }]}>
      {Array.from({ length: 14 }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}

      <LinearGradient
        colors={
          isDark
            ? ['#0E0C11', '#161320', '#1A1724', '#0E0C11']
            : ['#F5EDE0', '#EDE5D8', '#E8DFD0', '#F5EDE0']
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.heroContent}>
        <Animated.View entering={ZoomIn.duration(900).springify().damping(12).stiffness(70)} style={styles.shieldWrap}>
          <BreathingGlow color={theme.colors.primary} size={180} />
          <Animated.View
            style={[
              styles.shieldOuter,
              {
                borderColor: theme.colors.primary + '30',
                backgroundColor: isDark ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.08)',
              },
              glowStyle,
            ]}
          >
            <Ionicons name="shield" size={56} color={theme.colors.primary} />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(700).delay(300).springify().damping(16)}>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>LifeFlow</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <Text style={[styles.heroSubtitle, { color: theme.colors.primary }]}>Master Your Domain</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(500).delay(700)}>
          <Text style={[styles.heroTagline, { color: theme.colors.textMuted }]}>
            Tasks · Habits · Focus · Discipline · Growth
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(850)} style={styles.dividerWrap}>
          <OrnamentalDivider />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(1000).springify().damping(14)}>
          <Animated.View style={btnStyle}>
            <TouchableOpacity
              style={[styles.enterButton, { borderColor: theme.colors.primary + '40' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.replace('Main');
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <BreathingGlow color={theme.colors.primary} size={300} style={{ top: -110, opacity: 0.15 }} />
              <Text style={[styles.enterButtonText, { color: theme.colors.primary }]}>Enter</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

function FeatureCard({ feature, index, theme }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(100 + index * 80).springify().damping(18).stiffness(120)}
    >
      <TouchableOpacity
        style={[
          styles.featureCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          theme.shadows.small,
        ]}
        activeOpacity={0.85}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View
          style={[
            styles.featureIconWrap,
            { backgroundColor: feature.color + '18' },
          ]}
        >
          <Ionicons name={feature.icon} size={24} color={feature.color} />
        </View>
        <Text style={[styles.featureName, { color: theme.colors.text }]}>{feature.title}</Text>
        <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{feature.desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function FeaturesSection({ theme, isDark }) {
  return (
    <View style={styles.section}>
      <Animated.View entering={FadeInDown.duration(600).delay(100)}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Everything You Need</Text>
      </Animated.View>

      <View style={styles.featureGrid}>
        {FEATURES.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} theme={theme} />
        ))}
      </View>
    </View>
  );
}

function StatBox({ stat, index, theme }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(150 + index * 100).springify().damping(16)}
      style={[
        styles.statBox,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        theme.shadows.small,
      ]}
    >
      <Ionicons name={stat.icon} size={20} color={theme.colors.primary} />
      <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{stat.number}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
    </Animated.View>
  );
}

function StatsSection({ theme, isDark }) {
  return (
    <View style={styles.section}>
      <Animated.View entering={FadeInDown.duration(600).delay(100)}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Built For Champions</Text>
      </Animated.View>

      <View style={styles.statGrid}>
        {STATS.map((stat, index) => (
          <StatBox key={stat.label} stat={stat} index={index} theme={theme} />
        ))}
      </View>
    </View>
  );
}

function CreatorSection({ theme, isDark }) {
  return (
    <View style={[styles.section, styles.creatorSection]}>
      <Animated.View entering={FadeIn.duration(600).delay(100)}>
        <OrnamentalDivider />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(250)}>
        <Text style={[styles.craftedLabel, { color: theme.colors.textMuted }]}>Crafted with passion by</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(700).delay(400).springify().damping(14)}>
        <View style={styles.creatorNameWrap}>
          <BreathingGlow color={theme.colors.primary} size={220} style={{ top: -40 }} />
          <Text style={[styles.creatorName, { color: theme.colors.primary }]}>Harshit Mishra</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(500).delay(600)}>
        <Text style={[styles.yearText, { color: theme.colors.textMuted }]}>2025</Text>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <HeroSection theme={theme} isDark={isDark} navigation={navigation} />

        <FeaturesSection theme={theme} isDark={isDark} />

        <StatsSection theme={theme} isDark={isDark} />

        <CreatorSection theme={theme} isDark={isDark} />

        <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.versionWrap}>
          <Text style={[styles.versionText, { color: theme.colors.textMuted }]}>LifeFlow v2.0</Text>
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  shieldWrap: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  shieldOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: serifFont,
    fontWeight: '400',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroTagline: {
    fontSize: 13,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  dividerWrap: {
    marginVertical: 20,
    width: width * 0.7,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  enterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: serifFont,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.3,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: (width - 56) / 3,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: serifFont,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  creatorSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  craftedLabel: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  creatorNameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  creatorName: {
    fontSize: 30,
    fontFamily: serifFont,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 4,
  },

  versionWrap: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  versionText: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});
