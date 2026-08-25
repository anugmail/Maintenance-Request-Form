// ตรวจครบทั้ง 3 ระดับ: ทั้งหมด / ทั้งภาค / ทั้งเขต + รายคัน + reload persistence
const { chromium } = require('playwright-core');
const U = 'http://127.0.0.1:8123/maintainance-yearly/plan-new.html';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));

  const count = async () => (await page.locator('.sub', { hasText: 'เลือกแล้ว' }).first().textContent()).trim();
  let pass = 0, fail = 0;
  const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));

  await page.goto(U);
  await page.waitForSelector('#chkAllZones');
  await page.fill('#fPlanName', 'ทดสอบเลือกรถ');
  await page.waitForTimeout(150);

  console.log('\nเลือกทั้งหมด (ทุกเขต)');
  await page.check('#chkAllZones');
  await page.waitForTimeout(250);
  ok((await count()).includes('132 คัน'), 'ได้ 132 คัน จาก 12 เขต — ' + await count());
  ok(await page.locator('.zoneAllChk:checked').count() === 4, 'checkbox ภาคติ๊กครบ 4/4');
  ok(await page.locator('.regionAllChk:checked').count() === 12, 'checkbox เขตติ๊กครบ 12/12');

  console.log('\nเอาออกทั้งหมด');
  await page.uncheck('#chkAllZones');
  await page.waitForTimeout(250);
  ok((await count()).includes('0 คัน'), 'กลับเป็น 0 คัน');
  ok(await page.locator('.zoneAllChk:checked').count() === 0, 'checkbox ภาคหลุดหมด');

  console.log('\nเลือกทั้งภาค (ภาคเหนือ = เขต 1-3 = 33 คัน)');
  await page.locator('.zoneAllChk').first().check();
  await page.waitForTimeout(250);
  ok((await count()).includes('33 คัน'), 'ได้ 33 คัน จาก 3 เขต — ' + await count());
  ok(await page.locator('.regionAllChk:checked').count() === 3, 'เขตในภาคนั้นติ๊กครบ 3');
  ok(!await page.locator('#chkAllZones').isChecked(), '"เลือกทั้งหมด" ยังไม่ติ๊ก (เลือกแค่ภาคเดียว)');

  console.log('\nเลือกทั้งเขต (เพิ่มเขต 4 = 11 คัน)');
  await page.locator('.regionAllChk').nth(3).check();
  await page.waitForTimeout(250);
  ok((await count()).includes('44 คัน'), 'รวมเป็น 44 คัน จาก 4 เขต — ' + await count());

  console.log('\nรถรายคัน (กางเขต 1 แล้วเอาออก 1 คัน)');
  await page.locator('.rzone-head').first().click();
  await page.waitForSelector('.rowChk[data-id="v-1-1"]');
  // คลิกด้วย selector เจาะจง — ลิสต์ถูกวาดใหม่ทุกครั้งที่ติ๊ก ถ้าใช้ :checked.first()
  // Playwright จะ resolve ใหม่แล้วคลิกคันถัดไปวนไปเรื่อยๆ
  await page.click('.rowChk[data-id="v-1-1"]');
  await page.waitForFunction(() =>
    document.body.innerText.includes('เลือกแล้ว 43 คัน'), null, { timeout: 5000 }).catch(() => {});
  ok((await count()).includes('43 คัน'), 'เหลือ 43 คัน — ' + await count());
  ok(await page.locator('.zoneAllChk').first().evaluate(el => el.indeterminate), 'checkbox ภาคเป็นสถานะครึ่งๆ (indeterminate)');

  // ร่างถูกบันทึกจริง และเปิดต่อได้จากรายการแผนด้วย #<planId> (ปุ่ม "ทำต่อ")
  // เปิด plan-new.html เปล่าๆ = เริ่มร่างใหม่ตามดีไซน์ ไม่ใช่การกู้ร่างเดิม
  console.log('\nร่างถูกบันทึก + เปิดต่อได้');
  const draftId = await page.evaluate(() =>
    (JSON.parse(localStorage.getItem('maintaind.yearly.plans.v1')).plans
      .find(p => p.planName === 'ทดสอบเลือกรถ') || {}).id);
  ok(!!draftId, 'ร่างถูกบันทึกลง storage แล้ว');

  await page.goto(U);
  await page.waitForSelector('#chkAllZones');
  ok((await count()).includes('0 คัน'), 'เปิดหน้าเปล่า = ร่างใหม่ 0 คัน (ตามดีไซน์)');

  // ต้องเป็นการโหลดเอกสารใหม่จริงเหมือนกดปุ่ม "ทำต่อ" จาก index.html
  // (goto ที่ต่างกันแค่ hash ไม่รีโหลด → INIT ที่ผูกกับ DOMContentLoaded ไม่ทำงาน)
  await page.goto('http://127.0.0.1:8123/maintainance-yearly/index.html');
  await page.waitForTimeout(200);
  await page.goto(U + '#' + draftId);
  await page.waitForSelector('#chkAllZones');
  ok((await count()).includes('43 คัน'), 'เปิดด้วย #<planId> ได้ 43 คันคืน — ' + await count());

  const drafts = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('maintaind.yearly.plans.v1')).plans
      .filter(p => !p.workNumber).length);
  ok(drafts === 1, `เปิดหน้าเปล่าแล้วไม่ทิ้งร่างขยะ (ร่างทั้งหมด ${drafts} ใบ)`);

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
