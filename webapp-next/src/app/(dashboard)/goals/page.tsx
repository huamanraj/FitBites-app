'use client';

import { useAuth } from '@/context/auth-context';
import {
  ActivityLevel,
  calculateDailyGoals,
  FoodPreference,
  Gender,
  getUserGoalProfile,
  GoalType,
  saveUserGoalProfile,
  UserGoalProfile,
} from '@/lib/goals-service';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ACTIVITY_OPTIONS: [ActivityLevel, string][] = [
  ['sedentary', 'Not active — sitting most of the day'],
  ['light', 'Light — a bit of walking'],
  ['moderate', 'Moderate — exercise 3–4x / week'],
  ['active', 'Very active — daily hard workout'],
];

const FOOD_PREF_OPTIONS: [FoodPreference, string][] = [
  ['vegetarian', 'Vegetarian'],
  ['non-vegetarian', 'Non-veg'],
  ['eggetarian', 'Eggetarian'],
  ['vegan', 'Vegan'],
];

export default function GoalsPage() {
  const { user } = useAuth();

  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('maintain');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [foodPref, setFoodPref] = useState<FoodPreference>('non-vegetarian');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState<UserGoalProfile | null>(null);

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

    if (!ageN || ageN < 10 || ageN > 120) { alert('Enter a valid age (10–120).'); return; }
    if (!heightN || heightN < 100 || heightN > 250) { alert('Enter a valid height in cm (100–250).'); return; }
    if (!weightN || weightN < 20 || weightN > 400) { alert('Enter a valid weight in kg (20–400).'); return; }

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
      const { savedProfile: sp, goals, aiError } = await saveUserGoalProfile(profile);
      setSavedProfile(sp);

      const sourceTag = goals.source === 'ai' ? 'AI-Personalised' : 'Estimated';
      let msg = `${sourceTag}: ${goals.calories} cal | ${goals.protein}g protein | ${goals.carbs}g carbs | ${goals.fat}g fat`;
      if (goals.note) msg += `\n${goals.note}`;
      if (aiError && goals.source === 'math') msg += '\nAI was unavailable — using estimate.';
      alert(msg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save goals.';
      alert(message);
    } finally {
      setSaving(false);
    }
  }, [user, age, gender, height, weight, goalType, activity, foodPref, savedProfile]);

  const displayGoals = useMemo(() => {
    const ageN = parseInt(age, 10);
    const heightN = parseFloat(height);
    const weightN = parseFloat(weight);
    if (!(ageN > 0 && heightN > 0 && weightN > 0)) return null;

    const matchesSaved =
      savedProfile &&
      savedProfile.age === ageN &&
      savedProfile.gender === gender &&
      savedProfile.heightCm === heightN &&
      savedProfile.weightKg === weightN &&
      savedProfile.goalType === goalType &&
      savedProfile.activityLevel === activity &&
      savedProfile.foodPreference === foodPref;

    if (matchesSaved && savedProfile.aiCalories) {
      return {
        calories: savedProfile.aiCalories,
        protein: savedProfile.aiProtein || 0,
        carbs: savedProfile.aiCarbs || 0,
        fat: savedProfile.aiFat || 0,
        note: savedProfile.aiNote,
        source: 'ai' as const,
      };
    }

    try {
      return {
        ...calculateDailyGoals({ age: ageN, gender, heightCm: heightN, weightKg: weightN, goalType, activityLevel: activity, foodPreference: foodPref }),
        source: 'math' as const,
      };
    } catch {
      return null;
    }
  }, [age, gender, height, weight, goalType, activity, foodPref, savedProfile]);

  if (loading) {
    return (
      <div className="px-5 pt-8 space-y-4 animate-fadeIn">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[52px] bg-[#E8E8E8] rounded-xl animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <h2 className="text-[18px] font-light text-[#111111] tracking-[0.2px] px-5 py-3">
        Goals
      </h2>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Preview Card */}
        {displayGoals && (
          <div className="bg-[#FBFBFB] border border-[#F0F0F0] rounded-2xl p-4 mb-5 animate-fadeInDown">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#888888] uppercase tracking-[0.5px]">
                Daily Target
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                displayGoals.source === 'ai' ? 'bg-[#F0EFFF] text-[#6B5CE7]' : 'bg-[#F0F0F0] text-[#888888]'
              }`}>
                {displayGoals.source === 'ai' ? 'AI' : 'Estimate'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[28px] font-bold text-[#111111] leading-none">
                  {displayGoals.calories}
                </p>
                <p className="text-xs text-[#888888]">cal</p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: 'P', val: displayGoals.protein, color: '#EF4444' },
                  { label: 'C', val: displayGoals.carbs, color: '#3B82F6' },
                  { label: 'F', val: displayGoals.fat, color: '#F97316' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 border border-[#F0F0F0]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-xs text-[#555555]">{m.val}g</span>
                  </div>
                ))}
              </div>
            </div>
            {displayGoals.note && (
              <p className="text-xs text-[#888888] mt-2 leading-relaxed">{displayGoals.note}</p>
            )}
          </div>
        )}

        {/* Personal Info */}
        <SectionHeader title="Personal Info" />
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <FormInput label="Age" value={age} onChange={setAge} placeholder="25" />
          <FormInput label="Height (cm)" value={height} onChange={setHeight} placeholder="170" />
        </div>
        <FormInput label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" />

        {/* Gender */}
        <SectionHeader title="Gender" />
        <div className="flex flex-wrap gap-2 mb-1">
          <Chip label="Male" selected={gender === 'male'} onClick={() => setGender('male')} />
          <Chip label="Female" selected={gender === 'female'} onClick={() => setGender('female')} />
        </div>

        {/* Goal */}
        <SectionHeader title="Goal" sub="What do you want to achieve?" />
        <div className="flex flex-wrap gap-2 mb-1">
          <Chip label="Lose weight" selected={goalType === 'lose'} onClick={() => setGoalType('lose')} />
          <Chip label="Maintain" selected={goalType === 'maintain'} onClick={() => setGoalType('maintain')} />
          <Chip label="Gain weight" selected={goalType === 'gain'} onClick={() => setGoalType('gain')} />
        </div>

        {/* Activity */}
        <SectionHeader title="Activity Level" />
        <div className="flex flex-col gap-2 mb-1">
          {ACTIVITY_OPTIONS.map(([val, label]) => (
            <Chip key={val} label={label} selected={activity === val} onClick={() => setActivity(val)} />
          ))}
        </div>

        {/* Food Preference */}
        <SectionHeader title="Food Preference" sub="Optional — helps personalise suggestions" />
        <div className="flex flex-wrap gap-2 mb-6">
          {FOOD_PREF_OPTIONS.map(([val, label]) => (
            <Chip key={val} label={label} selected={foodPref === val} onClick={() => setFoodPref(val)} />
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#111111] text-white font-bold text-base rounded-[14px] py-4 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-60"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Asking AI...</span>
            </div>
          ) : savedProfile ? 'Recalculate Goals' : 'Calculate & Save Goals'}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mt-5 mb-3">
      <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-[1px]">{title}</h3>
      {sub && <p className="text-xs text-[#BBBBBB] mt-0.5">{sub}</p>}
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="mb-3.5">
      <label className="text-xs font-semibold text-[#888888] uppercase tracking-[1px] mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#E5E5E5] rounded-xl px-4 py-3 text-base text-[#111111] bg-[#FAFAFA] placeholder:text-[#BBBBBB] outline-none focus:border-[#111111] transition-colors"
      />
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        selected
          ? 'bg-[#111111] text-white'
          : 'bg-[#FAFAFA] text-[#111111] border border-[#E5E5E5] hover:border-[#CCCCCC]'
      }`}
    >
      {label}
    </button>
  );
}
