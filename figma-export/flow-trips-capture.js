#!/usr/bin/env node
/* ============================================================
   โฟลว์ "วางแผนการเดินทาง" (เฟส 1 ขั้น 3) — capture เส้นหลัก 8 หน้าจอ
   ------------------------------------------------------------
   เส้นเรื่อง: กบค. สร้างใบเดินทาง (แยกตามจังหวัด) → กรอก + วันนัดรายคัน
   → ส่งให้หน่วยงาน → หน่วยงานเลือกวัน + ตอบรับ → กลับ กบค. ทุกใบตอบรับแล้ว

   ใช้แผน seed `plan-seed-2569-002` — ขั้นยืนยันรถยังค้างตัดสิน 4 คัน
   จึง fast-forward gate ด้วยการเซ็ต verdict ตรงๆ (ท่าเดียวกับ
   maintainance-yearly/test/verify-trips.js) เพราะขั้นยืนยันรถ
   ไม่ใช่โฟลว์ที่จะเอาลงบอร์ด (เจ้าของงานสั่ง "เอาแค่นั้นแหละ")

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/flow-trips-capture.js
   ผลลัพธ์: out/figjam/flow-trips/NN-<ชื่อ>.png + manifest.json
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out', 'figjam', 'flow-trips');
const WIDTH = 1440;
const PLAN = 'plan-seed-2569-002';

const shots = [];
const errors = [];

async function capture(page, slug, name, note) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  const file = String(shots.length + 1).padStart(2, '0') + '-' + slug + '.png';
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize({ width: WIDTH, height: 1000 });
  shots.push({ file, slug, name, note, w: WIDTH, h });
  console.log('✓ ' + file.padEnd(40) + name);
}

/* กรอกใบเดินทางหนึ่งใบให้พร้อมส่ง — index คือลำดับ .rzone
   (กรอกวันรายคันแล้วหน้า re-render ทุกครั้ง — ต้องคว้า locator ใหม่เสมอ) */
