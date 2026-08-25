// ตรวจหน้าเดี่ยว "ทำแผนการเดินทาง" (trip-plan.html) ที่แยกออกมา 25 ส.ค. 2569
// จุดที่ต้องพิสูจน์: โมดูล trip-plan.js ทำงานได้จริงเมื่อ host ไม่ใช่ stepper 6 เฟส
//   · เลือกแผนจากรายการ → เข้าขั้นทำแผนเดินทาง
//   · callback onChange/onValidity ที่หน้านี้ส่งให้โมดูล ทำงานถูก (ปุ่มถัดไปเปิด/ปิดตามจริง)
//   · ไม่มีปุ่ม "ไปเฟสถัดไป" เพราะหน้าเดี่ยวไม่ได้ส่ง onNextPhase มา
//   · ข้อมูลเป็นชุดเดียวกับ index.html — ทำที่หน้าไหนอีกหน้าก็เห็น
//
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//   CHROME_PATH=~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell \
//   node maintainance-yearly/test/verify-trip-plan-page.js
const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8123/maintainance-yearly';
const PLAN = 'plan-seed-2569-002';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().split('\n')[0]); });

  let pass = 0, fail = 0;
  const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));

  console.log('หน้าเลือกแผน');
  await page.goto(`${BASE}/trip-plan.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.page-title');
  ok((await page.locator('.page-title').first().textContent()).includes('ทำแผนการเดินทาง'),
    'เปิดหน้ามาเจอรายการแผนให้เลือก');
  ok(await page.evaluate(() => typeof window.TRIP === 'object'), 'โมดูล TRIP โหลดมาแล้ว');
  ok(await page.evaluate(() => typeof window.renderProcWizard === 'undefined'),
    'หน้านี้ไม่มี stepper 6 เฟสของ app.js ติดมาด้วย');
  const planRows = await page.locator('tbody tr').count();
  ok(planRows > 0, `มีแผนที่ออกเลขงานแล้วให้เลือก ${planRows} ใบ`);

  console.log('\nเข้าแผน → ขั้นทำแผนเดินทาง');
  await page.goto(`${BASE}/trip-plan.html#${PLAN}`);
  await page.waitForSelector('.wsteps');
  ok(await page.locator('.wstep').count() === 2, 'แถบขั้นตอนมี 2 ขั้น (ไม่ใช่ 6 เฟส)');
  ok(await page.locator('.sect', { hasText: 'ทำแผนเดินทาง' }).count() > 0, 'เข้าขั้นที่ 1 ได้ตรงๆ ไม่ต้องเดินเฟสก่อนหน้า');
  // แผน seed ใบนี้ผ่านเฟส 1 มาแล้ว (partsRequisitioned=true) โน้ตเตือนจึงต้อง "ไม่" ขึ้น
  ok(await page.locator('.note-info', { hasText: 'ข้ามมาที่ขั้นแผนเดินทางโดยตรง' }).count() === 0,
    'แผนที่ผ่านเฟส 1 แล้ว ไม่ขึ้นโน้ตเตือน');
  ok(await page.locator('#btnPrimaryTrip').isDisabled(), 'ยังไม่มีใบเดินทาง → ปุ่มถัดไปปิดอยู่');
  ok(await page.locator('.note-warn', { hasText: 'ยังไปขั้นถัดไปไม่ได้' }).count() > 0,
    'บอกเหตุผลที่ไปต่อไม่ได้ (TRIP.blockers)');

  await page.evaluate(p => { const x = MYD.getPlan(p); x.partsRequisitioned = false; MYD.savePlan(x); }, PLAN);
  await page.reload();
  await page.waitForSelector('.wsteps');
  ok(await page.locator('.note-info', { hasText: 'ข้ามมาที่ขั้นแผนเดินทางโดยตรง' }).count() > 0,
    'แผนที่ยังไม่ผ่านเฟส 1 → เตือนว่าหน้านี้ข้ามมาที่ขั้นแผนเดินทางโดยตรง');
  await page.evaluate(p => { const x = MYD.getPlan(p); x.partsRequisitioned = true; MYD.savePlan(x); }, PLAN);
  await page.reload();
  await page.waitForSelector('.wsteps');

  console.log('\nโมดูลเรียก callback ของ host ได้จริง');
  await page.locator('#btnAutoTrips').click();     // → onChange → renderWizard ใหม่
  await page.waitForTimeout(400);
  const boxes = await page.locator('.rzone').count();
  ok(boxes === 2, `onChange ทำงาน — แยกอัตโนมัติได้ ${boxes} ใบ แล้ววาดหน้าใหม่`);
  ok(await page.locator('#btnPrimaryTrip').isDisabled(), 'ใบยังไม่ถูกตอบรับ → ปุ่มถัดไปยังปิด');

  const box1 = page.locator('.rzone').first();
  await box1.locator('[data-field="location"]').fill('จุดรวมงาน กฟจ. จันทบุรี');
  await box1.locator('[data-field="windowFrom"]').fill('2568-11-04');
  await box1.locator('[data-field="windowTo"]').fill('2568-11-08');
  await page.waitForTimeout(300);
  ok(await box1.locator('[data-trip-send]').isDisabled(), 'ยังไม่ระบุพนักงาน → ส่งใบไม่ได้ (เกณฑ์เดิมยังอยู่)');

  console.log('\nสลับไตรมาสแล้วหน้าไม่พัง');
  const segs = page.locator('.travelQSeg');   // ไม่ใช่ '.seg .sg' — ชนกับปุ่มสลับ ตรวจเอง/จ้าง
  ok(await segs.count() === 4, 'มีตัวเลือกไตรมาส Q1–Q4');
  await segs.nth(1).click();
  await page.waitForTimeout(300);
  ok(await page.locator('.sect', { hasText: 'ทำแผนเดินทาง' }).count() > 0, 'สลับไตรมาสแล้วยังอยู่ขั้นเดิม');

  console.log('\nข้อมูลชุดเดียวกับหน้ารายการแผน');
  await page.goto(`${BASE}/index.html#${PLAN}`);
  await page.waitForSelector('.wsteps');
  const sameData = await page.evaluate(p => MYD.ensureTrips(MYD.getPlan(p)).length, PLAN);
  ok(sameData === 2, `ใบเดินทางที่สร้างจากหน้าเดี่ยว มองเห็นจาก index.html ด้วย (${sameData} ใบ)`);

  console.log('\nหน้าเดี่ยวไม่มีปุ่ม "ไปเฟสถัดไป"');
  await page.goto(`${BASE}/trip-plan.html#${PLAN}`);
  await page.waitForSelector('.wsteps');
  await page.evaluate(p => { const x = MYD.getPlan(p); x.travelConfirmed = true; MYD.savePlan(x); }, PLAN);
  await page.reload();
  await page.waitForSelector('.badge');
  ok(await page.locator('.badge', { hasText: 'แผนเดินทางยืนยันแล้ว' }).count() > 0, 'แผนที่ยืนยันแล้วเปิดมาเจอหน้าสรุป');
  ok(await page.locator('#btnGoNextPhaseProc').count() === 0, 'ไม่มีปุ่ม "ไปเฟสถัดไป" (ไม่ได้ส่ง onNextPhase)');
  ok(await page.locator('#btnPeaLife').count() === 1, 'ปุ่มทำใบนำจ่าย (PEA Life) ยังมี');

  console.log('\nแต่ในหน้ารายการแผน (host ที่มี stepper) ปุ่มนั้นต้องมี');
  await page.goto(`${BASE}/index.html#${PLAN}`);
  await page.waitForSelector('.wsteps');
  await page.locator(`[onclick="goPhase('travel')"]`).click();
  await page.waitForTimeout(400);
  ok(await page.locator('#btnGoNextPhaseProc').count() === 1, 'host เดิมส่ง onNextPhase มา → ปุ่มโผล่ตามเดิม');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
