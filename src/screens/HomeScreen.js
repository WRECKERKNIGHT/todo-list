import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeInLeft, FadeInRight,
  ZoomIn, BounceIn, SlideInDown, useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence, Easing,
  interpolate, Extrapolation, LightSpeedInLeft, FlipInYUp,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { OrnamentalDivider, BreathingGlow } from '../components/MedievalUI';

const { width, height } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function FloatingDust({ delay, x, y, size, color }) {
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 4000 + Math.random() * 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4000 + Math.random() * 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(sv.value, [0, 1], [0, 0.25]),
    transform: [
      { translateY: interpolate(sv.value, [0, 1], [0, -60]) },
      { scale: interpolate(sv.value, [0, 0.5, 1], [0.5, 1, 0.5]) },
    ],
  }));

  return (
    <Animated.View style={[styles.dust, { left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
  );
}

function ShieldHero() {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View entering={ZoomIn.duration(800).springify().damping(12).stiffness(80)} style={styles.shieldWrap}>
      <BreathingGlow color={theme.colors.primary} size={160} />
      <Animated.View style={[styles.shieldOuter, { borderColor: theme.colors.primary + '30' }, animatedStyle]}>
        <Ionicons name="shield" size={52} color={theme.colors.primary} />
      </Animated.View>
    </Animated.View>
  );
}

function HeroTitle() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const btnScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handlePressIn = () => { btnScale.value = withSpring(0.95, { damping: 15, stiffness: 400 }); };
  const handlePressOut = () => { btnScale.value = withSpring(1, { damping: 15, stiffness: 400 }); };

  return (
    <View style={styles.titleContainer}>
      <ShieldHero />

      <Animated.View entering={FadeInDown.duration(700).delay(300).springify().damping(16)} style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Royal</Text>
        <Text style={[styles.titleAccent, { color: theme.colors.primary }]}>Task</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(600).delay(600)}>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Command Your Dominion</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(500).delay(800)}>
        <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>Tasks · Habits · Focus</Text>
      </Animated.View>

      <OrnamentalDivider />

      <Animated.View entering={FadeInUp.duration(600).delay(1000).springify().damping(14)}>
        <Animated.View style={btnStyle}>
          <TouchableOpacity
            style={[styles.button, { borderColor: theme.colors.primary + '40' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.replace('Main'); }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
          >
            <BreathingGlow color={theme.colors.primary} size={280} style={{ top: -100 }} />
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Begin Your Quest</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const dustParticles = Array.from({ length: 12 }, (_, i) => ({
  key: i,
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 3 + 1.5,
  delay: Math.random() * 3000,
  color: ['#C9A84C', '#E2CC7E', '#8B6914'][i % 3],
}));

export default function HomeScreen() {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0E0C11', '#12101A', '#161320'] : ['#F5EDE0', '#EDE5D8', '#E5DDD0']}
        style={StyleSheet.absoluteFill}
      />

      {dustParticles.map(p => (
        <FloatingDust key={p.key} {...p} />
      ))}

      <View style={styles.content}>
        <HeroTitle />
      </View>

      <Animated.View entering={FadeIn.duration(500).delay(1400)}>
        <Text style={[styles.version, { color: theme.colors.textMuted }]}>v2.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  dust: { position: 'absolute' },

  shieldWrap: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  shieldOuter: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },

  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  title: { fontSize: 44, fontWeight: '400', fontFamily: serifFont, letterSpacing: 0.5, marginRight: 8 },
  titleAccent: { fontSize: 44, fontWeight: '400', fontFamily: serifFont, letterSpacing: 0.5 },

  subtitle: { fontSize: 14, fontWeight: '500', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' },
  tagline: { fontSize: 13, letterSpacing: 1, marginBottom: 4, textAlign: 'center' },

  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, paddingVertical: 16, borderRadius: 10,
    borderWidth: 1, overflow: 'hidden', marginTop: 8,
  },
  buttonText: { fontSize: 14, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },

  version: { position: 'absolute', bottom: 50, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
});
