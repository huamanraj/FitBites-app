import Chip from "@/components/goals/Chip";
import FormInput from "@/components/goals/FormInput";
import PreviewCard from "@/components/goals/PreviewCard";
import SaveButton from "@/components/goals/SaveButton";
import SectionHeader from "@/components/goals/SectionHeader";
import HamburgerMenu from "@/components/shared/HamburgerMenu";
import { useAuth } from "@/context/auth-context";
import {
  ActivityLevel,
  calculateDailyGoals,
  FoodPreference,
  Gender,
  getUserGoalProfile,
  GoalType,
  saveUserGoalProfile,
  UserGoalProfile,
} from "@/lib/goals-service";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Skeleton helpers ─────────────────────────────────────────────────────────
function SkeletonBox({
  w,
  h,
  radius = 8,
  mt = 0,
  mb = 0,
}: {
  w: number | string;
  h: number;
  radius?: number;
  mt?: number;
  mb?: number;
}) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [anim]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 1], [0.18, 0.5]),
  }));
  return (
    <Animated.View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius: radius,
          backgroundColor: "#E8E8E8",
          marginTop: mt,
          marginBottom: mb,
        },
        style,
      ]}
    />
  );
}

function GoalsSkeleton() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
      scrollEnabled={false}
    >
      {/* Preview card */}
      <SkeletonBox w="100%" h={100} radius={16} mb={20} />

      {/* Personal Info */}
      <SkeletonBox w={120} h={13} radius={5} mb={14} />
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
        <SkeletonBox w="48%" h={52} radius={12} />
        <SkeletonBox w="48%" h={52} radius={12} />
      </View>
      <SkeletonBox w="100%" h={52} radius={12} mb={22} />

      {/* Gender */}
      <SkeletonBox w={70} h={13} radius={5} mb={12} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 22 }}>
        <SkeletonBox w={80} h={36} radius={20} />
        <SkeletonBox w={90} h={36} radius={20} />
      </View>

      {/* Goal */}
      <SkeletonBox w={55} h={13} radius={5} mb={12} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 22 }}>
        <SkeletonBox w={100} h={36} radius={20} />
        <SkeletonBox w={90} h={36} radius={20} />
        <SkeletonBox w={105} h={36} radius={20} />
      </View>

      {/* ActivityLevel */}
      <SkeletonBox w={110} h={13} radius={5} mb={12} />
      <View style={{ gap: 8, marginBottom: 22 }}>
        <SkeletonBox w="100%" h={40} radius={20} />
        <SkeletonBox w="100%" h={40} radius={20} />
        <SkeletonBox w="100%" h={40} radius={20} />
        <SkeletonBox w="100%" h={40} radius={20} />
      </View>

      {/* Food Preference */}
      <SkeletonBox w={140} h={13} radius={5} mb={12} />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 32,
        }}
      >
        <SkeletonBox w={110} h={36} radius={20} />
        <SkeletonBox w={90} h={36} radius={20} />
        <SkeletonBox w={115} h={36} radius={20} />
        <SkeletonBox w={80} h={36} radius={20} />
      </View>

      {/* Save button */}
      <SkeletonBox w="100%" h={52} radius={14} mb={8} />
    </ScrollView>
  );
}

