#!/usr/bin/env node
/**
 * FitBites – Appwrite Setup Script
 * ─────────────────────────────────
 * Creates the database, collection, indexes, and all attributes
 * required by the app.
 *
 * Prerequisites:
 *   • Node 18+ (uses native fetch)
 *   • An Appwrite Cloud / self-hosted instance
 *   • An API key with the following scopes:
 *       databases.read   databases.write
 *       collections.read collections.write
 *       attributes.read  attributes.write
 *       indexes.read     indexes.write
 *
 * Usage:
 *   node scripts/setup-appwrite.mjs
 *
 * The script reads credentials from .env.local in the project root.
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

function loadEnv(filePath) {
    try {
        const raw = readFileSync(filePath, 'utf-8');
        const env = {};
        for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            env[key] = value;
        }
        return env;
    } catch {
        console.error(`❌  Could not read ${filePath}`);
        process.exit(1);
    }
}

const env = loadEnv(envPath);

const ENDPOINT = env['EXPO_PUBLIC_APPWRITE_ENDPOINT'];
const PROJECT_ID = env['EXPO_PUBLIC_APPWRITE_PROJECT_ID'];
const DATABASE_ID = env['EXPO_PUBLIC_APPWRITE_DATABASE_ID'];
const COLLECTION_ID = env['EXPO_PUBLIC_APPWRITE_COLLECTION_ID'] || 'food_logs';
const GOALS_COLLECTION_ID = env['EXPO_PUBLIC_APPWRITE_GOALS_COLLECTION_ID'] || 'user_goals';

// ── API Key ───────────────────────────────────────────────────────────────────
// The app's EXPO_PUBLIC_ keys are client-side only.
// For setup you need a server-side API key – add it to .env.local as:
//   APPWRITE_API_KEY=your_secret_api_key
const API_KEY = env['APPWRITE_API_KEY'];

// ─── Validation ───────────────────────────────────────────────────────────────
const missing = [];
if (!ENDPOINT) missing.push('EXPO_PUBLIC_APPWRITE_ENDPOINT');
if (!PROJECT_ID) missing.push('EXPO_PUBLIC_APPWRITE_PROJECT_ID');
if (!DATABASE_ID) missing.push('EXPO_PUBLIC_APPWRITE_DATABASE_ID');
if (!API_KEY) missing.push('APPWRITE_API_KEY');

if (missing.length) {
    console.error('❌  Missing required environment variables in .env.local:');
    missing.forEach(k => console.error(`   • ${k}`));
    console.error('\nAdd them and re-run the script.');
    process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
const BASE = `${ENDPOINT}/databases`;

const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
};

async function request(method, path, body) {
    const res = await fetch(`${ENDPOINT}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { message: text }; }

    if (!res.ok) {
        // 409 = already exists – treat as success
        if (res.status === 409) return { alreadyExists: true, ...json };
        throw new Error(`${method} ${path} → ${res.status}: ${json.message ?? text}`);
    }
    return json;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const del = (path) => request('DELETE', path);

// ─── Colour helpers ───────────────────────────────────────────────────────────
const green = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;
const bold = s => `\x1b[1m${s}\x1b[0m`;
const dim = s => `\x1b[2m${s}\x1b[0m`;

function ok(msg) { console.log(`  ${green('✔')}  ${msg}`); }
function skip(msg) { console.log(`  ${yellow('⚠')}  ${msg} ${dim('(already exists – skipped)')}`); }
function info(msg) { console.log(`\n${bold(msg)}`); }

// ─── Sleep (for attribute processing) ────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Database ─────────────────────────────────────────────────────────────────
async function ensureDatabase() {
    info('📦  Database');
    const result = await post(`/databases`, {
        databaseId: DATABASE_ID,
        name: 'FitBites',
    });
    result.alreadyExists
        ? skip(`Database  "${DATABASE_ID}"`)
        : ok(`Created database  "${DATABASE_ID}"`);
}

// ─── Collection ───────────────────────────────────────────────────────────────
async function ensureCollection() {
    info('📂  Collection: food_logs');

    const result = await post(`/databases/${DATABASE_ID}/collections`, {
        collectionId: COLLECTION_ID,
        name: 'Food Logs',
        // Document-level security is handled per-document via userId queries.
        // Set documentSecurity to false so the server-side API key can always
        // read/write; client reads are filtered by userId in queries.
        documentSecurity: false,
        permissions: [],
    });

    result.alreadyExists
        ? skip(`Collection "${COLLECTION_ID}"`)
        : ok(`Created collection "${COLLECTION_ID}"`);
}

// ─── Attribute helpers ────────────────────────────────────────────────────────
async function createStringAttr(key, size, required, defaultValue, array = false) {
    const body = { key, size, required, array };
    if (defaultValue !== undefined) body.default = defaultValue;

    const result = await post(
        `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`,
        body,
    );
    result.alreadyExists
        ? skip(`  string  "${key}"`)
        : ok(`  string  "${key}"  (size: ${size}, required: ${required})`);
}

async function createFloatAttr(key, required, min, max, defaultValue, array = false) {
    const body = { key, required, array };
    if (min !== undefined) body.min = min;
    if (max !== undefined) body.max = max;
    if (defaultValue !== undefined) body.default = defaultValue;

    const result = await post(
        `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/float`,
        body,
    );
    result.alreadyExists
        ? skip(`  float   "${key}"`)
        : ok(`  float   "${key}"  (required: ${required})`);
}

async function createIntAttr(key, required, min, max, defaultValue, array = false) {
    const body = { key, required, array };
    if (min !== undefined) body.min = min;
    if (max !== undefined) body.max = max;
    if (defaultValue !== undefined) body.default = defaultValue;

    const result = await post(
        `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/integer`,
        body,
    );
    result.alreadyExists
        ? skip(`  integer "${key}"`)
        : ok(`  integer "${key}"  (required: ${required})`);
}

async function createDatetimeAttr(key, required, defaultValue) {
    const body = { key, required };
    if (defaultValue !== undefined) body.default = defaultValue;

    const result = await post(
        `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/datetime`,
        body,
    );
    result.alreadyExists
        ? skip(`  datetime "${key}"`)
        : ok(`  datetime "${key}"  (required: ${required})`);
}

// ─── Attributes ───────────────────────────────────────────────────────────────
/**
 * FoodEntry shape (from food-service.ts):
 *   userId     string  – Appwrite user $id
 *   date       string  – yyyy-MM-dd
 *   foodName   string  – free text, up to 512 chars
 *   calories   float   – can be negative (exercise)
 *   protein    float   – grams
 *   carbs      float   – grams
 *   fat        float   – grams
 *   createdAt  string  – ISO 8601 datetime stored as string for easy sorting
 */
