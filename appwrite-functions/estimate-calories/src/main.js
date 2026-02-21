/**
 * Appwrite Function: estimate-calories
 * ──────────────────────────────────────
 * Called by the FitBites app to estimate calories/macros for a given food name.
 * The Pollinations API key is stored as a server-side environment variable —
 * it is NEVER exposed to the client bundle.
 *
 * Runtime  : node-21.0
 * Entrypoint: src/main.js
 *
 * Rate limit: 15 requests / 60 s per userId (in-memory, resets on cold start).
 * No DB / Redis needed — good enough for a personal-use app.
 */

// ─── In-memory rate limiter ────────────────────────────────────────────────
//
// Structure:  Map<userId, number[]>   (userId → array of request timestamps)
// Strategy:   sliding-window, WINDOW_MS wide, max MAX_REQUESTS per window.
// NOTE: This map lives in the function's V8 heap. It persists between
//       warm invocations of the same container instance but is reset on
//       cold starts. That is intentional — no external state needed.

const rateLimits = new Map(); // userId → [timestamp, ...]
const WINDOW_MS = 60 * 1000; // 1 minute sliding window
const MAX_REQUESTS = 15;         // max 15 food lookups per minute per user

/**
 * Returns true if the request is allowed, false if rate-limited.
 * Mutates the rateLimits map as a side-effect.
 */
function allow(userId) {
    const now = Date.now();
    // Retrieve existing timestamps and drop any outside the window
    const stamps = (rateLimits.get(userId) || []).filter(t => now - t < WINDOW_MS);

    if (stamps.length >= MAX_REQUESTS) {
        rateLimits.set(userId, stamps); // still update to drop expired stamps
        return false;
    }

    stamps.push(now);
    rateLimits.set(userId, stamps);
    return true;
}

// ─── Main handler ──────────────────────────────────────────────────────────
export default async ({ req, res, log, error }) => {
    const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || '';

    // ── Auth: Appwrite injects the user id from the session JWT automatically
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
        return res.json({ error: 'Unauthorized' }, 401);
    }

    // ── Rate limit check
    if (!allow(userId)) {
        const retryAfter = Math.ceil(WINDOW_MS / 1000);
        return res.json(
            { error: `Rate limit exceeded. Max ${MAX_REQUESTS} requests per minute. Retry in ${retryAfter}s.` },
            429,
        );
    }

    // ── Parse body
    let foodName;
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        foodName = body?.foodName;
    } catch {
        return res.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!foodName || typeof foodName !== 'string' || foodName.trim().length === 0) {
        return res.json({ error: '`foodName` is required and must be a non-empty string' }, 400);
    }

    // Sanitise: strip control chars, limit to 300 chars
    const safeName = foodName.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, 300);

    log(`[estimate-calories] user=${userId}  food="${safeName}"`);

    // ── Call Pollinations AI
    // The prompt asks the AI to FIRST validate whether the input is a real food or
    // exercise, then return macros. Non-food inputs (names, places, gibberish, etc.)
    // must be flagged with valid:false so the user can correct their entry.
    const prompt =
        `You are a nutrition assistant for an Indian food calorie tracker. ` +
        `A user entered: "${safeName}". ` +
        `First, decide: is this a real food item, drink, or physical exercise/activity? ` +
        `If YES: return ONLY valid JSON with these exact keys: ` +
        `{"valid":true,"calories":150,"protein":10,"carbs":20,"fat":5} ` +
        `For exercise/activity, use NEGATIVE calories (e.g. -200). ` +
        `If NO (it's a person's name, place, random word, gibberish, or not food/exercise): ` +
        `return ONLY valid JSON: {"valid":false,"error":"<short friendly reason>","hint":"<what the user should enter instead, e.g. try: 2 wheat roti, rice 50g>"} ` +
        `Reply ONLY with the JSON object. No markdown, no explanation, no extra text.`;

    try {
        const url =
            `https://gen.pollinations.ai/text/${encodeURIComponent(prompt)}` +
            `?json=true&model=gemini-fast&seed=-1&key=${POLLINATIONS_API_KEY}`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(15_000),
            headers: {
                'Authorization': `Bearer ${POLLINATIONS_API_KEY}`,
            },
        });

        if (!response.ok) {
            error(`Pollinations error: ${response.status}`);
            return res.json({ error: `AI service error: ${response.status}` }, 502);
        }

        const text = await response.text();
        log(`[estimate-calories] raw response: ${text.slice(0, 300)}`);

        // Extract the first JSON object from the response
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            error(`Could not parse AI JSON from: ${text.slice(0, 300)}`);
            return res.json({ error: 'Could not parse AI response' }, 502);
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            error(`JSON.parse failed on: ${jsonMatch[0]}`);
            return res.json({ error: 'Could not parse AI response' }, 502);
        }

        // ── Invalid food entry — AI says this is not a food/exercise
        if (parsed.valid === false) {
            log(`[estimate-calories] invalid entry: ${parsed.error}`);
            return res.json(
                {
                    error: parsed.error || 'That doesn\'t look like a food or exercise.',
                    hint: parsed.hint || 'Try something like: 2 wheat roti, rice 50g, 30 min walk',
                },
                422,
            );
        }

        // ── Valid food entry — return macros
        return res.json({
            calories: Math.round(parsed.calories ?? 0),
            protein: Math.round(parsed.protein ?? 0),
            carbs: Math.round(parsed.carbs ?? 0),
            fat: Math.round(parsed.fat ?? 0),
        });
    } catch (err) {
        error(`[estimate-calories] fetch error: ${err.message}`);
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            return res.json({ error: 'AI service timed out. Please try again.' }, 504);
        }
        return res.json({ error: 'Failed to estimate calories' }, 500);
    }
};
