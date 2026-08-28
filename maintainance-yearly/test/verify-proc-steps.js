// แยก "เบิก/จัดหา" (เฟส 1) กับ "แผนเดินทาง" (เฟส 2) ออกจากกัน — เจ้าของงานสั่ง 21 ส.ค. 2569
// ไล่ทั้งสองเฟสด้วยการคลิกจริง + เช็ค gate ทั้งระดับเฟส (stepper บน) และระดับขั้น (wizard ย่อย)
//
// ⚠️ 28 ส.ค. 2569 — เจ้าของงานสั่งย้าย "ตรวจสภาพก่อนซ่อม/ดำเนินการบำรุงรักษา/จัดทำรายงาน/คำนวณต้นทุน"
// ออกจาก stepper ของแผน ไปเป็น stepper แยกต่างหาก "ต่อไตรมาส" (index.html#<planId>/<Q>) — กด "ยืนยัน<ไตรมาส>"
// ที่ขั้นทวน+ยืนยันแล้วพาเข้าหน้าไตรมาสนั้นตรงๆ ทันที (ไม่รอไตรมาสอื่น) จึงต้องแยกเทสส่วนนี้ไล่ทีละไตรมาส —
// ทดสอบนี้ยืนยันแค่ไตรมาสเดียว (Q1) แล้วไล่ stepper 4 เฟสของไตรมาสนั้นให้ครบ
//
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//   CHROME_PATH=<เบราว์เซอร์> node maintainance-yearly/test/verify-proc-steps.js
// CHROME_PATH ตั้งต้นชี้ Google Chrome — ถ้าเครื่องไม่มี ใช้ chromium ของ playwright แทนได้:
//   ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell
const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8123/maintainance-yearly';
const PLAN = 'plan-seed-2569-002';
const TAB_TRAVEL = `[onclick="goPhase('travel')"]`;
const TAB_PROC   = `[onclick="goPhase('procurement')"]`;

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
  const subLabels = () => page.locator('.wsteps.sm .wstep .lbl').allTextContents();

  await page.goto(`${BASE}/index.html#${PLAN}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.wsteps');

  console.log('stepper หลักของแผน — เหลือ 2 เฟส (4 เฟสท้ายย้ายไปเป็นของไตรมาสแล้ว — 28 ส.ค. 2569)');
  const phases = await page.locator('#stepper .wstep .lbl').allTextContents();
  console.log('   ', phases.join(' → '));
  ok(phases[0] === 'เบิก/จัดหา', 'เฟส 1 = เบิก/จัดหา');
  ok(phases[1] === 'แผนเดินทาง', 'เฟส 2 = แผนเดินทาง');
  ok(phases.length === 2, `มี 2 เฟส (ได้ ${phases.length})`);

  console.log('\nเฟส 1 มี 2 ขั้น: ยืนยันรถ → เบิกอะไหล่');
  let subs = await subLabels();
  console.log('   ', subs.join(' → '));
  ok(subs.length === 2 && subs[0] === 'ยืนยันรถเข้าร่วมแผน' && subs[1] === 'เบิก/จัดหาอะไหล่',
    'ขั้นของเฟส 1 ถูกต้อง');
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ยืนยันรถ' }).count() > 0, 'เปิดมาอยู่ขั้นที่ 1');

  console.log('\ngate ระดับขั้น: ยังยืนยันรถไม่ครบ → ข้ามไปขั้นเบิกไม่ได้');
  await page.locator('[onclick="goProcSub(2)"]').click(); await page.waitForTimeout(300);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ยืนยันรถ' }).count() > 0, 'ยังค้างที่ขั้น 1');
  ok(await page.locator('.toast.show').count() > 0, 'มี toast บอกว่าต้องทำขั้นก่อนหน้าก่อน');

  console.log('\ngate ระดับเฟส: เฟส 1 ยังไม่จบ → เข้าเฟส 2 ไม่ได้');
  // แผนตัวอย่างนี้ partsRequisitioned=true อยู่แล้ว แต่ยังยืนยันรถไม่ครบ ⇒ ต้องยังเข้าเฟส 2 ไม่ได้
  await page.locator(TAB_TRAVEL).click(); await page.waitForTimeout(300);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ยืนยันรถ' }).count() > 0, 'ยังค้างอยู่เฟส 1');

  // ผ่านขั้นยืนยันรถ + ล้างธงเบิกอะไหล่ เพื่อไล่ขั้นที่ 2 จริง
  await page.evaluate((planId) => {
    const p = MYD.getPlan(planId);
    (p.selectedVehicleIds || []).forEach(id => {
      const e = MYD.vehicleConfirm(p, id);
      if (!(e.answer === 'ready' || e.verdict)) {
        p.confirm.byVehicle[id] = { ...MYD.emptyConfirmEntry(), ...e, verdict: 'keep', verdictWhy: 'ตั้งต้นเทส', verdictAt: 'x' };
      }
    });
    p.partsRequisitioned = false;
    MYD.savePlan(p);
  }, PLAN);
  await page.reload(); await page.waitForSelector('.wsteps');

  console.log('\nเฟส 1 · ขั้นที่ 2 = เบิก/จัดหาอะไหล่');
  await page.locator('[onclick="goProcSub(2)"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 2: เบิก/จัดหาอะไหล่' }).count() > 0, 'เข้าขั้นเบิกอะไหล่ได้');
  ok(await page.locator('#btnPrimaryProc').isDisabled(), 'ยังไม่ส่งคำขอ → ปุ่มหลักปิด');
  ok((await page.locator('#btnPrimaryProc').textContent()).includes('ไปเฟสถัดไป'),
    'ปุ่มท้ายเฟส 1 = "ไปเฟสถัดไป" (ไม่ใช่ "ยืนยันแผนเดินทาง")');
  await page.locator('#btnRequisition').click(); await page.waitForTimeout(400);
  ok(await page.locator('.badge', { hasText: 'ส่งคำขอแล้ว' }).count() > 0, 'ส่งคำขอเบิกแล้ว');
  ok(!(await page.locator('#btnPrimaryProc').isDisabled()), 'ส่งคำขอแล้ว → ปุ่มหลักเปิด');

  console.log('\nเฟส 2 · ขั้นที่ 1 = ทำแผนเดินทาง (shell ไม่มีปุ่ม ย้อนกลับ/ถัดไป แล้ว — 28 ส.ค. 2569)');
  await page.locator('#btnPrimaryProc').click(); await page.waitForTimeout(500);
  subs = await subLabels();
  console.log('   ', subs.join(' → '));
  ok(subs.length === 2 && subs[0] === 'แผนเดินทาง' && subs[1] === 'ทวน + ยืนยัน', 'ขั้นของเฟส 2 ถูกต้อง');
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ทำแผนเดินทาง' }).count() > 0, 'ปุ่มท้ายเฟส 1 พาเข้าเฟส 2 จริง');
  ok(await page.locator('#btnPrimaryProc').count() === 0, 'เฟสแผนเดินทางไม่มีปุ่ม "ถัดไป" ของ shell');
  ok(await page.locator('#btnBackProc').count() === 0, 'และไม่มีปุ่ม "ย้อนกลับ" ของ shell เช่นกัน');

  console.log('\nสลับไปขั้น "ทวน + ยืนยัน" ได้ทันที แม้ยังไม่มีใบเดินทางเลย (ตัดเกณฑ์ครบไตรมาสออกแล้ว)');
  await page.locator('[onclick="goProcSub(2)"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 2: ทวนแผนเดินทาง + ยืนยัน' }).count() > 0,
    'ไปขั้นทวนได้เลยโดยไม่ต้องทำแผนเดินทางให้ครบก่อน');
  ok(await page.locator('[data-confirm-q]').count() === 0,
    'ยังไม่มีไตรมาสไหนพร้อม (quarterTravelReady) → ยังไม่มีปุ่ม "ยืนยัน<ไตรมาส>" ให้กด');
  await page.locator('[onclick="goProcSub(1)"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ทำแผนเดินทาง' }).count() > 0, 'กลับมาขั้น 1 ได้อิสระเหมือนกัน');

  console.log('\nรายการไตรมาสท้ายเฟส "แผนเดินทาง" — ยังไม่มีไตรมาสไหนยืนยัน จึงเปิดดำเนินการไม่ได้สักไตรมาส');
  ok(await page.locator('.sect', { hasText: 'รายการไตรมาส' }).count() > 0, 'มีการ์ดรายการไตรมาส');
  ok(await page.locator('a', { hasText: 'เปิดดำเนินการ' }).count() === 0,
    'ยังไม่มีลิงก์ "เปิดดำเนินการ" ที่กดได้เลยสักไตรมาส (ทุกไตรมาสเป็นปุ่ม disabled)');

  // ทำแผนเดินทางให้ครบทุกไตรมาสมีรถอยู่ในใบเดียวกัน (ใบเดียวครอบคลุมทุกไตรมาส) — ให้ทุกไตรมาส "พร้อม" พร้อมกัน
  await page.evaluate((planId) => {
    const p = MYD.getPlan(planId), m = MYD.loadMaster();
    MYD.ensurePlanQuarters(p); MYD.ensureTrips(p);
    const un = MYD.unassignedVehicleIds(p);
    const t = MYD.emptyTrip('trip-all', 'ใบรวมทดสอบ');
    t.location = 'จุดรวมงานทดสอบ'; t.windowFrom = '2568-11-04'; t.windowTo = '2568-11-08';
    t.vehicleIds = un; t.sentAt = 'x';
    t.replies = {}; MYD.tripDepts(t, m).forEach(d => { t.replies[d] = { status: 'accepted', reason: '', by: 'x', at: 'x', history: [] }; });
    p.trips = [t]; MYD.savePlan(p);
  }, PLAN);
  await page.reload(); await page.waitForSelector('.wsteps');
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ทำแผนเดินทาง' }).count() > 0, 'รีโหลดแล้วยังอยู่เฟส 2 (plan.phase ถูกบันทึก)');

  console.log('\nเฟส 2 · ขั้นที่ 2 = ทวน + ยืนยัน — ยืนยันไตรมาสเดียว (Q1) แล้วพาเข้าหน้าไตรมาสนั้นตรงๆ');
  await page.locator('[onclick="goProcSub(2)"]').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 2: ทวนแผนเดินทาง + ยืนยัน' }).count() > 0, 'เข้าขั้นทวนได้');
  ok(await page.locator('[data-confirm-q="Q1"]').count() > 0, 'มีปุ่ม "ยืนยันไตรมาส 1" ให้กด (ไตรมาสนี้พร้อมแล้ว)');

  await page.locator('[data-confirm-q="Q1"]').click();
  await page.waitForTimeout(600);
  ok(page.url().endsWith(`${PLAN}/Q1`), `กดยืนยันไตรมาส 1 แล้วพาเข้าหน้าไตรมาสนั้นตรงๆ (URL: ${page.url()})`);

  console.log('\nหน้าไตรมาส — stepper แยกต่างหาก 4 เฟส เห็นแค่รถของไตรมาสนี้');
  const qPhases = await page.locator('#stepper .wstep .lbl').allTextContents();
  console.log('   ', qPhases.join(' → '));
  ok(qPhases.length === 4 && qPhases[0] === 'ตรวจสภาพก่อนซ่อม' && qPhases[1] === 'ดำเนินการบำรุงรักษา'
    && qPhases[2] === 'จัดทำรายงาน' && qPhases[3] === 'คำนวณต้นทุน', '4 เฟสของไตรมาสถูกต้อง');
  ok(await page.locator('.cur', { hasText: 'ไตรมาส 1' }).count() > 0, 'crumbs บอกว่าอยู่ไตรมาส 1');

  console.log('\nเปิดใบตรวจของคันแรก + กด "เสร็จสิ้น" (ปุ่มเดียวจบ ข้ามไปขั้นถัดไปทันทีแม้ยังตรวจไม่ครบทุกคัน — ของเดิม)');
  // ⚠️ ต้องมิวเทตตัวแปร PLAN ที่หน้ากำลังใช้อยู่ตรงๆ (global let ไม่ได้ห่อ IIFE เหมือน trip-plan.js) ไม่ใช่
  // MYD.getPlan(id) ซึ่งอ่านสำเนาใหม่จาก localStorage ทุกครั้ง — เคยพลาดมาแล้ว: sav ต่อไปของหน้าจากตัวแปร
  // PLAN เดิมจะเขียนทับสำเนาที่เพิ่งแก้ทิ้งเงียบๆ ทำให้ signedDeliverAt/signedReceiveAt หายไป
  await page.evaluate(() => {
    MYD.planVehicleIds(PLAN, 'Q1').forEach(id => {
      const f = MYD.ensureInspection(PLAN, id);
      f.signedDeliverAt = 'x'; f.signedReceiveAt = 'x';
    });
    MYD.savePlan(PLAN);
  });
  await page.locator('[data-insp-open]').first().click();
  await page.waitForTimeout(300);
  await page.locator('#btnInspDone').click();
  await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ดำเนินการบำรุงรักษา' }).count() > 0,
    'ตรวจคันแรกเสร็จ → ข้ามไปขั้นดำเนินการบำรุงรักษาอัตโนมัติ');
  ok((await page.locator('.wsteps .wstep').first().getAttribute('class') || '').includes('passed'),
    'ขั้นตรวจสภาพก่อนซ่อมของไตรมาสนี้ขึ้น passed แล้ว');

  console.log('\nไล่ต่อ: ดำเนินการบำรุงรักษา → จัดทำรายงาน → คำนวณต้นทุน');
  await page.locator('#btnMaintShowAll').click().catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('#btnPhaseNext').click();
  await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'จัดทำรายงาน' }).count() > 0, 'ไปขั้นจัดทำรายงานได้');
  await page.locator('#btnPhaseNext').click();
  await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'คำนวณต้นทุน' }).count() > 0, 'ไปขั้นคำนวณต้นทุนได้');

  await page.locator('#btnSendCloseQ').click();
  await page.waitForTimeout(300);
  const proceedBtn = page.locator('#inspectWarnProceed');
  if (await proceedBtn.count()) { await proceedBtn.click(); await page.waitForTimeout(300); }
  ok(await page.locator('.note', { hasText: 'ส่งอนุมัติปิดแผน' }).count() > 0, 'ส่งอนุมัติปิดแผนไตรมาส 1 แล้ว');
  const qStepClasses = await page.locator('.wsteps .wstep').evaluateAll(els => els.map(e => e.className));
  ok(qStepClasses.every(c => c.includes('passed')), `ทั้ง 4 เฟสของไตรมาส 1 ผ่านหมดแล้ว (${qStepClasses.join(' | ')})`);

  console.log('\nกลับหน้าแผน — รายการไตรมาสต้องเห็นไตรมาส 1 ดำเนินการครบแล้ว + เปิดดำเนินการซ้ำได้');
  await page.locator('a', { hasText: 'กลับไปหน้าแผน' }).click();
  await page.waitForTimeout(400);
  ok(page.url().endsWith(`#${PLAN}`), 'กลับมาที่หน้าแผน (ไม่ใช่หน้าไตรมาสแล้ว)');
  await page.locator(TAB_TRAVEL).click(); await page.waitForTimeout(400);
  ok(await page.locator('tr', { hasText: 'ไตรมาส 1' }).locator('.badge', { hasText: 'ดำเนินการครบแล้ว' }).count() > 0,
    'แถวไตรมาส 1 ในรายการไตรมาสขึ้นว่าดำเนินการครบแล้ว');
  ok(await page.locator('tr', { hasText: 'ไตรมาส 1' }).locator('a', { hasText: 'เปิดดำเนินการ' }).count() > 0,
    'ยังกดเปิดดำเนินการซ้ำเพื่อย้อนดูได้');

  console.log('\nถอยกลับดูเฟส 1 ของแผนได้ตามปกติ');
  await page.locator(TAB_PROC).click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ยืนยันรถ' }).count() > 0, 'กลับเฟส 1 แล้วเริ่มที่ขั้น 1');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
