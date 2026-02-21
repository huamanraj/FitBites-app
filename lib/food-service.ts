import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { COLLECTION_ID, DATABASE_ID, databases, FUNCTION_ID, functions, ID, Query } from './appwrite';

export interface FoodEntry {
    $id: string;
    userId: string;
    date: string;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    createdAt: string;
}

export interface MacroEstimate {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

// ─── Client-side rate limiter (first-pass guard) ─────────────────────────────
// Mirrors the server limit but prevents unnecessary network round-trips.
// 10 requests per 60 s — slightly below the server's 15 so the server limit
// is never the first thing the user sees.
const _clientStamps: number[] = [];
const CLIENT_WINDOW = 60_000;
const CLIENT_MAX = 10;

function _clientAllow(): boolean {
    const now = Date.now();
    // Drop expired stamps
    while (_clientStamps.length && now - _clientStamps[0] > CLIENT_WINDOW) {
        _clientStamps.shift();
    }
    if (_clientStamps.length >= CLIENT_MAX) return false;
    _clientStamps.push(now);
    return true;
}

export async function estimateCalories(foodName: string): Promise<MacroEstimate> {
    // Client-side rate limit check
    if (!_clientAllow()) {
        throw new Error(
            `Too many requests — please wait a moment before logging more food.`
        );
    }

    // Call the Appwrite Function (session JWT is attached automatically by the SDK)
    let execution: Awaited<ReturnType<typeof functions.createExecution>>;
    try {
        execution = await functions.createExecution(
            FUNCTION_ID,
            JSON.stringify({ foodName }),
            false,           // synchronous — wait for result
            '/',             // path (default)
            'POST' as any,   // method
        );
    } catch (err: any) {
        // Network-level error (no internet, DNS fail, etc.)
        throw new Error('network:' + (err?.message ?? 'unknown'));
    }

    const statusCode = execution.responseStatusCode ?? execution.responseStatusCode;

    if (statusCode === 429) {
        throw new Error('Rate limit exceeded. Please wait a minute before trying again.');
    }

    // 422 = AI says this is not a valid food or exercise entry
    if (statusCode === 422) {
        let errorMsg = 'That doesn\'t look like a food or exercise.';
        let hint = '';
        try {
            const body = JSON.parse(execution.responseBody);
            if (body?.error) errorMsg = body.error;
            if (body?.hint) hint = body.hint;
        } catch { /* ignore */ }
        throw new Error(`invalid-entry:${errorMsg}${hint ? `\n${hint}` : ''}`);
    }

    if (statusCode !== 200) {
        let msg = 'Failed to estimate calories';
        try {
            const body = JSON.parse(execution.responseBody);
            if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
    }

    let result: MacroEstimate;
    try {
        result = JSON.parse(execution.responseBody);
    } catch {
        throw new Error('Could not parse AI response');
    }

    return {
        calories: result.calories ?? 0,
        protein: result.protein ?? 0,
        carbs: result.carbs ?? 0,
        fat: result.fat ?? 0,
    };
}

export async function addFoodEntry(
    userId: string,
    foodName: string,
    macros: MacroEstimate
): Promise<FoodEntry> {
    const now = new Date();
    const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
            userId,
            date: format(now, 'yyyy-MM-dd'),
            foodName,
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            createdAt: now.toISOString(),
        }
    );

    return doc as unknown as FoodEntry;
}

export async function getTodayEntries(userId: string): Promise<FoodEntry[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return getEntriesByDate(userId, today);
}

export async function getEntriesByDate(userId: string, date: string): Promise<FoodEntry[]> {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('userId', userId),
        Query.equal('date', date),
        Query.orderAsc('createdAt'),
        Query.limit(100),
    ]);

    return response.documents as unknown as FoodEntry[];
}

export async function deleteEntry(documentId: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, documentId);
}

export async function getHistoryDays(userId: string, days: number = 30): Promise<{ date: string; totalCalories: number }[]> {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('userId', userId),
        Query.greaterThanEqual('date', startDate),
        Query.lessThanEqual('date', endDate),
        Query.orderDesc('date'),
        Query.limit(500),
    ]);

    const docs = response.documents as unknown as FoodEntry[];
    const dayMap = new Map<string, number>();

    docs.forEach((doc) => {
        const existing = dayMap.get(doc.date) || 0;
        dayMap.set(doc.date, existing + doc.calories);
    });

    return Array.from(dayMap.entries())
        .map(([date, totalCalories]) => ({ date, totalCalories }))
        .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getEntriesForRange(
    userId: string,
    startDate: string,
    endDate: string
): Promise<FoodEntry[]> {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('userId', userId),
        Query.greaterThanEqual('date', startDate),
        Query.lessThanEqual('date', endDate),
        Query.orderAsc('date'),
        Query.limit(500),
    ]);

    return response.documents as unknown as FoodEntry[];
}

export function getWeekRange(): { start: string; end: string } {
    const now = new Date();
    return {
        start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
}

export function getMonthRange(): { start: string; end: string } {
    const now = new Date();
    return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
}
