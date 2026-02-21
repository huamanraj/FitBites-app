import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

type Period = "week" | "month";

export default function TabSwitcher({
  period,
  onSwitch,
  tabWidth,
  tabStyle,
}: {
  period: Period;
  onSwitch: (p: Period) => void;
  tabWidth: number;
  tabStyle: any;
}) {
  return (
    <View style={styles.container}>
      {/* Sliding indicator */}
      <Animated.View
        style={[styles.indicator, { width: tabWidth }, tabStyle]}
      />
      <Pressable style={styles.tab} onPress={() => onSwitch("week")}>
        <Text style={[styles.text, period === "week" && styles.textActive]}>
          Week
        </Text>
      </Pressable>
      <Pressable style={styles.tab} onPress={() => onSwitch("month")}>
        <Text style={[styles.text, period === "month" && styles.textActive]}>
          Month
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    position: "relative",
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    zIndex: 1,
  },
  text: {
    fontFamily: "Questrial",
    fontSize: 15,
    color: "#AAAAAA",
    fontWeight: "500",
  },
  textActive: {
    color: "#111111",
    fontWeight: "600",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    // subtle shadow so it lifts off the track
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
