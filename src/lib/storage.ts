import { storage } from 'wxt/utils/storage';

// Pro feature limits
export const FREE_HISTORY_LIMIT = 10;
export const FREE_QUICK_ACCESS_LIMIT = 5;
export const PRO_HISTORY_LIMIT = 500;
export const PRO_QUICK_ACCESS_LIMIT = 20;

export interface UserPreferences {
  fromCurrency: string;
  toCurrency: string;
  recentCurrencies: string[];
  theme: 'light' | 'dark' | 'system';
}

export interface UserSettings {
  isPro: boolean;
  proSince: number | null;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  recentCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'],
  theme: 'system',
};

const DEFAULT_SETTINGS: UserSettings = {
  isPro: false,
  proSince: null,
};

// Settings storage
export const settingsStorage = storage.defineItem<UserSettings>(
  'local:settings',
  {
    fallback: DEFAULT_SETTINGS,
  }
);

export async function getSettings(): Promise<UserSettings> {
  return await settingsStorage.getValue();
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await settingsStorage.setValue({ ...current, ...settings });
}

export async function setProStatus(isPro: boolean): Promise<void> {
  await saveSettings({
    isPro,
    proSince: isPro ? Date.now() : null,
  });
}

export const preferencesStorage = storage.defineItem<UserPreferences>(
  'local:preferences',
  {
    fallback: DEFAULT_PREFERENCES,
  }
);

export async function getPreferences(): Promise<UserPreferences> {
  return await preferencesStorage.getValue();
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const current = await getPreferences();
  await preferencesStorage.setValue({ ...current, ...prefs });
}

export async function addRecentCurrency(code: string, isPro: boolean = false): Promise<void> {
  const prefs = await getPreferences();
  const recent = prefs.recentCurrencies.filter(c => c !== code);
  recent.unshift(code);
  // Pro users get more quick access slots
  const limit = isPro ? PRO_QUICK_ACCESS_LIMIT : FREE_QUICK_ACCESS_LIMIT;
  await savePreferences({ recentCurrencies: recent.slice(0, limit) });
}

// Get display limit for quick access currencies
export function getQuickAccessLimit(isPro: boolean): number {
  return isPro ? PRO_QUICK_ACCESS_LIMIT : FREE_QUICK_ACCESS_LIMIT;
}

// Get display limit for history
export function getHistoryLimit(isPro: boolean): number {
  return isPro ? PRO_HISTORY_LIMIT : FREE_HISTORY_LIMIT;
}

// Conversion history
export interface ConversionEntry {
  id: string;
  amount: number;
  from: string;
  to: string;
  result: number;
  timestamp: number;
}

export const historyStorage = storage.defineItem<ConversionEntry[]>(
  'local:history',
  {
    fallback: [],
  }
);

export async function addToHistory(entry: Omit<ConversionEntry, 'id' | 'timestamp'>, isPro: boolean = false): Promise<void> {
  const history = await historyStorage.getValue();
  const newEntry: ConversionEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  // Pro users get more history entries
  const limit = isPro ? PRO_HISTORY_LIMIT : FREE_HISTORY_LIMIT;
  const updated = [newEntry, ...history].slice(0, limit);
  await historyStorage.setValue(updated);
}

export async function getHistory(): Promise<ConversionEntry[]> {
  return await historyStorage.getValue();
}

export async function clearHistory(): Promise<void> {
  await historyStorage.setValue([]);
}
