import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/MedievalUI';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const QUOTES = [
  "Small steps every day lead to big changes.",
  "You don't have to be perfect, just present.",
  "The secret of getting ahead is getting started.",
  "Discipline is choosing between what you want now and what you want most.",
  "Done is better than perfect.",
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 20;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP) / 2;

const defaultOrder = [
  'clock',
  'quickStats',
  'streak',
  'coins',
  'nextDeadline',
  'focusTimer',
  'quote',
  'weatherMood',
  'progressRing',
];

function ClockWidget({ colors }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={widgetStyles.center}>
      <Ionicons name="time-outline" size={20} color={colors.primary} />
      <Text style={[widgetStyles.time, { color: colors.text }]}>{hours}:{minutes}</Text>
      <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>{dateStr}</Text>
    </View>
  );
}

function QuickStatsWidget({ colors, app }) {
  const tasksToday = app.tasks?.filter((t) => {
    const d = new Date(t.createdAt || t.id);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }) || [];
  const doneToday = tasksToday.filter((t) => t.completed).length;
  const totalHabits = app.habits?.length || 0;
  const doneHabits = app.habits?.filter((h) => h.completedToday).length || 0;

  return (
    <View style={widgetStyles.center}>
      <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
      <Text style={[widgetStyles.statLine, { color: colors.text }]}>
        {doneToday} / {tasksToday.length} tasks
      </Text>
      <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>
        {doneHabits} / {totalHabits} habits
      </Text>
    </View>
  );
}

function StreakWidget({ colors, app }) {
  const streak = app.streak || 0;
  return (
    <View style={widgetStyles.center}>
      <Ionicons name="flame-outline" size={22} color="#F59E0B" />
      <Text style={[widgetStyles.bigNumber, { color: colors.text }]}>{streak}</Text>
      <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>day streak</Text>
    </View>
  );
}

function CoinsWidget({ colors, app }) {
  const coins = app.coins || 0;
  return (
    <View style={widgetStyles.center}>
      <Ionicons name="cash-outline" size={20} color="#F59E0B" />
      <Text style={[widgetStyles.bigNumber, { color: colors.text }]}>{coins}</Text>
      <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>earn more</Text>
    </View>
  );
}

