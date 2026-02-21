import BarChart from "@/components/BarChart";
import MacroSplitBar from "@/components/MacroSplitBar";
import ScreenHeader from "@/components/analytics/ScreenHeader";
import StatsRow from "@/components/analytics/StatsRow";
import TabSwitcher from "@/components/analytics/TabSwitcher";
import { useAuth } from "@/context/auth-context";
import {
  FoodEntry,
  getEntriesForRange,
  getMonthRange,
  getWeekRange,
} from "@/lib/food-service";
import { getDailyGoalsForUser } from "@/lib/goals-service";
import { DrawerActions } from "@react-navigation/native";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Period = "week" | "month";

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [period, setPeriod] = useState<Period>("week");
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goal, setGoal] = useState(2000);

  // Tab indicator animation
  const tabPos = useSharedValue(0);
  const tabStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(tabPos.value, { duration: 250 }) }],
  }));

  // Tab indicator: pill width = (container - 8px padding - gap) / 2
  // container = screenWidth - 40 (horizontal scroll padding)
  // pill padding = 4px each side, so inner = screenWidth - 40 - 8
  const TAB_WIDTH = (screenWidth - 48) / 2;

  const switchPeriod = useCallback(
    (p: Period) => {
      setPeriod(p);
      tabPos.value = p === "week" ? 0 : TAB_WIDTH;
    },
    [tabPos, TAB_WIDTH],
  );

  useEffect(() => {
    if (!user) return;
    getDailyGoalsForUser(user.$id)
      .then((g) => setGoal(g.calories))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const range = period === "week" ? getWeekRange() : getMonthRange();
    getEntriesForRange(user.$id, range.start, range.end)
      .then(setEntries)
      .catch(() => {});
  }, [user, period]);

  const chartData = useMemo(() => {
    const range = period === "week" ? getWeekRange() : getMonthRange();
    const days = eachDayOfInterval({
      start: parseISO(range.start),
      end: parseISO(range.end),
    });

    const dayTotals = new Map<string, number>();
    entries.forEach((e) => {
      dayTotals.set(e.date, (dayTotals.get(e.date) || 0) + e.calories);
    });

    return days.map((d) => ({
      label: format(d, period === "week" ? "EEE" : "d"),
      value: Math.max(dayTotals.get(format(d, "yyyy-MM-dd")) || 0, 0),
    }));
  }, [entries, period]);

  const stats = useMemo(() => {
    const dayTotals = new Map<string, number>();
    entries.forEach((e) => {
      dayTotals.set(e.date, (dayTotals.get(e.date) || 0) + e.calories);
    });

    const values = Array.from(dayTotals.values());
    const avg = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    const best = values.length ? Math.max(...values) : 0;

    return {
      average: Math.round(avg),
      bestDay: Math.round(best),
      totalDays: dayTotals.size,
    };
  }, [entries]);

  const macros = useMemo(() => {
    const totals = entries.reduce(
      (acc, e) => ({
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fat: acc.fat + (e.fat || 0),
      }),
      { protein: 0, carbs: 0, fat: 0 },
    );
    return totals;
  }, [entries]);

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScreenHeader
        title="Analytics"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <TabSwitcher
          period={period}
          onSwitch={switchPeriod}
          tabWidth={TAB_WIDTH}
          tabStyle={tabStyle}
        />

        <Animated.View
          key={period}
          entering={FadeInDown.duration(400).springify()}
          style={styles.chartSection}
        >
          <BarChart
            data={chartData}
            goal={goal}
            width={screenWidth - 40}
            height={220}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(400).springify()}
        >
          <StatsRow
            average={stats.average}
            bestDay={stats.bestDay}
            totalDays={stats.totalDays}
          />

          <View style={styles.macroSection}>
            <MacroSplitBar
              protein={macros.protein}
              carbs={macros.carbs}
              fat={macros.fat}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  macroSection: {
    marginBottom: 32,
  },
});
