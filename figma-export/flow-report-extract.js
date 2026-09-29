#!/usr/bin/env node
/* ============================================================
   โฟลว์ "แจ้งซ่อม" ฝั่งผู้แจ้ง — extract DOM 8 state สำหรับท่อ Figma design
   ------------------------------------------------------------
   คู่แฝดของ flow-report-capture.js (บอร์ด FigJam ใช้ภาพ) แต่ตัวนี้เก็บ
   DOM + computed style ทีละ state ด้วย walkDom เพื่อไปสร้างเป็น
   frame/auto-layout จริงใน Figma ผ่าน 2-map.js --report + plugin/

   จังหวะกดลอกมาจาก flow-report-capture.js ตัวต่อตัว (พิสูจน์แล้วว่าเดินจบ):
   เลือกรถ → อาการเสีย → ติดต่อ/งบ → อะไหล่ → ตัดสินใจ+สรุป → ส่ง → เรื่องของฉัน

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/flow-report-extract.js
   ผลลัพธ์: out/dom-report-NN.json + out/shot-report-NN.png

   จอมือถือ (เพิ่ม 16 ก.ย. 2569):
     WIDTH=390 VARIANT=m390 NODE_PATH=… node figma-export/flow-report-extract.js
     → out/dom-report-m390-NN.json (คนละชุดกับ web ไม่ทับกัน)
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { walkDom } = require('./dom-walk');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out');
/* ความกว้างจอที่ extract — 16 ก.ย. 2569 เพิ่มให้ทำ mobile ได้
   WIDTH=390 VARIANT=m390 node figma-export/flow-report-extract.js
   VARIANT ทำให้ไฟล์ออกเป็น dom-report-m390-NN.json แยกจากชุด web ไม่ทับกัน
   ไม่ใส่อะไรเลย = 1440 + ชื่อไฟล์เดิม (ของเก่าไม่กระทบ) */
const WIDTH = Number(process.env.WIDTH) || 1440;
const VARIANT = (process.env.VARIANT || '').trim();
const vslug = (slug) => VARIANT ? slug.replace(/^report-/, 'report-' + VARIANT + '-') : slug;
const PLATE = '81-2345';   // Hino FM8J + เครน Tadano — จังหวัดบนป้ายอยู่ในผัง AREAS ทำให้ระบบ prefill ให้เห็นจริง

const summary = [];
const errors = [];

/* UNTIL=report-01 — หยุดหลังเก็บ state ที่ระบุ (ไม่ต้องไล่กดครบทั้ง 8 ขั้น)
   ใช้ตอนอยากลอง export ทีละหน้า หรือตอนจังหวะกดขั้นหลังยังไม่ตรงโฟลว์ปัจจุบัน */
const UNTIL = (process.env.UNTIL || '').trim();
const STOP = Symbol('stop');

