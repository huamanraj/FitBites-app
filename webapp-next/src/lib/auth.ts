import { account, ID } from './appwrite';

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
    try {
        await account.deleteSession({ sessionId: 'current' });
    } catch {
        // session may already be gone
    }
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const user = await account.get();
        return { $id: user.$id, name: user.name, email: user.email };
    } catch {
        return null;
    }
}

export async function updateName(name: string): Promise<void> {
    await account.updateName({ name });
}