// ─── Goals screen ─────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // form state
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("maintain");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [foodPref, setFoodPref] = useState<FoodPreference>("non-vegetarian");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState<UserGoalProfile | null>(
    null,
  );
  const [aiNote, setAiNote] = useState<string | undefined>(undefined);
  const [aiSource, setAiSource] = useState<"ai" | "math" | null>(null);

  // Load existing profile
  useEffect(() => {
    if (!user) return;
    getUserGoalProfile(user.$id)
      .then((profile) => {
        if (profile) {
          setSavedProfile(profile);
          setAge(String(profile.age));
          setGender(profile.gender);
          setHeight(String(profile.heightCm));
          setWeight(String(profile.weightKg));
          setGoalType(profile.goalType);
          setActivity(profile.activityLevel);
          setFoodPref(profile.foodPreference);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const ageN = parseInt(age, 10);
    const heightN = parseFloat(height);
    const weightN = parseFloat(weight);

    if (!ageN || ageN < 10 || ageN > 120) {
      Alert.alert("Invalid", "Enter a valid age (10–120).");
      return;
    }
    if (!heightN || heightN < 100 || heightN > 250) {
      Alert.alert("Invalid", "Enter a valid height in cm (100–250).");
      return;
    }
    if (!weightN || weightN < 20 || weightN > 400) {
      Alert.alert("Invalid", "Enter a valid weight in kg (20–400).");
      return;
    }

    setSaving(true);
    try {
      const profile: UserGoalProfile = {
        $id: savedProfile?.$id,
        userId: user.$id,
        age: ageN,
        gender,
        heightCm: heightN,
        weightKg: weightN,
        goalType,
        activityLevel: activity,
        foodPreference: foodPref,
      };
      const {
        savedProfile: sp,
        goals,
        aiError,
      } = await saveUserGoalProfile(profile);
      setSavedProfile(sp);

      const sourceTag =
        goals.source === "ai" ? "✨ AI-Personalised" : "📐 Estimated";
      let msg = `${sourceTag}\n\n🔥 ${goals.calories} cal\n🥩 ${goals.protein}g protein\n🌾 ${goals.carbs}g carbs\n🫒 ${goals.fat}g fat`;
      if (goals.note) msg += `\n\n💬 ${goals.note}`;
      if (aiError && goals.source === "math")
        msg += `\n\n⚠️ AI was unavailable — using estimate.`;

      Alert.alert("Goals Saved!", msg, [{ text: "Great!" }]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save goals.");
    } finally {
      setSaving(false);
    }
  }, [
    user,
    age,
    gender,
    height,
    weight,
    goalType,
    activity,
    foodPref,
    savedProfile,
  ]);

  // ─── Goal Calculation / Selection ──────────────────────────────────────────
  // We want to show AI goals if the form matches the saved profile,
  // otherwise show a live math estimate as they type.
  const displayGoals = useMemo(() => {
    const ageN = parseInt(age, 10);
    const heightN = parseFloat(height);
    const weightN = parseFloat(weight);

    if (!(ageN > 0 && heightN > 0 && weightN > 0)) return null;

    // Check if current form matches the saved profile (if any)
    const matchesSaved =
      savedProfile &&
      savedProfile.age === ageN &&
      savedProfile.gender === gender &&
      savedProfile.heightCm === heightN &&
      savedProfile.weightKg === weightN &&
      savedProfile.goalType === goalType &&
      savedProfile.activityLevel === activity &&
      savedProfile.foodPreference === foodPref;

    // If it matches and we have AI data, show that
    if (matchesSaved && savedProfile.aiCalories) {
      return {
        calories: savedProfile.aiCalories,
        protein: savedProfile.aiProtein || 0,
        carbs: savedProfile.aiCarbs || 0,
        fat: savedProfile.aiFat || 0,
        note: savedProfile.aiNote,
        source: "ai" as const,
      };
    }

    // Fallback: live math calculation
    try {
      return {
        ...calculateDailyGoals({
          age: ageN,
          gender,
          heightCm: heightN,
          weightKg: weightN,
          goalType,
          activityLevel: activity,
          foodPreference: foodPref,
        }),
        source: "math" as const,
      };
    } catch {
      return null;
    }
  }, [age, gender, height, weight, goalType, activity, foodPref, savedProfile]);

  // Sync AI note/source with whatever is being displayed
  useEffect(() => {
    if (displayGoals?.source === "ai") {
      setAiSource("ai");
      setAiNote(displayGoals.note);
    } else if (displayGoals?.source === "math") {
      setAiSource("math");
      setAiNote(undefined);
    } else {
      setAiSource(null);
      setAiNote(undefined);
    }
  }, [displayGoals]);

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={[s.root, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={s.header}>
        <HamburgerMenu
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
        <Text style={s.headerTitle}>Goals</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <GoalsSkeleton />
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.content,
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Live Preview Card (math preview while typing or saved AI goals) ── */}
          {displayGoals && (
            <PreviewCard
              goals={displayGoals}
              aiSource={aiSource}
              aiNote={aiNote}
            />
          )}

          {/* ── Personal Info ── */}
          <SectionHeader title="Personal Info" />

          <View style={s.inputRow}>
            <View style={[s.inputGroup, { flex: 1, marginRight: 8 }]}>
              <FormInput
                label="Age"
                value={age}
                onChangeText={setAge}
                placeholder="25"
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={[s.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <FormInput
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                placeholder="170"
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
          </View>

          <FormInput
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="70"
            keyboardType="decimal-pad"
            maxLength={5}
          />

          {/* Gender */}
          <SectionHeader title="Gender" />
          <View style={s.chipRow}>
            <Chip
              label="Male"
              selected={gender === "male"}
              onPress={() => setGender("male")}
            />
            <Chip
              label="Female"
              selected={gender === "female"}
              onPress={() => setGender("female")}
            />
          </View>

          {/* ── Goal ── */}
          <SectionHeader title="Goal" sub="What do you want to achieve?" />
          <View style={s.chipRow}>
            <Chip
              label="Lose weight"
              selected={goalType === "lose"}
              onPress={() => setGoalType("lose")}
            />
            <Chip
              label="Maintain"
              selected={goalType === "maintain"}
              onPress={() => setGoalType("maintain")}
            />
            <Chip
              label="Gain weight"
              selected={goalType === "gain"}
              onPress={() => setGoalType("gain")}
            />
          </View>

          {/* ── Activity Level ── */}
          <SectionHeader title="Activity Level" />
          <View style={s.chipCol}>
            {(
              [
                ["sedentary", "🪑  Not active — sitting most of the day"],
                ["light", "🚶  Light — a bit of walking"],
                ["moderate", "🏃  Moderate — exercise 3–4× / week"],
                ["active", "💪  Very active — daily hard workout"],
              ] as [ActivityLevel, string][]
            ).map(([val, label]) => (
              <Chip
                key={val}
                label={label}
                selected={activity === val}
                onPress={() => setActivity(val)}
              />
            ))}
          </View>

          {/* ── Food Preference ── */}
          <SectionHeader
            title="Food Preference"
            sub="Optional — helps personalise suggestions"
          />
          <View style={s.chipRow}>
            {(
              [
                ["vegetarian", "🥦 Vegetarian"],
                ["non-vegetarian", "🍗 Non-veg"],
                ["eggetarian", "🥚 Eggetarian"],
                ["vegan", "🌱 Vegan"],
              ] as [FoodPreference, string][]
            ).map(([val, label]) => (
              <Chip
                key={val}
                label={label}
                selected={foodPref === val}
                onPress={() => setFoodPref(val)}
              />
            ))}
          </View>

          {/* ── Save ── */}
          <SaveButton
            onPress={handleSave}
            saving={saving}
            isUpdate={!!savedProfile}
          />
        </ScrollView>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  headerTitle: {
    fontFamily: "Questrial",
    fontSize: 18,
    fontWeight: "300",
    color: "#111111",
    letterSpacing: 0.2,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  inputRow: { flexDirection: "row", marginBottom: 0 },
  inputGroup: { marginBottom: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chipCol: { gap: 8, marginBottom: 4 },
});
