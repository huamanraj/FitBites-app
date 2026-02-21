import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function GoalPill({
  label,
  current,
  goal,
  unit,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
}) {
  const over = current > goal;
  const pct = Math.min(current / Math.max(goal, 1), 1);
  return (
    <View style={styles.goalPill}>
      <Text style={styles.goalPillEmoji}>{label}</Text>
      <Text style={[styles.goalPillText, over && styles.goalPillOver]}>
        {current}
        <Text style={styles.goalPillGoal}>
          /{goal}
          {unit}
        </Text>
      </Text>
      <View style={styles.goalPillBar}>
        <View
          style={[
            styles.goalPillFill,
            { width: `${Math.round(pct * 100)}%` as any },
            over && { backgroundColor: "#EF4444" },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  goalPill: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  goalPillEmoji: { fontSize: 13, marginBottom: 2 },
  goalPillText: {
    fontFamily: "Questrial",
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
  goalPillOver: { color: "#EF4444" },
  goalPillGoal: {
    fontFamily: "Questrial",
    fontSize: 10,
    fontWeight: "400",
    color: "#AAA",
  },
  goalPillBar: {
    height: 3,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  goalPillFill: {
    height: 3,
    backgroundColor: "#111",
    borderRadius: 2,
  },
});
