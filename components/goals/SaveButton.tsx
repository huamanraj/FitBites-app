import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SaveButton({
  onPress,
  saving,
  isUpdate,
}: {
  onPress: () => void;
  saving: boolean;
  isUpdate: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      onPress={onPress}
      disabled={saving}
    >
      {saving ? (
        <View style={styles.inner}>
          <ActivityIndicator color="#FFF" />
          <Text style={[styles.text, { marginLeft: 10 }]}>Asking AI…</Text>
        </View>
      ) : (
        <Text style={styles.text}>
          {isUpdate ? "✨ Recalculate Goals" : "✨ Calculate & Save Goals"}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: 28,
    backgroundColor: "#111",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  inner: { flexDirection: "row", alignItems: "center" },
  btnPressed: { opacity: 0.75 },
  text: {
    fontFamily: "Questrial",
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
