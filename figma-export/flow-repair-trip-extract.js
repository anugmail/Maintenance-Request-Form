#!/usr/bin/env node
/* ============================================================================
   โฟลว์ "สร้างแผนการเดินทางของงานซ่อม" (SC-15) — extract DOM สำหรับท่อ Figma
   ============================================================================
   หน้าที่: เปิดหน้าจริง ไล่กดจนถึงแต่ละ state แล้วเก็บ DOM + computed style
   ด้วย walkDom (แชร์กับ flow-report-extract.js) → out/dom-repair-trip-NN.json

   ⚠️ walkDom เก็บ `classes` ของทุก element อยู่แล้ว ⇒ ขั้นถัดไป (7-map-components.js)
      เอาไปจับคู่กับ design-system/figma-map.json ได้ตรงๆ ไม่ต้องแก้ walkDom

   3 state ที่เก็บ — ครอบทุกหน้าตาที่ต้องแปลงเป็น component:
     01  ยังไม่มีใบเดินทาง   → Page header · Alert · Section header · Pill outline · Table (รายจังหวัด)
     02  มีใบเปล่า 1 ใบ      → + ฟอร์มทั้งชุด (Text input · Input dropdown) + Alert เตือน
     03  กรอกครบพร้อมส่ง     → + Table cell ที่มีใบแจ้งซ่อม + ปุ่มส่งที่เปิดแล้ว

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules \
     CHROME_PATH=<เบราว์เซอร์> node figma-export/flow-repair-trip-extract.js
   CHROME_PATH ตั้งต้นชี้ Google Chrome — ถ้าเครื่องไม่มี ใช้ chromium ของ playwright:
     ใต้ ~/Library/Caches/ms-playwright/ โฟลเดอร์ chromium_headless_shell-NNN → chrome-headless-shell
   ============================================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { walkDom } = require('./dom-walk');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME_PATH || process.env.CHROME
  || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out');
const PAGE = '/maintainance-yearly/trip-plan.html#repair';
const WIDTH = 1440;

const summary = [];
const errors = [];

async function extractState(page, slug, name) {
  await page.evaluate(() => document.fonts.ready);
  // toast หายเองใน ~2.6 วิ — รอให้หายก่อน ไม่งั้นติดเป็น node เกินใน DOM ที่เก็บ
  await page.waitForFunction(() => {
    const t = document.getElementById('toast');
    return !t || !t.classList.contains('show');
  }, null, { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(300);

  // ขยาย viewport เท่าความสูงหน้าจริง — rect จะเป็นพิกัดหน้าตรงๆ ไม่ต้องเลื่อน
  // ⚠️ ห้ามใช้ fullPage screenshot — element ที่ position:fixed จะวาดซ้ำทุกสไลซ์
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
  await page.waitForTimeout(200);

  const data = await page.evaluate(walkDom);
  await page.screenshot({ path: path.join(OUT, 'shot-' + slug + '.png') });
  await page.setViewportSize({ width: WIDTH, height: 1000 });

  const payload = {
    version: 1,
    slug,
    name,
    source: PAGE,
    viewport: { width: WIDTH, height: data.docHeight },
    root: data.root,
  };
  fs.writeFileSync(path.join(OUT, 'dom-' + slug + '.json'), JSON.stringify(payload, null, 2));

  // นับ node + คลาสที่เจอ — ใช้ดูว่าเก็บครบไหมโดยไม่ต้องเปิดไฟล์
  let nodes = 0;
  const classes = new Set();
  (function count(n) {
    nodes++;
    (n.classes || []).forEach((c) => classes.add(c));
    (n.children || []).forEach(count);
  })(data.root);

  summary.push({ slug, name, nodes, classes: classes.size });
  console.log(`  ✓ ${slug}  ${String(nodes).padStart(4)} node · ${classes.size} คลาส — ${name}`);
  return classes;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await (await browser.newContext({ viewport: { width: WIDTH, height: 1000 } })).newPage();

  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console: ' + m.text().split('\n')[0]); });

  console.log('เปิด ' + BASE + PAGE);
  await page.goto(BASE + PAGE);
  await page.evaluate(() => localStorage.clear());   // ให้เริ่มจากสถานะตั้งต้นเสมอ
  await page.reload();
  await page.waitForSelector('#btnAddRepairTrip');

  const allClasses = new Set();
  const merge = (s) => s.forEach((c) => allClasses.add(c));

  // ---------- 01 ยังไม่มีใบเดินทาง ----------
  merge(await extractState(page, 'repair-trip-01', 'ยังไม่มีใบเดินทาง — เห็นรถที่ต้องออกไปซ่อม + แยกตามจังหวัด'));

  // ---------- 02 มีใบเปล่า ----------
  await page.locator('#btnAddRepairTrip').click();
  await page.waitForSelector('[data-rtrip]');
  merge(await extractState(page, 'repair-trip-02', 'สร้างใบเดินทางแล้ว — ฟอร์มเปล่า + กล่องเตือนว่าติดอะไร'));

  // ---------- 03 กรอกครบพร้อมส่ง ----------
  const box = page.locator('.rzone').filter({ has: page.locator('[data-rtrip]') }).first();
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-radd-sel]').first().selectOption({ index: 0 });
    await page.locator('[data-radd]').first().click();
    await page.waitForTimeout(200);
  }
  await box.locator('[data-field="location"]').fill('กฟจ.ขอนแก่น');
  await box.locator('[data-field="windowFrom"]').fill('2569-09-01');
  await box.locator('[data-field="windowTo"]').fill('2569-09-03');
  await box.locator('[data-field="pickupPoint"]').fill('สนง.ใหญ่ กบค.');
  await box.locator('[data-field="crewVehicle"]').fill('กข-1234 กรุงเทพมหานคร');
  await box.locator('[data-rstaff]').first().fill('ช.สมชาย ใจดี');
  await box.locator('[data-rstaff]').first().dispatchEvent('change');
  await page.waitForTimeout(400);

  if (await page.locator('[data-rsend]').isDisabled()) {
    errors.push('กรอกครบแล้วแต่ปุ่มส่งยังปิดอยู่ — จังหวะกดเปลี่ยนไปจากตอนเขียนสคริปต์');
  }
  merge(await extractState(page, 'repair-trip-03', 'กรอกครบ 3 ใบแจ้งซ่อม — ปุ่มส่งแผนนัดเปิดแล้ว'));

  await browser.close();

  if (pageErrors.length) errors.push('pageerror: ' + pageErrors.join(' | '));

  // ---------- เทียบกับแมป: คลาสไหนที่เจอในหน้า แต่ยังไม่มีในแมป ----------
  const map = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design-system', 'figma-map.json'), 'utf8'));
  const mapped = new Set();
  for (const k of Object.keys(map.map)) {
    for (const m of k.matchAll(/\.([a-zA-Z][\w-]*)/g)) mapped.add(m[1]);
  }
  // คลาสที่ไม่ต้องมีในแมป — แยกเป็น 2 แบบ
  //   PREFIX: modifier ของ component แม่ (.b-ok = สีของ .badge · .rzone-head = ส่วนของ .rzone)
  //   EXACT : utility / state / คลาสประกอบที่ไม่ใช่ component
  // ⚠️ เคยเขียนรวมเป็น /^(b-|…)$/ ซึ่งบังคับให้ทั้งสตริงเท่ากับ "b-" เป๊ะ เลยฟ้อง .b-brand ผิดๆ
  const PREFIX = /^(b-|btn-|note-|tile-|cal-|rzone-|modal-|filter-|daterange-|sg-|cell-|sp\d|mb-|ml-|decision-tiles-|page-title-)/;
  const EXACT = new Set(['ms', 'sg', 'cur', 'on', 'sel', 'active', 'passed', 'locked', 'show', 'wrap',
    'flush', 'ro', 'err', 'sm', 'lg', 'xl', 'tight', 'loose', 'noic', 'split', 'open', 'num', 'go',
    'ic', 'meta', 'lbl', 'nvlbl', 'vlogo', 'wide', 'page-title', 'help', 'sortable', 'dot', 'hidden']);
  const MOD = { test: (c) => PREFIX.test(c) || EXACT.has(c) };
  const unmapped = [...allClasses].filter((c) => !mapped.has(c) && !MOD.test(c)).sort();

  fs.writeFileSync(path.join(OUT, 'extract-repair-trip-summary.json'),
    JSON.stringify({ summary, errors, classesFound: [...allClasses].sort(), unmapped }, null, 2));

  console.log('\nรวม ' + summary.length + ' state · node รวม ' + summary.reduce((a, s) => a + s.nodes, 0));
  console.log('คลาสที่เจอในหน้า ' + allClasses.size + ' ตัว · ยังไม่มีในแมป ' + unmapped.length + ' ตัว');
  if (unmapped.length) console.log('  ' + unmapped.join(' · '));
  if (errors.length) {
    console.log('\n⚠ ปัญหา ' + errors.length + ' รายการ:');
    errors.forEach((e) => console.log('  ' + e));
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
