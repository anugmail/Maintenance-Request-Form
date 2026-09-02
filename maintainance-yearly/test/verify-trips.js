// ตรวจแผนเดินทางหลายใบ: สร้างใบ · จัดรถเข้าใบ · วันนัดรายคัน · ส่งให้หน่วยงาน ·
// หน่วยงานตอบรับ/ปฏิเสธ · กติกา "เลือกวันได้เฉพาะในช่วงที่เสนอ" · gate ก่อนไปขั้นถัดไป
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//   CHROME_PATH=<เบราว์เซอร์> node maintainance-yearly/test/verify-trips.js
// CHROME_PATH ตั้งต้นชี้ Google Chrome — ถ้าเครื่องไม่มี ใช้ chromium ของ playwright แทนได้:
//   ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell
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

  // ไปเฟส 2 (แผนเดินทาง) ด้วยการคลิกจริงบน stepper หลัก — แยกเป็นคนละเฟสแล้ว 21 ส.ค. 2569
  await page.locator(`[onclick="goPhase('travel')"]`).click();
  await page.waitForTimeout(400);
  // หัวข้อเปลี่ยนจาก "ขั้นที่ 1: ทำแผนเดินทาง" เป็น "แผนเดินทาง" ตอนย้าย stepper ย่อยเข้าไปในการ์ดไตรมาส (28 ส.ค. 2569 รอบ 3)
  ok(await page.locator('.sect', { hasText: 'แผนเดินทาง' }).count() > 0, 'เข้าเฟส 2 · แผนเดินทางได้');

  console.log('\nสร้างแผนเดินทาง');
  ok(await page.locator('#btnPrimaryProc').count() === 0, 'เฟสแผนเดินทางไม่มีปุ่ม "ถัดไป" ของ shell แล้ว (28 ส.ค. 2569)');
  // ไตรมาส 1 กางไว้เป็นค่าเริ่มต้น (28 ส.ค. 2569: เปลี่ยนจากแท็บสลับเป็นรายการพับ/กาง) — ปุ่มจึงมี data-q="Q1"
  // .rzone ตอนนี้มี 2 ชั้น: กล่องไตรมาส (มี data-q) ห่อกล่องใบเดินทางแต่ละใบ (ไม่มี data-q) ไว้ข้างใน
  const tripBoxes = () => page.locator('[data-q] .rzone-body .rzone');
  await page.locator('[data-auto-trips="Q1"]').click();
  await page.waitForTimeout(400);
  const boxes = await tripBoxes().count();
  ok(boxes === 2, `แยกอัตโนมัติได้ 2 ใบตามจังหวัด (ได้ ${boxes})`);
  const names = await tripBoxes().locator('.rzone-head b').allTextContents();
  ok(names.join('|').includes('จันทบุรี') && names.join('|').includes('กาญจนบุรี'),
    'ชื่อใบเป็นชื่อจังหวัด — ' + names.join(' | '));
  ok((await page.locator('.empty', { hasText: 'ยังไม่ถูกจัดเข้าแผน' }).count()) === 0, 'จัดรถครบทุกคันแล้ว');

  console.log('\nกรอกรายละเอียดใบที่ 1');
  const box1 = tripBoxes().first();
  await box1.locator('[data-field="location"]').fill('จุดรวมงาน กฟจ. จันทบุรี');
  await box1.locator('[data-field="windowFrom"]').fill('2568-11-04');
  await box1.locator('[data-field="windowTo"]').fill('2568-11-08');
  await page.waitForTimeout(200);
  ok(await box1.locator('[data-trip-send]').isDisabled(), 'ยังไม่ระบุพนักงาน กบค. → ส่งไม่ได้');

  // ⚠️ วันนัดรายคันไม่ได้อยู่จอนี้แล้ว — หน่วยงานเจ้าของรถเลือกเองตอนตอบรับ (17 ส.ค. 2569)
  // เกณฑ์ส่งใบตอนนี้ = สถานที่ + ช่วงวัน + ผู้ดำเนินการ (พนักงาน กบค./ผู้รับจ้าง) + ทุกคันเลือกงานอย่างน้อย 1
  const trip1 = () => tripBoxes().first();
  await trip1().locator('[data-staff-trip]').first().fill('ช่างสมชาย');
  await page.waitForTimeout(400);
  ok(!(await trip1().locator('[data-trip-send]').isDisabled()), 'ครบเกณฑ์ (สถานที่+ช่วง+พนักงาน+งานรายคัน) → ส่งได้');

  // ตัวเลือก "งานที่จะทำ" รายคัน — 3 อย่าง (เพิ่ม "เปลี่ยนตัวกรอง" 21 ส.ค. 2569)
  const row1 = () => trip1().locator('tbody tr').first();
  const jobLabels = await row1().locator('.chip').allTextContents();
  ok(jobLabels.length === 3 && jobLabels.includes('เปลี่ยนตัวกรอง'),
    `งานที่จะทำมี 3 ตัวเลือก — ${jobLabels.join(' · ')}`);
  ok((await row1().locator('.chip.sel').allTextContents()).join('|') === 'เปลี่ยนถ่ายน้ำมันไฮดรอลิก|ตรวจน้ำมันไฮดรอลิก',
    'ตั้งต้นติ๊ก 2 งานน้ำมัน · เปลี่ยนตัวกรองยังไม่ติ๊ก');
  await row1().locator('.chip', { hasText: 'เปลี่ยนตัวกรอง' }).click();
  await page.waitForTimeout(400);
  ok(await row1().locator('.chip.sel', { hasText: 'เปลี่ยนตัวกรอง' }).count() > 0, 'ติ๊กเปลี่ยนตัวกรองได้');

  // เอางานของรถคันแรกออกให้หมด → ส่งไม่ได้ แล้วติ๊กกลับ
  for (let i = 0; i < 5 && await row1().locator('.chip.sel').count(); i++) {
    await row1().locator('.chip.sel').first().click();
    await page.waitForTimeout(200);
  }
  ok(await trip1().locator('[data-trip-send]').isDisabled(), 'มีรถที่ยังไม่เลือกงาน → ส่งไม่ได้');
  await row1().locator('.chip').first().click();
  await page.waitForTimeout(400);
  ok(!(await trip1().locator('[data-trip-send]').isDisabled()), 'ติ๊กงานกลับ → ส่งได้อีกครั้ง');

  console.log('\nส่งแผนนัด');
  await tripBoxes().first().locator('[data-trip-send]').click();
  await page.waitForTimeout(500);
  ok(await page.locator('.badge', { hasText: 'รอตอบรับ' }).count() > 0, 'ใบที่ 1 เป็นสถานะรอตอบรับ');
  ok(await tripBoxes().first().locator('[data-field="location"]').isDisabled(), 'ส่งแล้วฟอร์มล็อก');

  console.log('\nฝั่งหน่วยงาน: ตอบรับ / ปฏิเสธ');
  await page.goto(`${BASE}/confirm.html`);
  await page.waitForSelector('.card');
  // แผนตัวอย่างใบเดิม (001) ก็มีแผนนัดที่ตอบรับไปแล้ว จึงต้องเจาะเฉพาะของแผน 002
  const mine = page.locator(`a[href^="#trip/${PLAN}/"]`);
  const inviteRows = await mine.count();
  // จำนวนหน่วยงานที่ต้องตอบ = หน่วยงานเจ้าของรถในใบที่ส่งไป (ไม่ hardcode — ข้อมูลรถ/หน่วยงานเปลี่ยนได้)
  const nDept = await page.evaluate((planId) => {
    const p = MYD.getPlan(planId);
    const sent = (p.trips || []).filter(t => t.sentAt);
    return sent.reduce((n, t) => n + MYD.tripDepts(t, MYD.loadMaster()).length, 0);
  }, PLAN);
  ok(inviteRows === nDept, `แผนนัดของแผนนี้รอตอบ ${inviteRows} รายการ (1 ใบ × ${nDept} หน่วยงาน)`);
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
  await page.locator(`[onclick="goPhase('travel')"]`).click();
  await page.waitForTimeout(400);
  ok(await page.locator('.badge', { hasText: 'ถูกปฏิเสธ' }).count() > 0, 'ใบขึ้นสถานะถูกปฏิเสธ');
  ok(!(await tripBoxes().first().locator('[data-field="location"]').isDisabled()), 'ปลดล็อกให้แก้ได้อีกครั้ง');
  ok(await page.locator('[data-trip-send]').first().textContent().then(t => /ส่งใหม่/.test(t)), 'ปุ่มเปลี่ยนเป็น "แก้แล้วส่งใหม่"');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
