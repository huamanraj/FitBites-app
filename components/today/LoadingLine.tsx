import ShimmerPlaceholder from "@/components/ShimmerPlaceholder";
import React from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export default function LoadingLine() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.loadingLine}
    >
      <ShimmerPlaceholder />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingLine: { paddingVertical: 5, paddingHorizontal: 2 },
});
