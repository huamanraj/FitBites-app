import HamburgerMenu from "@/components/shared/HamburgerMenu";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ScreenHeader({
  title,
  onMenuPress,
}: {
  title: string;
  onMenuPress: () => void;
}) {
  return (
    <View style={styles.header}>
      <HamburgerMenu onPress={onMenuPress} />
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontFamily: "Questrial",
    fontSize: 18,
    fontWeight: "300",
    color: "#111111",
    letterSpacing: 0.2,
  },
});