async function extractState(page, rawSlug, name, rootSel) {
  const slug = vslug(rawSlug);
  await page.evaluate(() => document.fonts.ready);
  // toast auto-hide 2.6s — รอให้หายก่อน ไม่ให้ติดเป็น node เกินใน DOM ที่เก็บ
  await page.waitForFunction(() => !document.getElementById('toast').classList.contains('show'),
    null, { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(350);
  // ขยาย viewport ให้สูงเท่าหน้าจริง — rect จะได้เป็นพิกัดหน้าตรงๆ ไม่ต้องเลื่อน
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
  await page.waitForTimeout(200);

  const data = await page.evaluate(walkDom, rootSel || null);
  await page.screenshot({ path: path.join(OUT, 'shot-' + slug + '.png') });
  await page.setViewportSize({ width: WIDTH, height: 1000 });

  const payload = {
    version: 1,
    slug,
    name,
    source: '/mock/Maintenance-Request-Form.html',
    viewport: { width: WIDTH, height: rootSel ? data.rootHeight : data.docHeight },
    extractedAt: new Date().toISOString(),
    root: data.root
  };
  const file = path.join(OUT, 'dom-' + slug + '.json');
  fs.writeFileSync(file, JSON.stringify(payload));
  const kb = Math.round(fs.statSync(file).size / 1024);
  summary.push({ slug, nodes: data.counted, height: data.docHeight, kb });
  console.log('✓ ' + slug.padEnd(12) + String(data.counted).padStart(5) + ' node · สูง ' + data.docHeight + 'px · ' + kb + 'KB · ' + name);
  if (UNTIL && rawSlug === UNTIL) throw STOP;
}

const visible = (id) => '#' + id + ':not(.hidden)';

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));

  // ---- ตั้งต้น: ล้าง state → ค่าเริ่มต้นทุกอย่าง (wizard 5 ขั้นตาม config seed) ----
  await page.goto(BASE + '/mock/Maintenance-Request-Form.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  /* จังหวะกด = ชุดเดียวกับ mock/test/flow-regression.js (เทสที่ดูแลอยู่จริง)
     ซ่อม 16 ก.ย. 2569 — ของเดิมยังกด `#vlist .radcard` / `#symcats .chip` / `#i-costtypes .radcard`
     ซึ่งถูกถอดไปตั้งแต่ 7 ก.ย. ⇒ เดินไม่จบมาตลอด (คอมเมนต์เดิมบอกให้ใช้ UNTIL=report-01 ไปก่อน)
     วิซาร์ดตอนนี้เหลือ **3 ขั้น** + 2 หน้าหลังส่ง ⇒ เก็บ 6 state */
  await page.waitForSelector('#mylist table.tbl tbody tr');
  await page.locator('.lt-actions .btn-p', { hasText: 'แจ้งซ่อม' }).click();
  await page.waitForSelector('#repair-modal:not(.hidden)');
  await page.waitForSelector('#v-select');

  // ---- ขั้น 1: ข้อมูลยานพาหนะและผู้แจ้ง ----
  // เอาเฉพาะตัว modal — ไม่เอา .modal-overlay (ฉากหลังดำโปร่ง) กับหน้าตารางที่อยู่ข้างหลัง
  // ไม่งั้นเฟรมใน Figma จะเป็นหน้าเต็มที่ถูกคลุมด้วยสีดำโปร่ง (เจ้าของงานเจอ 14 ก.ย. 2569)
  await extractState(page, 'report-01', 'ขั้นที่ 1 ข้อมูลยานพาหนะและผู้แจ้ง — ยังไม่เลือกรถ',
    '#repair-modal .modal');

  await page.selectOption('#v-select', '1');                 // 81-2345 Hino FM8J + เครน Tadano
  await page.waitForSelector('#vsum .incident-field');
  await page.locator('input[name="r-usable"]').first().check();
  await page.locator('label', { hasText: 'ส่งเรื่องให้ กรย.' }).first().click();
  for (const t of ['ตัวรถ', 'เครน']) await page.locator('#target-chks label', { hasText: t }).click();
  await page.selectOption('#i-costsel', '1');
  const nCost = await page.locator('#i-costfields input').count();
  for (let i = 0; i < nCost; i++) {
    const el = page.locator('#i-costfields input').nth(i);
    if (!await el.inputValue()) await el.fill('อ้างอิงตัวอย่าง 2569/104');
  }
  await page.waitForTimeout(250);
  await extractState(page, 'report-02', 'ขั้นที่ 1 เลือกรถแล้ว — สรุปรถ · จุดที่แจ้ง · งบ',
    '#repair-modal .modal');

  // ---- ขั้น 2: อาการเสีย + รายละเอียดเหตุการณ์ ----
  await page.locator('#next').click();
  await page.waitForSelector(visible('s2'));
  // เลือก 3 อาการที่ "มีอะไหล่แนะนำ" — ขั้นอะไหล่จะได้เห็นการจัดกลุ่มแบบ ค ครบ 3 กลุ่ม
  const symNames = await page.evaluate(() => {
    const withParts = new Set(PARTS.map(p => p.sym));
    return SYMPTOMS.filter(s => withParts.has(s.id)).slice(0, 3).map(s => s.name);
  });
  if (symNames.length < 2) throw new Error('อาการที่มีอะไหล่แนะนำน้อยกว่า 2 — จัดกลุ่มแบบ ค ไม่เห็นผล');
  for (const n of symNames) {
    await page.locator('#symcats .chks label', { hasText: n }).first().click();
    await page.waitForTimeout(120);
  }
  await page.locator('#i-odo').fill('84120');
  await page.locator('#i-crane').fill('3210');
  await page.locator('#desc').fill('เสียงดังผิดปกติตอนสตาร์ต และมีน้ำมันซึมใต้ท้องรถ').catch(() => {});
  await page.locator('.addph', { hasText: 'รูปตัวอย่าง' }).click();
  await page.waitForTimeout(200);
  await extractState(page, 'report-03', 'ขั้นที่ 2 อาการเสียและรายละเอียดเหตุการณ์',
    '#repair-modal .modal');

  // ---- ขั้น 3: อะไหล่ที่แนะนำ — "แบบ ค" จัดกลุ่มการ์ดตามอาการ (เจ้าของงานเลือก 16 ก.ย. 2569) ----
  await page.locator('#next').click();
  await page.waitForSelector('#parts-rec .parts-rec-item');
  const nGroups = await page.locator('#parts-rec .symgroup-head').count();
  if (nGroups < 2) errors.push('ขั้นอะไหล่จัดกลุ่มได้ ' + nGroups + ' กลุ่ม — คาดว่าอย่างน้อย 2');
  // กดเพิ่มจำนวนให้ยอดรวมต่อกลุ่มไม่เป็น 0 (หัวกลุ่มจะได้โชว์ตัวเลขจริงตอนส่งเข้า Figma)
  const nPlus = Math.min(3, await page.locator('#parts-rec .parts-rec-item').count());
  for (let i = 0; i < nPlus; i++) {
    await page.locator('#parts-rec .parts-rec-item').nth(i).locator('.qty button').nth(1).click();
    await page.waitForTimeout(120);
  }
  await extractState(page, 'report-04',
    'ขั้นที่ 3 อะไหล่ที่แนะนำ — จัดกลุ่มตามอาการ (แบบ ค) · ' + nGroups + ' กลุ่ม',
    '#repair-modal .modal');

  // ---- ส่งเรื่อง → กลับเข้าตาราง "เรื่องของฉัน" ----
  await page.locator('#next').click();
  await page.waitForSelector('#repair-modal.hidden', { state: 'attached' });
  await page.waitForSelector('#mylist table.tbl tbody tr');
  const row = page.locator('#mylist tbody tr', { hasText: 'รอหัวหน้าหน่วยงานอนุมัติ' }).first();
  if (!await row.count()) errors.push('ส่งเรื่องแล้วไม่พบใบสถานะ "รอหัวหน้าหน่วยงานอนุมัติ"');
  const docno = (await row.locator('.cell-key').textContent() || '').trim();
  await extractState(page, 'report-05', 'เรื่องของฉัน — ใบใหม่ ' + docno + ' รอหัวหน้าอนุมัติ');

  // ---- หน้าอนุมัติของหัวหน้า: รายละเอียดใบ (มีบล็อกอะไหล่ที่ผู้แจ้งเลือกไว้) ----
  // เมนูข้าง (.nv) ถูกซ่อนด้วย media query ที่จอแคบ ⇒ คลิกไม่ได้ตอน WIDTH=390/360
  // ตัวนี้ไม่ได้มาเทสเมนู เลยเรียกสิ่งที่ปุ่มเรียกตรงๆ ให้เดินได้ทุกความกว้าง
  await page.evaluate(() => switchView('boss'));
  await page.waitForSelector('#bosslist table.tbl tbody tr');
  await page.locator('#bosslist tbody tr', { hasText: docno }).locator('.dt-action .btn').click();
  await page.waitForSelector('#bossdetail:not(.hidden) .incident-head');
  await page.waitForTimeout(250);
  await extractState(page, 'report-06', 'หัวหน้าหน่วยงาน — รายละเอียดใบ ' + docno + ' + อะไหล่ที่เลือกไว้',
    '#bossdetail');

  await browser.close();   // 16 ก.ย. 2569: ไม่มีบรรทัดนี้ node ไม่ยอมจบ (เดิมรอดเพราะ UNTIL= เรียก process.exit)
  fs.writeFileSync(path.join(OUT, 'extract-report-summary' + (VARIANT ? '-' + VARIANT : '') + '.json'), JSON.stringify({ summary, errors }, null, 2));
  console.log('\nรวม ' + summary.length + ' state · node รวม ' + summary.reduce((a, s) => a + s.nodes, 0) +
    ' → ' + path.relative(process.cwd(), OUT) + '/dom-report-*.json');
  if (errors.length) process.exitCode = 1;
}

main().catch(async (e) => {
  if (e === STOP) {
    fs.writeFileSync(path.join(OUT, 'extract-report-summary' + (VARIANT ? '-' + VARIANT : '') + '.json'), JSON.stringify({ summary, errors }, null, 2));
    console.log('\nหยุดที่ UNTIL=' + UNTIL + ' · ' + summary.length + ' state');
    process.exit(0);
  }
  console.error(e);
  process.exit(1);
});