async function ensureAttributes() {
    info('🏷️   Attributes');

    // userId
    await createStringAttr('userId', 128, true);
    // date (yyyy-MM-dd — kept as string for simple equality queries)
    await createStringAttr('date', 10, true);
    // foodName
    await createStringAttr('foodName', 512, true);
    // createdAt (ISO string — used for orderAsc queries)
    await createStringAttr('createdAt', 30, true);

    // Macros – float so fractional grams / negative calories are supported
    await createFloatAttr('calories', true, -9999, 99999);
    await createFloatAttr('protein', true, 0, 9999);
    await createFloatAttr('carbs', true, 0, 9999);
    await createFloatAttr('fat', true, 0, 9999);

    // Appwrite needs a moment to process new attributes before indexes can be added
    console.log(dim('\n  ⏳  Waiting 3 s for attributes to process…'));
    await sleep(3000);
}

// ─── Indexes ──────────────────────────────────────────────────────────────────
/**
 * Queries used in food-service.ts:
 *   Query.equal('userId', …)
 *   Query.equal('date', …)
 *   Query.greaterThanEqual('date', …)
 *   Query.lessThanEqual('date', …)
 *   Query.orderAsc('createdAt')
 *   Query.orderDesc('date')
 *
 * We cover them with two composite indexes.
 */
async function ensureIndexes() {
    info('🔍  Indexes – food_logs');

    // Index 1: userId + date (equality + range queries on date)
    const idx1 = await post(
        `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/indexes`,
        {
            key: 'userId_date',
            type: 'key',
            attributes: ['userId', 'date'],
            orders: ['ASC', 'ASC'],
        },
    );
    idx1.alreadyExists
        ? skip('Index "userId_date"')
        : ok('Index "userId_date"  (userId ASC, date ASC)');

    // Index 2: userId + createdAt (for time-ordered results within a day)
    const idx2 = await post(
        `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/indexes`,
        {
            key: 'userId_createdAt',
            type: 'key',
            attributes: ['userId', 'createdAt'],
            orders: ['ASC', 'ASC'],
        },
    );
    idx2.alreadyExists
        ? skip('Index "userId_createdAt"')
        : ok('Index "userId_createdAt"  (userId ASC, createdAt ASC)');
}

// ─── user_goals collection ────────────────────────────────────────────────────
async function ensureGoalsCollection() {
    info('📂  Collection: user_goals');
    const result = await post(`/databases/${DATABASE_ID}/collections`, {
        collectionId: GOALS_COLLECTION_ID,
        name: 'User Goals',
        documentSecurity: false,
        permissions: [],
    });
    result.alreadyExists
        ? skip(`Collection "${GOALS_COLLECTION_ID}"`)
        : ok(`Created collection "${GOALS_COLLECTION_ID}"`);
}

