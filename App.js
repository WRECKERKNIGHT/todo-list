import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
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

function MainTabs() {
  const { theme } = useTheme();
  const [searchVisible, setSearchVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => {
            let iconName;
            switch (route.name) {
              case 'Dashboard': iconName = focused ? 'shield' : 'shield-outline'; break;
              case 'Quests': iconName = focused ? 'scroll' : 'scroll-outline'; break;
              case 'Calendar': iconName = focused ? 'calendar' : 'calendar-outline'; break;
              case 'Rituals': iconName = focused ? 'flame' : 'flame-outline'; break;
              case 'More': iconName = focused ? 'grid' : 'grid-outline'; break;
              default: iconName = 'ellipse';
            }
            return <Ionicons name={iconName} size={22} color={focused ? theme.colors.primary : theme.colors.textMuted} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 0.5,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            height: Platform.OS === 'ios' ? 80 : 60,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600', marginTop: 2 },
          headerShown: false,
        })}
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
              <TouchableOpacity {...props} onPress={() => setSearchVisible(true)} style={props.style}>
                <Ionicons name="grid-outline" size={22} color={theme.colors.textMuted} />
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
