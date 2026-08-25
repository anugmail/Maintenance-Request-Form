// ตรวจ "จังหวะสร้างแผนการเดินทางของงานซ่อม" (SC-15 · UC-15.1) — เพิ่ม 25 ส.ค. 2569
// เจ้าของงานสั่ง: โครงเหมือนหน้าแผนเดินทางบำรุงรักษา แต่ตัดไตรมาส + ตัดปุ่มแยกอัตโนมัติออก
// ขอบเขต: จบที่ "ส่งแผนนัด" — ยังไม่มีฝั่งตอบรับ/ขั้นอนุมัติ/ยืนยันแผน
//
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//   CHROME_PATH=<เบราว์เซอร์> node maintainance-yearly/test/verify-repair-trip.js
// CHROME_PATH ตั้งต้นชี้ Google Chrome — ถ้าเครื่องไม่มี ใช้ chromium ของ playwright แทนได้:
//   ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell
const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8123/maintainance-yearly';

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

  console.log('เข้าหน้างานซ่อมจากแถบสลับสายงาน');
  await page.goto(`${BASE}/trip-plan.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-src]');
  ok(await page.locator('[data-src]').count() === 2, 'หน้าเลือกมีแถบสลับ 2 สาย (บำรุงรักษา / งานซ่อม)');
  await page.locator('[data-src="repair"]').click();
  await page.waitForSelector('#btnAddRepairTrip');
  ok((await page.locator('.page-title').first().textContent()).includes('งานซ่อม'), 'สลับมาหน้างานซ่อมได้');

  console.log('\nเห็นว่ามีรถที่ต้องออกไปซ่อมกี่คัน');
  const head = (await page.locator('.sub').first().textContent()).replace(/\s+/g, ' ');
  ok(/มีรถที่ต้องออกไปซ่อม\s*6\s*คัน/.test(head), 'นับเฉพาะใบที่เลือกจัดซ่อมที่หน้างาน (6 จาก 8) — ' + head.trim());
  ok(/ยังไม่จัด\s*6/.test(head), 'ตอนเริ่มยังไม่จัดเข้าใบเลยทั้ง 6');
  ok(await page.locator('.note-info', { hasText: 'จัดซ่อมที่หน้างาน' }).count() > 0,
    'บอกเงื่อนไขเข้าแผนไว้บนหน้า (นับเฉพาะใบที่เลือกจัดซ่อมที่หน้างาน)');
  // นับเฉพาะแถวที่ติดป้าย 'เข้าซ่อมที่ กบค.' — '.tbl tbody tr' เฉยๆ ชนกับตารางรายจังหวัดด้วย
  const offRows = await page.locator('.tbl tbody tr').filter({ has: page.locator('.badge', { hasText: 'เข้าซ่อมที่ กบค.' }) }).count();
  ok(offRows === 2, `แสดงใบที่ถูกกันออก 2 ใบพร้อมเหตุผล (ได้ ${offRows})`);
  ok(await page.locator('.badge', { hasText: 'เข้าซ่อมที่ กบค.' }).count() === 2,
    'ใบที่ถูกกันออกติดป้ายว่า "เข้าซ่อมที่ กบค."');

  console.log('\nสิ่งที่เจ้าของงานสั่งให้ตัดออก');
  ok(await page.locator('#btnAutoTrips').count() === 0, 'ไม่มีปุ่ม "แยกอัตโนมัติตามจังหวัด"');
  ok(await page.locator('.travelQSeg').count() === 0, 'ไม่มีตัวเลือกไตรมาส');

  console.log('\nแยกใบที่ยังไม่จัด ตามจังหวัด');
  const provBoxes = await page.locator('.rzone-head b').allTextContents();
  ok(provBoxes.length === 4, `มีกล่องจังหวัด 4 กล่อง (ได้ ${provBoxes.length}) — ${provBoxes.join(' · ')}`);
  ok(provBoxes[0] === 'ขอนแก่น' || provBoxes[0] === 'อุดรธานี',
    'เรียงจังหวัดที่มีใบเยอะสุดขึ้นก่อน (ขอนแก่น/อุดรธานี 2 ใบ)');
  ok(await page.locator('.rzone-count').first().textContent().then(t => /2 ใบแจ้งซ่อม/.test(t)),
    'หัวกล่องบอกจำนวนใบของจังหวัดนั้น');
  ok(await page.locator('.sect', { hasText: 'แยกตามจังหวัด' }).count() > 0, 'มีหัวข้อ "แยกตามจังหวัด"');

  console.log('\nสร้างใบเดินทาง + เกณฑ์ส่ง');
  await page.locator('#btnAddRepairTrip').click();
  await page.waitForTimeout(300);
  ok(await page.locator('[data-rtrip]').count() > 0, 'สร้างใบเดินทางได้');
  ok(await page.locator('[data-rsend]').isDisabled(), 'ใบเปล่ายังส่งไม่ได้');
  const bl = await page.locator('.note-warn li').allTextContents();
  ok(bl.length === 6, `บอกครบว่าติดอะไรบ้าง ${bl.length} ข้อ`);
  ok(bl.some(x => x.includes('รถที่ใช้เดินทาง')), 'เกณฑ์มี "รถที่ใช้เดินทาง" (UC-15.1)');
  ok(bl.some(x => x.includes('จุดนัดรับรถ')), 'เกณฑ์มี "จุดนัดรับรถ" (SC-15)');

  console.log('\n1 ใบเดินทางรวมได้หลายใบแจ้งซ่อม');
  const addOne = async () => {
    await page.locator('[data-radd-sel]').first().selectOption({ index: 0 });
    await page.locator('[data-radd]').first().click();
    await page.waitForTimeout(250);
  };
  await addOne(); await addOne(); await addOne();
  ok(await page.locator('.rzone:has([data-rtrip]) .tbl tbody tr').count() === 3, 'ใส่ใบแจ้งซ่อมเข้าใบเดียวกันได้ 3 ใบ');
  const head2 = (await page.locator('.sub').first().textContent()).replace(/\s+/g, ' ');
  ok(/จัดเข้าใบแล้ว\s*3/.test(head2) && /ยังไม่จัด\s*3/.test(head2), 'ตัวเลขคุมยอดขยับตาม — ' + head2.trim());
  ok(await page.locator('.rzone-count').first().textContent().then(t => /3 ใบแจ้งซ่อม/.test(t)), 'หัวใบนับจำนวนใบแจ้งซ่อมถูก');
  ok(await page.locator('.rzone .tbl tbody tr .badge').first().isVisible(), 'ตารางแสดงอาการที่แจ้งเป็น badge (อ่านอย่างเดียว)');

  console.log('\nเอาใบแจ้งซ่อมออกจากใบเดินทาง');
  await page.locator('[data-rdrop]').first().click();
  await page.waitForTimeout(250);
  ok(await page.locator('.rzone:has([data-rtrip]) .tbl tbody tr').count() === 2, 'เอาออกได้ทีละใบ');

  console.log('\nกรอกครบแล้วส่งได้');
  const box = page.locator('.rzone').filter({ has: page.locator('[data-rtrip]') }).first();
  await box.locator('[data-field="location"]').fill('กฟจ.ขอนแก่น');
  await box.locator('[data-field="windowFrom"]').fill('2569-09-01');
  await box.locator('[data-field="windowTo"]').fill('2569-09-03');
  await box.locator('[data-field="pickupPoint"]').fill('สนง.ใหญ่ กบค.');
  await box.locator('[data-field="crewVehicle"]').fill('กข-1234 กรุงเทพมหานคร');
  await box.locator('[data-rstaff]').first().fill('ช.สมชาย ใจดี');
  await box.locator('[data-rstaff]').first().dispatchEvent('change');
  await page.waitForTimeout(400);
  ok(!(await page.locator('[data-rsend]').isDisabled()), 'กรอกครบแล้วปุ่มส่งเปิด');
  ok(await page.locator('.note-warn').count() === 0, 'กล่องบอกข้อติดหายไป');

  await page.locator('[data-rsend]').click();
  await page.waitForTimeout(400);
  ok(await page.locator('.badge', { hasText: 'รอตอบรับ' }).count() > 0, 'ส่งแล้วใบขึ้นสถานะรอตอบรับ');
  ok(await box.locator('[data-field="location"]').isDisabled(), 'ส่งแล้วฟอร์มล็อก');

  console.log('\nข้อมูลอยู่ต่อหลังรีโหลด');
  await page.reload();
  await page.waitForSelector('.rzone');
  ok(await page.locator('.rzone:has([data-rtrip]) .tbl tbody tr').count() === 2, 'ใบแจ้งซ่อมในใบเดินทางยังอยู่ครบหลังรีโหลด');

  console.log('\nสายบำรุงรักษาไม่ถูกกระทบ');
  await page.locator('[data-src="plan"]').click();
  await page.waitForTimeout(400);
  ok(await page.locator('tbody tr').count() > 0, 'กลับมาหน้าเลือกแผนบำรุงรักษาได้');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
