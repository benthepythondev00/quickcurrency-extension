// Currency API using fawazahmed0/exchange-api
// Free, no rate limits, 200+ currencies including crypto

const PRIMARY_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1';
const FALLBACK_API = 'https://latest.currency-api.pages.dev/v1';

export interface CurrencyRates {
  [currency: string]: number;
}

export interface CurrencyList {
  [code: string]: string;
}

// Popular currencies to show first
export const POPULAR_CURRENCIES = [
  'usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'mxn',
  'brl', 'krw', 'sgd', 'hkd', 'nzd', 'sek', 'nok', 'dkk', 'pln', 'zar',
  'btc', 'eth', 'xrp', 'ltc', 'bch'
];

// Cache for API responses
let ratesCache: { [base: string]: { rates: CurrencyRates; timestamp: number } } = {};
let currencyListCache: { list: CurrencyList; timestamp: number } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function fetchWithFallback<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${PRIMARY_API}${endpoint}`);
    if (!response.ok) throw new Error('Primary API failed');
    return response.json();
  } catch (error) {
    console.log('Primary API failed, trying fallback...');
    const response = await fetch(`${FALLBACK_API}${endpoint}`);
    if (!response.ok) throw new Error('Both APIs failed');
    return response.json();
  }
}

export async function getCurrencyList(): Promise<CurrencyList> {
  // Check cache
  if (currencyListCache && Date.now() - currencyListCache.timestamp < CACHE_DURATION) {
    return currencyListCache.list;
  }

  const data = await fetchWithFallback<CurrencyList>('/currencies.json');
  currencyListCache = { list: data, timestamp: Date.now() };
  return data;
}

export async function getRates(baseCurrency: string): Promise<CurrencyRates> {
  const base = baseCurrency.toLowerCase();
  
  // Check cache
  if (ratesCache[base] && Date.now() - ratesCache[base].timestamp < CACHE_DURATION) {
    return ratesCache[base].rates;
  }

  const data = await fetchWithFallback<{ [key: string]: CurrencyRates }>(`/currencies/${base}.json`);
  const rates = data[base];
  
  ratesCache[base] = { rates, timestamp: Date.now() };
  return rates;
}

export function convertCurrency(
  amount: number,
  fromRate: number,
  toRate: number
): number {
  // Convert: amount in FROM currency to TO currency
  // rate is how many units of target currency per 1 unit of base
  return (amount / fromRate) * toRate;
}

export async function convert(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  
  if (fromLower === toLower) return amount;
  
  // Get rates with 'from' as base
  const rates = await getRates(fromLower);
  const toRate = rates[toLower];
  
  if (!toRate) {
    throw new Error(`Rate not found for ${to}`);
  }
  
  return amount * toRate;
}

// Format currency with proper decimals
export function formatCurrency(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  
  // Crypto currencies typically need more decimal places
  const cryptoCurrencies = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'DOGE', 'ADA', 'DOT', 'SOL'];
  
  if (cryptoCurrencies.includes(code)) {
    if (amount < 0.0001) {
      return amount.toExponential(4);
    }
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 8 
    });
  }
  
  // Regular currencies
  return amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
}

// Get currency symbol
export function getCurrencySymbol(code: string): string {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    KRW: '₩',
    BTC: '₿',
    ETH: 'Ξ',
    RUB: '₽',
    BRL: 'R$',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'Fr',
    MXN: '$',
    SGD: 'S$',
    HKD: 'HK$',
    NOK: 'kr',
    SEK: 'kr',
    DKK: 'kr',
    NZD: 'NZ$',
    ZAR: 'R',
    PLN: 'zł',
    THB: '฿',
    TRY: '₺',
    ILS: '₪',
    PHP: '₱',
    CZK: 'Kč',
    IDR: 'Rp',
    MYR: 'RM',
    HUF: 'Ft',
    CLP: '$',
    TWD: 'NT$',
    ARS: '$',
    COP: '$',
    SAR: '﷼',
    AED: 'د.إ',
  };
  
  return symbols[code.toUpperCase()] || code.toUpperCase();
}
