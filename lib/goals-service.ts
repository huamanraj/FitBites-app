import { DATABASE_ID, databases, functions, GOALS_FUNCTION_ID, ID, Query } from './appwrite';

// ─── Collection ID ───────────────────────────────────────────────────────────
export const GOALS_COLLECTION_ID =
    process.env.EXPO_PUBLIC_APPWRITE_GOALS_COLLECTION_ID || 'user_goals';

// ─── Types ───────────────────────────────────────────────────────────────────
export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type FoodPreference = 'vegetarian' | 'non-vegetarian' | 'eggetarian' | 'vegan';
export type Gender = 'male' | 'female';

export interface UserGoalProfile {
    $id?: string;
    userId: string;
    age: number;
    gender: Gender;
    heightCm: number;
    weightKg: number;
    goalType: GoalType;
    activityLevel: ActivityLevel;
    foodPreference: FoodPreference;
    // AI-calculated goals stored in the document
    aiCalories?: number;
    aiProtein?: number;
    aiCarbs?: number;
    aiFat?: number;
    aiNote?: string;
}

export interface DailyGoals {
    calories: number;
    protein: number;   // grams
    carbs: number;   // grams
    fat: number;   // grams
    note?: string;   // AI personalised tip
    source: 'ai' | 'math';
}

// ─── Fallback: pure-math TDEE (Mifflin-St Jeor) ─────────────────────────────
// Used for:
//  1. Live UI preview while the user is editing the form (instant, no network)
//  2. Fallback if the AI function fails or is rate-limited
export function calculateDailyGoals(
    profile: Omit<UserGoalProfile, '$id' | 'userId' | 'aiCalories' | 'aiProtein' | 'aiCarbs' | 'aiFat' | 'aiNote'>,
): DailyGoals {
    const { gender, age, weightKg, heightCm, goalType, activityLevel } = profile;

    // BMR
    const bmr = gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

    // Activity multiplier
    const multipliers: Record<ActivityLevel, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
    };
    const tdee = bmr * multipliers[activityLevel];

    // Goal adjustment
    const adjustments: Record<GoalType, number> = {
        lose: -500,
        maintain: 0,
        gain: 300,
    };
    const targetCals = Math.round(tdee + adjustments[goalType]);

    // Macros: protein-first
    const proteinG = Math.round(weightKg * (goalType === 'maintain' ? 1.6 : 2.0));
    const fatG = Math.round((targetCals * 0.25) / 9);
    const carbsG = Math.round((targetCals - proteinG * 4 - fatG * 9) / 4);

    return {
        calories: Math.max(targetCals, 1200),
        protein: Math.max(proteinG, 50),
        carbs: Math.max(carbsG, 50),
        fat: Math.max(fatG, 30),
        source: 'math',
    };
}

// ─── Client-side rate limiter for AI goals (first-pass guard) ────────────────
// Server allows 5/min. We allow 3/min client-side so users see a
// friendly message before ever hitting the server.
const _goalStamps: number[] = [];
const GOAL_WINDOW = 60_000;
const GOAL_MAX = 3;

function _goalAllow(): boolean {
    const now = Date.now();
    while (_goalStamps.length && now - _goalStamps[0] > GOAL_WINDOW) _goalStamps.shift();
    if (_goalStamps.length >= GOAL_MAX) return false;
    _goalStamps.push(now);
    return true;
}

