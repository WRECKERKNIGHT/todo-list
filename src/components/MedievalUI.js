import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeIn, FadeInLeft, FadeInRight,
  ZoomIn, BounceIn,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, Easing, interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export function GlassCard({ children, delay = 0, style, onPress }) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const cardStyle = theme.cardStyle || {};

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); };

  const cardBg = cardStyle.backgroundColor || theme.colors.surface;
  const cardBorder = cardStyle.borderColor || theme.colors.border;

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay).springify().damping(18).stiffness(120)}
      style={[{
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: cardBorder,
        borderRadius: 16,
        overflow: 'hidden',
      }, animatedStyle, style]}
    >
      {onPress ? (
        <Animated.View onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={{ padding: 16 }}>
          {children}
        </Animated.View>
      ) : (
        <View style={{ padding: 16 }}>{children}</View>
      )}
    </Animated.View>
  );
}

export function NeumorphCard({ children, delay = 0, style }) {
  const { theme, isDark } = useTheme();
  const cardStyle = theme.cardStyle || {};

  const shadowStyle = isDark ? {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  } : {
    shadowColor: '#D5CFC5',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay).springify().damping(18).stiffness(120)}
      style={[{
        backgroundColor: cardStyle.backgroundColor || theme.colors.surface,
        borderRadius: 16,
        padding: 16,
      }, shadowStyle, style]}
    >
      {children}
    </Animated.View>
  );
}

export function FluidCard({ children, delay = 0, style }) {
  const { theme } = useTheme();
  const cardStyle = theme.cardStyle || {};
  const breathe = useSharedValue(0);

  React.useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(breathe.value, [0, 1], [20, 28]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.005]) }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay).springify().damping(18).stiffness(120)}
      style={[{
        backgroundColor: cardStyle.backgroundColor || theme.colors.surface,
        borderWidth: 1,
        borderColor: cardStyle.borderColor || theme.colors.border,
        padding: 16,
      }, animatedStyle, style]}
    >
      {children}
    </Animated.View>
  );
}

export function FadeInView({ children, delay = 0, style }) {
  return (
    <Animated.View entering={FadeIn.duration(500).delay(delay).springify().damping(18)} style={style}>
      {children}
    </Animated.View>
  );
}

export function OrnamentalDivider({ color, style }) {
  const { theme } = useTheme();
  const c = color || theme.colors.primary;
  return (
    <Animated.View entering={FadeIn.duration(600).delay(300)} style={[styles.dividerContainer, style]}>
      <View style={[styles.dividerLine, { backgroundColor: c + '20' }]} />
      <View style={[styles.dividerDiamond, { backgroundColor: c + '40' }]} />
      <View style={[styles.dividerLine, { backgroundColor: c + '20' }]} />
    </Animated.View>
  );
}

export function AnimatedCard({ children, delay = 0, style, onPress }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); };

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay).springify().damping(18).stiffness(120)}
      style={[animatedStyle, style]}
    >
      <Animated.RawButton onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        {children}
      </Animated.RawButton>
    </Animated.View>
  );
}

export function StaggerItem({ children, index, style }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60).springify().damping(16).stiffness(120)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function SlideInView({ children, delay = 0, direction = 'left', style }) {
  const entering = direction === 'left'
    ? FadeInLeft.duration(500).delay(delay).springify().damping(18)
    : direction === 'right'
    ? FadeInRight.duration(500).delay(delay).springify().damping(18)
    : direction === 'up'
    ? FadeInUp.duration(500).delay(delay).springify().damping(18)
    : FadeInDown.duration(500).delay(delay).springify().damping(18);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

export function ScaleInView({ children, delay = 0, style }) {
  return (
    <Animated.View entering={ZoomIn.duration(500).delay(delay).springify().damping(14).stiffness(120)} style={style}>
      {children}
    </Animated.View>
  );
}

export function BounceInView({ children, delay = 0, style }) {
  return (
    <Animated.View entering={BounceIn.duration(600).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}

export function BreathingGlow({ color, size = 200, style }) {
  const { theme } = useTheme();
  const glowColor = color || theme.colors.primary;
  const sv = useSharedValue(0);

  React.useEffect(() => {
    sv.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sv.value, [0, 1], [0.05, 0.2]),
    transform: [{ scale: interpolate(sv.value, [0, 1], [0.9, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: glowColor, position: 'absolute',
      }, animatedStyle, style]}
    />
  );
}

export function AnimatedCounter({ value, style, duration = 800 }) {
  const sv = useSharedValue(0);

  React.useEffect(() => {
    sv.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sv.value, [0, value || 1], [0.3, 1]),
  }));

  return (
    <Animated.View entering={FadeIn.duration(duration)} style={[animatedStyle, style]}>
      {React.Children.map(children, child => child)}
    </Animated.View>
  );
}

export function PulseDot({ color, size = 8, style }) {
  const sv = useSharedValue(0);

  React.useEffect(() => {
    sv.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sv.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(sv.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, animatedStyle, style]}
    />
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
