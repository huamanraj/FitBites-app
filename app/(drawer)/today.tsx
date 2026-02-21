import ShimmerPlaceholder from "@/components/ShimmerPlaceholder";
import HamburgerMenu from "@/components/shared/HamburgerMenu";
import DayProgressSheet from "@/components/today/DayProgressSheet";
import FoodDetailSheet from "@/components/today/FoodDetailSheet";
import FoodLine from "@/components/today/FoodLine";
import InputLine from "@/components/today/InputLine";
import NoInternetBanner from "@/components/today/NoInternetBanner";
import PendingFoodLine, {
  PendingEntry,
} from "@/components/today/PendingFoodLine";
import { useAuth } from "@/context/auth-context";
import {
  addFoodEntry,
  deleteEntry,
  estimateCalories,
  FoodEntry,
  getTodayEntries,
} from "@/lib/food-service";
import { DailyGoals, getDailyGoalsForUser } from "@/lib/goals-service";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TodayScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [inputText, setInputText] = useState("");
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [noInternet, setNoInternet] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Pending queue: items whose name is shown immediately while cal is calculating
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);

  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Per-entry processing: set of temp ids currently being processed
  const processingIds = useRef<Set<string>>(new Set());

  // Load today's entries
  useEffect(() => {
    if (user) {
      getTodayEntries(user.$id)
        .then(setEntries)
        .catch(() => {})
        .finally(() => setIsInitLoading(false));
    }
  }, [user]);

  // Load daily goals from Appwrite
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

  // Today's macro totals for goal sheet
  const todayTotals = useMemo(
    () => ({
      calories: entries.reduce((s, e) => s + e.calories, 0),
      protein: entries.reduce((s, e) => s + (e.protein || 0), 0),
      carbs: entries.reduce((s, e) => s + (e.carbs || 0), 0),
      fat: entries.reduce((s, e) => s + (e.fat || 0), 0),
    }),
    [entries],
  );

  const showError = (msg: string) => {
    setErrorMsg(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 5000);
  };

  // ── Submit: food name appears instantly, cal calculates in background ────────
  const handleSubmit = useCallback(async () => {
    const food = inputText.trim();
    if (!food || !user) return;

    // Clear input immediately so user can type the next entry
    setInputText("");
    setErrorMsg(null);
    setNoInternet(false);

    // Add to pending queue so name shows up on the list right away
    const tempId = `pending-${Date.now()}-${Math.random()}`;
    const pending: PendingEntry = { id: tempId, foodName: food };
    setPendingEntries((prev) => [...prev, pending]);
    processingIds.current.add(tempId);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    setTimeout(() => inputRef.current?.focus(), 80);

    try {
      const macros = await estimateCalories(food);
      const entry = await addFoodEntry(user.$id, food, macros);

      // Replace pending item with real entry
      setPendingEntries((prev) => prev.filter((p) => p.id !== tempId));
      setEntries((prev) => [...prev, entry]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      // Remove the pending item on any error
      setPendingEntries((prev) => prev.filter((p) => p.id !== tempId));

      if (msg.startsWith("invalid-entry:")) {
        const parts = msg.replace("invalid-entry:", "").split("\n");
        setInputText(food); // restore so user can fix it
        showError(parts.join(" · "));
      } else if (
        msg.startsWith("network:") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("timeout")
      ) {
        setInputText(food);
        setNoInternet(true);
        setTimeout(() => setNoInternet(false), 4000);
      } else {
        Alert.alert("Error", msg || "Failed to estimate calories.");
      }
    } finally {
      processingIds.current.delete(tempId);
    }
  }, [inputText, user]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.$id !== id));
    } catch {
      Alert.alert("Error", "Failed to delete entry.");
    }
  }, []);

  const handleFoodPress = useCallback((item: FoodEntry) => {
    setSelectedEntry(item);
    setSheetVisible(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSelectedEntry(null), 350);
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: insets.top }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* No internet banner */}
        <NoInternetBanner visible={noInternet} />
        {/* Invalid entry banner */}
        {!!errorMsg && (
          <Animated.View
            entering={FadeIn.duration(250)}
            style={styles.errorBanner}
          >
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </Animated.View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <HamburgerMenu
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />
        </View>

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.titleLabel}>Today</Text>
          <Pressable
            onPress={() => dailyGoals && setProgressVisible(true)}
            hitSlop={10}
          >
            <Animated.Text
              key={totalCalories}
              entering={FadeIn.duration(300)}
              style={[
                styles.titleCals,
                totalCalories !== 0 && styles.titleCalsActive,
              ]}
            >
              {dailyGoals
                ? `${totalCalories} / ${dailyGoals.calories} cal`
                : totalCalories !== 0
                  ? `cals  ${totalCalories}`
                  : "cals"}
            </Animated.Text>
          </Pressable>
        </View>

        {/* Notes-style list */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 16, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={() => {
            if (!isInitLoading)
              setTimeout(
                () => scrollRef.current?.scrollToEnd({ animated: false }),
                50,
              );
          }}
        >
          {isInitLoading ? (
            <>
              <View style={styles.shimmerWrap}>
                <ShimmerPlaceholder />
              </View>
              <View style={styles.shimmerWrap}>
                <ShimmerPlaceholder />
              </View>
              <View style={styles.shimmerWrap}>
                <ShimmerPlaceholder />
              </View>
            </>
          ) : (
            <>
              {entries.map((item, index) => (
                <FoodLine
                  key={item.$id}
                  item={item}
                  index={index}
                  onPress={handleFoodPress}
                  onDelete={handleDelete}
                />
              ))}
              {/* Pending entries: name shown, cal shimmer */}
              {pendingEntries.map((p) => (
                <PendingFoodLine key={p.id} item={p} />
              ))}
              {/* Input is always visible — user can type next food at any time */}
              <InputLine
                value={inputText}
                onChangeText={setInputText}
                onSubmit={handleSubmit}
                disabled={false}
                inputRef={inputRef}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FoodDetailSheet
        item={selectedEntry}
        visible={sheetVisible}
        onClose={handleSheetClose}
        onDelete={handleDelete}
        dailyGoals={dailyGoals}
        todayTotals={todayTotals}
      />
      <DayProgressSheet
        visible={progressVisible}
        onClose={() => setProgressVisible(false)}
        dailyGoals={dailyGoals}
        todayTotals={todayTotals}
      />
    </>
  );
}

// ─── Main Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
  },
  titleLabel: {
    fontFamily: "Questrial",
    fontSize: 26,
    fontWeight: "300",
    color: "#AAAAAA",
    letterSpacing: 0.2,
  },
  titleCals: {
    fontFamily: "Questrial",
    fontSize: 15,
    color: "#BBBBBB",
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  titleCalsActive: {
    fontFamily: "Questrial",
    color: "#333333",
    fontWeight: "600",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22 },
  shimmerWrap: { paddingVertical: 5 },
  errorBanner: {
    backgroundColor: "#FFF3CD",
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  errorBannerText: {
    fontFamily: "Questrial",
    color: "#7A4F00",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
