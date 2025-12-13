import { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, History, RefreshCw, Star, X } from 'lucide-react';
import { 
  getCurrencyList, 
  getRates, 
  formatCurrency, 
  getCurrencySymbol,
  POPULAR_CURRENCIES,
  type CurrencyList,
  type CurrencyRates
} from '@/src/lib/currency-api';
import { 
  getPreferences, 
  savePreferences, 
  addRecentCurrency,
  addToHistory,
  getHistory,
  type ConversionEntry 
} from '@/src/lib/storage';
import './App.css';

function App() {
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number | null>(null);
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyList>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCurrencies, setRecentCurrencies] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ConversionEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);
        
        // Load preferences
        const prefs = await getPreferences();
        setFromCurrency(prefs.fromCurrency);
        setToCurrency(prefs.toCurrency);
        setRecentCurrencies(prefs.recentCurrencies);
        
        // Load currencies list
        const currencyList = await getCurrencyList();
        setCurrencies(currencyList);
        
        // Load rates
        const ratesData = await getRates(prefs.fromCurrency.toLowerCase());
        setRates(ratesData);
        setLastUpdated(new Date());
        
        // Load history
        const hist = await getHistory();
        setHistory(hist);
        
      } catch (err) {
        setError('Failed to load exchange rates. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, []);

  // Convert when inputs change
  useEffect(() => {
    if (!rates || !amount) {
      setResult(null);
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setResult(null);
      return;
    }
    
    const toRate = rates[toCurrency.toLowerCase()];
    if (toRate) {
      setResult(numAmount * toRate);
    }
  }, [amount, rates, toCurrency]);

  // Fetch new rates when from currency changes
  const fetchRates = useCallback(async (currency: string) => {
    try {
      setError(null);
      const ratesData = await getRates(currency.toLowerCase());
      setRates(ratesData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch rates');
      console.error(err);
    }
  }, []);

  const handleFromCurrencyChange = async (currency: string) => {
    setFromCurrency(currency);
    await savePreferences({ fromCurrency: currency });
    await addRecentCurrency(currency);
    await fetchRates(currency);
    
    const prefs = await getPreferences();
    setRecentCurrencies(prefs.recentCurrencies);
  };

  const handleToCurrencyChange = async (currency: string) => {
    setToCurrency(currency);
    await savePreferences({ toCurrency: currency });
    await addRecentCurrency(currency);
    
    const prefs = await getPreferences();
    setRecentCurrencies(prefs.recentCurrencies);
  };

  const swapCurrencies = async () => {
    const newFrom = toCurrency;
    const newTo = fromCurrency;
    
    setFromCurrency(newFrom);
    setToCurrency(newTo);
    
    await savePreferences({ fromCurrency: newFrom, toCurrency: newTo });
    await fetchRates(newFrom);
  };

  const handleConvert = async () => {
    if (result !== null && amount) {
      await addToHistory({
        amount: parseFloat(amount),
        from: fromCurrency,
        to: toCurrency,
        result,
      });
      const hist = await getHistory();
      setHistory(hist);
    }
  };

  const refreshRates = async () => {
    setLoading(true);
    await fetchRates(fromCurrency);
    setLoading(false);
  };

  // Sort currencies: popular first, then alphabetical
  const sortedCurrencies = Object.entries(currencies).sort(([a], [b]) => {
    const aPopular = POPULAR_CURRENCIES.includes(a.toLowerCase());
    const bPopular = POPULAR_CURRENCIES.includes(b.toLowerCase());
    
    if (aPopular && !bPopular) return -1;
    if (!aPopular && bPopular) return 1;
    
    return a.localeCompare(b);
  });

  if (loading && !rates) {
    return (
      <div className="app loading-screen">
        <div className="spinner" />
        <p>Loading exchange rates...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">$</span>
            <span className="logo-text">QuickCurrency</span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-btn" 
            onClick={() => setShowHistory(!showHistory)}
            title="History"
          >
            <History size={18} />
          </button>
          <button 
            className="icon-btn" 
            onClick={refreshRates}
            title="Refresh rates"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {showHistory ? (
        <div className="history-panel">
          <h3>Recent Conversions</h3>
          {history.length === 0 ? (
            <p className="empty-history">No conversions yet</p>
          ) : (
            <ul className="history-list">
              {history.slice(0, 10).map((entry) => (
                <li key={entry.id} className="history-item">
                  <span className="history-amount">
                    {getCurrencySymbol(entry.from)}{formatCurrency(entry.amount, entry.from)} {entry.from}
                  </span>
                  <span className="history-arrow">=</span>
                  <span className="history-result">
                    {getCurrencySymbol(entry.to)}{formatCurrency(entry.result, entry.to)} {entry.to}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button className="btn-secondary" onClick={() => setShowHistory(false)}>
            Back to Converter
          </button>
        </div>
      ) : (
        <>
          <div className="converter">
            <div className="input-group">
              <label>Amount</label>
              <div className="amount-input">
                <span className="currency-symbol">{getCurrencySymbol(fromCurrency)}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="any"
                />
              </div>
            </div>

            <div className="currency-row">
              <div className="currency-select-group">
                <label>From</label>
                <select 
                  value={fromCurrency} 
                  onChange={(e) => handleFromCurrencyChange(e.target.value)}
                  className="currency-select"
                >
                  {sortedCurrencies.map(([code, name]) => (
                    <option key={code} value={code.toUpperCase()}>
                      {code.toUpperCase()} - {name}
                    </option>
                  ))}
                </select>
              </div>

              <button className="swap-btn" onClick={swapCurrencies} title="Swap currencies">
                <ArrowUpDown size={24} />
              </button>

              <div className="currency-select-group">
                <label>To</label>
                <select 
                  value={toCurrency} 
                  onChange={(e) => handleToCurrencyChange(e.target.value)}
                  className="currency-select"
                >
                  {sortedCurrencies.map(([code, name]) => (
                    <option key={code} value={code.toUpperCase()}>
                      {code.toUpperCase()} - {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {result !== null && (
              <div className="result-card">
                <div className="result-label">
                  {amount} {fromCurrency} =
                </div>
                <div className="result-value">
                  <span className="result-symbol">{getCurrencySymbol(toCurrency)}</span>
                  <span className="result-amount">{formatCurrency(result, toCurrency)}</span>
                  <span className="result-currency">{toCurrency}</span>
                </div>
                {rates && rates[toCurrency.toLowerCase()] && (
                  <div className="rate-info">
                    1 {fromCurrency} = {formatCurrency(rates[toCurrency.toLowerCase()], toCurrency)} {toCurrency}
                  </div>
                )}
              </div>
            )}

            <button className="btn-primary" onClick={handleConvert}>
              Save to History
            </button>
          </div>

          {recentCurrencies.length > 0 && (
            <div className="quick-currencies">
              <label>Quick Access</label>
              <div className="quick-currency-list">
                {recentCurrencies.slice(0, 5).map((code) => (
                  <button
                    key={code}
                    className={`quick-currency-btn ${code === toCurrency ? 'active' : ''}`}
                    onClick={() => handleToCurrencyChange(code)}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <footer className="footer">
        {lastUpdated && (
          <span className="last-updated">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <span className="powered-by">200+ currencies</span>
      </footer>
    </div>
  );
}

export default App;
