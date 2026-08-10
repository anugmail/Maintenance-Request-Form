// ตรวจการแบ่งรายการยืนยันรถเป็น ภาค → จังหวัด + ปุ่มตัดสินยังทำงานหลังจัดกลุ่ม
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules node maintainance-yearly/test/verify-cf-grouping.js
const { chromium } = require('playwright-core');
const URL = 'http://127.0.0.1:8123/maintainance-yearly/index.html#plan-seed-2569-002';

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

  // ล้าง state ก่อน ไม่งั้นคำตัดสินจากการรันรอบก่อนค้างอยู่ ทำให้ผลไม่คงที่
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.rzone');

  console.log('\nการแบ่งกลุ่ม');
  const zoneHeads = await page.locator('.wgrp').allTextContents();
  ok(zoneHeads.length >= 1, `มีหัวข้อภาค ${zoneHeads.length} กลุ่ม — ${zoneHeads.join(' | ')}`);
  ok(zoneHeads.every(t => /คัน/.test(t)), 'หัวข้อภาคมีสรุปจำนวนคัน');

  const provHeads = await page.locator('.rzone-head').allTextContents();
  ok(provHeads.length >= 2, `มีกล่องจังหวัด ${provHeads.length} กล่อง`);
  ok(provHeads.every(t => /เขต \d/.test(t)), 'ทุกกล่องบอกเขตกำกับ');
  // ชื่อจังหวัดอยู่ใน <b> — ไม่ใช้ textContent ของหัวกล่องเพราะจะติดชื่อ ligature ของไอคอนมาด้วย
  const provNames = await page.locator('.rzone-head b').allTextContents();
  ok(provNames.every(n => n.trim() && !/^เขต/.test(n.trim())), 'หัวกล่องเป็นชื่อจังหวัด ไม่ใช่เลขเขต');
  console.log('   จังหวัด:', provNames.map(n => n.trim()).join(' | '));

  console.log('\nความถูกต้องของตัวเลข');
  const perTableRows = await page.locator('.rzone-body table tbody tr').count();
  ok(perTableRows === 12, `รวมทุกกล่องได้ 12 แถว = รถในแผน (ได้ ${perTableRows})`);
  const plates = await page.locator('.rzone-body table tbody tr td:first-child').allTextContents();
  ok(new Set(plates).size === plates.length, 'ไม่มีรถซ้ำข้ามกล่อง');

  // ทุกกล่องต้องมีเฉพาะรถของเขตนั้น — เช็คจากเลขนำหน้าทะเบียน (05-xxxx = เขต 5)
  let mismatch = 0;
  for (const box of await page.locator('.rzone').all()) {
    const head = (await box.locator('.rzone-head').textContent()) || '';
    const region = (head.match(/เขต (\d+)/) || [])[1];
    const boxPlates = await box.locator('tbody tr td:first-child').allTextContents();
    if (boxPlates.some(p => !p.trim().startsWith(String(region).padStart(2, '0')))) mismatch++;
  }
  ok(mismatch === 0, 'รถในแต่ละกล่องเป็นของเขตนั้นจริงทุกกล่อง');

  console.log('\nปุ่มตัดสินยังทำงานหลังจัดกลุ่ม');
  const joining = async () => {
    const t = (await page.locator('.card .sub', { hasText: 'เข้าทริปนี้' }).first().textContent()) || '';
    return Number((t.replace(/\s+/g, ' ').match(/เข้าทริปนี้ (\d+) คัน/) || [])[1]);
  };
  const before = await page.locator('[data-verdict-for]').count();
  ok(before === 4, `มีปุ่มตัดสิน ${before} ปุ่ม (ไม่พร้อม 2 + เลยกำหนด 2)`);
  ok(await joining() === 8, 'ตั้งต้นเข้าทริป 8 คัน (ตอบพร้อม 8 · อีก 4 ยังไม่ตัดสิน)');

  const decide = async (value, why) => {
    await page.locator('[data-verdict-for]').first().click();
    await page.waitForSelector('[data-verdict-row]');
    await page.locator(`[data-verdict-row] input[value="${value}"]`).check();
    await page.locator('#vdWhy').fill(why);
    await page.locator('#vdSave').click();
    await page.waitForTimeout(400);
  };

  // ตัดคันที่ตอบ "ไม่พร้อม" ออก — เดิมก็ไม่ได้เข้าทริปอยู่แล้ว ยอดต้องไม่ขยับ
  await decide('drop', 'ทดสอบตัดออก');
  ok(await page.locator('[data-verdict-for]').count() === before - 1, 'ตัดสินแล้วปุ่มลดลง 1');
  ok(await joining() === 8, 'ตัด(drop)คันที่ไม่พร้อม → ยอดเข้าทริปคงที่ 8');

  // สั่ง "เข้าตามเดิม" ให้คันที่ไม่พร้อม — verdict ต้องชนะคำตอบ ยอดต้องเพิ่ม
  await decide('keep', 'ทดสอบให้เข้าตามเดิม');
  ok(await joining() === 9, 'สั่ง(keep)คันที่ไม่พร้อม → ยอดเข้าทริปเพิ่มเป็น 9');

  await page.reload();
  await page.waitForSelector('.rzone');
  ok(await page.locator('[data-verdict-for]').count() === before - 2, 'รีโหลดแล้วคำตัดสินทั้ง 2 ครั้งยังอยู่');
  ok(await joining() === 9, 'รีโหลดแล้วยอดเข้าทริปยังเป็น 9');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
