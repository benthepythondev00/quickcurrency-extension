import { X, Moon, Sun, Monitor, Crown, Check } from 'lucide-react';
import { openPaymentPage, openLoginPage } from '@/src/lib/payment';
import { FREE_HISTORY_LIMIT, FREE_QUICK_ACCESS_LIMIT, PRO_HISTORY_LIMIT, PRO_QUICK_ACCESS_LIMIT } from '@/src/lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function SettingsModal({ isOpen, onClose, isPro, theme, onThemeChange }: SettingsModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    openPaymentPage();
  };

  const handleRestorePurchase = () => {
    openLoginPage();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Pro Status */}
          <div className="settings-section">
            <div className="settings-label">Account</div>
            {isPro ? (
              <div className="pro-badge-large">
                <Crown size={18} />
                <span>Pro Member</span>
              </div>
            ) : (
              <div className="upgrade-card">
                <div className="upgrade-header">
                  <Crown size={20} />
                  <span>Upgrade to Pro</span>
                </div>
                <ul className="upgrade-features">
                  <li><Check size={14} /> Unlimited conversion history</li>
                  <li><Check size={14} /> Unlimited quick access currencies</li>
                  <li><Check size={14} /> Dark mode theme</li>
                  <li><Check size={14} /> Favorite currency pairs</li>
                </ul>
                <div className="upgrade-pricing">
                  <span className="price">$0.99/mo</span>
                  <span className="or">or</span>
                  <span className="price">$9.99 lifetime</span>
                </div>
                <button className="btn-upgrade" onClick={handleUpgrade}>
                  Upgrade Now
                </button>
                <button className="btn-restore" onClick={handleRestorePurchase}>
                  Restore Purchase
                </button>
              </div>
            )}
          </div>

          {/* Theme Selection */}
          <div className="settings-section">
            <div className="settings-label">Theme {!isPro && <span className="pro-tag">PRO</span>}</div>
            <div className={`theme-options ${!isPro ? 'disabled' : ''}`}>
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => isPro && onThemeChange('light')}
                disabled={!isPro}
              >
                <Sun size={16} />
                <span>Light</span>
              </button>
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => isPro && onThemeChange('dark')}
                disabled={!isPro}
              >
                <Moon size={16} />
                <span>Dark</span>
              </button>
              <button
                className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => isPro && onThemeChange('system')}
                disabled={!isPro}
              >
                <Monitor size={16} />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Feature Limits */}
          <div className="settings-section">
            <div className="settings-label">Your Limits</div>
            <div className="limits-info">
              <div className="limit-row">
                <span>History entries</span>
                <span className="limit-value">
                  {isPro ? PRO_HISTORY_LIMIT : FREE_HISTORY_LIMIT}
                  {isPro && <Crown size={12} className="limit-crown" />}
                </span>
              </div>
              <div className="limit-row">
                <span>Quick access currencies</span>
                <span className="limit-value">
                  {isPro ? PRO_QUICK_ACCESS_LIMIT : FREE_QUICK_ACCESS_LIMIT}
                  {isPro && <Crown size={12} className="limit-crown" />}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <span className="version">QuickCurrency v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
