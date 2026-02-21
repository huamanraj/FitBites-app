import HamburgerMenu from "@/components/shared/HamburgerMenu";
import { useAuth } from "@/context/auth-context";
import { updateName } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings-service";
import { DrawerActions } from "@react-navigation/native";
import Constants from "expo-constants";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      if (settings.displayName) setDisplayName(settings.displayName);
      else if (user?.name) setDisplayName(user.name);
    })();
  }, [user]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveSettings({
        displayName: displayName.trim(),
        dailyCalorieGoal: 2000, // kept internally but not exposed in UI
      });

      if (displayName.trim() !== user?.name) {
        await updateName(displayName.trim());
        updateUser({ name: displayName.trim() });
      }

      Alert.alert("Saved", "Your settings have been updated.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }, [displayName, user, updateUser]);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <HamburgerMenu
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        {/* Display Name */}
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor="#AAAAAA"
        />

        {/* Save */}
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>

        {/* Version */}
        <Text style={styles.version}>Fit Bites v{appVersion}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontFamily: "Questrial",
    fontSize: 18,
    fontWeight: "300",
    color: "#111111",
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  label: {
    fontFamily: "Questrial",
    fontSize: 12,
    fontWeight: "600",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    fontFamily: "Questrial",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
  },
  saveBtn: {
    backgroundColor: "#111111",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 36,
  },
  saveBtnPressed: {
    opacity: 0.8,
  },
  saveBtnText: {
    fontFamily: "Questrial",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  version: {
    fontFamily: "Questrial",
    textAlign: "center",
    color: "#CCCCCC",
    fontSize: 12,
    marginTop: "auto" as any,
    marginBottom: 24,
  },
});
