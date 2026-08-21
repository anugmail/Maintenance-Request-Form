// แยก "เบิก/จัดหา" (เฟส 1) กับ "แผนเดินทาง" (เฟส 2) ออกจากกัน — เจ้าของงานสั่ง 21 ส.ค. 2569
// ไล่ทั้งสองเฟสด้วยการคลิกจริง + เช็ค gate ทั้งระดับเฟส (stepper บน) และระดับขั้น (wizard ย่อย)
// รันจากรากโปรเจกต์ (playwright-core ไม่ได้อยู่ใน repo — ชี้ผ่าน NODE_PATH):
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules node maintainance-yearly/test/verify-proc-steps.js
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

  console.log('stepper หลัก — 6 เฟส · เบิก/จัดหา กับ แผนเดินทาง แยกกันแล้ว');
  const phases = await page.locator('#stepper .wstep .lbl').allTextContents();
  console.log('   ', phases.join(' → '));
  ok(phases[0] === 'เบิก/จัดหา',          'เฟส 1 = เบิก/จัดหา');
  ok(phases[1] === 'แผนเดินทาง',          'เฟส 2 = แผนเดินทาง');
  ok(phases[2] === 'ตรวจสภาพก่อนซ่อม',    'เฟส 3 = ตรวจสภาพก่อนซ่อม');
  ok(phases[3] === 'ดำเนินการบำรุงรักษา', 'เฟส 4 = ดำเนินการบำรุงรักษา');
  ok(phases[4] === 'จัดทำรายงาน',         'เฟส 5 = จัดทำรายงาน');
  ok(phases[5] === 'คำนวณต้นทุน',         'เฟส 6 = คำนวณต้นทุน');
  ok(phases.length === 6, `มี 6 เฟส (ได้ ${phases.length})`);

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

  console.log('\nเฟส 2 · ขั้นที่ 1 = ทำแผนเดินทาง');
  await page.locator('#btnPrimaryProc').click(); await page.waitForTimeout(500);
  subs = await subLabels();
  console.log('   ', subs.join(' → '));
  ok(subs.length === 2 && subs[0] === 'แผนเดินทาง' && subs[1] === 'ทวน + ยืนยัน', 'ขั้นของเฟส 2 ถูกต้อง');
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ทำแผนเดินทาง' }).count() > 0, 'ปุ่มท้ายเฟส 1 พาเข้าเฟส 2 จริง');
  ok(await page.locator('#btnPrimaryProc').isDisabled(), 'ยังไม่มีใบ → ปุ่มหลักปิด');
  ok(await page.locator('.note-warn', { hasText: 'ยังไปขั้นถัดไปไม่ได้' }).count() > 0, 'บอกเหตุผลที่ยังไปต่อไม่ได้');

  // ทำแผนเดินทางให้ครบ + ให้ทุกหน่วยงานตอบรับ
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
  ok(!(await page.locator('#btnPrimaryProc').isDisabled()), 'จัดรถครบ + ตอบรับครบ → ปุ่มหลักเปิด');

  console.log('\nเฟส 2 · ขั้นที่ 2 = ทวน + ยืนยัน');
  await page.locator('#btnPrimaryProc').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 2: ทวนแผนเดินทาง + ยืนยัน' }).count() > 0, 'เข้าขั้นทวนได้');
  ok((await page.locator('#btnPrimaryProc').textContent()).includes('ยืนยันแผนเดินทาง'), 'ปุ่มสุดท้าย = ยืนยันแผนเดินทาง');
  await page.locator('#btnPrimaryProc').click(); await page.waitForTimeout(500);
  ok(await page.locator('.sect', { hasText: 'แผนเดินทาง — ยืนยันแล้ว' }).count() > 0, 'ยืนยันแล้ว → หน้าสรุปของเฟส 2');
  ok(await page.locator('#btnGoNextPhaseProc').count() > 0, 'มีปุ่มไปเฟสถัดไป');
  await page.locator('#btnGoNextPhaseProc').click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ตรวจสภาพก่อนซ่อม' }).count() > 0, 'ไปต่อเฟส 3 ตรวจสภาพก่อนซ่อมได้');

  console.log('\nถอยกลับดูของเดิมได้');
  await page.locator(TAB_PROC).click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'ขั้นที่ 1: ยืนยันรถ' }).count() > 0, 'กลับเฟส 1 แล้วเริ่มที่ขั้น 1');
  await page.locator(TAB_TRAVEL).click(); await page.waitForTimeout(400);
  ok(await page.locator('.sect', { hasText: 'แผนเดินทาง — ยืนยันแล้ว' }).count() > 0, 'กลับเฟส 2 เห็นสรุปที่ยืนยันแล้ว');

  console.log('\npageerror:', errors.length ? errors.join(' | ') : '(ไม่มี)');
  ok(errors.length === 0, 'ไม่มี pageerror');
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
