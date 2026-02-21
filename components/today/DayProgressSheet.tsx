import { DailyGoals } from "@/lib/goals-service";
import React, { useEffect } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GoalBar from "./GoalBar";

const { height: SCREEN_H } = Dimensions.get("window");

// Thin animated fill bar for the calorie ring
function CalRing({ eaten, goal }: { eaten: number; goal: number }) {
  const pct = Math.min(eaten / Math.max(goal, 1), 1);
  const remaining = Math.max(goal - eaten, 0);
  const over = eaten > goal;

  return (
    <View style={ring.wrap}>
      {/* big number */}
      <View style={ring.centre}>
        <Text style={[ring.num, over && { color: "#EF4444" }]}>{eaten}</Text>
        <Text style={ring.sub}>of {goal} cal</Text>
      </View>

      {/* slim bar beneath */}
      <View style={ring.track}>
        <View
          style={[
            ring.fill,
            {
              width: `${Math.round(pct * 100)}%` as any,
              backgroundColor: over ? "#EF4444" : "#1C1C1E",
            },
          ]}
        />
      </View>

      <Text style={[ring.remaining, over && { color: "#EF4444" }]}>
        {over ? `${eaten - goal} cal over goal` : `${remaining} cal remaining`}
      </Text>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 20 },
  centre: { alignItems: "center", marginBottom: 14 },
  num: {
    fontFamily: "Questrial",
    fontSize: 52,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -1,
    lineHeight: 56,
  },
  sub: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  track: {
    width: "100%",
    height: 5,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  fill: { height: 5, borderRadius: 3 },
  remaining: {
    fontFamily: "Questrial",
    fontSize: 13,
    color: "#888",
  },
});

// ─── Main Sheet ───────────────────────────────────────────────────────────────
export default function DayProgressSheet({
  visible,
  onClose,
  dailyGoals,
  todayTotals,
}: {
  visible: boolean;
  onClose: () => void;
  dailyGoals: DailyGoals | null;
  todayTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 200, mass: 0.8 })
      : withTiming(SCREEN_H, { duration: 280 });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!dailyGoals) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(280)}
          style={styles.scrim}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 20) },
          sheetStyle,
        ]}
      >
        {/* Drag pill */}
        <View style={styles.pill} />

        {/* Header label */}
        <Text style={styles.heading}>Today's Progress</Text>

        {/* Calorie summary card */}
        <View style={styles.card}>
          <CalRing eaten={todayTotals.calories} goal={dailyGoals.calories} />
        </View>

        {/* Macro bars card */}
        <View style={styles.card}>
          <GoalBar
            label="Protein"
            eaten={todayTotals.protein}
            goal={dailyGoals.protein}
            color="#FF6B6B"
          />
          <GoalBar
            label="Carbs"
            eaten={todayTotals.carbs}
            goal={dailyGoals.carbs}
            color="#4D9EFF"
          />
          <GoalBar
            label="Fat"
            eaten={todayTotals.fat}
            goal={dailyGoals.fat}
            color="#F5A623"
          />
        </View>

        {/* AI note if present */}
        {!!dailyGoals.note && (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{dailyGoals.note}</Text>
          </View>
        )}

        {/* Done */}
        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            pressed && styles.doneBtnPressed,
          ]}
          onPress={onClose}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F2F2F7",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C8C8CC",
    alignSelf: "center",
    marginBottom: 20,
  },
  heading: {
    fontFamily: "Questrial",
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 10,
  },
  noteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 10,
  },
  noteText: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  doneBtnPressed: { opacity: 0.75 },
  doneBtnText: {
    fontFamily: "Questrial",
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
});
