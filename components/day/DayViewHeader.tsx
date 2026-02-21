import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function DayViewHeader({
  onMenuPress,
  onBackPress,
}: {
  onMenuPress: () => void;
  onBackPress: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onMenuPress} style={styles.btn} hitSlop={12}>
        <Text style={styles.hamburger}>☰</Text>
      </Pressable>
      <Pressable onPress={onBackPress} style={styles.btn} hitSlop={12}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  btn: {
    padding: 4,
  },
  hamburger: {
    fontSize: 24,
    color: "#000000",
  },
  backText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
  },
});
