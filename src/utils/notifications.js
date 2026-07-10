import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Habits',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 200, 100],
      lightColor: '#00D2D3',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('countdowns', {
      name: 'Countdowns',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 300, 500],
      lightColor: '#FFB347',
      sound: 'default',
    });
  }

  return true;
}

export async function scheduleTodoReminder(todo) {
  if (!todo.reminderTime) return;
  try {
    const reminderDate = new Date(todo.reminderTime);
    if (reminderDate <= new Date()) return;

    await cancelNotification(todo.id);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Todo Reminder',
        body: todo.title,
        data: { type: 'todo', todoId: todo.id },
        sound: 'default',
        priority: Notifications.AndroidImportance.HIGH,
        ...(Platform.OS === 'ios' ? { categoryIdentifier: 'todoReminder' } : {}),
      },
      trigger: {
        date: reminderDate,
        channelId: 'reminders',
      },
    });
  } catch (e) {
    console.error('Error scheduling todo reminder:', e);
  }
}

export async function scheduleHabitReminder(habit) {
  if (!habit.reminderTime) return;
  try {
    await cancelNotification(habit.id);

    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Habit Reminder',
        body: `Don't forget to: ${habit.name}`,
        data: { type: 'habit', habitId: habit.id },
        sound: 'default',
        priority: Notifications.AndroidImportance.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
        channelId: 'habits',
      },
    });
  } catch (e) {
    console.error('Error scheduling habit reminder:', e);
  }
}

export async function scheduleCountdownNotification(countdown, daysBefore = 1) {
  if (!countdown || !countdown.targetDate) return;
  try {
    const targetDate = new Date(countdown.targetDate);
    const notifyDate = new Date(targetDate);
    notifyDate.setDate(notifyDate.getDate() - daysBefore);

    if (notifyDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Countdown Alert',
        body: `${countdown.title} is in ${daysBefore} day${daysBefore > 1 ? 's' : ''}!`,
        data: { type: 'countdown', countdownId: countdown.id },
        sound: 'default',
      },
      trigger: {
        date: notifyDate,
        channelId: 'countdowns',
      },
    });
  } catch (e) {
    console.error('Error scheduling countdown notification:', e);
  }
}

export async function cancelNotification(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (e) {
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
  }
}

export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
