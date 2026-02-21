/**
 * Appwrite Function: calculate-goals
 * ─────────────────────────────────────────────────────────────────────────────
 * Receives a user's health profile and uses Pollinations AI to calculate
 * personalised, accurate daily nutrition goals — considering not just TDEE
 * math but also dietary preferences, body composition factors, and goal type.
 *
 * Runtime   : bun-1.0
 * Entrypoint: src/main.js
 *
 * Rate limit : 5 requests / 60 s per userId (in-memory, resets on cold start).
 * This is lower than estimate-calories because goals don't change often.
 */

// ─── In-memory rate limiter ─────────────────────────────────────────────────
const rateLimits = new Map(); // userId → [timestamp, ...]
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5; // goals calculation should be rare

function allow(userId) {
    const now = Date.now();
    const stamps = (rateLimits.get(userId) || []).filter(t => now - t < WINDOW_MS);
    if (stamps.length >= MAX_REQUESTS) {
        rateLimits.set(userId, stamps);
        return false;
    }
    stamps.push(now);
    rateLimits.set(userId, stamps);
    return true;
}

// ─── Field labels (human-readable for prompt) ───────────────────────────────
const ACTIVITY_LABELS = {
    sedentary: 'Sedentary — desk job, no exercise',
    light: 'Light — walking, 1-3 workouts/week',
    moderate: 'Moderate — 3-5 workouts/week',
    active: 'Very Active — hard training 6-7 days/week',
};

const GOAL_LABELS = {
    lose: 'Fat loss / lose weight',
    maintain: 'Maintain current weight and body composition',
    gain: 'Build muscle / gain weight',
};

const FOOD_LABELS = {
    vegetarian: 'Vegetarian (no meat, can eat dairy & eggs)',
    'non-vegetarian': 'Non-vegetarian (eats all foods including meat, fish, eggs)',
    eggetarian: 'Eggetarian (vegetarian + eggs, no meat)',
    vegan: 'Vegan (no animal products at all)',
};

