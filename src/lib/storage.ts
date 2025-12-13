import { storage } from 'wxt/utils/storage';

export interface UserPreferences {
  fromCurrency: string;
  toCurrency: string;
  recentCurrencies: string[];
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  recentCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'],
  theme: 'system',
};

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

export async function addRecentCurrency(code: string): Promise<void> {
  const prefs = await getPreferences();
  const recent = prefs.recentCurrencies.filter(c => c !== code);
  recent.unshift(code);
  // Keep only last 10
  await savePreferences({ recentCurrencies: recent.slice(0, 10) });
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

export async function addToHistory(entry: Omit<ConversionEntry, 'id' | 'timestamp'>): Promise<void> {
  const history = await historyStorage.getValue();
  const newEntry: ConversionEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  // Keep last 50 entries
  const updated = [newEntry, ...history].slice(0, 50);
  await historyStorage.setValue(updated);
}

export async function getHistory(): Promise<ConversionEntry[]> {
  return await historyStorage.getValue();
}

export async function clearHistory(): Promise<void> {
  await historyStorage.setValue([]);
}
