import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('DevTools')) errors.push(m.text()); });

await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.screenshot({ path: 'tests/shots/redesign-dashboard.png' });

await page.getByRole('button', { name: /Candidates/ }).click();
await page.waitForSelector('tbody tr');
await page.waitForTimeout(900);
await page.screenshot({ path: 'tests/shots/redesign-candidates.png' });

await page.locator('tbody tr').first().click();
await page.waitForSelector('text=Move stage');
await page.waitForTimeout(900);
await page.screenshot({ path: 'tests/shots/redesign-drawer.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

await page.getByRole('button', { name: /Pipeline/ }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: 'tests/shots/redesign-pipeline.png' });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