// ─── Main handler ────────────────────────────────────────────────────────────
export default async ({ req, res, log, error }) => {
    const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || '';

    // ── Auth
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
        return res.json({ error: 'Unauthorized' }, 401);
    }

    // ── Rate limit
    if (!allow(userId)) {
        return res.json(
            { error: `Rate limit: max ${MAX_REQUESTS} goal calculations per minute. Try again soon.` },
            429,
        );
    }

    // ── Parse body
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
        return res.json({ error: 'Invalid JSON body' }, 400);
    }

    const { age, gender, heightCm, weightKg, goalType, activityLevel, foodPreference } = body ?? {};

    // ── Validate required fields
    const issues = [];
    if (!age || typeof age !== 'number' || age < 10 || age > 120) issues.push('age (10-120)');
    if (!gender || !['male', 'female'].includes(gender)) issues.push('gender (male|female)');
    if (!heightCm || heightCm < 100 || heightCm > 250) issues.push('heightCm (100-250)');
    if (!weightKg || weightKg < 20 || weightKg > 400) issues.push('weightKg (20-400)');
    if (!goalType || !GOAL_LABELS[goalType]) issues.push('goalType (lose|maintain|gain)');
    if (!activityLevel || !ACTIVITY_LABELS[activityLevel]) issues.push('activityLevel');

    if (issues.length) {
        return res.json({ error: `Invalid or missing fields: ${issues.join(', ')}` }, 400);
    }

    const foodLabel = FOOD_LABELS[foodPreference] ?? 'No specific preference';
    const activityDesc = ACTIVITY_LABELS[activityLevel];
    const goalDesc = GOAL_LABELS[goalType];

    // BMI for context
    const bmi = (weightKg / ((heightCm / 100) ** 2)).toFixed(1);

    log(`[calculate-goals] userId=${userId}  ${gender} ${age}y ${heightCm}cm ${weightKg}kg  goal=${goalType}  activity=${activityLevel}  food=${foodPreference}  BMI=${bmi}`);

    // ─── Build rich, expert-level prompt ────────────────────────────────────
    const prompt = [
        `You are an expert sports nutritionist and registered dietitian.`,
        `Calculate precise, personalised daily nutrition goals for this user.`,
        ``,
        `== USER PROFILE ==`,
        `Age            : ${age} years`,
        `Gender         : ${gender}`,
        `Height         : ${heightCm} cm`,
        `Weight         : ${weightKg} kg`,
        `BMI            : ${bmi}`,
        `Goal           : ${goalDesc}`,
        `Activity Level : ${activityDesc}`,
        `Food preference: ${foodLabel}`,
        ``,
        `== INSTRUCTIONS ==`,
        `1. Calculate TDEE using Mifflin-St Jeor BMR with the correct activity multiplier.`,
        `2. Adjust calories for the stated goal:`,
        `   - Lose weight  → deficit of 400-600 kcal (adjust for BMI; larger deficit if BMI > 28)`,
        `   - Maintain     → at TDEE`,
        `   - Gain muscle  → surplus of 250-350 kcal (lean bulk approach)`,
        `3. Set protein based on goal AND food preference:`,
        `   - Non-vegetarian: 2.0-2.2 g/kg for lose/gain, 1.6 g/kg for maintain`,
        `   - Vegetarian/Eggetarian: 1.7-1.9 g/kg (complete proteins harder to source)`,
        `   - Vegan: 1.8-2.0 g/kg (account for lower bioavailability)`,
        `4. Fat: 25-30% of total calories.`,
        `5. Carbs: remaining calories after protein and fat are accounted for.`,
        `6. All values must be realistic and at least: calories ≥ 1200, protein ≥ 40g, carbs ≥ 50g, fat ≥ 25g.`,
        `7. Write a single personalised tip (max 80 chars) specific to their combination of goal + food preference.`,
        ``,
        `Reply ONLY with valid JSON. No markdown. No extra text. Example format:`,
        `{"calories":2100,"protein":160,"carbs":210,"fat":68,"note":"Focus on legumes and tofu for complete plant protein"}`,
    ].join('\n');

    // ─── Call Pollinations AI ────────────────────────────────────────────────
    try {
        const url =
            `https://gen.pollinations.ai/text/${encodeURIComponent(prompt)}` +
            `?json=true&model=gemini-fast&seed=-1&key=${POLLINATIONS_API_KEY}`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(25_000), // goals need more reasoning time
            headers: { 'Authorization': `Bearer ${POLLINATIONS_API_KEY}` },
        });

        if (!response.ok) {
            error(`Pollinations HTTP ${response.status}`);
            return res.json({ error: `AI service error: ${response.status}` }, 502);
        }

        const text = await response.text();
        log(`[calculate-goals] raw: ${text.slice(0, 300)}`);

        // Generous regex — allow floats, optional spaces, any field order
        const jsonMatch = text.match(/\{[^{}]*"calories"\s*:\s*\d+[^{}]*\}/s);
        if (!jsonMatch) {
            error(`Could not parse JSON from: ${text.slice(0, 400)}`);
            return res.json({ error: 'AI returned an unexpected format' }, 502);
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Clamp to minimums for safety
        const result = {
            calories: Math.max(Math.round(parsed.calories ?? 1500), 1200),
            protein: Math.max(Math.round(parsed.protein ?? 100), 40),
            carbs: Math.max(Math.round(parsed.carbs ?? 150), 50),
            fat: Math.max(Math.round(parsed.fat ?? 50), 25),
            note: String(parsed.note ?? '').slice(0, 120) || null,
        };

        log(`[calculate-goals] result: ${JSON.stringify(result)}`);
        return res.json(result);

    } catch (err) {
        error(`[calculate-goals] ${err.name}: ${err.message}`);
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            return res.json({ error: 'AI timed out. Using local estimate instead.' }, 504);
        }
        return res.json({ error: 'Failed to calculate goals' }, 500);
    }
};
