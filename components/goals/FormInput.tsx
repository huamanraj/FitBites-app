import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  maxLength?: number;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#CCC"
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: {
    fontFamily: "Questrial",
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    fontFamily: "Questrial",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#FAFAFA",
  },
});