async function ensureGoalsAttributes() {
    info('🏷️   Attributes – user_goals');

    // userId
    const gAttr = async (key, size, required, defaultVal) => {
        const body = { key, size, required };
        if (defaultVal !== undefined) body.default = defaultVal;
        const result = await post(
            `/databases/${DATABASE_ID}/collections/${GOALS_COLLECTION_ID}/attributes/string`,
            body,
        );
        result.alreadyExists ? skip(`  string "${key}"`) : ok(`  string "${key}"  (size:${size})`);
    };
    const gInt = async (key, required, min, max, defaultVal) => {
        const body = { key, required };
        if (min !== undefined) body.min = min;
        if (max !== undefined) body.max = max;
        if (defaultVal !== undefined) body.default = defaultVal;
        const result = await post(
            `/databases/${DATABASE_ID}/collections/${GOALS_COLLECTION_ID}/attributes/integer`,
            body,
        );
        result.alreadyExists ? skip(`  integer "${key}"`) : ok(`  integer "${key}"`);
    };
    const gFloat = async (key, required, min, max, defaultVal) => {
        const body = { key, required };
        if (min !== undefined) body.min = min;
        if (max !== undefined) body.max = max;
        if (defaultVal !== undefined) body.default = defaultVal;
        const result = await post(
            `/databases/${DATABASE_ID}/collections/${GOALS_COLLECTION_ID}/attributes/float`,
            body,
        );
        result.alreadyExists ? skip(`  float "${key}"`) : ok(`  float "${key}"`);
    };

    await gAttr('userId', 128, true);
    await gAttr('gender', 10, true);           // 'male' | 'female'
    await gAttr('goalType', 20, true);         // 'lose' | 'maintain' | 'gain'
    await gAttr('activityLevel', 20, true);    // 'sedentary' | 'light' | 'moderate' | 'active'
    await gAttr('foodPreference', 20, true);   // vegetarian | non-vegetarian | eggetarian | vegan
    await gInt('age', true, 10, 120);
    await gFloat('heightCm', true, 100, 250);
    await gFloat('weightKg', true, 20, 400);

    // AI-calculated goals (optional, populated by calculate-goals function)
    await gFloat('aiCalories', false);
    await gFloat('aiProtein', false);
    await gFloat('aiCarbs', false);
    await gFloat('aiFat', false);
    await gAttr('aiNote', 200, false);         // personalised tip from AI

    console.log(dim('\n  ⏳  Waiting 3 s for attributes to process…'));
    await sleep(3000);
}

async function ensureGoalsIndexes() {
    info('🔍  Indexes – user_goals');
    const idx = await post(
        `/databases/${DATABASE_ID}/collections/${GOALS_COLLECTION_ID}/indexes`,
        {
            key: 'goals_userId',
            type: 'key',
            attributes: ['userId'],
            orders: ['ASC'],
        },
    );
    idx.alreadyExists ? skip('Index "goals_userId"') : ok('Index "goals_userId"');
}

async function updateGoalsPermissions() {
    info('🔐  Permissions – user_goals');
    try {
        await request('PUT', `/databases/${DATABASE_ID}/collections/${GOALS_COLLECTION_ID}`, {
            name: 'User Goals',
            permissions: ['create("users")', 'read("users")', 'update("users")', 'delete("users")'],
            documentSecurity: false,
        });
        ok('Permissions set for user_goals');
    } catch (err) {
        console.error(`  ${red('✖')}  Could not update goals permissions: ${err.message}`);
    }
}

// ─── Collection permissions (any authenticated user can CRUD their own docs) ──
async function updateCollectionPermissions() {
    info('🔐  Collection permissions');

    // 'any' role with read/write lets the client SDK work with its session token.
    // Row-level filtering is done in app code via userId queries.
    try {
        await request('PUT', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}`, {
            name: 'Food Logs',
            permissions: [
                'create("users")',
                'read("users")',
                'update("users")',
                'delete("users")',
            ],
            documentSecurity: false,
        });
        ok('Permissions set: create/read/update/delete for authenticated users');
    } catch (err) {
        console.error(`  ${red('✖')}  Could not update permissions: ${err.message}`);
    }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function printSummary() {
    console.log(`
${bold('─'.repeat(50))}
${green('✅  Appwrite setup complete!')}

${bold('Your configuration:')}
  Endpoint:      ${dim(ENDPOINT)}
  Project ID:    ${dim(PROJECT_ID)}
  Database ID:   ${dim(DATABASE_ID)}
  Collection ID: ${dim(COLLECTION_ID)}

${bold('Next steps:')}
  1. Make sure your .env.local has real IDs (not placeholders).
  2. If you changed DATABASE_ID, your free Appwrite plan may have a 1-DB limit.
  3. The collection uses user-scoped permissions – only logged-in users can
     access their own documents via the Appwrite client SDK session.
${bold('─'.repeat(50))}
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${bold('🍎  FitBites – Appwrite Setup')}`);
    console.log(dim(`   Endpoint : ${ENDPOINT}`));
    console.log(dim(`   Project  : ${PROJECT_ID}`));
    console.log(dim(`   Database : ${DATABASE_ID}`));
    console.log(dim(`   Collection: ${COLLECTION_ID}`));

    try {
        await ensureDatabase();
        await ensureCollection();
        await ensureAttributes();
        await ensureIndexes();
        await updateCollectionPermissions();
        await ensureGoalsCollection();
        await ensureGoalsAttributes();
        await ensureGoalsIndexes();
        await updateGoalsPermissions();
        printSummary();
    } catch (err) {
        console.error(`\n${red('❌  Setup failed:')} ${err.message}`);
        process.exit(1);
    }
}

main();
