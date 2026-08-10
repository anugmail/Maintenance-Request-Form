// ตรวจหน้า Admin: คอลัมน์หน่วยงานเจ้าของรถ + ค่าตั้งค่ากำหนดวันตอบ
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules node maintainance-yearly/test/verify-admin-cf.js
const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8123/maintainance-yearly';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().split('\n')[0]); });

  let pass = 0, fail = 0;
  const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));

  await page.goto(`${BASE}/admin.html`);
  await page.waitForSelector('.tbl');

  console.log('\nตารางรถ');
  const heads = await page.locator('.tbl thead th').allTextContents();
  ok(heads.includes('หน่วยงานเจ้าของรถ'), 'มีคอลัมน์ "หน่วยงานเจ้าของรถ" — ' + heads.join(' | '));
  const firstRow = await page.locator('.tbl tbody tr').first().locator('td').allTextContents();
  ok(firstRow.length === heads.length, `จำนวนช่องในแถวตรงกับหัวตาราง (${firstRow.length}/${heads.length})`);
  ok(/กฟ/.test(firstRow[4] || ''), 'ช่องหน่วยงานมีชื่อจริง — ' + firstRow[4]);

  console.log('\nฟอร์มแก้ไขรถ');
  await page.locator('.tbl tbody tr').first().locator('button, a').first().click();
  await page.waitForSelector('#vehicleForm');
  ok(await page.locator('#vehicleForm input[name="ownerDept"]').count() === 1, 'ฟอร์มมีช่องหน่วยงานเจ้าของรถ');
  ok(await page.locator('#vehicleForm input[name="ownerDept"]').inputValue() !== '', 'ช่องเติมค่าเดิมมาให้');
  await page.locator('#vehicleForm input[name="ownerDept"]').fill('กฟส. ทดสอบแก้ไข');
  await page.locator('#vehicleForm button[type="submit"]').click();
  await page.waitForTimeout(300);
  const afterEdit = await page.locator('.tbl tbody tr').first().locator('td').nth(4).textContent();
  ok((afterEdit || '').includes('ทดสอบแก้ไข'), 'แก้แล้วค่าขึ้นในตาราง — ' + afterEdit);

  console.log('\nค่าตั้งค่าโฟลว์ (แท็บเดโม)');
  await page.locator('.seg button, .seg a, [data-tab]').last().click().catch(() => {});
  await page.waitForTimeout(300);
  if (await page.locator('#cfDays').count() === 0) {
    // หาแท็บที่มีการ์ดค่าตั้งค่า
    for (const el of await page.locator('.seg *').all()) {
      await el.click().catch(() => {});
      await page.waitForTimeout(200);
      if (await page.locator('#cfDays').count()) break;
    }
  }
  ok(await page.locator('#cfDays').count() === 1, 'เจอช่องกำหนดวันตอบ');
  ok(await page.locator('#cfDays').inputValue() === '7', 'ค่าตั้งต้น = 7 วัน');
  await page.locator('#cfDays').fill('14');
  await page.locator('#btnSaveSettings').click();
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForTimeout(400);
  for (const el of await page.locator('.seg *').all()) {
    await el.click().catch(() => {});
    await page.waitForTimeout(150);
    if (await page.locator('#cfDays').count()) break;
  }
  ok(await page.locator('#cfDays').inputValue() === '14', 'รีโหลดแล้วค่าที่บันทึกยังอยู่ (14)');

  const stored = await page.evaluate(() => localStorage.getItem('maintaind.yearly.settings.v1'));
  ok(/"confirmDueDays":14/.test(stored || ''), 'เก็บลง localStorage ถูก key — ' + stored);

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
