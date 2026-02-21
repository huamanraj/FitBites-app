import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function HamburgerMenu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={14} style={styles.btn}>
      <View style={styles.icon}>
        <View style={styles.line} />
        <View style={[styles.line, { width: 14 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
  icon: { gap: 5 },
  line: {
    width: 20,
    height: 1.8,
    backgroundColor: "#555555",
    borderRadius: 2,
  },
});