function NextDeadlineWidget({ colors, app }) {
  const nextTask = useMemo(() => {
    if (!app.tasks) return null;
    const upcoming = app.tasks
      .filter((t) => !t.completed && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return upcoming[0] || null;
  }, [app.tasks]);

  return (
    <View style={widgetStyles.center}>
      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      {nextTask ? (
        <>
          <Text
            style={[widgetStyles.smallTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {nextTask.title}
          </Text>
          <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>
            {new Date(nextTask.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </>
      ) : (
        <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>
          No deadlines
        </Text>
      )}
    </View>
  );
}

function FocusTimerWidget({ colors, app, navigation }) {
  const pomodoroCount = app.pomodoroCount || 0;
  return (
    <View style={widgetStyles.center}>
      <Ionicons name="timer-outline" size={20} color={colors.primary} />
      <Text style={[widgetStyles.bigNumber, { color: colors.text }]}>{pomodoroCount}</Text>
      <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>pomodoros</Text>
      <TouchableOpacity
        style={[widgetStyles.miniButton, { backgroundColor: colors.primary + '22' }]}
        onPress={() => navigation.navigate('Pomodoro')}
      >
        <Text style={[widgetStyles.miniButtonText, { color: colors.primary }]}>
          Start Focus
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function QuoteWidget({ colors }) {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const quote = QUOTES[dayOfYear % QUOTES.length];
  return (
    <View style={widgetStyles.center}>
      <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
      <Text style={[widgetStyles.quoteText, { color: colors.text }]} numberOfLines={3}>
        "{quote}"
      </Text>
    </View>
  );
}

function WeatherMoodWidget({ colors, app }) {
  const todayMood = app.moods?.[new Date().toDateString()];
  return (
    <View style={widgetStyles.center}>
      {todayMood ? (
        <>
          <Text style={widgetStyles.moodEmoji}>{todayMood.emoji || '😊'}</Text>
          <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>
            {todayMood.label || 'Today'}
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="happy-outline" size={22} color={colors.text + '66'} />
          <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>
            Log mood
          </Text>
        </>
      )}
    </View>
  );
}

function ProgressRingWidget({ colors, app }) {
  const tasksToday = app.tasks?.filter((t) => {
    const d = new Date(t.createdAt || t.id);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }) || [];
  const completed = tasksToday.filter((t) => t.completed).length;
  const total = tasksToday.length || 1;
  const progress = Math.min(completed / total, 1);
  const size = 56;
  const border = 5;

  return (
    <View style={widgetStyles.center}>
      <View
        style={[
          widgetStyles.ringOuter,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.text + '22',
          },
        ]}
      >
        <View
          style={[
            widgetStyles.ringInner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: progress > 0 ? colors.primary : colors.text + '22',
              borderTopColor: progress > 0.25 ? colors.primary : 'transparent',
              borderRightColor: progress > 0.5 ? colors.primary : 'transparent',
              borderBottomColor: progress > 0.75 ? colors.primary : 'transparent',
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        />
        <View style={widgetStyles.ringCenter}>
          <Text style={[widgetStyles.ringText, { color: colors.text }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>
      <Text style={[widgetStyles.subtitle, { color: colors.text + '99' }]}>
        {completed}/{tasksToday.length} done
      </Text>
    </View>
  );
}

const WIDGET_MAP = {
  clock: { title: 'Clock', component: ClockWidget },
  quickStats: { title: 'Quick Stats', component: QuickStatsWidget },
  streak: { title: 'Streak', component: StreakWidget },
  coins: { title: 'Coins', component: CoinsWidget },
  nextDeadline: { title: 'Next Deadline', component: NextDeadlineWidget },
  focusTimer: { title: 'Focus Timer', component: FocusTimerWidget },
  quote: { title: 'Daily Quote', component: QuoteWidget },
  weatherMood: { title: 'Mood', component: WeatherMoodWidget },
  progressRing: { title: 'Progress', component: ProgressRingWidget },
};

const WIDGET_ICONS = {
  clock: 'time-outline',
  quickStats: 'stats-chart-outline',
  streak: 'flame-outline',
  coins: 'cash-outline',
  nextDeadline: 'calendar-outline',
  focusTimer: 'timer-outline',
  quote: 'chatbubble-ellipses-outline',
  weatherMood: 'happy-outline',
  progressRing: 'ellipse-outline',
};

export default function WidgetsScreen() {
  const { colors } = useTheme();
  const app = useApp();
  const navigation = useNavigation();
  const [customizeMode, setCustomizeMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState(defaultOrder);

  const handleReorderUp = useCallback((index) => {
    if (index === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWidgetOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleReorderDown = useCallback((index) => {
    setWidgetOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleToggleCustomize = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCustomizeMode((prev) => !prev);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="grid-outline" size={22} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Widgets</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.customizeToggle,
              { backgroundColor: customizeMode ? colors.primary + '22' : colors.text + '11' },
            ]}
            onPress={handleToggleCustomize}
          >
            <Ionicons
              name={customizeMode ? 'checkmark-circle' : 'settings-outline'}
              size={18}
              color={customizeMode ? colors.primary : colors.text + '88'}
            />
            <Text
              style={[
                styles.customizeText,
                { color: customizeMode ? colors.primary : colors.text + '88' },
              ]}
            >
              {customizeMode ? 'Done' : 'Customize'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.grid}>
        {widgetOrder.map((key, index) => {
          const widget = WIDGET_MAP[key];
          if (!widget) return null;
          const WidgetComponent = widget.component;

          return (
            <Animated.View
              key={key}
              entering={FadeInDown.delay(index * 60).duration(350)}
              style={styles.cardWrapper}
            >
              {customizeMode && (
                <View style={[styles.editBar, { backgroundColor: colors.card + 'DD' }]}>
                  <TouchableOpacity onPress={() => handleReorderUp(index)} disabled={index === 0}>
                    <Ionicons
                      name="chevron-up"
                      size={18}
                      color={index === 0 ? colors.text + '33' : colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReorderDown(index)}
                    disabled={index === widgetOrder.length - 1}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={
                        index === widgetOrder.length - 1
                          ? colors.text + '33'
                          : colors.primary
                      }
                    />
                  </TouchableOpacity>
                  <Ionicons
                    name="reorder-three-outline"
                    size={14}
                    color={colors.text + '44'}
                  />
                </View>
              )}
              <GlassCard
                style={[
                  styles.widgetCard,
                  {
                    width: CARD_WIDTH,
                    minHeight: 100,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  },
                  customizeMode && styles.widgetCardCustomize,
                ]}
              >
                <View style={styles.widgetHeader}>
                  <Ionicons
                    name={WIDGET_ICONS[key]}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.widgetTitle, { color: colors.text + '88' }]}>
                    {widget.title}
                  </Text>
                </View>
                <WidgetComponent
                  colors={colors}
                  app={app}
                  navigation={navigation}
                />
              </GlassCard>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: PADDING,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  customizeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  customizeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  widgetCard: {
    padding: 14,
  },
  widgetCardCustomize: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  time: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  bigNumber: {
    fontSize: 30,
    fontWeight: '800',
  },
  smallTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  statLine: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
  },
  moodEmoji: {
    fontSize: 28,
  },
  miniButton: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  miniButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ringOuter: {
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ringInner: {
    position: 'absolute',
    borderWidth: 5,
  },
  ringCenter: {
    zIndex: 1,
  },
  ringText: {
    fontSize: 13,
    fontWeight: '800',
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  bottomSpacer: {
    height: 40,
  },
});
