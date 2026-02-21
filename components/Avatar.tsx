import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AvatarProps {
  name: string;
  size?: number;
}

const COLORS = ["#000000", "#333333", "#555555", "#777777"];

const Avatar = React.memo(function Avatar({ name, size = 48 }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const colorIdx = name ? name.charCodeAt(0) % COLORS.length : 0;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS[colorIdx],
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

export default Avatar;
