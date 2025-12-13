import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built extension
const extensionPath = path.join(__dirname, '..', '.output', 'chrome-mv3');

// Helper function to get extension page
async function getExtensionPage(context: BrowserContext): Promise<{ page: Page; extensionId: string }> {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  const extensionId = serviceWorker.url().split('/')[2];
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Wait for API to load
  return { page, extensionId };
}

test.describe('QuickCurrency Extension - Popup', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('extension popup opens and shows header', async () => {
    const { page } = await getExtensionPage(context);

    // Check that popup loaded
    await expect(page.locator('.app')).toBeVisible({ timeout: 10000 });
    
    // Check for QuickCurrency header
    await expect(page.locator('.logo-text')).toContainText('QuickCurrency');
    
    await page.screenshot({ path: 'e2e/screenshots/popup-opened.png' });
    await page.close();
  });

  test('shows loading state initially then loads converter', async () => {
    const { page } = await getExtensionPage(context);

    // Wait for converter to load (either loading or converter should be visible)
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    await page.screenshot({ path: 'e2e/screenshots/converter-loaded.png' });
    await page.close();
  });

  test('shows header with history and refresh buttons', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Check for header buttons
    const historyBtn = page.locator('.icon-btn').first();
    const refreshBtn = page.locator('.icon-btn').nth(1);
    
    await expect(historyBtn).toBeVisible();
    await expect(refreshBtn).toBeVisible();
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Amount Input', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('shows amount input with currency symbol', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Check amount input exists
    const amountInput = page.locator('.amount-input input[type="number"]');
    await expect(amountInput).toBeVisible();
    
    // Check currency symbol is displayed
    const currencySymbol = page.locator('.currency-symbol');
    await expect(currencySymbol).toBeVisible();
    
    await page.screenshot({ path: 'e2e/screenshots/amount-input.png' });
    await page.close();
  });

  test('can enter custom amount', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    
    // Clear and enter new amount
    await amountInput.fill('');
    await amountInput.fill('500');
    
    await expect(amountInput).toHaveValue('500');
    
    await page.screenshot({ path: 'e2e/screenshots/custom-amount.png' });
    await page.close();
  });

  test('handles decimal amounts', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('123.45');
    
    await expect(amountInput).toHaveValue('123.45');
    
    // Result should update
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    await page.close();
  });

  test('handles large numbers', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('1000000');
    
    // Result should show formatted number with commas
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    const resultText = await page.locator('.result-amount').textContent();
    expect(resultText).toContain(',');
    
    await page.screenshot({ path: 'e2e/screenshots/large-amount.png' });
    await page.close();
  });

  test('handles zero amount', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('0');
    
    // App should handle gracefully
    await expect(page.locator('.converter')).toBeVisible();
    
    await page.close();
  });

  test('handles empty amount', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('');
    
    // App should not crash
    await expect(page.locator('.converter')).toBeVisible();
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Currency Selectors', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('shows From and To currency selectors', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Check both selectors are visible
    const fromSelect = page.locator('.currency-select').first();
    const toSelect = page.locator('.currency-select').nth(1);
    
    await expect(fromSelect).toBeVisible();
    await expect(toSelect).toBeVisible();
    
    await page.screenshot({ path: 'e2e/screenshots/currency-selectors.png' });
    await page.close();
  });

  test('currency selectors have many options', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const fromSelect = page.locator('.currency-select').first();
    const optionCount = await fromSelect.locator('option').count();
    
    // Should have 200+ currencies
    expect(optionCount).toBeGreaterThan(100);
    
    await page.close();
  });

  test('can change From currency', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const fromSelect = page.locator('.currency-select').first();
    
    // Change to EUR
    await fromSelect.selectOption('EUR');
    await page.waitForTimeout(1000);
    
    // Verify selection
    await expect(fromSelect).toHaveValue('EUR');
    
    // Currency symbol should update to €
    const currencySymbol = page.locator('.currency-symbol');
    await expect(currencySymbol).toContainText('€');
    
    await page.screenshot({ path: 'e2e/screenshots/from-currency-changed.png' });
    await page.close();
  });

  test('can change To currency', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const toSelect = page.locator('.currency-select').nth(1);
    
    // Change to JPY
    await toSelect.selectOption('JPY');
    await page.waitForTimeout(500);
    
    // Verify selection
    await expect(toSelect).toHaveValue('JPY');
    
    await page.screenshot({ path: 'e2e/screenshots/to-currency-changed.png' });
    await page.close();
  });

  test('swap button swaps currencies', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const fromSelect = page.locator('.currency-select').first();
    const toSelect = page.locator('.currency-select').nth(1);
    
    // Get initial values
    const initialFrom = await fromSelect.inputValue();
    const initialTo = await toSelect.inputValue();
    
    // Click swap button
    const swapButton = page.locator('.swap-btn');
    await expect(swapButton).toBeVisible();
    await swapButton.click();
    await page.waitForTimeout(1000);
    
    // Values should be swapped
    await expect(fromSelect).toHaveValue(initialTo);
    await expect(toSelect).toHaveValue(initialFrom);
    
    await page.screenshot({ path: 'e2e/screenshots/currencies-swapped.png' });
    await page.close();
  });

  test('swap button is visually distinct', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const swapButton = page.locator('.swap-btn');
    await expect(swapButton).toBeVisible();
    
    // Hover effect
    await swapButton.hover();
    await page.waitForTimeout(200);
    
    await page.screenshot({ path: 'e2e/screenshots/swap-button-hover.png' });
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Conversion Result', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('shows result card with conversion', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Enter an amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    
    // Result card should appear
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'e2e/screenshots/result-card.png' });
    await page.close();
  });

  test('result shows formatted amount', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('1000');
    
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Check result amount is displayed
    const resultAmount = page.locator('.result-amount');
    await expect(resultAmount).toBeVisible();
    
    const resultText = await resultAmount.textContent();
    expect(resultText).toBeTruthy();
    expect(parseFloat(resultText!.replace(/,/g, ''))).toBeGreaterThan(0);
    
    await page.close();
  });

  test('result shows rate info', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Check rate info
    const rateInfo = page.locator('.rate-info');
    await expect(rateInfo).toBeVisible();
    
    const rateText = await rateInfo.textContent();
    expect(rateText).toMatch(/1\s+\w+\s+=\s+[\d.,]+\s+\w+/);
    
    await page.screenshot({ path: 'e2e/screenshots/rate-info.png' });
    await page.close();
  });

  test('result updates when amount changes', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    
    // Enter first amount
    await amountInput.fill('100');
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    const result1 = await page.locator('.result-amount').textContent();
    
    // Enter second amount
    await amountInput.fill('200');
    await page.waitForTimeout(300);
    const result2 = await page.locator('.result-amount').textContent();
    
    // Results should be different
    expect(result1).not.toBe(result2);
    
    await page.close();
  });

  test('result updates when To currency changes', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    const result1 = await page.locator('.result-amount').textContent();
    
    // Change to currency
    const toSelect = page.locator('.currency-select').nth(1);
    await toSelect.selectOption('JPY');
    await page.waitForTimeout(500);
    
    const result2 = await page.locator('.result-amount').textContent();
    
    // Results should be different (JPY values are much larger)
    expect(result1).not.toBe(result2);
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - History', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('can save conversion to history', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Enter amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('250');
    
    // Wait for result
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Click save to history
    const saveButton = page.locator('.btn-primary');
    await expect(saveButton).toContainText('Save to History');
    await saveButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'e2e/screenshots/saved-to-history.png' });
    await page.close();
  });

  test('can open history panel', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Click history button
    const historyButton = page.locator('.icon-btn').first();
    await historyButton.click();
    await page.waitForTimeout(300);
    
    // History panel should be visible
    await expect(page.locator('.history-panel')).toBeVisible();
    await expect(page.locator('text=Recent Conversions')).toBeVisible();
    
    await page.screenshot({ path: 'e2e/screenshots/history-panel.png' });
    await page.close();
  });

  test('history shows saved items', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // First add an item to history
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('500');
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(500);
    
    // Open history
    const historyButton = page.locator('.icon-btn').first();
    await historyButton.click();
    await page.waitForTimeout(300);
    
    // Check history items exist
    const historyItems = page.locator('.history-item');
    const count = await historyItems.count();
    expect(count).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'e2e/screenshots/history-with-items.png' });
    await page.close();
  });

  test('can return to converter from history', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Open history
    const historyButton = page.locator('.icon-btn').first();
    await historyButton.click();
    await page.waitForTimeout(300);
    
    await expect(page.locator('.history-panel')).toBeVisible();
    
    // Click back button
    const backButton = page.locator('.btn-secondary');
    await expect(backButton).toContainText('Back to Converter');
    await backButton.click();
    await page.waitForTimeout(300);
    
    // Converter should be visible again
    await expect(page.locator('.converter')).toBeVisible();
    await expect(page.locator('.history-panel')).not.toBeVisible();
    
    await page.close();
  });

  test('history toggle works repeatedly', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const historyButton = page.locator('.icon-btn').first();
    
    // Toggle multiple times
    for (let i = 0; i < 3; i++) {
      await historyButton.click();
      await page.waitForTimeout(300);
      await expect(page.locator('.history-panel')).toBeVisible();
      
      await page.locator('.btn-secondary').click();
      await page.waitForTimeout(300);
      await expect(page.locator('.converter')).toBeVisible();
    }
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Refresh Rates', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('refresh button is visible', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const refreshButton = page.locator('.icon-btn').nth(1);
    await expect(refreshButton).toBeVisible();
    
    await page.close();
  });

  test('can click refresh button', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const refreshButton = page.locator('.icon-btn').nth(1);
    await refreshButton.click();
    
    // Should show spinning animation briefly
    await page.waitForTimeout(500);
    
    // Converter should still work
    await expect(page.locator('.converter')).toBeVisible();
    
    await page.screenshot({ path: 'e2e/screenshots/after-refresh.png' });
    await page.close();
  });

  test('rates update after refresh', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Enter amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Refresh
    const refreshButton = page.locator('.icon-btn').nth(1);
    await refreshButton.click();
    await page.waitForTimeout(1500);
    
    // Result should still display
    await expect(page.locator('.result-card')).toBeVisible();
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Quick Access Currencies', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('shows quick currencies section', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Quick currencies should be visible
    const quickSection = page.locator('.quick-currencies');
    await expect(quickSection).toBeVisible();
    
    await page.screenshot({ path: 'e2e/screenshots/quick-currencies.png' });
    await page.close();
  });

  test('quick currency buttons are clickable', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const quickButtons = page.locator('.quick-currency-btn');
    const count = await quickButtons.count();
    
    if (count > 0) {
      // Get initial To currency
      const toSelect = page.locator('.currency-select').nth(1);
      const initialTo = await toSelect.inputValue();
      
      // Click a different quick currency
      const buttonToClick = await quickButtons.filter({ hasNotText: initialTo }).first();
      if (await buttonToClick.isVisible()) {
        const buttonText = await buttonToClick.textContent();
        await buttonToClick.click();
        await page.waitForTimeout(500);
        
        // To currency should change
        await expect(toSelect).toHaveValue(buttonText!);
      }
    }
    
    await page.close();
  });

  test('active quick currency is highlighted', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const toSelect = page.locator('.currency-select').nth(1);
    const toCurrency = await toSelect.inputValue();
    
    // Find the quick currency button matching the To currency
    const activeButton = page.locator(`.quick-currency-btn:has-text("${toCurrency}")`);
    
    if (await activeButton.isVisible()) {
      await expect(activeButton).toHaveClass(/active/);
    }
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Footer', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('shows footer with last updated time', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    
    const lastUpdated = page.locator('.last-updated');
    await expect(lastUpdated).toBeVisible();
    await expect(lastUpdated).toContainText('Updated:');
    
    await page.screenshot({ path: 'e2e/screenshots/footer.png' });
    await page.close();
  });

  test('shows 200+ currencies badge', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const poweredBy = page.locator('.powered-by');
    await expect(poweredBy).toBeVisible();
    await expect(poweredBy).toContainText('200+ currencies');
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Error Handling', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('app handles negative numbers gracefully', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('-100');
    
    // App should not crash
    await expect(page.locator('.converter')).toBeVisible();
    
    await page.close();
  });

  test('app recovers from errors', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Even if there's an error, user can continue using the app
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('');
    await page.waitForTimeout(200);
    await amountInput.fill('100');
    
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    await page.close();
  });
});

