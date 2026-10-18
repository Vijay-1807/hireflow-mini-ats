import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4000';
const issues = [];
const suppress = new Set(); // e.g. "http.409" during intentional-conflict tests
let passed = 0;
const log = (...a) => console.log(...a);
const ok = (name) => { passed++; log(`  ✓ ${name}`); };
const bad = (page, name, detail = '') => {
  issues.push({ page, name, detail });
  log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
};

function track(page, label) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Download the React DevTools')) return;
      if (text.includes('409') && suppress.has('conflict')) return;
      if (/status of (400|404)/.test(text) && suppress.has('expected-4xx')) return;
      issues.push({ page: label, name: 'console.error', detail: text });
      log(`  ! console.error (${label}): ${text}`);
    }
  });
  page.on('pageerror', (err) => {
    issues.push({ page: label, name: 'pageerror', detail: err.message });
    log(`  ! pageerror (${label}): ${err.message}`);
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('favicon')) return;
    issues.push({ page: label, name: 'requestfailed', detail: `${req.method()} ${url} — ${req.failure()?.errorText}` });
    log(`  ! requestfailed (${label}): ${url}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      if (res.status() === 409 && suppress.has('conflict')) return;
      if ([400, 404].includes(res.status()) && suppress.has('expected-4xx')) return;
      issues.push({ page: label, name: `http.${res.status()}`, detail: `${res.request().method()} ${res.url()}` });
      log(`  ! http.${res.status()} (${label}): ${res.request().method()} ${res.url()}`);
    }
  });
}

async function step(name, fn, pageLabel) {
  log(`\n--- ${name} ---`);
  try {
    await fn();
  } catch (e) {
    bad(pageLabel, name, e.message.split('\n')[0]);
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// ═══════════ DASHBOARD ═══════════
{
  const page = await ctx.newPage();
  track(page, 'dashboard');
  log('\n═══ DASHBOARD ═══');

  await step('loads without errors', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Hiring dashboard")', { timeout: 15000 });
    ok('dashboard renders');
  }, 'dashboard');

  await step('KPI cards + counters', async () => {
    await page.waitForTimeout(1800);
    const labels = ['Total candidates', 'Active pipeline', 'Hired', 'Avg. time to close'];
    for (const l of labels) {
      const n = await page.locator(`text=${l}`).count();
      if (!n) bad('dashboard', `missing KPI: ${l}`);
    }
    const body = await page.locator('body').innerText();
    if (/NaN|undefined|\[object/.test(body)) bad('dashboard', 'invalid value rendered', body.match(/.{0,30}(NaN|undefined|\[object).{0,30}/)?.[0]);
    else ok('all KPI cards render, no NaN/undefined');
  }, 'dashboard');

  await step('charts render', async () => {
    const svgs = await page.locator('.recharts-surface').count();
    if (svgs < 2) bad('dashboard', `expected ≥2 charts, got ${svgs}`);
    else ok(`${svgs} chart surfaces`);
    const funnelBars = await page.locator('.h-2\\.5.overflow-hidden').count();
    log(`  funnel bars: ${funnelBars}`);
  }, 'dashboard');

  await step('funnel + skills + recent', async () => {
    const funnel = await page.locator('text=Stage funnel').count();
    const skills = await page.locator('text=Top skills').count();
    const recent = await page.locator('text=Recent applicants').count();
    if (!funnel || !skills || !recent) bad('dashboard', 'missing dashboard section', `funnel=${funnel} skills=${skills} recent=${recent}`);
    else ok('funnel, skills, recent sections present');
  }, 'dashboard');

  await step('navigates to candidates via View all', async () => {
    await page.getByRole('button', { name: /View all/ }).click();
    await page.waitForTimeout(900);
    const h = await page.locator('h1:has-text("Candidates")').count();
    if (!h) bad('dashboard', 'View all did not navigate');
    else ok('navigated to Candidates');
  }, 'dashboard');

  await page.screenshot({ path: 'tests/shots/01-dashboard.png', fullPage: true });
  await page.close();
}

// ═══════════ CANDIDATES ═══════════
{
  const page = await ctx.newPage();
  track(page, 'candidates');
  log('\n═══ CANDIDATES ═══');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Candidates/ }).click();

  await step('table loads with rows', async () => {
    await page.waitForSelector('tbody tr', { timeout: 15000 });
    const rows = await page.locator('tbody tr').count();
    if (rows < 10) bad('candidates', `only ${rows} rows`);
    else ok(`${rows} rows`);
  }, 'candidates');

  await step('search filters results', async () => {
    const before = await page.locator('tbody tr').count();
    await page.getByPlaceholder(/Search name/).fill('react');
    await page.waitForTimeout(1000);
    const after = await page.locator('tbody tr').count();
    if (after === 0 || after >= before) bad('candidates', `search: before=${before} after=${after}`);
    else ok(`search "react": ${before} → ${after} rows`);
    await page.getByPlaceholder(/Search name/).fill('zzz_no_match_zzz');
    await page.waitForTimeout(1000);
    const empty = await page.locator('text=No candidates match').count();
    if (!empty) bad('candidates', 'empty state missing for no results');
    else ok('empty state shows for no matches');
    await page.getByPlaceholder(/Search name/).fill('');
    await page.waitForTimeout(900);
  }, 'candidates');

  await step('sort toggles order', async () => {
    await page.getByRole('button', { name: /^Candidate$/ }).click();
    await page.waitForTimeout(700);
    const asc = await page.locator('tbody tr td p').first().textContent();
    await page.getByRole('button', { name: /^Candidate$/ }).click();
    await page.waitForTimeout(700);
    const desc = await page.locator('tbody tr td p').first().textContent();
    if (asc === desc) bad('candidates', 'sort toggle no effect', `${asc} === ${desc}`);
    else ok(`sort: "${asc}" ⇄ "${desc}"`);
  }, 'candidates');

  await step('stage filter works', async () => {
    await page.getByRole('button', { name: /Filters/ }).click();
    await page.waitForTimeout(400);
    await page.getByLabel('Filter by stage').selectOption('hired');
    await page.waitForTimeout(900);
    const rows = await page.locator('tbody tr').count();
    const badges = await page.locator('tbody tr span:text("Hired")').count();
    if (rows === 0) bad('candidates', 'hired filter returned 0');
    else if (badges < rows) bad('candidates', `filter leak: ${rows} rows but ${badges} hired badges`);
    else ok(`hired filter: ${rows} rows, all hired`);
    await page.getByLabel('Filter by stage').selectOption('');
    await page.getByRole('button', { name: /Filters/ }).click();
    await page.waitForTimeout(600);
  }, 'candidates');

  await step('grid view toggle', async () => {
    await page.getByRole('button', { name: 'Grid' }).click();
    await page.waitForTimeout(800);
    const cards = await page.locator('button.glass.group').count();
    if (cards < 10) bad('candidates', `grid cards: ${cards}`);
    else ok(`grid view: ${cards} cards`);
    await page.screenshot({ path: 'tests/shots/02-grid.png' });
    await page.getByRole('button', { name: 'Table' }).click();
    await page.waitForTimeout(600);
  }, 'candidates');

  await step('drawer opens on row click', async () => {
    await page.locator('tbody tr').first().click();
    await page.waitForSelector('text=Move stage', { timeout: 8000 });
    const drawer = await page.locator('text=Move stage').isVisible();
    if (!drawer) bad('candidates', 'drawer not visible');
    else ok('drawer opens');
  }, 'candidates');

  await step('note adds to timeline', async () => {
    const noteInput = page.locator('input[placeholder="Add a note…"]');
    await noteInput.waitFor({ timeout: 5000 });
    await noteInput.fill('Audit note 12345');
    await noteInput.press('Enter');
    await page.waitForTimeout(1500);
    const found = await page.locator('text=Audit note 12345').count();
    if (!found) bad('candidates', 'note not in timeline after add');
    else ok('note appears in timeline');
  }, 'candidates');

  await step('stage change from drawer + audit trail', async () => {
    const buttons = page.locator('div.grid button:has-text("Screening"), div.grid button:has-text("Interview"), div.grid button:has-text("Offer"), div.grid button:has-text("Hired"), div.grid button:has-text("Rejected"), div.grid button:has-text("Applied")');
    const count = await buttons.count();
    let target = null;
    for (let i = 0; i < count; i++) {
      const b = buttons.nth(i);
      if (!(await b.isDisabled())) { target = b; break; }
    }
    if (!target) { bad('candidates', 'no enabled stage button'); return; }
    const label = (await target.textContent()).trim();
    await target.click();
    await page.waitForTimeout(1500);
    const trail = await page.locator('text=/Moved from .* to/').count();
    if (!trail) bad('candidates', 'stage-change audit trail missing');
    else ok(`moved to ${label}, audit trail written`);
  }, 'candidates');

  await step('escape closes drawer', async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1400);
    const open = await page.locator('text=Move stage').isVisible().catch(() => false);
    if (open) bad('candidates', 'Escape did not close drawer');
    else ok('drawer closed via Escape');
  }, 'candidates');

  await step('create candidate + validation', async () => {
    await page.getByRole('button', { name: /Add candidate/ }).first().click();
    await page.waitForSelector('h2:has-text("Add candidate")', { timeout: 5000 });
    // empty submit
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(400);
    const nameErr = await page.locator('text=Name is required').count();
    const emailErr = await page.locator('text=Enter a valid email').count();
    if (!nameErr || !emailErr) bad('candidates', 'client validation missing', `name=${nameErr} email=${emailErr}`);
    else ok('client validation fires on empty submit');
    // fill
    await page.locator('input[placeholder="Aarav Sharma"]').fill('Zed Matrix');
    await page.locator('input[type="email"]').fill('zed.matrix@example.com');
    await page.locator('input[list="role-options"]').fill('Backend Developer');
    const skillInput = page.locator('input[placeholder="Type a skill + Enter…"]');
    await skillInput.fill('Rust');
    await skillInput.press('Enter');
    await page.waitForTimeout(200);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1800);
    const exists = await page.locator('td:has-text("Zed Matrix")').count();
    if (!exists) bad('candidates', 'created candidate not in table');
    else ok('candidate created and visible');
  }, 'candidates');

  await step('duplicate email rejected', async () => {
    suppress.add('conflict');
    await page.getByRole('button', { name: /Add candidate/ }).first().click();
    await page.waitForSelector('h2:has-text("Add candidate")');
    await page.locator('input[placeholder="Aarav Sharma"]').fill('Another Person');
    await page.locator('input[type="email"]').fill('zed.matrix@example.com');
    await page.locator('input[list="role-options"]').fill('QA Engineer');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1200);
    const errToast = await page.locator('text=/already exists/i').count();
    const modalStill = await page.locator('h2:has-text("Add candidate")').isVisible().catch(() => false);
    if (!errToast && !modalStill) bad('candidates', 'duplicate email not handled');
    else ok('duplicate email rejected with feedback');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    suppress.delete('conflict');
  }, 'candidates');

  await step('bulk select + move', async () => {
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await page.waitForTimeout(400);
    const bar = await page.locator('text=/\\d+ selected/').count();
    if (!bar) { bad('candidates', 'bulk bar did not appear'); return; }
    ok('bulk bar appears');
    const hiredChip = page.locator('div.flex-wrap button:has-text("Hired")');
    await hiredChip.click();
    await page.waitForTimeout(1500);
    const toastOk = await page.locator('text=/moved to Hired/i').count();
    if (!toastOk) bad('candidates', 'bulk move toast missing');
    else ok('bulk move succeeded');
  }, 'candidates');

  await step('edit via drawer', async () => {
    await page.locator('tbody tr').first().click();
    await page.waitForSelector('text=Move stage');
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Edit profile/ }).click();
    await page.waitForSelector('h2:has-text("Edit")', { timeout: 5000 });
    const modalForm = page.locator('div.fixed form').last();
    await modalForm.locator('input[placeholder="Aarav Sharma"]').fill('Renamed Candidate');
    await modalForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    const renamed = await page.locator('text=Renamed Candidate').count();
    if (!renamed) bad('candidates', 'rename not reflected');
    else ok('edit saves and reflects');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    // ensure drawer also closed
    if (await page.locator('text=Move stage').isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }, 'candidates');

  await step('delete candidate', async () => {
    page.once('dialog', (d) => d.accept());
    const before = await page.locator('tbody tr').count();
    await page.locator('tbody tr').first().click();
    await page.waitForSelector('text=Move stage');
    await page.getByRole('button', { name: 'Delete candidate' }).click();
    await page.waitForTimeout(1500);
    const after = await page.locator('tbody tr').count();
    if (after !== before - 1) bad('candidates', `delete: before=${before} after=${after}`);
    else ok('candidate deleted');
  }, 'candidates');

  await page.screenshot({ path: 'tests/shots/03-candidates.png', fullPage: false });
  await page.close();
}

// ═══════════ PIPELINE ═══════════
{
  const page = await ctx.newPage();
  track(page, 'pipeline');
  log('\n═══ PIPELINE ═══');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Pipeline/ }).click();

  await step('6 columns render with cards', async () => {
    await page.waitForTimeout(2000);
    const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    for (const s of stages) {
      const n = await page.locator(`h2:text-is("${s}")`).count();
      if (!n) bad('pipeline', `missing column: ${s}`);
    }
    const cards = await page.locator('.glass.group').count();
    if (cards < 10) bad('pipeline', `only ${cards} kanban cards`);
    else ok(`6 columns, ${cards} cards`);
  }, 'pipeline');

  await step('drag card between columns', async () => {
    const card = page.locator('.glass.group').first();
    const name = (await card.locator('p').first().textContent())?.trim();
    const cols = page.locator('div.rounded-2xl.border-dashed');
    const src = await card.boundingBox();
    const dst = await cols.nth(3).boundingBox(); // Offer column area
    if (!src || !dst) { bad('pipeline', 'missing boxes'); return; }
    await page.mouse.move(src.x + src.width / 2, src.y + 10);
    await page.mouse.down();
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(
        src.x + src.width / 2 + ((dst.x + dst.width / 2 - src.x - src.width / 2) * i) / 15,
        src.y + 10 + ((dst.y + 80 - src.y - 10) * i) / 15,
      );
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    await page.waitForTimeout(1800);
    const res = await page.evaluate(async () => (await fetch('/api/candidates?q=' + encodeURIComponent(name), { headers: { Accept: 'application/json' } })).json());
    const c = (res.data || []).find((x) => x.name === name);
    log(`  card "${name}" now in stage: ${c?.stage}`);
    if (!c) bad('pipeline', 'dragged candidate not found');
    else ok(`drag moved "${name}" → ${c.stage}`);
  }, 'pipeline');

  await step('column counts match cards', async () => {
    const counts = await page.evaluate(() => {
      const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
      return stages.map((label) => {
        const h = [...document.querySelectorAll('h2')].find((x) => x.textContent.trim() === label);
        if (!h) return { label, count: 0 };
        const header = h.closest('div.flex.items-center.justify-between');
        const badge = header?.querySelectorAll('span:last-of-type');
        const last = badge?.[badge.length - 1];
        return { label, count: parseInt(last?.textContent || '0', 10) };
      });
    });
    log('  column counts:', counts.map((c) => `${c.label}:${c.count}`).join(' '));
    const totalCards = await page.locator('.glass.group').count();
    const sum = counts.reduce((s, c) => s + c.count, 0);
    if (sum !== totalCards) bad('pipeline', `count mismatch: badges=${sum} cards=${totalCards}`);
    else ok(`counts consistent (${sum})`);
  }, 'pipeline');

  await page.screenshot({ path: 'tests/shots/04-pipeline.png', fullPage: true });
  await page.close();
}

// ═══════════ MOBILE ═══════════
{
  const page = await ctx.newPage();
  track(page, 'mobile');
  log('\n═══ MOBILE 390×844 ═══');
  await page.setViewportSize({ width: 390, height: 844 });

  await step('mobile dashboard + bottom nav', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const nav = await page.locator('nav.fixed.bottom-0, nav.fixed.inset-x-3').first().isVisible().catch(() => false);
    const anyNav = await page.locator('nav.fixed').first().isVisible().catch(() => false);
    if (!nav && !anyNav) bad('mobile', 'bottom nav missing');
    else ok('bottom nav visible');
    const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    if (hOverflow) bad('mobile', 'horizontal overflow on dashboard');
    else ok('no horizontal overflow');
    await page.screenshot({ path: 'tests/shots/05-mobile-dash.png', fullPage: true });
  }, 'mobile');

  await step('mobile candidates nav + no overflow', async () => {
    await page.locator('nav.fixed button:has-text("Candidates")').click();
    await page.waitForTimeout(1500);
    const h1 = await page.locator('h1:has-text("Candidates")').count();
    if (!h1) bad('mobile', 'mobile nav did not switch page');
    else ok('navigated via bottom nav');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    if (overflow) bad('mobile', 'horizontal overflow on candidates');
    else ok('no horizontal overflow');
    await page.screenshot({ path: 'tests/shots/06-mobile-candidates.png' });
  }, 'mobile');

  await step('mobile pipeline', async () => {
    await page.locator('nav.fixed button:has-text("Pipeline")').click();
    await page.waitForTimeout(1800);
    const h1 = await page.locator('h1:has-text("Hiring pipeline")').count();
    if (!h1) bad('mobile', 'pipeline page missing on mobile');
    else ok('pipeline renders on mobile');
    await page.screenshot({ path: 'tests/shots/07-mobile-pipeline.png', fullPage: true });
  }, 'mobile');

  await page.close();
}

// ═══════════ NETWORK / API EDGE CASES ═══════════
{
  const page = await ctx.newPage();
  track(page, 'api');
  suppress.add('expected-4xx');
  log('\n═══ API EDGE CASES ═══');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  await step('API validation errors surface', async () => {
    const r = await page.evaluate(async () => {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', email: 'nope' }),
      });
      return { status: res.status, body: await res.json() };
    });
    if (r.status !== 400 || !r.body.error) bad('api', 'expected 400 with error', JSON.stringify(r));
    else ok(`400 + "${r.body.error}"`);
  }, 'api');

  await step('404 for unknown candidate', async () => {
    const r = await page.evaluate(async () => {
      const res = await fetch('/api/candidates/99999');
      return res.status;
    });
    if (r !== 404) bad('api', `expected 404, got ${r}`);
    else ok('404 handled');
  }, 'api');

  await step('unknown API route 404s', async () => {
    const r = await page.evaluate(async () => {
      const res = await fetch('/api/nope');
      return res.status;
    });
    if (r !== 404) bad('api', `expected 404, got ${r}`);
    else ok('unknown route 404');
  }, 'api');

  await step('search SQL-injection-safe', async () => {
    const r = await page.evaluate(async () => {
      const res = await fetch("/api/candidates?q='; DROP TABLE candidates;--");
      return { status: res.status, count: (await res.json()).meta?.total };
    });
    const health = await page.evaluate(async () => (await fetch('/api/metrics')).json());
    if (r.status !== 200 || health.data.summary.total < 1) bad('api', 'injection broke something');
    else ok(`injection-safe, ${health.data.summary.total} candidates intact`);
  }, 'api');

  await page.close();
}

await browser.close();

log('\n\n════════════════════════════════');
log(`PASSED: ${passed}  |  ISSUES: ${issues.length}`);
if (issues.length) {
  log('\nISSUE LIST:');
  for (const i of issues) log(` [${i.page}] ${i.name}${i.detail ? ` — ${i.detail}` : ''}`);
}
process.exit(issues.length ? 1 : 0);
