import { useAuth } from "@/context/auth-context";
import { getHistoryDays } from "@/lib/food-service";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { format, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HISTORY_PAGE_SIZE = 7;

function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<
    { date: string; totalCalories: number }[]
  >([]);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    if (user) {
      getHistoryDays(user.$id, 30)
        .then(setHistory)
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login" as any);
        },
      },
    ]);
  }, [logout, router]);

  const visibleHistory = history.slice(0, historyPage * HISTORY_PAGE_SIZE);
  const hasMore = visibleHistory.length < history.length;

  return (
    <View style={[styles.drawerContainer]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[
          styles.drawerScroll,
          { paddingTop: Math.max(insets.top + 16, 32) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/images/icon-nobg.png")}
            style={styles.brandIcon}
            resizeMode="contain"
          />
          <Text style={styles.drawerBrand}>Fit Bites</Text>
        </View>

        {/* Navigation */}
        <View style={styles.navSection}>
          <Pressable
            style={({ pressed }) => [
              styles.drawerItem,
              pressed && styles.drawerItemPressed,
            ]}
            onPress={() => router.push("/(drawer)/today" as any)}
          >
            <Text style={styles.drawerItemText}>Today</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.drawerItem,
              pressed && styles.drawerItemPressed,
            ]}
            onPress={() => router.push("/(drawer)/analytics" as any)}
          >
            <Text style={styles.drawerItemText}>Analytics</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.drawerItem,
              pressed && styles.drawerItemPressed,
            ]}
            onPress={() => router.push("/(drawer)/goals" as any)}
          >
            <Text style={styles.drawerItemText}>Goals</Text>
          </Pressable>
        </View>

        {/* History */}
        <Text style={styles.drawerSectionTitle}>History</Text>
        {history.length === 0 && (
          <Text style={styles.noHistory}>No entries yet.</Text>
        )}
        {visibleHistory.map((day) => (
          <Pressable
            key={day.date}
            style={({ pressed }) => [
              styles.historyItem,
              pressed && styles.historyItemPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/(drawer)/day/[date]" as any,
                params: { date: day.date },
              } as any)
            }
          >
            <Text style={styles.historyDate}>
              {format(parseISO(day.date), "MMM dd")}
            </Text>
            <Text style={styles.historyCals}>{day.totalCalories} cal</Text>
          </Pressable>
        ))}
        {hasMore && (
          <Pressable
            style={styles.showMoreBtn}
            onPress={() => setHistoryPage((p) => p + 1)}
          >
            <Text style={styles.showMoreText}>Show more</Text>
          </Pressable>
        )}
      </DrawerContentScrollView>

      {/* Bottom section — pinned, safe-area-aware */}
      <View
        style={[
          styles.drawerBottom,
          { paddingBottom: Math.max(insets.bottom + 8, 24) },
        ]}
      >
        {/* User name only — no avatar, no email */}
        <Text style={styles.userName} numberOfLines={1}>
          {user?.name || "User"}
        </Text>

        {/* Settings & Logout on two separate lines */}
        <Pressable
          style={({ pressed }) => [
            styles.bottomBtn,
            pressed && styles.bottomBtnPressed,
          ]}
          onPress={() => router.push("/(drawer)/settings" as any)}
        >
          <Text style={styles.bottomBtnText}>Settings</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.bottomBtn,
            pressed && styles.bottomBtnPressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={[styles.bottomBtnText, styles.logoutText]}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        overlayColor: "rgba(0,0,0,0.3)",
        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 280,
        },
        sceneStyle: { backgroundColor: "#FFFFFF" },
        drawerLabelStyle: { fontFamily: "Questrial" },
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="today" options={{ title: "Today" }} />
      <Drawer.Screen name="analytics" options={{ title: "Analytics" }} />
      <Drawer.Screen name="goals" options={{ title: "Goals" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
      <Drawer.Screen name="day/[date]" options={{ title: "Day View" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  drawerScroll: {
    paddingHorizontal: 22,
  },

  // ── Brand ─────────────────────────────────────────────────────────
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36,
    gap: 10,
  },
  brandIcon: {
    width: 52,
    height: 52,
  },
  drawerBrand: {
    fontFamily: "Questrial",
    fontSize: 32,
    fontWeight: "200",
    color: "#111111",
    letterSpacing: 2,
  },

  // ── Nav items ──────────────────────────────────────────────────────
  navSection: {
    marginBottom: 8,
  },
  drawerItem: {
    paddingVertical: 11,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  drawerItemPressed: {
    opacity: 0.5,
  },
  drawerItemText: {
    fontFamily: "Questrial",
    fontSize: 20,
    fontWeight: "400",
    color: "#111111",
  },

  // ── History ────────────────────────────────────────────────────────
  drawerSectionTitle: {
    fontFamily: "Questrial",
    fontSize: 11,
    fontWeight: "600",
    color: "#AAAAAA",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  noHistory: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#CCCCCC",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  historyItemPressed: {
    opacity: 0.5,
  },
  historyDate: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#333333",
  },
  historyCals: {
    fontFamily: "Questrial",
    fontSize: 13,
    color: "#AAAAAA",
  },
  showMoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  showMoreText: {
    fontFamily: "Questrial",
    fontSize: 13,
    color: "#AAAAAA",
    fontWeight: "600",
  },

  // ── Bottom ──────────────────────────────────────────────────────────
  drawerBottom: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EEEEEE",
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  userName: {
    fontFamily: "Questrial",
    fontSize: 13,
    fontWeight: "600",
    color: "#AAAAAA",
    marginBottom: 10,
  },
  bottomBtn: {
    paddingVertical: 9,
    borderRadius: 6,
  },
  bottomBtnPressed: {
    opacity: 0.5,
  },
  bottomBtnText: {
    fontFamily: "Questrial",
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  logoutText: {
    color: "#EF4444",
  },
});
