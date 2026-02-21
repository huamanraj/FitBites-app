import type { FoodEntry } from "@/lib/food-service";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import MacroBar from "./MacroBar";

interface FoodRowProps {
  item: FoodEntry;
  index: number;
  onDelete: (id: string) => void;
}

const FoodRow = React.memo(function FoodRow({
  item,
  index,
  onDelete,
}: FoodRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isExercise = item.calories < 0;

  const handlePress = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleLongPress = useCallback(() => {
    Alert.alert("Delete Entry", `Remove "${item.foodName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(item.$id),
      },
    ]);
  }, [item.$id, item.foodName, onDelete]);

  const maxMacro = Math.max(
    Math.abs(item.protein || 0),
    Math.abs(item.carbs || 0),
    Math.abs(item.fat || 0),
    1,
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.mainRow}>
          <Text style={styles.foodName} numberOfLines={1}>
            {item.foodName}
          </Text>
          <Text
            style={[styles.calories, isExercise && styles.exerciseCalories]}
          >
            {item.calories > 0 ? "+" : ""}
            {item.calories} cal
          </Text>
        </View>

        {expanded && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={styles.macroContainer}
          >
            <MacroBar
              label="Protein"
              value={item.protein || 0}
              maxValue={maxMacro}
              color="#EF4444"
            />
            <MacroBar
              label="Carbs"
              value={item.carbs || 0}
              maxValue={maxMacro}
              color="#3B82F6"
            />
            <MacroBar
              label="Fat"
              value={item.fat || 0}
              maxValue={maxMacro}
              color="#F97316"
            />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  rowPressed: {
    backgroundColor: "#FAFAFA",
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodName: {
    fontFamily: "Questrial",
    fontSize: 16,
    color: "#000000",
    flex: 1,
    marginRight: 16,
  },
  calories: {
    fontFamily: "Questrial",
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  exerciseCalories: {
    color: "#16A34A",
  },
  macroContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
  },
});

export default FoodRow;
