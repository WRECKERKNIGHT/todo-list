# LifeFlow - Todo List App

A feature-rich React Native Expo todo app with gamification, theming, and productivity tools.

## Prerequisites

- **Node.js** 18+
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- For iOS builds: **Xcode** + Apple Developer account
- For Android builds: **Android Studio** + SDK

## Setup

```bash
git clone https://github.com/WRECKERKNIGHT/todo-list.git
cd todo-list
npm install
```

## Running the App

```bash
npx expo start
```

This opens the Expo DevTools in your browser.

| Command | What it does |
|---|---|
| `npx expo start` | Start dev server, scan QR with Expo Go |
| `npx expo start --ios` | Open in iOS Simulator |
| `npx expo start --android` | Open in Android Emulator |
| `npx expo start --web` | Open in browser (limited) |

## Building for Production

Install EAS CLI first:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Then build:

```bash
# Android APK
npm run build:android

# iOS IPA
npm run build:ios
```

## Tech Stack

- **React Native** ~0.76 (Expo SDK 52)
- **React Navigation** 7 (bottom tabs + stack)
- **Reanimated** 3.16 (animations)
- **Gesture Handler** 2.20 (swipes, long-press)
- **expo-blur** (glassmorphism)
- **expo-notifications** (reminders)
- **expo-haptics** (feedback)
- **AsyncStorage** (local persistence)

## Features

- Quest system with priorities, categories, subtasks, recurring tasks
- Habit tracker with streak tracking
- Pomodoro timer
- Mood & energy tracking
- Kanban board
- Daily challenges with coin rewards
- Guild system (simulated social)
- Shop with loot boxes and streak multipliers
- 365-day activity heatmap
- Time tracking with sessions
- Smart reminders with pattern analysis
- Voice commands
- Full theme builder (10 accent colors, 6 backgrounds, 4 card styles, light/dark)
- Draggable dashboard widgets
