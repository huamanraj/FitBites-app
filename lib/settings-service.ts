import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'user_settings';

export interface UserSettings {
    displayName: string;
    dailyCalorieGoal: number;
}

const DEFAULT_SETTINGS: UserSettings = {
    displayName: '',
    dailyCalorieGoal: 2000,
};

export async function getSettings(): Promise<UserSettings> {
    try {
        const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch {
        // ignore parse errors
    }
    return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await getSettings();
    const merged = { ...current, ...settings };
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
}
