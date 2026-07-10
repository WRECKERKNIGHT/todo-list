import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  Easing, interpolate,
} from 'react-native-reanimated';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { requestNotificationPermission } from './src/utils/notifications';

import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TodoScreen from './src/screens/TodoScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import HabitScreen from './src/screens/HabitScreen';
import CountdownScreen from './src/screens/CountdownScreen';
import StatsScreen from './src/screens/StatsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import PomodoroScreen from './src/screens/PomodoroScreen';
import NotesScreen from './src/screens/NotesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GlobalSearch from './src/components/GlobalSearch';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { active: 'shield', inactive: 'shield-outline' },
  Quests: { active: 'scroll', inactive: 'scroll-outline' },
  Calendar: { active: 'calendar', inactive: 'calendar-outline' },
  Rituals: { active: 'flame', inactive: 'flame-outline' },
};

function AnimatedTabIcon({ routeName, focused, color }) {
  const icons = TAB_ICONS[routeName] || { active: 'ellipse', inactive: 'ellipse-outline' };
  const scale = useSharedValue(focused ? 1 : 0.85);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.85, { damping: 15, stiffness: 300 });
  }, [focused]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.85, 1], [0.6, 1]),
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={focused ? icons.active : icons.inactive} size={22} color={color} />
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation, theme }) {
  const indicatorX = useSharedValue(0);
  const { width } = require('react-native').Dimensions.get('window');
  const TAB_WIDTH = (width - 48) / 4;

  useEffect(() => {
    indicatorX.value = withSpring(state.index * TAB_WIDTH, {
      damping: 20, stiffness: 250, mass: 0.8,
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      <Animated.View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }, indicatorStyle]} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? theme.colors.primary : theme.colors.textMuted;
        const onPress = () => {
          if (route.name === 'More') {
            return;
          }
          navigation.navigate(route.name);
        };

        if (route.name === 'More') return null;

        return (
          <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
            <AnimatedTabIcon routeName={route.name} focused={focused} color={color} />
            <Animated.View style={{ opacity: focused ? 1 : 0.5 }}>
              <Ionicons name={focused ? 'ellipse' : 'ellipse-outline'} size={3} color={color} />
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const [searchVisible, setSearchVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Quests" component={TodoScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Rituals" component={HabitScreen} />
        <Tab.Screen
          name="More"
          component={MoreTab}
          options={{
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={() => setSearchVisible(true)} style={[props.style, styles.moreBtn]}>
                <Ionicons name="grid-outline" size={22} color={theme.colors.textMuted} />
                <Ionicons name="ellipse-outline" size={3} color={theme.colors.textMuted} style={{ marginTop: 4 }} />
              </TouchableOpacity>
            ),
          }}
        />
      </Tab.Navigator>
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </>
  );
}

function MoreTab() {
  return null;
}

export default function App() {
  useEffect(() => { requestNotificationPermission(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { theme, isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.accent,
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Pomodoro" component={PomodoroScreen} />
        <Stack.Screen name="Notes" component={NotesScreen} />
        <Stack.Screen name="Countdowns" component={CountdownScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    height: Platform.OS === 'ios' ? 80 : 60,
    borderTopWidth: 0.5,
    elevation: 0,
    shadowOpacity: 0,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 2,
    borderRadius: 1,
    left: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    gap: 4,
  },
  moreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    gap: 4,
  },
});
