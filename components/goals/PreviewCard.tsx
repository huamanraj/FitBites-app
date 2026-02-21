import { DailyGoals } from "@/lib/goals-service";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function PreviewCard({
  goals,
  aiSource,
  aiNote,
}: {
  goals: DailyGoals;
  aiSource: "ai" | "math" | null;
  aiNote?: string;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Daily Target</Text>
        {aiSource && (
          <View style={[styles.badge, aiSource === "ai" && styles.badgeAI]}>
            <Text style={styles.badgeText}>
              {aiSource === "ai" ? "✨ AI" : "📐 Estimate"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.calBlock}>
          <Text style={styles.calVal}>{goals.calories}</Text>
          <Text style={styles.calLabel}>calories</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.macroGrid}>
          <MacroPill label="P" value={goals.protein} color="#FF6B6B" />
          <MacroPill label="C" value={goals.carbs} color="#4D9EFF" />
          <MacroPill label="F" value={goals.fat} color="#F5A623" />
        </View>
      </View>

      {aiNote && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{aiNote}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.pillText}>
        <Text style={styles.pillLabel}>{label}: </Text>
        {value}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: "Questrial",
    fontSize: 12,
    fontWeight: "300",
    color: "#AAAAAA",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  badge: {
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeAI: { backgroundColor: "#F0EFFF" },
  badgeText: {
    fontFamily: "Questrial",
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
  },
  metricsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  calBlock: {
    flex: 1,
    alignItems: "center",
  },
  calVal: {
    fontFamily: "Questrial",
    fontSize: 32,
    fontWeight: "200",
    color: "#111111",
  },
  calLabel: {
    fontFamily: "Questrial",
    fontSize: 12,
    color: "#AAAAAA",
    marginTop: -2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 10,
  },
  macroGrid: {
    flex: 1.2,
    gap: 6,
    paddingLeft: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#111",
  },
  pillLabel: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  noteBox: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  noteText: {
    fontFamily: "Questrial",
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    fontStyle: "italic",
  },
});
