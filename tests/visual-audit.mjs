import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://localhost:4000';
const OUT = 'tests/shots/audit';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: '320-small', width: 320, height: 640 },
  { name: '375-iphoneSE', width: 375, height: 667 },
  { name: '390-iphone12', width: 390, height: 844 },
  { name: '414-iphoneXR', width: 414, height: 896 },
  { name: '768-ipad', width: 768, height: 1024 },
  { name: '1024-ipadL', width: 1024, height: 768 },
  { name: '1280-laptop', width: 1280, height: 800 },
  { name: '1440-desktop', width: 1440, height: 900 },
  { name: '1920-fhd', width: 1920, height: 1080 },
];

const report = { viewports: [], errors: [] };

async function clickNav(page, label) {
  await page.locator(`nav button:visible:has-text("${label}")`).first().click();
  await page.waitForTimeout(900);
}

async function analyze(page) {
  return page.evaluate(() => {
    const iw = window.innerWidth;
    const res = { docOverflow: 0, offscreen: [], smallTargets: [], tinyText: [] };
    res.docOverflow = Math.max(0, document.documentElement.scrollWidth - iw);

    const contained = (el) => {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true;
        p = p.parentElement;
      }
      return false;
    };

    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.right > iw + 2 && r.left < iw && !contained(el)) {
        res.offscreen.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 70), right: Math.round(r.right) });
      }
      const s = getComputedStyle(el);
      const fs = parseFloat(s.fontSize);
      if (fs && fs < 10 && el.textContent && el.textContent.trim() && el.children.length === 0) {
        res.tinyText.push({ txt: el.textContent.trim().slice(0, 30), fs });
      }
    }
    res.offscreen = res.offscreen.slice(0, 12);
    res.tinyText = [...new Map(res.tinyText.map((t) => [t.fs, t])).values()].slice(0, 6);

    const TARGETS = 'button, a[href], input[type=checkbox], select, [role=button], input';
    const seen = new Map();
    for (const el of document.querySelectorAll(TARGETS)) {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      if (el.type === 'hidden') continue;
      if (r.width < 40 || r.height < 40) {
        const label = String(el.getAttribute('aria-label') || el.textContent || el.type || '').trim().slice(0, 34);
        const key = `${el.tagName}|${label}|${Math.round(r.width)}x${Math.round(r.height)}`;
        const cur = seen.get(key) || { tag: el.tagName, label, w: Math.round(r.width), h: Math.round(r.height), count: 0 };
        cur.count += 1;
        seen.set(key, cur);
      }
    }
    res.smallTargets = [...seen.values()].sort((a, b) => b.count - a.count).slice(0, 15);
    return res;
  });
}

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('DevTools')) consoleErrors.push(m.text());
  });

  const vprec = { name: vp.name, width: vp.width, height: vp.height, pages: {}, consoleErrors };

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // dashboard
  await page.screenshot({ path: `${OUT}/${vp.name}__dashboard.png`, fullPage: true });
  vprec.pages.dashboard = await analyze(page);

  // candidates table
  await clickNav(page, 'Candidates');
  await page.waitForSelector('tbody tr', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vp.name}__candidates.png`, fullPage: true });
  vprec.pages.candidates = await analyze(page);

  // grid
  await page.getByRole('button', { name: 'Grid' }).first().click().catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${vp.name}__grid.png`, fullPage: true });
  vprec.pages.grid = await analyze(page);
  await page.getByRole('button', { name: 'Table' }).first().click().catch(() => {});
  await page.waitForTimeout(500);

  // drawer
  await page.locator('tbody tr').first().click().catch(() => {});
  await page.waitForSelector('text=Move stage', { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${vp.name}__drawer.png` });
  vprec.pages.drawer = await analyze(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);

  // modal
  await page.getByRole('button', { name: /Add candidate/ }).first().click().catch(() => {});
  await page.waitForSelector('h2:has-text("Add candidate")', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${vp.name}__modal.png` });
  vprec.pages.modal = await analyze(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // pipeline
  await clickNav(page, 'Pipeline');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${vp.name}__pipeline.png`, fullPage: true });
  vprec.pages.pipeline = await analyze(page);

  if (consoleErrors.length) report.errors.push({ viewport: vp.name, errors: consoleErrors });

  report.viewports.push(vprec);
  await ctx.close();
  console.log(`done ${vp.name}`);
}

await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));

// ── Summary ──
console.log('\n══════════════ SUMMARY ══════════════');
for (const v of report.viewports) {
  console.log(`\n■ ${v.name} (${v.width}×${v.height})${v.consoleErrors.length ? '  ⚠ console: ' + v.consoleErrors.length : ''}`);
  for (const [p, a] of Object.entries(v.pages)) {
    const bits = [];
    if (a.docOverflow > 1) bits.push(`OVERFLOW+${a.docOverflow}px`);
    if (a.offscreen.length) bits.push(`offscreen:${a.offscreen.length}`);
    if (a.smallTargets.length) bits.push(`smallTargets:${a.smallTargets.length}`);
    if (a.tinyText.length) bits.push(`tinyText:${a.tinyText.length}`);
    console.log(`   ${p.padEnd(11)} ${bits.length ? bits.join('  ') : 'ok'}`);
  }
}
console.log('\nreport.json written to', OUT);
