#!/usr/bin/env node

/**
 * Capture store screenshots for Chrome Web Store submission
 * Run after building: pnpm build && node scripts/capture-store-screenshots.mjs
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.join(__dirname, '..', '.output', 'chrome-mv3');
const outputDir = path.join(__dirname, '..', 'store-assets');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function main() {
  console.log('Launching browser with extension...');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // Get extension ID
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  const extensionId = serviceWorker.url().split('/')[2];
  console.log(`Extension ID: ${extensionId}`);

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Wait for API to load

  // Wait for converter to be ready
  await page.waitForSelector('.converter', { timeout: 15000 });

  // Screenshot 1: Main converter view (USD to EUR, $1000)
  console.log('Capturing screenshot 1: Main Converter...');
  const amountInput = page.locator('.amount-input input[type="number"]');
  await amountInput.fill('1000');
  await page.waitForTimeout(500);
  await page.waitForSelector('.result-card', { timeout: 5000 });
  await page.screenshot({ path: path.join(outputDir, 'screenshot-1-converter.png') });

  // Screenshot 2: Different currencies (EUR to GBP)
  console.log('Capturing screenshot 2: Different Currencies...');
  const fromSelect = page.locator('.currency-select').first();
  const toSelect = page.locator('.currency-select').nth(1);
  await fromSelect.selectOption('EUR');
  await page.waitForTimeout(1500);
  await toSelect.selectOption('GBP');
  await page.waitForTimeout(500);
  await amountInput.fill('500');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outputDir, 'screenshot-2-currencies.png') });

  // Screenshot 3: Crypto currencies (USD to BTC)
  console.log('Capturing screenshot 3: Crypto Support...');
  await fromSelect.selectOption('USD');
  await page.waitForTimeout(1500);
  await toSelect.selectOption('BTC');
  await page.waitForTimeout(500);
  await amountInput.fill('10000');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outputDir, 'screenshot-3-crypto.png') });

  // Reset to USD/EUR for history
  await fromSelect.selectOption('USD');
  await page.waitForTimeout(1500);
  await toSelect.selectOption('EUR');
  await page.waitForTimeout(500);

  // Add some history items
  console.log('Adding history items...');
  const amounts = ['100', '500', '1000', '2500'];
  for (const amount of amounts) {
    await amountInput.fill(amount);
    await page.waitForTimeout(300);
    await page.waitForSelector('.result-card', { timeout: 5000 });
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(300);
  }

  // Screenshot 4: History view
  console.log('Capturing screenshot 4: History...');
  await page.locator('.icon-btn').first().click();
  await page.waitForTimeout(300);
  await page.waitForSelector('.history-panel');
  await page.screenshot({ path: path.join(outputDir, 'screenshot-4-history.png') });

  // Go back to converter
  await page.locator('.btn-secondary').click();
  await page.waitForTimeout(300);

  // Screenshot 5: Large amount conversion
  console.log('Capturing screenshot 5: Large Amount...');
  await fromSelect.selectOption('USD');
  await page.waitForTimeout(1500);
  await toSelect.selectOption('JPY');
  await page.waitForTimeout(500);
  await amountInput.fill('1000000');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outputDir, 'screenshot-5-large-amount.png') });

  // Screenshot 6: Quick access currencies
  console.log('Capturing screenshot 6: Quick Access...');
  await fromSelect.selectOption('GBP');
  await page.waitForTimeout(1500);
  await toSelect.selectOption('CAD');
  await page.waitForTimeout(500);
  await amountInput.fill('750');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outputDir, 'screenshot-6-quick-access.png') });

  console.log('\nScreenshots saved to:', outputDir);
  console.log('Files:');
  fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).forEach(f => console.log(`  - ${f}`));

  await context.close();
  
  console.log('\nNow run: ./scripts/resize-screenshots.sh');
}

main().catch(console.error);
