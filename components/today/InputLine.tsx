import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import Animated from "react-native-reanimated";

const PLACEHOLDERS = [
  "2 wheat roti...",
  "rice 50g...",
  "1 bowl (100ml) daal...",
  "aloo sabzi 1 katori...",
  "paneer 80g...",
  "1 glass (200ml) lassi...",
  "poha 1 plate (150g)...",
  "2 idli + sambar...",
  "chana masala 100g...",
  "1 paratha with ghee...",
  "rajma 1 bowl (150g)...",
  "curd 100g...",
  "1 banana...",
  "upma 1 plate (120g)...",
  "moong daal khichdi 150g...",
];

export default function InputLine({
  value,
  onChangeText,
  onSubmit,
  disabled,
  inputRef,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  inputRef: React.RefObject<TextInput | null>;
}) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={styles.inputLine}>
      <TextInput
        ref={inputRef}
        style={styles.inputLineText}
        placeholder={PLACEHOLDERS[placeholderIndex]}
        placeholderTextColor="#BBBBBB"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        autoFocus
        editable={!disabled}
        blurOnSubmit={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inputLine: { paddingVertical: 1, paddingHorizontal: 2 },
  inputLineText: {
    fontFamily: "Questrial",
    fontSize: 17,
    fontWeight: "400",
    color: "#111111",
    paddingVertical: 5,
    letterSpacing: -0.2,
  },
});
