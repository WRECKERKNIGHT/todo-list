import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn, BounceIn,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
  withTiming, withRepeat, withDelay, Easing, interpolate,
  Layout, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const COLS = 2;
const CARD_W = (width - 60) / COLS;

const LOOT_BOXES = [
  { id: 'loot_bronze', name: 'Bronze Chest', price: 50, tier: 'bronze', rewards: [{ type: 'coins', min: 20, max: 60 }, { type: 'xp', min: 30, max: 80 }] },
  { id: 'loot_silver', name: 'Silver Chest', price: 120, tier: 'silver', rewards: [{ type: 'coins', min: 60, max: 150 }, { type: 'xp', min: 80, max: 200 }] },
  { id: 'loot_gold', name: 'Golden Chest', price: 250, tier: 'gold', rewards: [{ type: 'coins', min: 150, max: 400 }, { type: 'xp', min: 200, max: 500 }, { type: 'bonus', chance: 0.3 }] },
];

const STREAK_MULTIPLIERS = [
  { days: 0, label: 'None', multiplier: 1 },
  { days: 3, label: 'Bronze', multiplier: 1.25 },
  { days: 7, label: 'Silver', multiplier: 1.5 },
  { days: 14, label: 'Gold', multiplier: 2 },
  { days: 30, label: 'Diamond', multiplier: 3 },
];

const getTierColor = (tier, theme) => {
  switch (tier?.toLowerCase()) {
    case 'bronze': return theme.colors.warning;
    case 'silver': return theme.colors.textSecondary;
    case 'gold': return theme.colors.gold;
    case 'diamond': return theme.colors.primaryLight;
    case 'none': return theme.colors.textMuted;
    default: return theme.colors.primary;
  }
};

function PurchaseCelebration({ visible, onComplete, theme }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * Math.PI * 2,
    sv: useSharedValue(0),
    color: [theme.colors.primary, theme.colors.gold, theme.colors.accent, theme.colors.success][i % 4],
  }));

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      particles.forEach((p, i) => {
        p.sv.value = withDelay(i * 30, withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 300 }),
        ));
      });
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        onComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.celebrationOverlay, { backgroundColor: theme.colors.overlay }, containerStyle]}>
      <View style={[styles.celebrationCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.text }]}>
        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
        <Text style={[styles.celebrationText, { color: theme.colors.text }]}>Purchased!</Text>
      </View>
      {particles.map((p, i) => {
        const pStyle = useAnimatedStyle(() => ({
          opacity: p.sv.value,
          transform: [
            { translateX: Math.cos(p.angle) * 80 * p.sv.value },
            { translateY: Math.sin(p.angle) * 80 * p.sv.value },
            { scale: interpolate(p.sv.value, [0, 1], [0.3, 1]) },
          ],
        }));
        return (
          <Animated.View key={i} style={[styles.particle, { backgroundColor: p.color }, pStyle]} />
        );
      })}
    </Animated.View>
  );
}

