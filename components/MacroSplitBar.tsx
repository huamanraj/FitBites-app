import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MacroSplitBarProps {
  protein: number;
  carbs: number;
  fat: number;
}

const MacroSplitBar = React.memo(function MacroSplitBar({
  protein,
  carbs,
  fat,
}: MacroSplitBarProps) {
  const total = protein + carbs + fat;
  if (total === 0) return null;

  const proteinPct = (protein / total) * 100;
  const carbsPct = (carbs / total) * 100;
  const fatPct = (fat / total) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Macro Split</Text>
      <View style={styles.barOuter}>
        {proteinPct > 0 && (
          <View
            style={[
              styles.segment,
              { width: `${proteinPct}%`, backgroundColor: "#EF4444" },
            ]}
          />
        )}
        {carbsPct > 0 && (
          <View
            style={[
              styles.segment,
              { width: `${carbsPct}%`, backgroundColor: "#3B82F6" },
            ]}
          />
        )}
        {fatPct > 0 && (
          <View
            style={[
              styles.segment,
              { width: `${fatPct}%`, backgroundColor: "#F97316" },
            ]}
          />
        )}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
          <Text style={styles.legendText}>
            Protein {proteinPct.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#3B82F6" }]} />
          <Text style={styles.legendText}>Carbs {carbsPct.toFixed(0)}%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#F97316" }]} />
          <Text style={styles.legendText}>Fat {fatPct.toFixed(0)}%</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontFamily: "Questrial",
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  barOuter: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
  },
  segment: {
    height: "100%",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontFamily: "Questrial",
    fontSize: 12,
    color: "#888888",
  },
});

export default MacroSplitBar;
