import { FoodEntry } from "@/lib/food-service";
import { DailyGoals } from "@/lib/goals-service";
import React, { useEffect, useState } from "react";
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
import MacroSegmentBar from "./MacroSegmentBar";

const { height: SCREEN_H } = Dimensions.get("window");

// ─── Delete confirm overlay (in-sheet, no native Alert) ──────────────────────
function DeleteConfirm({
  foodName,
  onCancel,
  onConfirm,
}: {
  foodName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(120)}
      style={dc.overlay}
    >
      <View style={dc.box}>
        <View style={dc.pill} />
        <Text style={dc.title}>Remove entry?</Text>
        <Text style={dc.sub} numberOfLines={2}>
          "{foodName}" will be deleted from today's log.
        </Text>
        <Pressable
          style={({ pressed }) => [
            dc.deleteBtn,
            pressed && dc.deleteBtnPressed,
          ]}
          onPress={onConfirm}
        >
          <Text style={dc.deleteBtnText}>Delete</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            dc.cancelBtn,
            pressed && dc.cancelBtnPressed,
          ]}
          onPress={onCancel}
        >
          <Text style={dc.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const dc = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(242,242,247,0.92)",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  box: { width: "100%", alignItems: "center" },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C8C8CC",
    marginBottom: 28,
  },
  title: {
    fontFamily: "Questrial",
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  deleteBtn: {
    width: "100%",
    backgroundColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteBtnPressed: { opacity: 0.8 },
  deleteBtnText: {
    fontFamily: "Questrial",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  cancelBtn: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  cancelBtnPressed: { opacity: 0.75 },
  cancelBtnText: {
    fontFamily: "Questrial",
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
});

// ─── Main Sheet ───────────────────────────────────────────────────────────────
export default function FoodDetailSheet({
  item,
  visible,
  onClose,
  onDelete,
  dailyGoals,
  todayTotals,
}: {
  item: FoodEntry | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 200, mass: 0.8 })
      : withTiming(SCREEN_H, { duration: 280 });
    // reset confirm state whenever sheet opens/closes
    if (!visible) setConfirmDelete(false);
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!item) return null;

  const isExercise = item.calories < 0;
  const totalMacroG =
    Math.abs(item.protein || 0) +
      Math.abs(item.carbs || 0) +
      Math.abs(item.fat || 0) || 1;
  const pPct = Math.round((Math.abs(item.protein || 0) / totalMacroG) * 100);
  const cPct = Math.round((Math.abs(item.carbs || 0) / totalMacroG) * 100);
  const fPct = Math.round((Math.abs(item.fat || 0) / totalMacroG) * 100);

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    onClose();
    setTimeout(() => onDelete(item.$id), 350);
  };

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
        {/* Delete confirm overlay sits inside the sheet */}
        {confirmDelete && (
          <DeleteConfirm
            foodName={item.foodName}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={handleConfirmDelete}
          />
        )}

        <View style={styles.pill} />

        <View style={styles.topRow}>
          <View style={styles.nameChip}>
            <Text style={styles.nameChipText} numberOfLines={1}>
              {item.foodName}
            </Text>
          </View>
          {/* Delete button — trash icon style */}
          <Pressable
            onPress={() => setConfirmDelete(true)}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && styles.deleteBtnPressed,
            ]}
            hitSlop={10}
          >
            <Text style={styles.deleteBtnIcon}>⌫</Text>
          </Pressable>
        </View>

        <View style={styles.nutritionCard}>
          <Text style={[styles.calsText, isExercise && styles.calsExercise]}>
            {isExercise
              ? `−${Math.abs(item.calories)} cals burned`
              : `${item.calories} cals`}
          </Text>

          <View style={styles.macroRow}>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text>
                <Text style={[styles.macroValueNum, { color: "#FF6B6B" }]}>
                  {item.protein || 0}g{" "}
                </Text>
                <Text style={styles.macroPercent}>{pPct}%</Text>
              </Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text>
                <Text style={[styles.macroValueNum, { color: "#4D9EFF" }]}>
                  {item.carbs || 0}g{" "}
                </Text>
                <Text style={styles.macroPercent}>{cPct}%</Text>
              </Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text>
                <Text style={[styles.macroValueNum, { color: "#F5A623" }]}>
                  {item.fat || 0}g{" "}
                </Text>
                <Text style={styles.macroPercent}>{fPct}%</Text>
              </Text>
            </View>
          </View>

          <MacroSegmentBar
            protein={item.protein || 0}
            carbs={item.carbs || 0}
            fat={item.fat || 0}
          />
        </View>

        {dailyGoals && (
          <View style={styles.goalsCard}>
            <Text style={styles.goalsTitle}>Today's Progress</Text>
            <GoalBar
              label="Calories"
              eaten={todayTotals.calories}
              goal={dailyGoals.calories}
              color="#FF6B6B"
            />
            <GoalBar
              label="Protein"
              eaten={todayTotals.protein}
              goal={dailyGoals.protein}
              color="#4D9EFF"
            />
            <GoalBar
              label="Carbs"
              eaten={todayTotals.carbs}
              goal={dailyGoals.carbs}
              color="#F5A623"
            />
            <GoalBar
              label="Fat"
              eaten={todayTotals.fat}
              goal={dailyGoals.fat}
              color="#A78BFA"
            />
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.learnBtn,
            pressed && styles.learnBtnPressed,
          ]}
          onPress={onClose}
        >
          <Text style={styles.learnBtnText}>Done</Text>
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
    overflow: "hidden",
  },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C8C8CC",
    alignSelf: "center",
    marginBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  nameChip: {
    backgroundColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: "78%",
  },
  nameChipText: {
    fontFamily: "Questrial",
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFE5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnPressed: { opacity: 0.7 },
  deleteBtnIcon: {
    fontSize: 18,
    color: "#EF4444",
    lineHeight: 22,
  },
  nutritionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 10,
  },
  calsText: {
    fontFamily: "Questrial",
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  calsExercise: { color: "#22C55E" },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  macroCol: { flex: 1 },
  macroLabel: {
    fontFamily: "Questrial",
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 3,
  },
  macroValueNum: {
    fontFamily: "Questrial",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  macroPercent: {
    fontFamily: "Questrial",
    fontSize: 13,
    color: "#888888",
    fontWeight: "400" as const,
  },
  goalsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
  },
  goalsTitle: {
    fontFamily: "Questrial",
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  learnBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  learnBtnPressed: { opacity: 0.75 },
  learnBtnText: {
    fontFamily: "Questrial",
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
});
