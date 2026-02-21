import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function GoalBar({
  label,
  eaten,
  goal,
  color,
}: {
  label: string;
  eaten: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min(Math.abs(eaten) / Math.max(goal, 1), 1);
  const over = Math.abs(eaten) > goal;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, over && { color: "#EF4444" }]}>
          {Math.round(Math.abs(eaten))} / {goal}
          {label !== "Calories" ? "g" : " cal"}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(pct * 100)}%` as any,
              backgroundColor: over ? "#EF4444" : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { fontSize: 13, color: "#555", fontWeight: "500" },
  value: { fontSize: 12, color: "#888", fontWeight: "600" },
  track: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: "#111" },
});
