// โครงหน้าของโฟลว์บำรุงรักษา — เดินด้วยการคลิกจริงตั้งแต่หน้าแผนจนจบไตรมาส
//
// 8 ก.ย. 2569 (เจ้าของงานสั่ง "ตอนที่เป็น master plan ยังไม่มีการส่งนัด หรือส่งยืนยันกับหน่วยงาน"):
//   หน้าแผน   = 2 แท็บ — เบิก/จัดหาอะไหล่ · รายการไตรมาส   (ไม่ส่งอะไรหาหน่วยงานเลย)
//   หน้าไตรมาส = 6 แท็บ — ยืนยันรถ · แผนเดินทาง · ตรวจสภาพก่อนซ่อม · ดำเนินการบำรุงรักษา ·
//                 จัดทำรายงาน · คำนวณต้นทุน   (การส่งทุกอย่างเกิดที่นี่)
//   หน้า "เลือกรถที่จะดำเนินการ" คั่นก่อนเข้า 4 แท็บหลัง ไม่ใช่กั้นทั้งหน้าไตรมาสแล้ว
//
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//   CHROME_PATH=<เบราว์เซอร์> node maintainance-yearly/test/verify-proc-steps.js
const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8123/maintainance-yearly';
const PLAN = 'plan-seed-2569-002';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await (await browser.newContext()).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().split('\n')[0]); });
  let pass = 0, fail = 0;
  const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));
  const tabLabels = () => page.locator('#stepper .tab-btn').evaluateAll(
    els => els.map(e => (e.childNodes[0].textContent || '').trim()));
  const openQuarter = async (q) => {
    await page.goto(`${BASE}/index.html#${PLAN}/${q}`);
    await page.waitForSelector('.tab-btn');
  };

  await page.goto(`${BASE}/index.html#${PLAN}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.tab-btn');

  console.log('หน้าแผน — 2 แท็บ ไม่มีการส่งอะไรหาหน่วยงาน');
  const planTabs = await tabLabels();
  console.log('   ', planTabs.join(' · '));
  ok(planTabs.length === 2 && planTabs[0] === 'เบิก/จัดหาอะไหล่' && planTabs[1] === 'รายการไตรมาส',
    'หน้าแผนมี 2 แท็บถูกต้อง');
  ok(await page.locator('#stepper .wsteps').count() === 0, 'ไม่มี stepper เหลืออยู่');
  ok(await page.locator('#btnSendConfirm').count() === 0, 'หน้าแผนไม่มีปุ่มส่งคำขอยืนยัน');
  ok(await page.locator('[data-add-trip]').count() === 0, 'หน้าแผนไม่มีปุ่มสร้างแผนเดินทาง');

  console.log('\nแท็บเบิก/จัดหาอะไหล่ — ส่งคำขอได้เลย (เกณฑ์เดิมผูกกับการยืนยันรถ ย้ายไปไตรมาสแล้ว)');
  await page.evaluate((planId) => {
    const p = MYD.getPlan(planId); p.partsRequisitioned = false; MYD.savePlan(p);
  }, PLAN);
  await page.reload(); await page.waitForSelector('.tab-btn');
  ok(!(await page.locator('#btnRequisition').isDisabled()), 'ปุ่มส่งคำขอเบิกอะไหล่เปิดอยู่');
  await page.locator('#btnRequisition').click(); await page.waitForTimeout(400);
  ok(await page.locator('.badge', { hasText: 'ส่งคำขอแล้ว' }).count() > 0, 'ส่งคำขอเบิกแล้ว');
  ok(await page.locator('[data-plan-tab="parts"] .badge', { hasText: 'ส่งคำขอแล้ว' }).count() > 0,
    'ป้ายบนแท็บอัปเดตตาม');

  console.log('\nแท็บรายการไตรมาส — เปิดดำเนินการได้ทุกไตรมาสที่มีรถ (ไม่ต้องรอยืนยันแผนเดินทาง)');
  await page.locator('[data-plan-tab="quarters"]').click(); await page.waitForTimeout(400);
  const openLinks = await page.locator('a', { hasText: 'เปิดดำเนินการ' }).count();
  ok(openLinks === 4, `มีลิงก์เปิดดำเนินการครบ 4 ไตรมาส (ได้ ${openLinks})`);

  console.log('\nหน้าไตรมาส 1 — 6 แท็บ เปิดมาที่ "ยืนยันรถเข้าร่วมแผน"');
  await openQuarter('Q1');
  const qTabs = await tabLabels();
  console.log('   ', qTabs.join(' · '));
  ok(qTabs.length === 6 && qTabs[0] === 'ยืนยันรถเข้าร่วมแผน' && qTabs[1] === 'แผนเดินทาง'
    && qTabs[5] === 'คำนวณต้นทุน', '6 แท็บของไตรมาสถูกต้อง');
  ok(await page.locator('[data-q-tab="confirm"].on').count() === 1, 'เปิดมาอยู่แท็บยืนยันรถ');
  ok(await page.locator('.cur', { hasText: 'ไตรมาส 1' }).count() > 0, 'crumbs บอกว่าอยู่ไตรมาส 1');

  console.log('\nส่งคำขอยืนยันของไตรมาสนี้ — เฉพาะรถของไตรมาสนี้เท่านั้น');
  // แผนเดโมส่งคำขอมาแล้วทุกไตรมาส — ล้างของ Q1 ทิ้งก่อน จะได้เห็นปุ่มส่งจริง
  await page.evaluate((planId) => {
    const p = MYD.getPlan(planId); delete p.confirm.sent.Q1; MYD.savePlan(p);
  }, PLAN);
  await page.reload(); await page.waitForSelector('.tab-btn');
  const askText = (await page.locator('#phase').textContent()) || '';
  ok(/จะส่งคำขอไป/.test(askText), 'ยังไม่ส่ง → เห็นกล่องส่งคำขอ');
  const q1Count = await page.evaluate(p => MYD.planVehicleIds(MYD.getPlan(p), 'Q1').length, PLAN);
  ok(askText.includes(`${q1Count} คัน`), `นับเฉพาะรถของไตรมาส 1 (${q1Count} คัน) ไม่ใช่ทั้งแผน`);
  await page.locator('#btnSendConfirm').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'สรุปการยืนยัน' }).count() > 0, 'ส่งแล้วเห็นตารางสรุปการยืนยัน');
  const otherSent = await page.evaluate(p => !!MYD.confirmSentOf(MYD.getPlan(p), 'Q2'), PLAN);
  ok(otherSent, 'คำขอของไตรมาสอื่นไม่ถูกแตะ');

  console.log('\nฝั่งหน่วยงาน — รายการคำขอแยกรายไตรมาส');
  await page.goto(`${BASE}/confirm.html`);
  await page.waitForSelector('.card');
  const cfLinks = await page.locator(`a[href^="#${PLAN}/Q1/"]`).count();
  ok(cfLinks > 0, `มีคำขอของไตรมาส 1 ให้ตอบ ${cfLinks} รายการ (ลิงก์มีไตรมาสกำกับ)`);

  console.log('\nแท็บแผนเดินทางของไตรมาส 1');
  await page.evaluate((planId) => {
    const p = MYD.getPlan(planId);
    MYD.planVehicleIds(p, 'Q1').forEach(id => {
      const e = MYD.vehicleConfirm(p, id);
      if (!(e.answer === 'ready' || e.verdict)) {
        p.confirm.byVehicle[id] = { ...MYD.emptyConfirmEntry(), ...e, verdict: 'keep', verdictWhy: 'ตั้งต้นเทส', verdictAt: 'x' };
      }
    });
    MYD.savePlan(p);
  }, PLAN);
  await openQuarter('Q1');
  await page.locator('[data-q-tab="travel"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('[data-add-trip="Q1"]').count() > 0, 'มีปุ่มสร้างแผนเดินทางของไตรมาสนี้');
  ok(await page.locator('[data-add-trip="Q2"]').count() === 0, 'ไม่มีของไตรมาสอื่นปนมา');
  ok(await page.locator('.wsteps').count() === 0, 'ไม่มี mini-stepper ซ้อนในแท็บนี้');
  await page.locator('[data-auto-trips="Q1"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('#phase .rzone').count() >= 1, 'แยกใบเดินทางอัตโนมัติได้');

  console.log('\nยืนยันแผนเดินทางของไตรมาสนี้');
  // ⚠️ ต้องมิวเทตตัวแปร PLAN ที่หน้ากำลังถืออยู่ตรงๆ ไม่ใช่ MYD.getPlan() ซึ่งเป็นสำเนาใหม่ —
  // ไม่งั้นการ save ครั้งต่อไปของหน้า (เช่นตอนคลิกแท็บ) จะเขียนทับของที่เพิ่งแก้ทิ้งเงียบๆ
  await openQuarter('Q1');
  await page.evaluate(() => {
    const m = MYD.loadMaster();
    const q1 = new Set(MYD.planVehicleIds(PLAN, 'Q1'));
    MYD.ensureTrips(PLAN).filter(t => (t.vehicleIds || []).some(id => q1.has(id))).forEach(t => {
      t.location = 'จุดรวมงานทดสอบ'; t.windowFrom = '2568-11-04'; t.windowTo = '2568-11-08'; t.sentAt = 'x';
      t.replies = {}; MYD.tripDepts(t, m).forEach(d => {
        t.replies[d] = { status: 'accepted', reason: '', by: 'x', at: 'x', history: [] };
      });
    });
    MYD.savePlan(PLAN);
  });
  await page.locator('[data-q-tab="travel"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('[data-confirm-q="Q1"]').count() > 0, 'ไตรมาสพร้อมแล้ว → มีปุ่มยืนยันไตรมาส 1');
  await page.locator('[data-confirm-q="Q1"]').click(); await page.waitForTimeout(500);
  ok(await page.locator('.note-ok', { hasText: 'ยืนยันแผนเดินทางไตรมาส 1แล้ว' }).count() > 0,
    'ยืนยันแล้วขึ้นกล่องยืนยัน');
  ok(await page.locator('[data-q-tab="travel"] .badge', { hasText: 'เสร็จแล้ว' }).count() > 0,
    'ป้ายบนแท็บแผนเดินทางขึ้น "เสร็จแล้ว"');

  console.log('\nเข้าแท็บตรวจสภาพครั้งแรก — ต้องเจอหน้า "เลือกรถที่จะดำเนินการ" คั่นก่อน');
  await page.locator('[data-q-tab="inspection"]').click(); await page.waitForTimeout(500);
  ok(await page.locator('.sect', { hasText: 'เลือกรถที่จะดำเนินการ' }).count() > 0, 'เจอหน้าเลือกรถ');
  ok(await page.locator('#stepper .tabs').count() === 0, 'ระหว่างเลือกรถยังไม่เห็นแถบแท็บ');
  ok(await page.locator('#chkPickAll').isChecked(), 'ตั้งต้นติ๊กรถทุกคันไว้ให้แล้ว');
  await page.locator('#btnStartOps').click(); await page.waitForTimeout(500);
  ok(await page.locator('[data-q-tab="inspection"].on').count() === 1, 'ยืนยันเลือกรถแล้วเข้าแท็บตรวจสภาพ');

  console.log('\nไล่ 4 แท็บหลัง: ตรวจสภาพ → ดำเนินการ → รายงาน → ต้นทุน');
  await page.evaluate(() => {
    MYD.planVehicleIds(PLAN, 'Q1').forEach(id => {
      const f = MYD.ensureInspection(PLAN, id);
      f.signedDeliverAt = 'x'; f.signedReceiveAt = 'x';
    });
    MYD.savePlan(PLAN);
  });
  await page.locator('[data-insp-open]').first().click(); await page.waitForTimeout(300);
  await page.locator('#btnInspDone').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ดำเนินการบำรุงรักษา' }).count() > 0,
    'ตรวจคันแรกเสร็จ → ข้ามไปแท็บดำเนินการบำรุงรักษาอัตโนมัติ');
  ok(await page.locator('[data-q-tab="inspection"] .badge', { hasText: 'เสร็จแล้ว' }).count() > 0,
    'แท็บตรวจสภาพขึ้นป้าย "เสร็จแล้ว"');

  await page.locator('#btnMaintShowAll').click().catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('#btnPhaseNext').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'จัดทำรายงาน' }).count() > 0, 'ไปแท็บจัดทำรายงานได้');
  await page.locator('#btnPhaseNext').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'คำนวณต้นทุน' }).count() > 0, 'ไปแท็บคำนวณต้นทุนได้');

  await page.locator('#btnSendCloseQ').click(); await page.waitForTimeout(300);
  const proceedBtn = page.locator('#inspectWarnProceed');
  if (await proceedBtn.count()) { await proceedBtn.click(); await page.waitForTimeout(300); }
  ok(await page.locator('.note', { hasText: 'ส่งอนุมัติปิดแผน' }).count() > 0, 'ส่งอนุมัติปิดแผนไตรมาส 1 แล้ว');
  const qDone = await page.locator('#stepper .tab-btn .badge').allTextContents();
  ok(qDone.length === 6 && qDone.every(t => t.includes('เสร็จแล้ว')),
    `ทั้ง 6 แท็บของไตรมาส 1 ขึ้น "เสร็จแล้ว" หมด (ได้ ${qDone.length} ป้าย)`);

  console.log('\nกลับหน้าแผน — รายการไตรมาสต้องเห็นไตรมาส 1 ครบแล้ว');
  await page.locator('a', { hasText: 'กลับไปหน้าแผน' }).click(); await page.waitForTimeout(400);
  ok(page.url().endsWith(`#${PLAN}`), 'กลับมาที่หน้าแผน');
  await page.locator('[data-plan-tab="quarters"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('tr', { hasText: 'ไตรมาส 1' }).locator('.badge', { hasText: 'ดำเนินการครบแล้ว' }).count() > 0,
    'แถวไตรมาส 1 ขึ้นว่าดำเนินการครบแล้ว');
  ok(await page.locator('tr', { hasText: 'ไตรมาส 1' }).locator('a', { hasText: 'เปิดดำเนินการ' }).count() > 0,
    'ยังกดเปิดดำเนินการซ้ำเพื่อย้อนดูได้');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
