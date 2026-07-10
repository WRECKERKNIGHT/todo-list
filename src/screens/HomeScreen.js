import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, Easing, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, OrnamentalDivider } from '../components/MedievalUI';

const { width, height } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const crownOpacity = useRef(new Animated.Value(0)).current;
  const crownY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(crownOpacity, {
          toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(crownY, {
          toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
      Animated.delay(150),
      Animated.timing(subtitleOpacity, {
        toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.delay(100),
      Animated.timing(taglineOpacity, {
        toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.delay(100),
      Animated.timing(dividerOpacity, {
        toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 1, tension: 30, friction: 8, useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('Main');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDark
          ? ['#0E0C11', '#12101A', '#161320']
          : ['#F5EDE0', '#EDE5D8', '#E5DDD0']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.shieldWrap, { opacity: crownOpacity, transform: [{ translateY: crownY }] }]}>
          <View style={[styles.shieldOuter, { borderColor: theme.colors.primary + '30' }]}>
            <Ionicons name="shield" size={56} color={theme.colors.primary} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.titleWrap, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Royal</Text>
          <Text style={[styles.titleBold, { color: theme.colors.primary }]}>Task</Text>
        </Animated.View>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, color: theme.colors.textSecondary }]}>
          Command Your Dominion
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, color: theme.colors.textMuted }]}>
          Tasks · Habits · Focus
        </Animated.Text>

        <Animated.View style={{ opacity: dividerOpacity, width: '100%' }}>
          <OrnamentalDivider />
        </Animated.View>

        <Animated.View style={[styles.buttonWrap, { opacity: buttonOpacity, transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={[styles.button, { borderColor: theme.colors.primary + '50' }]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Begin</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={[styles.version, { color: theme.colors.textMuted }]}>v2.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  shieldWrap: {
    marginBottom: 32,
  },
  shieldOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: {
    fontSize: 44,
    fontWeight: '400',
    fontFamily: serifFont,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  titleBold: {
    fontSize: 44,
    fontWeight: '400',
    fontFamily: serifFont,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 4,
  },
  buttonWrap: {
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  version: {
    position: 'absolute',
    bottom: 50,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
