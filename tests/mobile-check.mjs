import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4000';
const issues = [];
const ok = (n) => console.log('  OK ' + n);
const bad = (n, d = '') => { issues.push(n + (d ? ' - ' + d : '')); console.log('  FAIL ' + n + (d ? ' - ' + d : '')); };

const browser = await chromium.launch();

for (const vp of [{ w: 360, h: 800, name: '360-android' }, { w: 427, h: 952, name: '427-pixel9pro' }]) {
  console.log(`\n=== ${vp.name} (${vp.w}x${vp.h}) ===`);
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const errs = [];
  page.on('pageerror', (e) => { errs.push(e.message); console.log('  PAGEERROR:', e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('DevTools')) errs.push(m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // 1. no horizontal document overflow
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ov > 1 ? bad('dashboard: horizontal overflow', ov + 'px') : ok('dashboard: no horizontal overflow');

  // 2. KPI row swipeable
  const kpi = await page.locator('.snap-x').first().evaluate((el) => ({
    display: getComputedStyle(el).display,
    scrollW: el.scrollWidth, clientW: el.clientWidth,
    overflowX: getComputedStyle(el).overflowX,
    cards: el.children.length,
  }));
  if (kpi.display === 'flex' && kpi.scrollW > kpi.clientW + 4 && kpi.cards === 4) ok(`KPI row swipeable (scrollW ${kpi.scrollW} > clientW ${kpi.clientW}, 4 cards)`);
  else bad('KPI row not horizontally scrollable', JSON.stringify(kpi));

  // 3. no clipped KPI text
  const body = await page.locator('body').innerText();
  /NaN|undefined|\[object/.test(body) ? bad('invalid value on dashboard') : ok('no NaN/undefined text');

  // 4. modal: opens as bottom sheet, above nav, footer reachable
  await page.locator('nav button:visible:has-text("Candidates")').first().click();
  await page.waitForTimeout(1200);
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Add candidate/ }).first().click();
  await page.waitForSelector('h2:has-text("Add candidate")', { timeout: 6000 });
  await page.waitForTimeout(700);

  const modalInfo = await page.evaluate(() => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const el = document.elementFromPoint(vw / 2, vh - 40);
    const inNav = !!el?.closest('nav');
    const card = [...document.querySelectorAll('div')].find((d) => d.className.includes('glass-strong') && d.querySelector('h2'));
    const r = card?.getBoundingClientRect();
    return {
      navCenterTopElement: el?.className?.toString().slice(0, 40) || '',
      navCoversModal: inNav,
      cardTop: r ? Math.round(r.top) : null,
      cardBottom: r ? Math.round(r.bottom) : null,
      vh,
    };
  });
  modalInfo.navCoversModal ? bad('bottom nav paints over modal') : ok('modal is above the bottom nav');
  (modalInfo.cardBottom <= modalInfo.vh + 1 && modalInfo.cardTop >= -1)
    ? ok(`modal fits viewport (top ${modalInfo.cardTop}, bottom ${modalInfo.cardBottom} / ${modalInfo.vh})`)
    : bad('modal overflows viewport', JSON.stringify(modalInfo));

  const closeVisible = await page.getByRole('button', { name: 'Close dialog' }).isVisible().catch(() => false);
  closeVisible ? ok('close button visible') : bad('close button not visible');

  // scroll body to bottom, ensure submit reachable + sticky footer
  const submitReach = await page.evaluate(() => {
    const scroller = document.querySelector('div.glass-strong > div.overflow-y-auto');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    const btn = document.querySelector('form button[type="submit"]');
    if (!btn) return { found: false };
    const r = btn.getBoundingClientRect();
    const footer = btn.closest('div');
    return { found: true, bottom: Math.round(r.bottom), vh: window.innerHeight, within: r.bottom <= window.innerHeight + 1 && r.top > 0, pos: footer ? getComputedStyle(footer).position : '?' };
  });
  (submitReach.found && submitReach.within) ? ok(`Add button reachable after scroll (footer position: ${submitReach.pos})`) : bad('Add button not reachable', JSON.stringify(submitReach));

  // all key fields present
  for (const label of ['FULL NAME', 'EMAIL', 'ROLE APPLIED FOR', 'SOURCE', 'SKILLS', 'RATING']) {
    const n = await page.locator(`text=${label}`).count();
    !n ? bad(`field missing: ${label}`) : null;
  }
  ok('all form fields present');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);

  // 5. drawer above nav
  await page.getByRole('button', { name: 'Table' }).first().click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('tbody tr').first().click().catch(() => {});
  await page.waitForSelector('text=Move stage', { timeout: 6000 });
  await page.waitForTimeout(700);
  const drawerOver = await page.evaluate(() => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const el = document.elementFromPoint(vw / 2, vh - 40);
    return !!el?.closest('nav');
  });
  drawerOver ? bad('bottom nav paints over drawer') : ok('drawer is above the bottom nav');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // 6. pipeline board swipe
  await page.locator('nav button:visible:has-text("Pipeline")').first().click();
  await page.waitForTimeout(1800);
  const board = await page.locator('.snap-x').first().evaluate((el) => ({ display: getComputedStyle(el).display, scrollW: el.scrollWidth, clientW: el.clientWidth }));
  (board.display === 'flex' && board.scrollW > board.clientW + 4) ? ok(`pipeline board swipeable (${board.scrollW} > ${board.clientW})`) : bad('pipeline board not scrollable', JSON.stringify(board));

  const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ov2 > 1 ? bad('pipeline: horizontal overflow', ov2 + 'px') : ok('pipeline: no horizontal overflow');

  if (errs.length) bad(`console errors (${errs.length})`, errs[0]);
  else ok('no console errors');

  await page.screenshot({ path: `tests/shots/audit/mobile-${vp.name}-kpi.png` });
  await page.close();
}

await browser.close();
console.log(`\n===========================\nISSUES: ${issues.length}`);
issues.forEach((i) => console.log(' - ' + i));
process.exit(issues.length ? 1 : 0);
