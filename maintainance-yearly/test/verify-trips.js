// ตรวจแผนเดินทางหลายใบ: สร้างใบ · จัดรถเข้าใบ · วันนัดรายคัน · ส่งให้หน่วยงาน ·
// หน่วยงานตอบรับ/ปฏิเสธ · กติกา "เลือกวันได้เฉพาะในช่วงที่เสนอ" · gate ก่อนไปขั้นถัดไป
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules node maintainance-yearly/test/verify-trips.js
const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8123/maintainance-yearly';
const PLAN = 'plan-seed-2569-002';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().split('\n')[0]); });

  let pass = 0, fail = 0;
  const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));

  // ---------- ตั้งต้น: ผ่านขั้นยืนยันรถ + เบิกอะไหล่ ให้เข้าขั้นแผนเดินทางได้ ----------
  await page.goto(`${BASE}/index.html#${PLAN}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.wsteps');
  await page.evaluate((planId) => {
    const p = MYD.getPlan(planId);
    (p.selectedVehicleIds || []).forEach(id => {
      const e = MYD.vehicleConfirm(p, id);
      if (!(e.answer === 'ready' || e.verdict)) {
        p.confirm.byVehicle[id] = { ...MYD.emptyConfirmEntry(), ...e, verdict: 'keep', verdictWhy: 'ตั้งต้นเทส', verdictAt: 'x' };
      }
    });
    p.partsRequisitioned = true;
    MYD.savePlan(p);
  }, PLAN);
  await page.reload();
  await page.waitForSelector('.wsteps');

  // ไปขั้นที่ 3 ด้วยการคลิกจริง
  await page.locator('[onclick="goProcSub(3)"]').click();
  await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 3' }).count() > 0, 'เข้าขั้นที่ 3 แผนเดินทางได้');

  console.log('\nสร้างแผนเดินทาง');
  ok(await page.locator('#btnPrimaryProc').isDisabled(), 'ยังไม่มีแผน → ปุ่มถัดไปปิดอยู่');
  await page.locator('#btnAutoTrips').click();
  await page.waitForTimeout(400);
  const boxes = await page.locator('.rzone').count();
  ok(boxes === 2, `แยกอัตโนมัติได้ 2 ใบตามจังหวัด (ได้ ${boxes})`);
  const names = await page.locator('.rzone-head b').allTextContents();
  ok(names.join('|').includes('จันทบุรี') && names.join('|').includes('กาญจนบุรี'),
    'ชื่อใบเป็นชื่อจังหวัด — ' + names.join(' | '));
  ok((await page.locator('.empty', { hasText: 'ยังไม่ถูกจัดเข้าแผน' }).count()) === 0, 'จัดรถครบทุกคันแล้ว');

  console.log('\nกรอกรายละเอียดใบที่ 1');
  const box1 = page.locator('.rzone').first();
  await box1.locator('[data-field="location"]').fill('จุดรวมงาน กฟจ. จันทบุรี');
  await box1.locator('[data-field="windowFrom"]').fill('2568-11-04');
  await box1.locator('[data-field="windowTo"]').fill('2568-11-08');
  await page.waitForTimeout(200);
  ok(await box1.locator('[data-trip-send]').isDisabled(), 'ยังไม่ใส่วันนัดรายคัน → ส่งไม่ได้');

  // วันนอกช่วงต้องถูกทัก
  const firstDate = box1.locator('tbody input[type="date"]').first();
  await firstDate.fill('2568-12-01');
  await page.waitForTimeout(400);
  ok(await page.locator('.sub', { hasText: 'อยู่นอกช่วงที่เสนอ' }).count() > 0, 'ใส่วันนอกช่วง → ขึ้นเตือน');
  ok(await page.locator('.rzone').first().locator('[data-trip-send]').isDisabled(), 'วันนอกช่วง → ส่งไม่ได้');

  const dates = await page.locator('.rzone').first().locator('tbody input[type="date"]').all();
  for (const d of dates) { await d.fill('2568-11-05'); await page.waitForTimeout(150); }
  await page.waitForTimeout(300);
  ok(!(await page.locator('.rzone').first().locator('[data-trip-send]').isDisabled()), 'ครบแล้ว → ส่งได้');

  console.log('\nส่งแผนนัด');
  await page.locator('.rzone').first().locator('[data-trip-send]').click();
  await page.waitForTimeout(500);
  ok(await page.locator('.badge', { hasText: 'รอตอบรับ' }).count() > 0, 'ใบที่ 1 เป็นสถานะรอตอบรับ');
  ok(await page.locator('.rzone').first().locator('[data-field="location"]').isDisabled(), 'ส่งแล้วฟอร์มล็อก');

  console.log('\nฝั่งหน่วยงาน: ตอบรับ / ปฏิเสธ');
  await page.goto(`${BASE}/confirm.html`);
  await page.waitForSelector('.card');
  // แผนตัวอย่างใบเดิม (001) ก็มีแผนนัดที่ตอบรับไปแล้ว จึงต้องเจาะเฉพาะของแผน 002
  const mine = page.locator(`a[href^="#trip/${PLAN}/"]`);
  const inviteRows = await mine.count();
  ok(inviteRows === 3, `แผนนัดของแผนนี้รอตอบ ${inviteRows} รายการ (1 ใบ × 3 หน่วยงาน)`);
  ok(await page.locator('a[href^="#trip/"]').count() > inviteRows, 'รายการรวมมีของแผนอื่นด้วย (ที่ตอบรับไปแล้ว)');

  // ปฏิเสธของหน่วยงานแรกในแผนนี้
  await mine.first().click();
  await page.waitForSelector('#btnTripReject');
  await page.locator('#btnTripReject').click();
  await page.waitForTimeout(200);
  ok(await page.locator('.toast.show').count() > 0, 'ปฏิเสธโดยไม่กรอกชื่อ/เหตุผล → ไม่ผ่าน');
  await page.locator('#tripBy').fill('หัวหน้าแผนก');
  await page.locator('#tripReason').fill('ติดงานทั้งช่วง');
  await page.locator('#btnTripReject').click();
  await page.waitForTimeout(500);
  ok(await page.locator('.empty', { hasText: 'ปฏิเสธแล้ว' }).count() > 0, 'ปฏิเสธสำเร็จ + แสดงเหตุผล');

  console.log('\nกลับฝั่ง กบค. — ใบถูกปฏิเสธต้องแก้แล้วส่งใหม่ได้');
  await page.goto(`${BASE}/index.html#${PLAN}`);
  await page.waitForSelector('.wsteps');
  await page.locator('[onclick="goProcSub(3)"]').click();
  await page.waitForTimeout(400);
  ok(await page.locator('.badge', { hasText: 'ถูกปฏิเสธ' }).count() > 0, 'ใบขึ้นสถานะถูกปฏิเสธ');
  ok(!(await page.locator('.rzone').first().locator('[data-field="location"]').isDisabled()), 'ปลดล็อกให้แก้ได้อีกครั้ง');
  ok(await page.locator('[data-trip-send]').first().textContent().then(t => /ส่งใหม่/.test(t)), 'ปุ่มเปลี่ยนเป็น "แก้แล้วส่งใหม่"');
  ok(await page.locator('#btnPrimaryProc').isDisabled(), 'ยังตอบรับไม่ครบ → ปุ่มถัดไปยังปิด');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
