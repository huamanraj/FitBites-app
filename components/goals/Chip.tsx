import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    backgroundColor: "#FAFAFA",
  },
  selected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  text: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  textSelected: {
    fontFamily: "Questrial",
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
