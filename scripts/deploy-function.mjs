#!/usr/bin/env node
/**
 * FitBites – Deploy estimate-calories Appwrite Function
 * ──────────────────────────────────────────────────────
 * This script:
 *   1. Creates the Appwrite Function (or skips if it already exists)
 *   2. Sets the POLLINATIONS_API_KEY environment variable in the function
 *   3. Tars the function source (src/main.js) into a .tar.gz
 *   4. Uploads the deployment and activates it
 *
 * Prerequisites
 *   • Node 18+ (uses native fetch + AbortSignal.timeout)
 *   • Windows 10 v1803+ / any modern macOS/Linux  (all have `tar` built-in)
 *   • .env.local must have APPWRITE_API_KEY and the other EXPO_PUBLIC_ vars
 *
 * Usage
 *   node scripts/deploy-function.mjs
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
const { writeFileSync } = createRequire(import.meta.url)('fs');

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FN_SRC_DIR = resolve(ROOT, 'appwrite-functions', 'estimate-calories');
const ENV_PATH = resolve(ROOT, '.env.local');
const TMP_DIR = join(tmpdir(), 'fitbites-fn-deploy');

// ─── Load .env.local ──────────────────────────────────────────────────────────
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

const env = loadEnv(ENV_PATH);

const ENDPOINT = env['EXPO_PUBLIC_APPWRITE_ENDPOINT'];
const PROJECT_ID = env['EXPO_PUBLIC_APPWRITE_PROJECT_ID'];
const API_KEY = env['APPWRITE_API_KEY'];
const POLLINATIONS_API_KEY = env['POLLINATIONS_API_KEY'] || env['EXPO_PUBLIC_POLLINATIONS_API_KEY'];

// Use existing function ID if already deployed, else we'll create and write it back
let FUNCTION_ID = env['EXPO_PUBLIC_APPWRITE_FUNCTION_ID'] || '';

// ─── Validate ─────────────────────────────────────────────────────────────────
const missing = [];
if (!ENDPOINT) missing.push('EXPO_PUBLIC_APPWRITE_ENDPOINT');
if (!PROJECT_ID) missing.push('EXPO_PUBLIC_APPWRITE_PROJECT_ID');
if (!API_KEY) missing.push('APPWRITE_API_KEY');
if (!POLLINATIONS_API_KEY) missing.push('POLLINATIONS_API_KEY  (or EXPO_PUBLIC_POLLINATIONS_API_KEY)');

if (missing.length) {
    console.error('❌  Missing required env variables in .env.local:');
    missing.forEach(k => console.error(`   • ${k}`));
    process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
const HEADERS = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
};

async function req(method, path, body) {
    const res = await fetch(`${ENDPOINT}${path}`, {
        method,
        headers: HEADERS,
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { message: text }; }
    if (!res.ok) {
        if (res.status === 409) return { alreadyExists: true, ...json };
        throw new Error(`${method} ${path} → ${res.status}: ${json.message ?? text}`);
    }
    return json;
}

async function reqMultipart(method, path, formData) {
    // Don't set Content-Type – let fetch set it with the boundary
    const res = await fetch(`${ENDPOINT}${path}`, {
        method,
        headers: {
            'X-Appwrite-Project': PROJECT_ID,
            'X-Appwrite-Key': API_KEY,
        },
        body: formData,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { message: text }; }
    if (!res.ok) {
        throw new Error(`${method} ${path} → ${res.status}: ${json.message ?? text}`);
    }
    return json;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
const green = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;
const bold = s => `\x1b[1m${s}\x1b[0m`;
const dim = s => `\x1b[2m${s}\x1b[0m`;

const ok = msg => console.log(`  ${green('✔')}  ${msg}`);
const skip = msg => console.log(`  ${yellow('⚠')}  ${msg} ${dim('(skipped)')}`);
const info = msg => console.log(`\n${bold(msg)}`);

// ─── Step 1: Create function ──────────────────────────────────────────────────
async function createFunction() {
    info('⚡  Creating Appwrite Function');

    if (FUNCTION_ID) {
        skip(`Function ID already set: ${FUNCTION_ID}`);
        return FUNCTION_ID;
    }

    const result = await req('POST', '/functions', {
        functionId: 'estimate-calories',
        name: 'Estimate Calories',
        runtime: 'bun-1.0',
        entrypoint: 'src/main.js',
        execute: ['users'],   // only authenticated users can execute
        timeout: 20,
        enabled: true,
    });

    if (result.alreadyExists) {
        // Function exists — fetch it to get the real ID
        const list = await req('GET', '/functions');
        const fn = list.functions?.find(f => f.name === 'Estimate Calories' || f.$id === 'estimate-calories');
        FUNCTION_ID = fn?.$id || 'estimate-calories';
        skip(`Function already exists (id: ${FUNCTION_ID})`);
    } else {
        FUNCTION_ID = result.$id;
        ok(`Created function "${result.name}" (id: ${FUNCTION_ID})`);
    }

    return FUNCTION_ID;
}

// ─── Step 2: Set env variable ──────────────────────────────────────────────────
async function setFunctionVariable() {
    info('🔐  Setting POLLINATIONS_API_KEY function variable');

    // List existing variables
    const vars = await req('GET', `/functions/${FUNCTION_ID}/variables`);
    const existing = vars.variables?.find(v => v.key === 'POLLINATIONS_API_KEY');

    if (existing) {
        // Update
        await req('PUT', `/functions/${FUNCTION_ID}/variables/${existing.$id}`, {
            key: 'POLLINATIONS_API_KEY',
            value: POLLINATIONS_API_KEY,
        });
        ok('Updated POLLINATIONS_API_KEY');
    } else {
        // Create
        await req('POST', `/functions/${FUNCTION_ID}/variables`, {
            key: 'POLLINATIONS_API_KEY',
            value: POLLINATIONS_API_KEY,
        });
        ok('Set POLLINATIONS_API_KEY');
    }
}

// ─── Step 3: Build tar.gz ─────────────────────────────────────────────────────
function buildTarball() {
    info('📦  Building function tarball');

    if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

    const tarPath = join(TMP_DIR, 'fn.tar.gz');

    // `tar` is built into Windows 10 v1803+, macOS, and Linux
    // -C changes to FN_SRC_DIR so paths inside the tar are relative
    const cmd = `tar -czf "${tarPath}" -C "${FN_SRC_DIR}" src`;
    try {
        execSync(cmd, { stdio: 'pipe' });
    } catch (e) {
        // Fallback: try with full path arg (some systems need it)
        execSync(`tar -czf "${tarPath}" -C "${FN_SRC_DIR}" .`, { stdio: 'pipe' });
    }

    ok(`Tarball created → ${tarPath}`);
    return tarPath;
}

// ─── Step 4: Upload deployment ────────────────────────────────────────────────
async function uploadDeployment(tarPath) {
    info('🚀  Uploading deployment');

    const fileBuffer = readFileSync(tarPath);
    const blob = new Blob([fileBuffer], { type: 'application/gzip' });

    const formData = new FormData();
    formData.append('entrypoint', 'src/main.js');
    formData.append('activate', 'true');
    formData.append('code', blob, 'code.tar.gz');

    const result = await reqMultipart(
        'POST',
        `/functions/${FUNCTION_ID}/deployments`,
        formData,
    );

    ok(`Deployment created (id: ${result.$id})`);
    ok(`Status: ${result.status}`);
    return result.$id;
}

// ─── Step 5: Write function ID back to .env.local ────────────────────────────
function writeFunctionIdToEnv() {
    info('📝  Saving EXPO_PUBLIC_APPWRITE_FUNCTION_ID to .env.local');

    let content = readFileSync(ENV_PATH, 'utf-8');
    const key = 'EXPO_PUBLIC_APPWRITE_FUNCTION_ID';

    if (content.includes(key)) {
        // Update existing line
        content = content.replace(
            new RegExp(`^${key}=.*$`, 'm'),
            `${key}=${FUNCTION_ID}`,
        );
    } else {
        content += `\n${key}=${FUNCTION_ID}\n`;
    }

    // Also comment out the public Pollinations key — it's no longer needed client-side
    content = content.replace(
        /^(EXPO_PUBLIC_POLLINATIONS_API_KEY=.*)$/m,
        '# $1   ← moved to Appwrite Function env var (POLLINATIONS_API_KEY)',
    );

    writeFileSync(ENV_PATH, content);
    ok(`Saved ${key}=${FUNCTION_ID}`);
    ok('Commented out EXPO_PUBLIC_POLLINATIONS_API_KEY (no longer needed in app)');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${bold('🍎  FitBites – Deploy estimate-calories function')}`);
    console.log(dim(`   Endpoint : ${ENDPOINT}`));
    console.log(dim(`   Project  : ${PROJECT_ID}`));

    await createFunction();
    await setFunctionVariable();
    const tarPath = buildTarball();
    await uploadDeployment(tarPath);
    writeFunctionIdToEnv();

    console.log(`\n${bold('─'.repeat(50))}`);
    console.log(`${green('✅  Function deployed successfully!')}`);
    console.log(`\n${bold('Function ID:')} ${dim(FUNCTION_ID)}`);
    console.log(`${bold('Next steps:')}`);
    console.log(`  1. Restart the Expo dev server (bunx expo start) to pick up the new env var.`);
    console.log(`  2. The app now calls the Appwrite Function — the Pollinations key is server-only.`);
    console.log(`  3. Rate limit: ${bold('15 requests / 60 s per user')} (in-memory, code-level).`);
    console.log(`${bold('─'.repeat(50))}\n`);
}

main().catch(err => {
    console.error(`\n${red('❌  Deploy failed:')} ${err.message}`);
    process.exit(1);
});
