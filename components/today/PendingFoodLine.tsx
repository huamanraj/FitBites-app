import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  interpolate,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// A food entry that has been submitted but whose calories are still being calculated
export interface PendingEntry {
  id: string; // temp local id
  foodName: string;
}

function CalShimmer() {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [anim]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 1], [0.25, 0.65]),
  }));

  return <Animated.View style={[styles.calShimmer, style]} />;
}

export default function PendingFoodLine({ item }: { item: PendingEntry }) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(160)}
      exiting={FadeOut.duration(180)}
      layout={Layout.springify().damping(18)}
      style={styles.row}
    >
      <Text style={styles.name} numberOfLines={1}>
        {item.foodName}
      </Text>
      <CalShimmer />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  name: {
    fontFamily: "Questrial",
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: "#111111",
    marginRight: 16,
    letterSpacing: -0.2,
  },
  calShimmer: {
    width: 36,
    height: 14,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
  },
});
