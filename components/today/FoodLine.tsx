import { FoodEntry } from "@/lib/food-service";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export default function FoodLine({
  item,
  index,
  onPress,
  onDelete,
}: {
  item: FoodEntry;
  index: number;
  onPress: (item: FoodEntry) => void;
  onDelete: (id: string) => void;
}) {
  const isExercise = item.calories < 0;
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40)
        .springify()
        .damping(18)
        .stiffness(160)}
      exiting={FadeOut.duration(180)}
      layout={Layout.springify().damping(18)}
      style={styles.foodLine}
    >
      <Animated.View style={scaleStyle}>
        <Pressable
          onPress={() => onPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.foodLineInner}
          android_ripple={{ color: "#F0F0F0" }}
        >
          <Text style={styles.foodLineName} numberOfLines={1}>
            {item.foodName}
          </Text>
          <Text
            style={[
              styles.foodLineCal,
              isExercise && styles.foodLineCalExercise,
            ]}
          >
            {item.calories}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  foodLine: { overflow: "hidden", borderRadius: 6 },
  foodLineInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  foodLineName: {
    fontFamily: "Questrial",
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: "#111111",
    marginRight: 16,
    letterSpacing: -0.2,
  },
  foodLineCal: {
    fontFamily: "Questrial",
    fontSize: 17,
    fontWeight: "400",
    color: "#111111",
    letterSpacing: -0.2,
  },
  foodLineCalExercise: { color: "#22C55E" },
});
