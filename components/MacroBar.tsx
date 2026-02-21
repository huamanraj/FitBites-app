import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MacroBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const MacroBar = React.memo(function MacroBar({
  label,
  value,
  maxValue,
  color,
}: MacroBarProps) {
  const percentage =
    maxValue > 0 ? Math.min((Math.abs(value) / maxValue) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.abs(value).toFixed(1)}g</Text>
      </View>
      <View style={styles.trackOuter}>
        <View
          style={[
            styles.trackFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontFamily: "Questrial",
    fontSize: 12,
    color: "#888888",
  },
  value: {
    fontFamily: "Questrial",
    fontSize: 12,
    color: "#000000",
    fontWeight: "600",
  },
  trackOuter: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: 3,
  },
});

export default MacroBar;
