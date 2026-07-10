import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export function OrnamentalDivider({ color, style }) {
  const { theme } = useTheme();
  const c = color || theme.colors.primary;

  return (
    <View style={[styles.dividerContainer, style]}>
      <View style={[styles.dividerLine, { backgroundColor: c + '25' }]} />
      <View style={[styles.dividerDiamond, { backgroundColor: c + '40' }]} />
      <View style={[styles.dividerLine, { backgroundColor: c + '25' }]} />
    </View>
  );
}

export function FadeInView({ children, delay = 0, duration = 500, style, direction = 'up' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(direction === 'up' ? 16 : direction === 'down' ? -16 : 0)).current;
  const translateX = useRef(new Animated.Value(direction === 'left' ? 16 : direction === 'right' ? -16 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }, { translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function ScaleInView({ children, delay = 0, duration = 400, style }) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1, tension: 40, friction: 8, delay, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function AnimatedCounter({ value, style, duration = 600 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View style={style}>
      <Animated.Text style={[{ opacity: anim }]}>{value}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    marginHorizontal: 16,
    transform: [{ rotate: '45deg' }],
  },
});
