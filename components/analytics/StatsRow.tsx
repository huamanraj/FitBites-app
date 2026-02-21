import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function StatsRow({
  average,
  bestDay,
  totalDays,
}: {
  average: number;
  bestDay: number;
  totalDays: number;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Text style={styles.value}>{average}</Text>
        <Text style={styles.label}>Avg / Day</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.value}>{bestDay}</Text>
        <Text style={styles.label}>Best Day</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.value}>{totalDays}</Text>
        <Text style={styles.label}>Days</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
  },
  item: {
    alignItems: "center",
  },
  value: {
    fontFamily: "Questrial",
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  label: {
    fontFamily: "Questrial",
    fontSize: 12,
    color: "#888888",
    marginTop: 4,
  },
});