// ─── Call the Appwrite Function to get AI-calculated goals ──────────────────
export async function fetchAIGoals(
    profile: Omit<UserGoalProfile, '$id' | 'userId' | 'aiCalories' | 'aiProtein' | 'aiCarbs' | 'aiFat' | 'aiNote'>,
): Promise<DailyGoals> {
    if (!_goalAllow()) {
        throw new Error('Please wait before recalculating your goals.');
    }

    let execution: Awaited<ReturnType<typeof functions.createExecution>>;
    try {
        execution = await functions.createExecution(
            GOALS_FUNCTION_ID,
            JSON.stringify({
                age: profile.age,
                gender: profile.gender,
                heightCm: profile.heightCm,
                weightKg: profile.weightKg,
                goalType: profile.goalType,
                activityLevel: profile.activityLevel,
                foodPreference: profile.foodPreference,
            }),
            false,
            '/',
            'POST' as any,
        );
    } catch (err: any) {
        throw new Error('network:' + (err?.message ?? 'unknown'));
    }

    const statusCode = execution.responseStatusCode;

    if (statusCode === 429) {
        throw new Error('Rate limit: please wait a moment before recalculating goals.');
    }
    if (statusCode === 504) {
        // AI timed out — function returns this so we can fall back gracefully
        throw new Error('timeout:AI timed out.');
    }
    if (statusCode !== 200) {
        let msg = 'AI goal calculation failed';
        try {
            const body = JSON.parse(execution.responseBody);
            if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
    }

    let result: { calories: number; protein: number; carbs: number; fat: number; note?: string };
    try {
        result = JSON.parse(execution.responseBody);
    } catch {
        throw new Error('Could not parse AI response');
    }

    return {
        calories: result.calories ?? 2000,
        protein: result.protein ?? 150,
        carbs: result.carbs ?? 200,
        fat: result.fat ?? 65,
        note: result.note,
        source: 'ai',
    };
}

// ─── Appwrite CRUD ────────────────────────────────────────────────────────────
export async function getUserGoalProfile(userId: string): Promise<UserGoalProfile | null> {
    try {
        const res = await databases.listDocuments(DATABASE_ID, GOALS_COLLECTION_ID, [
            Query.equal('userId', userId),
            Query.limit(1),
        ]);
        if (res.documents.length === 0) return null;
        const doc = res.documents[0];
        return {
            $id: doc.$id,
            userId: doc.userId,
            age: doc.age,
            gender: doc.gender as Gender,
            heightCm: doc.heightCm,
            weightKg: doc.weightKg,
            goalType: doc.goalType as GoalType,
            activityLevel: doc.activityLevel as ActivityLevel,
            foodPreference: doc.foodPreference as FoodPreference,
            aiCalories: doc.aiCalories ?? undefined,
            aiProtein: doc.aiProtein ?? undefined,
            aiCarbs: doc.aiCarbs ?? undefined,
            aiFat: doc.aiFat ?? undefined,
            aiNote: doc.aiNote ?? undefined,
        };
    } catch {
        return null;
    }
}

/**
 * Saves the profile AND calls the AI function to get personalised goals.
 * The AI result is stored in the document so subsequent reads are instant.
 *
 * Returns { savedProfile, goals, aiError? } where aiError is set if the AI
 * call failed but the profile was still saved (caller can show a warning).
 */
export async function saveUserGoalProfile(profile: UserGoalProfile): Promise<{
    savedProfile: UserGoalProfile;
    goals: DailyGoals;
    aiError?: string;
}> {
    // 1. Try AI goals first (may fail or be rate-limited)
    let aiGoals: DailyGoals | null = null;
    let aiError: string | undefined;

    try {
        aiGoals = await fetchAIGoals(profile);
    } catch (err: any) {
        aiError = err?.message ?? 'AI unavailable';
    }

    // 2. Build doc payload — include AI results if we got them
    const payload: Record<string, unknown> = {
        userId: profile.userId,
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        goalType: profile.goalType,
        activityLevel: profile.activityLevel,
        foodPreference: profile.foodPreference,
        ...(aiGoals ? {
            aiCalories: aiGoals.calories,
            aiProtein: aiGoals.protein,
            aiCarbs: aiGoals.carbs,
            aiFat: aiGoals.fat,
            aiNote: aiGoals.note ?? null,
        } : {}),
    };

    // 3. Save to Appwrite
    let doc: any;
    if (profile.$id) {
        doc = await databases.updateDocument(DATABASE_ID, GOALS_COLLECTION_ID, profile.$id, payload);
    } else {
        const existing = await getUserGoalProfile(profile.userId);
        if (existing?.$id) {
            doc = await databases.updateDocument(DATABASE_ID, GOALS_COLLECTION_ID, existing.$id, payload);
        } else {
            doc = await databases.createDocument(DATABASE_ID, GOALS_COLLECTION_ID, ID.unique(), payload);
        }
    }

    const savedProfile: UserGoalProfile = {
        ...profile,
        $id: doc.$id,
        aiCalories: aiGoals?.calories,
        aiProtein: aiGoals?.protein,
        aiCarbs: aiGoals?.carbs,
        aiFat: aiGoals?.fat,
        aiNote: aiGoals?.note,
    };

    // 4. Return AI goals if available, otherwise fall back to math
    const goals = aiGoals ?? { ...calculateDailyGoals(profile), source: 'math' as const };

    return { savedProfile, goals, aiError };
}

/**
 * Returns stored AI goals if the user has already saved a profile with AI results.
 * Falls back to math if not available.
 */
export async function getDailyGoalsForUser(userId: string): Promise<DailyGoals> {
    const profile = await getUserGoalProfile(userId);
    if (!profile) {
        return { calories: 2000, protein: 150, carbs: 250, fat: 65, source: 'math' };
    }

    // If AI goals are already stored — return them immediately (no network call)
    if (profile.aiCalories && profile.aiProtein && profile.aiCarbs && profile.aiFat) {
        return {
            calories: profile.aiCalories,
            protein: profile.aiProtein,
            carbs: profile.aiCarbs,
            fat: profile.aiFat,
            note: profile.aiNote,
            source: 'ai',
        };
    }

    // Fallback: math
    return calculateDailyGoals(profile);
}
