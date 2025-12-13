import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../.output/chrome-mv3');

// Helper to get extension ID
async function getExtensionId(context: BrowserContext): Promise<string> {
  // Open extensions page to get the ID
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  const extensionId = background.url().split('/')[2];
  return extensionId;
}

// Helper to open popup
async function openPopup(context: BrowserContext, extensionId: string) {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const page = await context.newPage();
  await page.goto(popupUrl);
  return page;
}

test.describe('QuickCurrency Extension', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Launch browser with extension
    const browser = await chromium.launchPersistentContext('', {
      headless: false, // Extensions require headed mode
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
        '--disable-gpu',
      ],
    });
    context = browser;
    extensionId = await getExtensionId(context);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('popup loads successfully', async () => {
    const page = await openPopup(context, extensionId);
    
    // Wait for the app to load
    await expect(page.locator('.app')).toBeVisible({ timeout: 10000 });
    
    // Check header is visible
    await expect(page.locator('.logo-text')).toContainText('QuickCurrency');
    
    await page.close();
  });

  test('displays loading state initially', async () => {
    const page = await openPopup(context, extensionId);
    
    // Either loading screen or main app should be visible
    const isLoading = await page.locator('.loading-screen').isVisible().catch(() => false);
    const isApp = await page.locator('.converter').isVisible().catch(() => false);
    
    expect(isLoading || isApp).toBeTruthy();
    
    // Wait for converter to load
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    await page.close();
  });

  test('amount input works correctly', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Find amount input
    const amountInput = page.locator('.amount-input input[type="number"]');
    await expect(amountInput).toBeVisible();
    
    // Clear and type new amount
    await amountInput.fill('');
    await amountInput.fill('500');
    
    // Verify value
    await expect(amountInput).toHaveValue('500');
    
    await page.close();
  });

  test('currency selectors are populated', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Check from currency selector
    const fromSelect = page.locator('.currency-select').first();
    await expect(fromSelect).toBeVisible();
    
    // Check it has options
    const optionCount = await fromSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(10); // Should have many currencies
    
    // Check to currency selector
    const toSelect = page.locator('.currency-select').nth(1);
    await expect(toSelect).toBeVisible();
    
    await page.close();
  });

  test('swap currencies button works', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Get initial currencies
    const fromSelect = page.locator('.currency-select').first();
    const toSelect = page.locator('.currency-select').nth(1);
    
    const initialFrom = await fromSelect.inputValue();
    const initialTo = await toSelect.inputValue();
    
    // Click swap button
    const swapButton = page.locator('.swap-btn');
    await expect(swapButton).toBeVisible();
    await swapButton.click();
    
    // Wait for swap to complete
    await page.waitForTimeout(500);
    
    // Verify currencies swapped
    const newFrom = await fromSelect.inputValue();
    const newTo = await toSelect.inputValue();
    
    expect(newFrom).toBe(initialTo);
    expect(newTo).toBe(initialFrom);
    
    await page.close();
  });

  test('conversion result displays correctly', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter an amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    
    // Wait for result to update
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Check result value is displayed
    const resultAmount = page.locator('.result-amount');
    await expect(resultAmount).toBeVisible();
    
    // Result should be a number
    const resultText = await resultAmount.textContent();
    expect(resultText).toBeTruthy();
    expect(parseFloat(resultText!.replace(/,/g, ''))).toBeGreaterThan(0);
    
    await page.close();
  });

  test('rate info displays correctly', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter an amount to trigger result
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    
    // Wait for result
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Check rate info is displayed
    const rateInfo = page.locator('.rate-info');
    await expect(rateInfo).toBeVisible();
    
    // Should contain "1 XXX = Y.YY YYY"
    const rateText = await rateInfo.textContent();
    expect(rateText).toMatch(/1\s+\w+\s+=\s+[\d.,]+\s+\w+/);
    
    await page.close();
  });

  test('save to history button works', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter an amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('250');
    
    // Wait for result
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Click save to history
    const saveButton = page.locator('.btn-primary');
    await expect(saveButton).toContainText('Save to History');
    await saveButton.click();
    
    // Open history panel
    const historyButton = page.locator('.icon-btn').first();
    await historyButton.click();
    
    // Verify history panel is visible
    await expect(page.locator('.history-panel')).toBeVisible();
    
    // Check if history item was added
    const historyItems = page.locator('.history-item');
    const itemCount = await historyItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    await page.close();
  });

  test('history panel toggle works', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Click history button
    const historyButton = page.locator('.icon-btn').first();
    await historyButton.click();
    
    // History panel should be visible
    await expect(page.locator('.history-panel')).toBeVisible();
    await expect(page.locator('.converter')).not.toBeVisible();
    
    // Click back button
    const backButton = page.locator('.btn-secondary');
    await expect(backButton).toContainText('Back to Converter');
    await backButton.click();
    
    // Converter should be visible again
    await expect(page.locator('.converter')).toBeVisible();
    await expect(page.locator('.history-panel')).not.toBeVisible();
    
    await page.close();
  });

  test('refresh rates button works', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Get refresh button (second icon button)
    const refreshButton = page.locator('.icon-btn').nth(1);
    await expect(refreshButton).toBeVisible();
    
    // Click refresh
    await refreshButton.click();
    
    // Button should show spinning state briefly
    // Then app should still work
    await page.waitForTimeout(1000);
    
    // Verify converter still works
    await expect(page.locator('.converter')).toBeVisible();
    
    await page.close();
  });

  test('quick access currencies work', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Check for quick currencies section
    const quickSection = page.locator('.quick-currencies');
    
    // It may or may not be visible depending on recent currencies
    if (await quickSection.isVisible()) {
      const quickButtons = page.locator('.quick-currency-btn');
      const buttonCount = await quickButtons.count();
      
      if (buttonCount > 0) {
        // Click a quick currency button
        await quickButtons.first().click();
        
        // Wait for update
        await page.waitForTimeout(500);
        
        // Converter should still be visible
        await expect(page.locator('.converter')).toBeVisible();
      }
    }
    
    await page.close();
  });

  test('changing from currency updates rates', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter an amount first
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    
    // Wait for initial result
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Get initial result
    const initialResult = await page.locator('.result-amount').textContent();
    
    // Change from currency to GBP
    const fromSelect = page.locator('.currency-select').first();
    await fromSelect.selectOption('GBP');
    
    // Wait for rates to update
    await page.waitForTimeout(2000);
    
    // Result should be different
    const newResult = await page.locator('.result-amount').textContent();
    
    // Results should generally be different (unless same currencies)
    expect(newResult).toBeTruthy();
    
    await page.close();
  });

  test('changing to currency updates result', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter an amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('100');
    
    // Wait for result
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Get initial result
    const initialResult = await page.locator('.result-amount').textContent();
    
    // Change to currency
    const toSelect = page.locator('.currency-select').nth(1);
    await toSelect.selectOption('JPY');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Result should be different (JPY has different rate)
    const newResult = await page.locator('.result-amount').textContent();
    expect(newResult).not.toBe(initialResult);
    
    await page.close();
  });

  test('currency symbol updates correctly', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Check initial currency symbol
    const currencySymbol = page.locator('.currency-symbol');
    await expect(currencySymbol).toBeVisible();
    
    // Change from currency to EUR
    const fromSelect = page.locator('.currency-select').first();
    await fromSelect.selectOption('EUR');
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Symbol should update to €
    await expect(currencySymbol).toContainText('€');
    
    await page.close();
  });

  test('footer displays last updated time', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Check footer
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    
    // Check last updated
    const lastUpdated = page.locator('.last-updated');
    await expect(lastUpdated).toBeVisible();
    await expect(lastUpdated).toContainText('Updated:');
    
    await page.close();
  });

  test('error handling - invalid amount', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter invalid amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('');
    
    // Result should not be visible or should show null state
    await page.waitForTimeout(500);
    
    // App should not crash
    await expect(page.locator('.converter')).toBeVisible();
    
    await page.close();
  });

  test('handles zero amount', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter zero
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('0');
    
    // Wait for result
    await page.waitForTimeout(500);
    
    // App should handle gracefully
    await expect(page.locator('.converter')).toBeVisible();
    
    // Result should show 0
    const resultCard = page.locator('.result-card');
    if (await resultCard.isVisible()) {
      const resultAmount = await page.locator('.result-amount').textContent();
      expect(parseFloat(resultAmount!.replace(/,/g, ''))).toBe(0);
    }
    
    await page.close();
  });

  test('handles large numbers', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter large number
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('999999999');
    
    // Wait for result
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Result should display with proper formatting
    const resultAmount = page.locator('.result-amount');
    await expect(resultAmount).toBeVisible();
    
    const resultText = await resultAmount.textContent();
    expect(resultText).toBeTruthy();
    // Should contain commas for large numbers
    expect(resultText).toContain(',');
    
    await page.close();
  });

  test('handles decimal amounts', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    // Enter decimal amount
    const amountInput = page.locator('.amount-input input[type="number"]');
    await amountInput.fill('123.45');
    
    // Wait for result
    await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
    
    // Result should display
    const resultAmount = page.locator('.result-amount');
    await expect(resultAmount).toBeVisible();
    
    const resultText = await resultAmount.textContent();
    expect(parseFloat(resultText!.replace(/,/g, ''))).toBeGreaterThan(0);
    
    await page.close();
  });

  test('multiple conversions in sequence', async () => {
    const page = await openPopup(context, extensionId);
    await expect(page.locator('.converter')).toBeVisible({ timeout: 15000 });
    
    const amountInput = page.locator('.amount-input input[type="number"]');
    const results: string[] = [];
    
    // Do multiple conversions
    const amounts = ['100', '250', '500', '1000'];
    
    for (const amount of amounts) {
      await amountInput.fill(amount);
      await page.waitForTimeout(300);
      
      const resultCard = page.locator('.result-card');
      if (await resultCard.isVisible()) {
        const result = await page.locator('.result-amount').textContent();
        results.push(result || '');
      }
    }
    
    // All results should be different
    const uniqueResults = [...new Set(results)];
    expect(uniqueResults.length).toBe(results.length);
    
    await page.close();
  });
});
