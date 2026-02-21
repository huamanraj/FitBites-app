import FoodRow from "@/components/FoodRow";
import ShimmerPlaceholder from "@/components/ShimmerPlaceholder";
import HamburgerMenu from "@/components/shared/HamburgerMenu";
import DayProgressSheet from "@/components/today/DayProgressSheet";
import { useAuth } from "@/context/auth-context";
import { FoodEntry, getEntriesByDate } from "@/lib/food-service";
import { DailyGoals, getDailyGoalsForUser } from "@/lib/goals-service";
import { DrawerActions } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { format, parseISO } from "date-fns";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DayViewScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [progressVisible, setProgressVisible] = useState(false);

  useEffect(() => {
    if (user && date) {
      getEntriesByDate(user.$id, date)
        .then(setEntries)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [user, date]);

  useEffect(() => {
    const loadGoals = () => {
      if (user) {
        getDailyGoalsForUser(user.$id)
          .then(setDailyGoals)
          .catch(() => {});
      }
    };
    loadGoals(); // initial
    return navigation.addListener("focus", loadGoals);
  }, [user, navigation]);

  const totalCalories = useMemo(
    () => entries.reduce((sum, e) => sum + e.calories, 0),
    [entries],
  );

  const todayTotals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + (e.protein || 0),
          carbs: acc.carbs + (e.carbs || 0),
          fat: acc.fat + (e.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [entries],
  );

  const formattedDate = date ? format(parseISO(date), "MMMM d, yyyy") : "";

  // Read-only view — no deletes
  const handleDelete = useCallback(() => {}, []);

  const renderItem = useCallback(
    ({ item, index }: { item: FoodEntry; index: number }) => (
      <FoodRow item={item} index={index} onDelete={handleDelete} />
    ),
    [handleDelete],
  );

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(350)}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Header — hamburger only, no back button */}
        <View style={styles.header}>
          <HamburgerMenu
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />
          <View style={{ width: 36 }} />
        </View>

        {/* Date title + tappable calorie count */}
        <Animated.View
          entering={FadeInDown.delay(60).springify()}
          style={styles.titleBlock}
        >
          <Text style={styles.pageTitle}>{formattedDate}</Text>

          <Pressable
            onPress={() => dailyGoals && setProgressVisible(true)}
            hitSlop={10}
          >
            <Text
              style={[
                styles.subtitle,
                totalCalories > 0 && styles.subtitleActive,
              ]}
            >
              {dailyGoals
                ? `${totalCalories} / ${dailyGoals.calories} cal`
                : `${totalCalories} cal`}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Food list */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.shimmerWrap}>
              <ShimmerPlaceholder />
              <ShimmerPlaceholder />
              <ShimmerPlaceholder />
            </View>
          ) : (
            <FlashList
              data={entries}
              renderItem={renderItem}
              keyExtractor={(item) => item.$id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No entries for this day.</Text>
              }
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </Animated.View>

      {/* Progress sheet — same as today page */}
      <DayProgressSheet
        visible={progressVisible}
        onClose={() => setProgressVisible(false)}
        dailyGoals={dailyGoals}
        todayTotals={todayTotals}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  pageTitle: {
    fontFamily: "Questrial",
    fontSize: 28,
    fontWeight: "200",
    color: "#111111",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: "Questrial",
    fontSize: 15,
    color: "#CCCCCC",
    marginTop: 4,
  },
  subtitleActive: {
    color: "#888888",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 32,
  },
  shimmerWrap: {
    paddingTop: 8,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    marginTop: 48,
  },
});
