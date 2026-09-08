// หน้า Overhaul — ไล่ด้วยการคลิกจริง: ลิสต์ · เหตุผลรายคัน · ตัวกรอง · แก้เกณฑ์ที่ Admin แล้วผลเปลี่ยน
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//   CHROME_PATH=<เบราว์เซอร์> node maintainance-yearly/test/verify-overhaul.js
const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8123/maintainance-yearly';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await (await browser.newContext()).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().split('\n')[0]); });
  page.on('dialog', d => d.accept());
  let pass = 0, fail = 0;
  const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));
  const counts = async () => {
    const t = (await page.locator('.ov-sum').textContent()).replace(/\s+/g, ' ');
    const n = k => Number((t.match(new RegExp(k + ' (\\d+)')) || [])[1]);
    return { due: n('เข้าข่าย'), near: n('ใกล้เกณฑ์'), ok: n('ยังไม่ถึง') };
  };

  await page.goto(`${BASE}/overhaul.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.tbl');

  console.log('เมนู + หัวข้อ');
  ok(await page.locator('.nv.on[href="overhaul.html"]').count() === 1, 'เมนูซ้ายมี Overhaul และ active อยู่');
  ok(await page.locator('.page-title', { hasText: 'Overhaul' }).count() > 0, 'มีหัวข้อหน้า');

  console.log('\nสรุปผลประเมิน');
  const c0 = await counts();
  console.log('   ', JSON.stringify(c0));
  const totalVeh = await page.evaluate(() => MYD.loadMaster().vehicles.length);
  ok(c0.due + c0.near + c0.ok === totalVeh, `นับครบทุกคัน (${c0.due}+${c0.near}+${c0.ok} = ${totalVeh})`);
  ok(c0.due > 0 && c0.ok > 0, 'ข้อมูลตัวอย่างมีทั้งคันที่เข้าข่ายและยังไม่ถึง');

  console.log('\nเหตุผลรายคัน — กางแถวแล้วต้องเห็นค่าจริงเทียบเกณฑ์');
  ok(await page.locator('.ov-metric').count() === 0, 'ยังไม่กาง = ยังไม่เห็นรายละเอียด');
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(300);
  const metrics = await page.locator('.ov-metric').allTextContents();
  console.log('   ', metrics.map(t => t.replace(/\s+/g, ' ').trim()).join(' | '));
  ok(metrics.length === 4, `กางแล้วเห็นครบ 4 ข้อ (อายุ/ไมล์/ชั่วโมง/ต้นทุน) — ได้ ${metrics.length}`);
  ok(metrics.some(t => /อายุใช้งาน/.test(t)), 'มีข้ออายุใช้งาน');
  ok(metrics.every(t => /\d+ \/ [\d,]+/.test(t.replace(/\s+/g, ' '))), 'ทุกข้อบอกค่าจริงเทียบเกณฑ์');

  console.log('\nตัวกรองผลประเมิน');
  await page.locator('#ov-filter-btn').click();
  await page.waitForTimeout(200);
  await page.selectOption('#ov-level', 'due');
  await page.waitForTimeout(300);
  const levels = await page.locator('tbody tr td:nth-child(6) .badge').allTextContents();
  ok(levels.length > 0 && levels.every(t => t.includes('เข้าข่าย')), `กรองแล้วเหลือแต่ "เข้าข่าย" (${levels.length} แถว)`);
  await page.locator('.btn', { hasText: 'ล้างตัวกรอง' }).click();
  await page.waitForTimeout(300);
  ok((await counts()).due === c0.due, 'ล้างตัวกรองแล้วกลับมาเหมือนเดิม');

  console.log('\nค้นหา');
  const firstPlate = (await page.locator('tbody tr .cell-key').first().textContent()).trim();
  await page.fill('#ov-q', firstPlate);
  await page.waitForTimeout(400);
  ok(await page.locator('tbody tr .cell-key', { hasText: firstPlate }).count() > 0, `ค้นทะเบียน "${firstPlate}" เจอ`);
  await page.fill('#ov-q', 'ไม่มีทะเบียนนี้แน่นอน');
  await page.waitForTimeout(400);
  ok(await page.locator('.filter-empty').count() > 0, 'ค้นไม่เจอ → ขึ้นสถานะว่าง');

  console.log('\nแก้เกณฑ์ที่ Admin แล้วผลต้องเปลี่ยนตาม');
  await page.goto(`${BASE}/admin.html`);
  await page.waitForSelector('#adminTabs');
  await page.locator('[data-tab="overhaul"]').click();
  await page.waitForTimeout(300);
  ok(await page.locator('#ovAge').inputValue() === '15', 'ค่าตั้งต้นเกณฑ์อายุ = 15 ปี');
  await page.fill('#ovAge', '10');
  await page.locator('#btnOvSave').click();
  await page.waitForTimeout(400);
  await page.goto(`${BASE}/overhaul.html`);
  await page.waitForSelector('.tbl');
  const c1 = await counts();
  console.log('   ', JSON.stringify(c1));
  ok(c1.due > c0.due, `ลดเกณฑ์อายุเป็น 10 ปี → เข้าข่ายเพิ่มจาก ${c0.due} เป็น ${c1.due}`);
  ok((await page.locator('.sub', { hasText: 'เกณฑ์อายุ 10 ปี' }).count()) > 0, 'หัวหน้าบอกเกณฑ์ที่ใช้อยู่จริง');

  console.log('\nคืนค่าตั้งต้น');
  await page.goto(`${BASE}/admin.html`);
  await page.waitForSelector('#adminTabs');
  await page.locator('[data-tab="overhaul"]').click();
  await page.waitForTimeout(300);
  await page.locator('#btnOvReset').click();
  await page.waitForTimeout(400);
  ok(await page.locator('#ovAge').inputValue() === '15', 'คืนค่าตั้งต้นแล้วกลับเป็น 15 ปี');
  await page.goto(`${BASE}/overhaul.html`);
  await page.waitForSelector('.tbl');
  ok((await counts()).due === c0.due, 'ผลประเมินกลับมาเท่าเดิม');

  console.log('\nปีที่เริ่มใช้งานแก้ได้จาก Admin › ข้อมูลรถ');
  await page.goto(`${BASE}/admin.html`);
  await page.waitForSelector('#adminTabs');
  ok(await page.locator('th', { hasText: 'เริ่มใช้ (พ.ศ.)' }).count() > 0, 'ตารางรถมีคอลัมน์ปีที่เริ่มใช้งาน');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
