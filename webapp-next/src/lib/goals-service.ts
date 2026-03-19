import { ExecutionMethod } from 'appwrite';
import { DATABASE_ID, databases, functions, GOALS_FUNCTION_ID, ID, Query } from './appwrite';

export const GOALS_COLLECTION_ID =
    process.env.NEXT_PUBLIC_APPWRITE_GOALS_COLLECTION_ID || 'user_goals';

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
    aiCalories?: number;
    aiProtein?: number;
    aiCarbs?: number;
    aiFat?: number;
    aiNote?: string;
}

export interface DailyGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    note?: string;
    source: 'ai' | 'math';
}

export function calculateDailyGoals(
    profile: Omit<UserGoalProfile, '$id' | 'userId' | 'aiCalories' | 'aiProtein' | 'aiCarbs' | 'aiFat' | 'aiNote'>,
): DailyGoals {
    const { gender, age, weightKg, heightCm, goalType, activityLevel } = profile;

    const bmr = gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

    const multipliers: Record<ActivityLevel, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
    };
    const tdee = bmr * multipliers[activityLevel];

    const adjustments: Record<GoalType, number> = {
        lose: -500,
        maintain: 0,
        gain: 300,
    };
    const targetCals = Math.round(tdee + adjustments[goalType]);

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
            ExecutionMethod.POST,
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown';
        throw new Error('network:' + message);
    }

    const statusCode = execution.responseStatusCode;

    if (statusCode === 429) {
        throw new Error('Rate limit: please wait a moment before recalculating goals.');
    }
    if (statusCode === 504) {
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

export async function saveUserGoalProfile(profile: UserGoalProfile): Promise<{
    savedProfile: UserGoalProfile;
    goals: DailyGoals;
    aiError?: string;
}> {
    let aiGoals: DailyGoals | null = null;
    let aiError: string | undefined;

    try {
        aiGoals = await fetchAIGoals(profile);
    } catch (err: unknown) {
        aiError = err instanceof Error ? err.message : 'AI unavailable';
    }

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

    let doc: Record<string, unknown>;
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
        $id: doc.$id as string,
        aiCalories: aiGoals?.calories,
        aiProtein: aiGoals?.protein,
        aiCarbs: aiGoals?.carbs,
        aiFat: aiGoals?.fat,
        aiNote: aiGoals?.note,
    };

    const goals = aiGoals ?? { ...calculateDailyGoals(profile), source: 'math' as const };

    return { savedProfile, goals, aiError };
}

export async function getDailyGoalsForUser(userId: string): Promise<DailyGoals> {
    const profile = await getUserGoalProfile(userId);
    if (!profile) {
        return { calories: 2000, protein: 150, carbs: 250, fat: 65, source: 'math' };
    }

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

    return calculateDailyGoals(profile);
}
