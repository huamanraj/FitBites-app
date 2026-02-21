import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SectionHeader({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 20, marginBottom: 10 },
  title: {
    fontFamily: "Questrial",
    fontSize: 15,
    fontWeight: "500",
    color: "#111111",
    letterSpacing: -0.1,
  },
  sub: {
    fontFamily: "Questrial",
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});
