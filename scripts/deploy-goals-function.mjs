#!/usr/bin/env node
/**
 * FitBites – Deploy calculate-goals Appwrite Function
 * ─────────────────────────────────────────────────────
 * Mirrors deploy-function.mjs but targets the calculate-goals function.
 *
 * Usage
 *   node scripts/deploy-goals-function.mjs
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
const FN_SRC_DIR = resolve(ROOT, 'appwrite-functions', 'calculate-goals');
const ENV_PATH = resolve(ROOT, '.env.local');
const TMP_DIR = join(tmpdir(), 'fitbites-goals-fn-deploy');

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
            env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
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
let FUNCTION_ID = env['EXPO_PUBLIC_APPWRITE_GOALS_FUNCTION_ID'] || '';

// ─── Validate ─────────────────────────────────────────────────────────────────
const missing = [];
if (!ENDPOINT) missing.push('EXPO_PUBLIC_APPWRITE_ENDPOINT');
if (!PROJECT_ID) missing.push('EXPO_PUBLIC_APPWRITE_PROJECT_ID');
if (!API_KEY) missing.push('APPWRITE_API_KEY');
if (!POLLINATIONS_API_KEY) missing.push('POLLINATIONS_API_KEY');

if (missing.length) {
    console.error('❌  Missing required env variables:');
    missing.forEach(k => console.error(`   • ${k}`));
    process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
const BASE_HEADERS = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
};

async function req(method, path, body) {
    const res = await fetch(`${ENDPOINT}${path}`, {
        method,
        headers: BASE_HEADERS,
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
    const res = await fetch(`${ENDPOINT}${path}`, {
        method,
        headers: { 'X-Appwrite-Project': PROJECT_ID, 'X-Appwrite-Key': API_KEY },
        body: formData,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { message: text }; }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${json.message ?? text}`);
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
    info('⚡  Creating calculate-goals function');

    if (FUNCTION_ID) {
        skip(`Function ID already set: ${FUNCTION_ID}`);
        return;
    }

    const result = await req('POST', '/functions', {
        functionId: 'calculate-goals',
        name: 'Calculate Goals',
        runtime: 'bun-1.0',
        entrypoint: 'src/main.js',
        execute: ['users'],
        timeout: 30,
        enabled: true,
    });

    if (result.alreadyExists) {
        FUNCTION_ID = 'calculate-goals';
        skip(`Function already exists (id: ${FUNCTION_ID})`);
    } else {
        FUNCTION_ID = result.$id;
        ok(`Created function "${result.name}" (id: ${FUNCTION_ID})`);
    }
}

// ─── Step 2: Set env variable ──────────────────────────────────────────────────
async function setFunctionVariable() {
    info('🔐  Setting POLLINATIONS_API_KEY');

    const vars = await req('GET', `/functions/${FUNCTION_ID}/variables`);
    const existing = vars.variables?.find(v => v.key === 'POLLINATIONS_API_KEY');

    if (existing) {
        await req('PUT', `/functions/${FUNCTION_ID}/variables/${existing.$id}`, {
            key: 'POLLINATIONS_API_KEY', value: POLLINATIONS_API_KEY,
        });
        ok('Updated POLLINATIONS_API_KEY');
    } else {
        await req('POST', `/functions/${FUNCTION_ID}/variables`, {
            key: 'POLLINATIONS_API_KEY', value: POLLINATIONS_API_KEY,
        });
        ok('Set POLLINATIONS_API_KEY');
    }
}

// ─── Step 3: Build tarball ────────────────────────────────────────────────────
function buildTarball() {
    info('📦  Building tarball');

    if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
    const tarPath = join(TMP_DIR, 'fn.tar.gz');

    try {
        execSync(`tar -czf "${tarPath}" -C "${FN_SRC_DIR}" src`, { stdio: 'pipe' });
    } catch {
        execSync(`tar -czf "${tarPath}" -C "${FN_SRC_DIR}" .`, { stdio: 'pipe' });
    }

    ok(`Tarball → ${tarPath}`);
    return tarPath;
}

// ─── Step 4: Upload deployment ────────────────────────────────────────────────
async function uploadDeployment(tarPath) {
    info('🚀  Uploading deployment');

    const blob = new Blob([readFileSync(tarPath)], { type: 'application/gzip' });
    const formData = new FormData();
    formData.append('entrypoint', 'src/main.js');
    formData.append('activate', 'true');
    formData.append('code', blob, 'code.tar.gz');

    const result = await reqMultipart('POST', `/functions/${FUNCTION_ID}/deployments`, formData);
    ok(`Deployment created (id: ${result.$id})`);
    ok(`Status: ${result.status}`);
}

// ─── Step 5: Save function ID to .env.local ───────────────────────────────────
function saveFunctionId() {
    info('📝  Saving EXPO_PUBLIC_APPWRITE_GOALS_FUNCTION_ID');

    let content = readFileSync(ENV_PATH, 'utf-8');
    const key = 'EXPO_PUBLIC_APPWRITE_GOALS_FUNCTION_ID';

    if (content.includes(key)) {
        content = content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${FUNCTION_ID}`);
    } else {
        content += `\n${key}=${FUNCTION_ID}\n`;
    }

    writeFileSync(ENV_PATH, content);
    ok(`Saved ${key}=${FUNCTION_ID}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${bold('🍎  FitBites – Deploy calculate-goals function')}`);
    console.log(dim(`   Endpoint : ${ENDPOINT}`));
    console.log(dim(`   Project  : ${PROJECT_ID}`));

    await createFunction();
    await setFunctionVariable();
    const tarPath = buildTarball();
    await uploadDeployment(tarPath);
    saveFunctionId();

    console.log(`\n${bold('─'.repeat(50))}`);
    console.log(`${green('✅  calculate-goals deployed!')}`);
    console.log(`\n  ID        : ${dim(FUNCTION_ID)}`);
    console.log(`  Rate limit: ${bold('5 goal calculations / 60 s per user')} (in-memory)`);
    console.log(`  Model     : ${bold('openai')} (full reasoning, not the fast variant)`);
    console.log(`\n  Restart: ${bold('bunx expo start')} to pick up the new env var.`);
    console.log(`${bold('─'.repeat(50))}\n`);
}

main().catch(err => {
    console.error(`\n${red('❌  Deploy failed:')} ${err.message}`);
    process.exit(1);
});
