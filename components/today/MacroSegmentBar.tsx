import React from "react";
import { StyleSheet, View } from "react-native";

export default function MacroSegmentBar({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const total = Math.abs(protein) + Math.abs(carbs) + Math.abs(fat) || 1;
  const pPct = Math.round((Math.abs(protein) / total) * 100);
  const cPct = Math.round((Math.abs(carbs) / total) * 100);
  const fPct = Math.round((Math.abs(fat) / total) * 100);
  return (
    <View style={styles.track}>
      <View
        style={[styles.segment, { flex: pPct, backgroundColor: "#FF6B6B" }]}
      />
      <View style={{ width: 3 }} />
      <View
        style={[styles.segment, { flex: cPct, backgroundColor: "#4D9EFF" }]}
      />
      <View style={{ width: 3 }} />
      <View
        style={[styles.segment, { flex: fPct, backgroundColor: "#F5A623" }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
  },
  segment: { height: 7, borderRadius: 4 },
});
