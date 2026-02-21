import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const ShimmerPlaceholder = React.memo(function ShimmerPlaceholder() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, styles.barLong, animatedStyle]} />
      <Animated.View style={[styles.bar, styles.barShort, animatedStyle]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  bar: {
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    height: 16,
  },
  barLong: {
    flex: 1,
    marginRight: 24,
  },
  barShort: {
    width: 48,
  },
});

export default ShimmerPlaceholder;
