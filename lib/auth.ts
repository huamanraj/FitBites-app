import { account, ID } from './appwrite';

async function deleteSession(): Promise<void> {
    try {
        await account.deleteSession({ sessionId: 'current' });
    } catch {
        // session may already be gone
    }
}

async function clearStoredSession(): Promise<void> {
    try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync('appwrite_session');
    } catch {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('appwrite_session');
        }
    }
}

export interface User {
    $id: string;
    name: string;
    email: string;
}

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
    await deleteSession();
    await clearStoredSession();
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const user = await account.get();
        return { $id: user.$id, name: user.name, email: user.email };
    } catch {
        await clearStoredSession();
        return null;
    }
}

export async function updateName(name: string): Promise<void> {
    await account.updateName({ name });
}