async function fillTrip(page, index, location) {
  const box = () => page.locator('.rzone').nth(index);
  await box().locator('[data-field="location"]').fill(location);
  await box().locator('[data-field="windowFrom"]').fill('2568-11-04');
  await box().locator('[data-field="windowTo"]').fill('2568-11-08');
  await box().locator('[data-field="perDiem"]').fill('240');
  await box().locator('[data-field="lodging"]').fill('800');
  await box().locator('[data-field="travel"]').fill('1500');
  await page.waitForTimeout(200);
  const n = await box().locator('tbody input[type="date"]').count();
  for (let i = 0; i < n; i++) {
    await box().locator('tbody input[type="date"]').nth(i).fill('2568-11-05');
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(200);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));

  // ---- ตั้งต้น: ล้าง state → ผ่าน gate ขั้นยืนยันรถ (เซ็ต verdict ตรงๆ) ----
  await page.goto(BASE + '/maintainance-yearly/index.html#' + PLAN, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.wsteps');
  await page.evaluate((planId) => {
    const p = MYD.getPlan(planId);
    (p.selectedVehicleIds || []).forEach(id => {
      const e = MYD.vehicleConfirm(p, id);
      if (!(e.answer === 'ready' || e.verdict)) {
        p.confirm.byVehicle[id] = { ...MYD.emptyConfirmEntry(), ...e, verdict: 'keep', verdictWhy: 'ตั้งต้นเดโม', verdictAt: 'x' };
      }
    });
    p.partsRequisitioned = true;
    MYD.savePlan(p);
  }, PLAN);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.wsteps');

  // ---- ฝั่ง กบค. ----
  await page.locator(`[onclick="goPhase('travel')"]`).click();
  await page.waitForSelector('#btnAddTrip');
  await capture(page, 'ขั้น3-ว่าง', 'เฟส 2 · ขั้นที่ 1 ทำแผนเดินทาง — ยังไม่มีใบ',
    'ปุ่ม "สร้างแผนเดินทางใหม่" / "แยกอัตโนมัติตามจังหวัด" · ปุ่มถัดไปยังปิด');

  await page.locator('#btnAutoTrips').click();
  await page.waitForTimeout(400);
  await capture(page, 'แยกตามจังหวัด', 'แยกอัตโนมัติ — ได้ใบเดินทางตามจังหวัด',
    'ใบละจังหวัด badge "ยังไม่ส่ง" · รถถูกจัดเข้าใบครบ');

  await fillTrip(page, 0, 'จุดรวมงาน กฟจ. จันทบุรี');
  await capture(page, 'กรอกใบแรก', 'กรอกใบที่ 1 ครบ — พร้อมส่ง',
    'สถานที่ · ช่วงที่เสนอ · ค่าเบี้ยเลี้ยง/ที่พัก/เดินทาง · วันนัดรายคัน (บังคับอยู่ในช่วง)');

  await fillTrip(page, 1, 'จุดรวมงาน กฟจ. กาญจนบุรี');
  await page.locator('.rzone').nth(0).locator('[data-trip-send]').click();
  await page.waitForTimeout(400);
  await page.locator('.rzone').nth(1).locator('[data-trip-send]').click();
  await page.waitForTimeout(400);
  await capture(page, 'ส่งแผนนัดแล้ว', 'ส่งแผนนัดให้หน่วยงานแล้ว — รอตอบรับ',
    'badge "รอตอบรับ" · ตารางการตอบรับรายหน่วยงาน · ฟอร์มล็อกแก้ไม่ได้');

  // ---- ฝั่งหน่วยงานเจ้าของรถ ----
  await page.goto(BASE + '/maintainance-yearly/confirm.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('.card');
  await capture(page, 'หน่วยงาน-รายการแผนนัด', 'หน่วยงาน — แผนนัดหมายเข้าบำรุงรักษา จาก กบค.',
    'รายการแผนนัดสถานะ "รอตอบรับ" แยกราย (ใบเดินทาง × หน่วยงาน)');

  const invites = await page.locator('a[href^="#trip/' + PLAN + '/"]')
    .evaluateAll(as => as.map(a => a.getAttribute('href')));
  if (!invites.length) throw new Error('ไม่พบแผนนัดของ ' + PLAN);

  await page.locator('a[href="' + invites[0] + '"]').click();
  await page.waitForSelector('#btnTripAccept');
  await capture(page, 'หน่วยงาน-เปิดแผนนัด', 'หน่วยงาน — เปิดแผนนัด เลือกวันรายคัน',
    'วันนัดถูกบังคับให้อยู่ในช่วงที่เสนอ · ใส่ชื่อผู้ตอบแล้ว ตอบรับ/ปฏิเสธ');

  // ตอบรับใบแรก (เก็บภาพ) แล้วไล่ตอบรับที่เหลือแบบไม่เก็บ
  async function acceptCurrent() {
    const n = await page.locator('input[id^="td-"]').count();
    for (let i = 0; i < n; i++) await page.locator('input[id^="td-"]').nth(i).fill('2568-11-05');
    await page.locator('#tripBy').fill('หัวหน้าหน่วยงาน');
    await page.locator('#btnTripAccept').click();
    await page.waitForTimeout(400);
  }
  await acceptCurrent();
  await capture(page, 'หน่วยงาน-ตอบรับแล้ว', 'หน่วยงาน — ตอบรับแผนนัดแล้ว',
    'ฟอร์มปิด เหลือสถานะ "ตอบรับแล้วเมื่อ … โดย …"');

  for (const href of invites.slice(1)) {
    await page.evaluate((h) => { location.hash = h.slice(1); }, href);
    await page.waitForTimeout(400);
    if (await page.locator('#btnTripAccept').count()) await acceptCurrent();
  }

  // ---- กลับฝั่ง กบค. — ทุกใบตอบรับแล้ว ----
  await page.goto(BASE + '/maintainance-yearly/index.html#' + PLAN, { waitUntil: 'networkidle' });
  await page.waitForSelector('.wsteps');
  await page.locator(`[onclick="goPhase('travel')"]`).click();
  await page.waitForFunction(() => document.querySelectorAll('.rzone').length > 0);
  const accepted = await page.locator('.rzone .badge', { hasText: 'ตอบรับแล้ว' }).count();
  if (accepted < 2) errors.push('คาดทุกใบตอบรับแล้ว แต่เจอ badge ตอบรับแล้วแค่ ' + accepted);
  await capture(page, 'กบค-ตอบรับครบ', 'กบค. — ทุกใบตอบรับแล้ว ไปขั้นถัดไปได้',
    'badge "ตอบรับแล้ว" ทุกใบ · ปุ่ม "ยืนยันแผนเดินทาง" (ขั้นถัดไป) เปิดแล้ว — จบโฟลว์');

  await browser.close();

  if (errors.length) {
    console.log('\n⚠ ปัญหา ' + errors.length + ' รายการ:');
    errors.forEach(e => console.log('  ' + e));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), width: WIDTH, flow: 'วางแผนการเดินทาง (เฟส 1 ขั้น 3)', shots, errors
  }, null, 2));
  console.log('\nรวม ' + shots.length + ' หน้าจอ → ' + path.relative(process.cwd(), OUT));
  if (errors.length) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
