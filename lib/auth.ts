import { makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { OAuthProvider } from 'react-native-appwrite';
import { account, ID } from './appwrite';

const SESSION_KEY = 'appwrite_session';

export interface User {
    $id: string;
    name: string;
    email: string;
}

// ── Email / password ──────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<User> {
    await account.createEmailPasswordSession({ email, password });
    const user = await account.get();
    return { $id: user.$id, name: user.name, email: user.email };
}

export async function register(name: string, email: string, password: string): Promise<User> {
    await account.create({ userId: ID.unique(), email, password, name });
    return login(email, password);
}

export async function logout(): Promise<void> {
    try {
        await account.deleteSession({ sessionId: 'current' });
    } catch {
        // session may already be gone
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const user = await account.get();
        return { $id: user.$id, name: user.name, email: user.email };
    } catch {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        return null;
    }
}

export async function updateName(name: string): Promise<void> {
    await account.updateName({ name });
}

// ── Google OAuth2 ─────────────────────────────────────────────────────────────
//
// Correct Expo flow (Appwrite docs):
//   1. createOAuth2Token()          → synchronous, returns URL object
//   2. openAuthSessionAsync()       → opens browser, blocks until redirect
//   3. parse userId + secret        → from redirect URL search params
//   4. createSession({userId,secret}) → creates the Appwrite session

export async function loginWithGoogle(): Promise<User> {
    // Builds the deep-link URI that Appwrite redirects to after OAuth.
    // makeRedirectUri() resolves to the correct URL for Expo Go / standalone.
    const redirectUri = makeRedirectUri({ preferLocalhost: true });

    // --- Step 1: Get the Google OAuth login URL from Appwrite (sync call) ---
    const loginUrlObj = account.createOAuth2Token({
        provider: OAuthProvider.Google,
        success: redirectUri,
        failure: redirectUri,
    });

    if (!loginUrlObj) {
        throw new Error('Appwrite did not return an OAuth URL.');
    }

    const loginUrl = loginUrlObj.toString();

    // Scheme to listen for (e.g. "appwrite-callback-fitbites://")
    const scheme = redirectUri.split('://')[0] + '://';

    // --- Step 2: Open the browser and wait for redirect back to our scheme ---
    const result = await WebBrowser.openAuthSessionAsync(loginUrl, scheme);

    if (result.type !== 'success' || !result.url) {
        // User closed the browser — surface as a "cancelled" error so the
        // UI can silently swallow it without showing an alert.
        throw new Error('Google sign-in was cancelled.');
    }

    // --- Step 3: Parse credentials from the redirect URL ---
    const url = new URL(result.url);
    const secret = url.searchParams.get('secret');
    const userId = url.searchParams.get('userId');

    if (!secret || !userId) {
        throw new Error('OAuth callback is missing credentials. Please try signing in again.');
    }

    // --- Step 4: Exchange for a real Appwrite session ---
    await account.createSession({ userId, secret });

    const user = await account.get();
    return { $id: user.$id, name: user.name, email: user.email };
}