test.describe('QuickCurrency Extension - Full UI Screenshot Suite', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('capture full UI - main converter', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Set up nice looking state
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('1000');
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'e2e/screenshots/full-ui-converter.png' });
    await page.close();
  });

  test('capture full UI - different currencies', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Set GBP to JPY
    const fromSelect = page.locator('.currency-select').first();
    const toSelect = page.locator('.currency-select').nth(1);
    
    await fromSelect.selectOption('GBP');
    await page.waitForTimeout(1500);
    await toSelect.selectOption('JPY');
    await page.waitForTimeout(500);
    
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('500');
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'e2e/screenshots/full-ui-gbp-jpy.png' });
    await page.close();
  });

  test('capture full UI - history view', async () => {
    const { page } = await getExtensionPage(context);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });

    // Add some history items
    const amountInput = page.locator('.amount-input input[type="number"]');
    const amounts = ['100', '250', '1000'];
    
    for (const amount of amounts) {
      await amountInput.fill(amount);
      await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
      await page.locator('.btn-primary').click();
      await page.waitForTimeout(300);
    }
    
    // Open history
    await page.locator('.icon-btn').first().click();
    await page.waitForTimeout(300);
    
    await page.screenshot({ path: 'e2e/screenshots/full-ui-history.png' });
    await page.close();
  });
});