function LootBoxCard({ box, owned, canAfford, onOpen, index }) {
  const { theme } = useTheme();
  const tierColor = getTierColor(box.tier, theme);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.3]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.9, 1.1]) }],
  }));

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(index * 100).springify().damping(16)}
      style={[{ width: CARD_W, marginBottom: 12 }, s]}
    >
      <TouchableOpacity
        onPress={() => {
          if (!canAfford) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          Alert.alert('Open Chest?', `Open "${box.name}" for ${box.price} coins?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open!', onPress: () => {
              scale.value = withSequence(
                withSpring(0.9, { damping: 10, stiffness: 300 }),
                withSpring(1.1, { damping: 8, stiffness: 200 }),
                withSpring(1, { damping: 12, stiffness: 200 }),
              );
              onOpen(box);
            }},
          ]);
        }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 12, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 400 }); }}
        activeOpacity={1}
        style={[styles.lootCard, { backgroundColor: theme.colors.surface, borderColor: tierColor + '40', borderWidth: 2 }]}
      >
        <Animated.View style={[styles.lootGlow, { backgroundColor: tierColor }, glowStyle]} />
        <View style={[styles.lootIconWrap, { backgroundColor: tierColor + '20' }]}>
          <Ionicons name="gift" size={28} color={tierColor} />
        </View>
        <Text style={[styles.lootName, { color: theme.colors.text }]}>{box.name}</Text>
        <Text style={[styles.lootDesc, { color: theme.colors.textSecondary }]}>Mystery rewards inside</Text>
        <View style={[styles.priceBadge, { backgroundColor: canAfford ? tierColor + '15' : theme.colors.surfaceLight }]}>
          <Ionicons name="diamond" size={10} color={canAfford ? theme.colors.gold : theme.colors.textMuted} />
          <Text style={[styles.priceText, { color: canAfford ? theme.colors.gold : theme.colors.textMuted }]}>{box.price}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LootRewardModal({ visible, reward, box, onClose, theme }) {
  const opacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (visible && reward) {
      opacity.value = withTiming(1, { duration: 200 });
      cardScale.value = withSequence(
        withDelay(200, withSpring(1.2, { damping: 8, stiffness: 150 })),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      setTimeout(() => setShowReward(true), 500);
    } else {
      setShowReward(false);
    }
  }, [visible, reward]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  if (!visible || !reward) return null;

  return (
    <Animated.View style={[styles.lootOverlay, { backgroundColor: theme.colors.overlay }, overlayStyle]}>
      <Animated.View style={[styles.lootModal, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.text }, cardStyle]}>
        <View style={[styles.lootModalIcon, { backgroundColor: getTierColor(box?.tier, theme) + '20' }]}>
          <Ionicons name="gift" size={36} color={getTierColor(box?.tier, theme)} />
        </View>
        <Text style={[styles.lootModalTitle, { color: theme.colors.text }]}>{box?.name || 'Chest'}</Text>

        {showReward && (
          <Animated.View entering={ZoomIn.springify().damping(10)} style={styles.rewardList}>
            {reward.coins > 0 && (
              <View style={[styles.rewardRow, { backgroundColor: theme.colors.gold + '15' }]}>
                <Ionicons name="diamond" size={18} color={theme.colors.gold} />
                <Text style={[styles.rewardText, { color: theme.colors.gold }]}>+{reward.coins} Coins</Text>
              </View>
            )}
            {reward.xp > 0 && (
              <View style={[styles.rewardRow, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="flash" size={18} color={theme.colors.primary} />
                <Text style={[styles.rewardText, { color: theme.colors.primary }]}>+{reward.xp} XP</Text>
              </View>
            )}
            {reward.bonus && (
              <View style={[styles.rewardRow, { backgroundColor: theme.colors.accent + '15' }]}>
                <Ionicons name="star" size={18} color={theme.colors.accent} />
                <Text style={[styles.rewardText, { color: theme.colors.accent }]}>Bonus Reward!</Text>
              </View>
            )}
          </Animated.View>
        )}

        <TouchableOpacity onPress={onClose} style={[styles.lootCloseBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.lootCloseText, { color: theme.colors.background }]}>Collect</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function StreakMultiplier({ streakDays, theme }) {
  const currentTier = [...STREAK_MULTIPLIERS].reverse().find(t => streakDays >= t.days) || STREAK_MULTIPLIERS[0];
  const nextTier = STREAK_MULTIPLIERS.find(t => t.days > streakDays);
  const tierColor = getTierColor(currentTier.label, theme);
  const progress = nextTier
    ? (streakDays - currentTier.days) / (nextTier.days - currentTier.days)
    : 1;

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.streakCard, { backgroundColor: theme.colors.surface, borderColor: tierColor + '30' }]}>
      <View style={styles.streakHeader}>
        <Ionicons name="flame" size={20} color={tierColor} />
        <Text style={[styles.streakTitle, { color: theme.colors.text }]}>Streak Multiplier</Text>
      </View>
      <View style={styles.streakInfo}>
        <Text style={[styles.streakDays, { color: tierColor }]}>{streakDays} days</Text>
        <View style={[styles.streakBadge, { backgroundColor: tierColor + '20' }]}>
          <Text style={[styles.streakBadgeText, { color: tierColor }]}>{currentTier.label}</Text>
          <Text style={[styles.streakMultiplier, { color: tierColor }]}>×{currentTier.multiplier}</Text>
        </View>
      </View>
      {nextTier && (
        <View style={styles.streakProgressWrap}>
          <View style={[styles.streakProgressBg, { backgroundColor: theme.colors.surfaceLight }]}>
            <View style={[styles.streakProgressFill, { width: `${progress * 100}%`, backgroundColor: tierColor }]} />
          </View>
          <Text style={[styles.streakNext, { color: theme.colors.textMuted }]}>
            {nextTier.days - streakDays} days to {nextTier.label} (×{nextTier.multiplier})
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

function ShopItemCard({ item, owned, canAfford, onPurchase, index }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const getTypeIcon = () => {
    switch (item.type) {
      case 'theme': return 'color-palette';
      case 'title': return 'text';
      case 'shield': return 'shield-checkmark';
      case 'boost': return 'flash';
      case 'protection': return 'lock-closed';
      case 'feature': return 'extension-puzzle';
      default: return 'gift';
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'theme': return 'Accent Color';
      case 'title': return 'Title';
      case 'shield': return 'Shield Icon';
      case 'boost': return 'XP Boost';
      case 'protection': return 'Protection';
      case 'feature': return 'Feature';
      default: return 'Item';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60).springify().damping(16).stiffness(110)}
      layout={Layout.springify().damping(18)}
      style={[{ width: CARD_W, marginBottom: 12 }, s]}
    >
      <TouchableOpacity
        onPress={() => {
          if (owned) return;
          if (!canAfford) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert('Purchase', `Buy "${item.name}" for ${item.price} coins?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Buy', onPress: () => { scale.value = withSequence(withSpring(0.9), withSpring(1)); onPurchase(item.id); } },
          ]);
        }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 12, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 400 }); }}
        activeOpacity={1}
        style={[styles.itemCard, {
          backgroundColor: owned ? theme.colors.surfaceLight : theme.colors.surface,
          borderColor: owned ? theme.colors.success + '40' : theme.colors.border,
          borderWidth: 1,
          opacity: !owned && !canAfford ? 0.6 : 1,
        }]}
      >
        <View style={[styles.itemIconWrap, { backgroundColor: (item.color || theme.colors.primary) + '15' }]}>
          {item.type === 'theme' ? (
            <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
          ) : (
            <Ionicons name={getTypeIcon()} size={22} color={item.color || theme.colors.primary} />
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemType, { color: theme.colors.textMuted }]}>{getTypeLabel()}</Text>
          <Text style={[styles.itemName, { color: owned ? theme.colors.textMuted : theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.desc}</Text>
        </View>

        {owned ? (
          <View style={[styles.ownedBadge, { backgroundColor: theme.colors.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          </View>
        ) : (
          <View style={[styles.priceBadge, { backgroundColor: canAfford ? theme.colors.gold + '15' : theme.colors.surfaceLight }]}>
            <Ionicons name="diamond" size={10} color={canAfford ? theme.colors.gold : theme.colors.textMuted} />
            <Text style={[styles.priceText, { color: canAfford ? theme.colors.gold : theme.colors.textMuted }]}>{item.price}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ShopScreen({ navigation }) {
  const { theme } = useTheme();
  const { state, purchaseShopItem, dispatch } = useApp();
  const [filter, setFilter] = useState('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [lootReward, setLootReward] = useState(null);
  const [openedBox, setOpenedBox] = useState(null);
  const [showLootModal, setShowLootModal] = useState(false);

  const types = ['all', 'theme', 'title', 'shield', 'boost', 'protection', 'feature'];
  const filteredItems = filter === 'all' ? state.shopItems : state.shopItems.filter(i => i.type === filter);

  const handlePurchase = (itemId) => {
    const success = purchaseShopItem(itemId);
    if (success) {
      setShowCelebration(true);
    }
  };

  const handleOpenLootBox = (box) => {
    if (state.coins < box.price) return;
    dispatch({ type: 'SPEND_COINS', payload: box.price });

    const reward = box.rewards.reduce((acc, r) => {
      if (r.type === 'coins') acc.coins = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
      else if (r.type === 'xp') acc.xp = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
      else if (r.type === 'bonus' && Math.random() < r.chance) acc.bonus = true;
      return acc;
    }, { coins: 0, xp: 0, bonus: false });

    if (reward.coins > 0) dispatch({ type: 'ADD_COINS', payload: reward.coins });
    if (reward.xp > 0) dispatch({ type: 'ADD_XP', payload: reward.xp });

    setOpenedBox(box);
    setLootReward(reward);
    setShowLootModal(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Royal Shop</Text>
        <View style={[styles.coinsBadge, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="diamond" size={14} color={theme.colors.gold} />
          <Text style={[styles.coinsText, { color: theme.colors.gold }]}>{state.coins}</Text>
        </View>
      </View>

      <StreakMultiplier streakDays={state.streakDays} theme={theme} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Mystery Chests</Text>
        </Animated.View>
        <View style={styles.lootRow}>
          {LOOT_BOXES.map((box, i) => (
            <LootBoxCard
              key={box.id}
              box={box}
              canAfford={state.coins >= box.price}
              onOpen={handleOpenLootBox}
              index={i}
            />
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Items</Text>
        </Animated.View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {types.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, filter === t && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(t); }}
              >
                <Text style={[styles.filterText, { color: theme.colors.textMuted }, filter === t && { color: theme.colors.primary }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {state.activeTitle && (
          <Animated.View entering={FadeIn.duration(400)} style={[styles.activeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary + '20' }]}>
            <Ionicons name="text" size={16} color={theme.colors.primary} />
            <Text style={[styles.activeLabel, { color: theme.colors.textMuted }]}>Active Title:</Text>
            <Text style={[styles.activeValue, { color: theme.colors.primary }]}>{state.activeTitle}</Text>
          </Animated.View>
        )}

        <View style={styles.grid}>
          {filteredItems.map((item, i) => (
            <ShopItemCard
              key={item.id}
              item={item}
              owned={state.unlockedShopItems.includes(item.id)}
              canAfford={state.coins >= item.price}
              onPurchase={handlePurchase}
              index={i}
            />
          ))}
        </View>
      </ScrollView>

      <PurchaseCelebration visible={showCelebration} onComplete={() => setShowCelebration(false)} theme={theme} />
      <LootRewardModal visible={showLootModal} reward={lootReward} box={openedBox} onClose={() => { setShowLootModal(false); setLootReward(null); }} theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: serifFont },
  coinsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  coinsText: { fontSize: 14, fontWeight: '600', marginLeft: 5 },

  scrollContent: { paddingBottom: 40 },

  sectionTitle: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 24, marginBottom: 12, marginTop: 8,
  },

  streakCard: {
    marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1,
  },
  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  streakTitle: { fontSize: 15, fontWeight: '700', fontFamily: serifFont },
  streakInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakDays: { fontSize: 28, fontWeight: '700', fontFamily: serifFont },
  streakBadge: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  streakBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  streakMultiplier: { fontSize: 18, fontWeight: '700', fontFamily: serifFont },
  streakProgressWrap: { marginTop: 10 },
  streakProgressBg: { height: 4, borderRadius: 2, marginBottom: 4 },
  streakProgressFill: { height: 4, borderRadius: 2 },
  streakNext: { fontSize: 10, fontWeight: '500' },

  lootRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  lootCard: {
    borderRadius: 16, padding: 16, alignItems: 'center', overflow: 'hidden',
  },
  lootGlow: {
    position: 'absolute', top: -20, right: -20,
    width: 80, height: 80, borderRadius: 40,
  },
  lootIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  lootName: { fontSize: 14, fontWeight: '700', fontFamily: serifFont, marginBottom: 2 },
  lootDesc: { fontSize: 10, marginBottom: 8 },

  filterRow: { paddingHorizontal: 24, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 24 },

  itemCard: {
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  itemIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  colorSwatch: { width: 24, height: 24, borderRadius: 12 },
  itemInfo: { alignItems: 'center', flex: 1 },
  itemType: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  itemName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  itemDesc: { fontSize: 10, textAlign: 'center' },

  priceBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  priceText: { fontSize: 12, fontWeight: '700', marginLeft: 3 },

  ownedBadge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  activeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 1, marginBottom: 12, marginHorizontal: 24,
  },
  activeLabel: { fontSize: 12, marginLeft: 8 },
  activeValue: { fontSize: 13, fontWeight: '700', marginLeft: 4 },

  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  celebrationCard: {
    padding: 32, borderRadius: 20, alignItems: 'center',
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  celebrationText: { fontSize: 20, fontWeight: '700', fontFamily: serifFont, marginTop: 12 },
  particle: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },

  lootOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  lootModal: {
    width: width - 60, borderRadius: 24, padding: 28, alignItems: 'center',
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  lootModalIcon: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  lootModalTitle: { fontSize: 22, fontWeight: '700', fontFamily: serifFont, marginBottom: 20 },
  rewardList: { width: '100%', gap: 8, marginBottom: 20 },
  rewardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12,
  },
  rewardText: { fontSize: 16, fontWeight: '700', fontFamily: serifFont },
  lootCloseBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  lootCloseText: { fontSize: 15, fontWeight: '700' },
});
