import React from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export default function NoInternetBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrap}>
      <Text style={styles.text}>📡 No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#1C1C1E",
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  text: {
    fontFamily: "Questrial",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
