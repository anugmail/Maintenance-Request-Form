#!/usr/bin/env node
/* ============================================================================
   Regression test ของโฟลว์แจ้งซ่อม — ขับ Chrome จริงด้วย playwright-core
   ----------------------------------------------------------------------------
   ทำไมต้องมี: 1–2 ก.ย. 2569 แก้ UI ติดกัน 6 เวอร์ชัน (ds41→ds46) แล้วจับผิดด้วยตาล้วน
   จน stepper ผิด 3 รอบติด ⇒ ต้องมีของรันก่อนส่งงานทุกครั้ง

   7 ก.ย. 2569: ปรับตามสเปกภาพชุดเต็มที่เจ้าของงานส่ง — modal 4 ขั้น
   (①ข้อมูลยานพาหนะและผู้แจ้ง = dropdown รถ + สถานะรถ + รูปแบบการซ่อม + จุดที่แจ้ง
    + งบ dropdown + ผู้แจ้งเหตุ · ②ไมล์/ชั่วโมงเครื่องจักร/รูป/หมายเหตุ · ③อาการเสีย ·
    ④อะไหล่ที่แนะนำ → ส่งอนุมัติ) · ผู้อนุมัติ = หัวหน้าหน่วยงานอัตโนมัติ ·
   ฝั่งผู้อนุมัติ: รายการอนุมัติ → รายละเอียดแบบหน้าเหตุการณ์ → modal ไม่อนุมัติ/ยืนยันอนุมัติ

   ตรวจ 2 ชั้น
     A/B. โฟลว์ — ผู้แจ้งส่งอนุมัติ + ผู้อนุมัติอนุมัติผ่าน modal แล้วใบหายจากรายการ
     C.   ดีไซน์ — วัดค่าคอมโพเนนต์หลักเทียบ "ค่าจริงจากไลบรารี" (Component) VMS Plus

   รัน
     NODE_PATH=<ที่ติดตั้ง playwright-core>/node_modules node mock/test/flow-regression.js
     BASE=http://127.0.0.1:8123 CHROME="/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome"
   ============================================================================ */
const { chromium } = require('playwright-core');   // CJS เพราะ ESM ไม่อ่าน NODE_PATH

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const URL = `${BASE}/mock/Maintenance-Request-Form.html`;

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
};
const eq = (name, got, want) => ok(name, String(got) === String(want), `ได้ ${got} · ต้องการ ${want}`);

const px = v => Math.round(parseFloat(v));
const rgb = v => v.replace(/\s/g, '');
const HEX = { brand600: 'rgb(168,6,137)', gray300: 'rgb(208,213,221)', white: 'rgb(255,255,255)' };

(async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => errors.push(`REQFAIL ${r.url()} — ${(r.failure() || {}).errorText}`));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  console.log('\n══════ A. โฟลว์แจ้งซ่อม (modal 4 ขั้น) ══════');
  await page.waitForSelector('#mylist table.tbl tbody tr');
  ok('หน้าแรกเปิดที่ตารางจัดการงานซ่อม', await page.locator('#view-my').isVisible());
  ok('modal แจ้งซ่อมยังไม่เปิดเอง', !(await page.locator('#repair-modal').isVisible()));
  eq('แถวไม่มีไอคอนแจ้งซ่อมแล้ว (เข้าจากปุ่มบนเท่านั้น)',
    await page.locator('#mylist .dt-action button[title="แจ้งซ่อมคันนี้"]').count(), 0);

  // ---- เปิด modal จากปุ่ม "แจ้งซ่อม" ----
  await page.locator('.lt-actions .btn-p', { hasText: 'แจ้งซ่อม' }).click();
  await page.waitForSelector('#repair-modal:not(.hidden)');
  ok('หัวขั้น = ข้อมูลยานพาหนะและผู้แจ้ง',
    /ขั้นที่ 1: ข้อมูลยานพาหนะและผู้แจ้ง/.test(await page.locator('#rm-step').textContent()));
  ok('มี dropdown ยานพาหนะ', await page.locator('#v-select').isVisible());
  eq('ยังไม่เลือกรถ → ไม่มีกล่องสรุป/จุดที่แจ้ง', await page.locator('#vinfo:not(.hidden)').count(), 0);

  // ---- ขั้น 1: เลือกรถ + สถานะ + รูปแบบ + จุด + งบ ----
  await page.selectOption('#v-select', '1');           // 81-2345 มีเครน
  await page.waitForSelector('#vsum .incident-field');
  ok('กล่องสรุปรถขึ้น (ทะเบียน/จังหวัด/ผู้ขับขี่/ช่างคุมรถ)',
    await page.locator('#vsum .incident-field').count() === 4);
  await page.locator('input[name="r-usable"]').first().check();
  await page.locator('label', { hasText: 'ดำเนินการซ่อมเอง' }).first().click();
  eq('จุดที่แจ้งเป็น checkbox 2 ตัว (ตัวรถ+เครน)', await page.locator('#target-chks label').count(), 2);
  await page.locator('#target-chks label', { hasText: 'ตัวรถ' }).click();
  await page.locator('#target-chks label', { hasText: 'เครน' }).click();
  // งบ 4 แบบ + ช่องกรอกตามแบบ
  eq('งบที่ตัดเป็น dropdown 4 แบบ', await page.locator('#i-costsel option:not([disabled])').count(), 4);
  await page.selectOption('#i-costsel', '1');
  eq('งบประจำหน่วยงาน → 1 ช่อง (ศูนย์ต้นทุน)', await page.locator('#i-costfields .f').count(), 1);
  await page.selectOption('#i-costsel', '3');
  eq('งบโครงการ WBS → 3 ช่อง', await page.locator('#i-costfields .f').count(), 3);
  ok('hint บอกช่องที่ต้องระบุ', /ต้องระบุ/.test(await page.locator('#i-costhint').textContent()));
  ok('ผู้แจ้งเหตุ default พนักงาน กฟภ.', /วิทยา/.test(await page.locator('#i-reporter').textContent()));
  await page.locator('#next').click();

  // ---- ขั้น 2: ไมล์/ชั่วโมง/รูป/หมายเหตุ (สถานที่เกิดเหตุ+รายละเอียดถูกตัด) ----
  await page.waitForSelector('#sinfo:not(.hidden)');
  ok('หัวขั้น 2 = รายละเอียดเหตุการณ์ และสถานที่', /ขั้นที่ 2/.test(await page.locator('#rm-step').textContent()));
  ok('มีช่องเลขไมล์ + ชั่วโมงเครื่องจักร', await page.locator('#i-odo').isVisible() && await page.locator('#i-crane').isVisible());
  eq('ไม่มีช่องจังหวัด/ผู้ติดต่อแล้ว', await page.locator('#i-prov, #i-owntel').count(), 0);
  await page.fill('#i-odo', '84120');
  await page.locator('.addph', { hasText: 'รูปตัวอย่าง' }).click();
  await page.locator('#next').click();

  // ---- ขั้น 3: อาการเสีย แยกกลุ่มตามจุด ----
  await page.waitForSelector('#symcats .chks label');
  eq('เลือก 2 จุด → หัวกลุ่ม 2 กลุ่ม', await page.locator('#symcats .symgroup-head').count(), 2);
  await page.locator('#symcats .chks label').first().click();
  await page.locator('#symcats .chks label', { hasText: 'กระบอกไฮดรอลิกรั่ว' }).click();
  await page.locator('#next').click();

  // ---- ขั้น 4: อะไหล่ที่แนะนำ → ส่งอนุมัติ ----
  await page.waitForSelector('#parts-rec .parts-rec-item');
  ok('มีรายการอะไหล่แนะนำจากอาการ', await page.locator('#parts-rec .parts-rec-item').count() >= 2);
  ok('ทุกรายการติดป้าย "แนะนำ"',
    await page.locator('#parts-rec .parts-rec-item .badge').count() === await page.locator('#parts-rec .parts-rec-item').count());
  await page.locator('#parts-rec .parts-rec-item .qty button').nth(1).click();   // + รายการแรก
  const sumAll = await page.locator('#p-sum-all').textContent();
  ok('ยอดรวมค่าอะไหล่ขยับ', /[1-9]/.test(sumAll), `ได้ "${sumAll}"`);
  eq('ปุ่มขั้นสุดท้าย = ส่งอนุมัติ', (await page.locator('#next').textContent()).trim(), 'ส่งอนุมัติ');
  await page.locator('#next').click();

  // ---- ส่งแล้ว: modal ปิด + ใบเข้าลิสต์สถานะใหม่ ----
  await page.waitForSelector('#repair-modal.hidden', { state: 'attached' });
  await page.waitForSelector('#mylist table.tbl tbody tr');
  const newRows = await page.locator('#mylist tbody tr', { hasText: 'รอหัวหน้าหน่วยงานอนุมัติ' }).count();
  ok('ใบใหม่อยู่ในตาราง สถานะ "รอหัวหน้าหน่วยงานอนุมัติ"', newRows >= 1, `เจอ ${newRows}`);
  const docno = (await page.locator('#mylist tbody tr', { hasText: 'รอหัวหน้าหน่วยงานอนุมัติ' }).first()
    .locator('.cell-key').textContent()).trim();

  console.log('\n══════ B. ฝั่งผู้อนุมัติ (หัวหน้าหน่วยงาน) ══════');
  await page.locator('#nav-boss').click();
  await page.waitForSelector('#bosslist table.tbl tbody tr');
  ok('หัวหน้าเห็นหน้ารวมแบบเดียวกัน (รายการอนุมัติ)', /รายการอนุมัติ/.test(await page.locator('#view-boss .page-title').first().textContent()));
  ok('ใบที่เพิ่งส่งอยู่ในรายการอนุมัติ', await page.locator('#bosslist tbody tr', { hasText: docno }).count() === 1);

  // ---- เปิดรายละเอียด ----
  await page.locator('#bosslist tbody tr', { hasText: docno }).locator('.dt-action .btn').click();
  await page.waitForSelector('#bossdetail:not(.hidden) .incident-head');
  ok('รายละเอียดเป็นโครงหน้าเหตุการณ์ (หัวเรื่อง+badge+แท็บ)',
    await page.locator('#bossdetail .tabs .tab-btn').count() === 2);
  ok('ปุ่ม ไม่อนุมัติ/อนุมัติ อยู่ด้านบน',
    await page.locator('#bossdetail .incident-actions .btn-td').isVisible()
    && await page.locator('#bossdetail .incident-actions .btn-p').isVisible());
  ok('อาการแสดงผูกจุด (ตัวรถ — … · เครน — …)',
    /ตัวรถ —/.test(await page.locator('#bossdetail').textContent()));
  eq('ช่องทางการซ่อมเลือกได้ 2 ทาง (ซ่อมเอง/ส่งต่อ กรย.)',
    await page.locator('#bossdetail .radcard').count(), 2);
  eq('อะไหล่ที่แนะนำ 10 รายการเป็น default', await page.locator('#bossdetail .parts-rec-item').count(), 10);
  // ---- แก้ไขงบที่ตัด (7 ก.ย. 2569) ----
  await page.locator('#bossdetail button', { hasText: 'แก้ไข' }).click();
  await page.waitForSelector('#boss-budget-modal:not(.hidden)');
  await page.selectOption('#bb-costsel', '1');
  await page.fill('#bb-costfields input', 'B0007777');
  await page.locator('#boss-budget-modal .btn-p', { hasText: 'บันทึก' }).click();
  await page.waitForSelector('#boss-budget-modal.hidden', { state: 'attached' });
  ok('หัวหน้าแก้งบที่ตัดได้ (ค่าอัปเดต + ลงประวัติ)',
    /งบประจำหน่วยงาน.*B0007777/.test(await page.locator('#bossdetail .incident-field', { hasText: 'งบที่ตัด' }).textContent()));
  ok('มีทั้งป้าย "แนะนำ" (ตรงอาการ) และ "แนะนำทั่วไป"',
    await page.locator('#bossdetail .parts-rec-item .badge.b-info').count() >= 1
    && await page.locator('#bossdetail .parts-rec-item .badge.b-neutral').count() >= 1);

  // ---- เปลี่ยนช่องทาง ----
  await page.locator('#bossdetail .radcard', { hasText: 'ส่งต่อให้ กรย.' }).click();
  await page.waitForSelector('#bossdetail .radcard.sel');
  ok('หัวหน้าเปลี่ยนช่องทางเป็น ส่งต่อ กรย. ได้',
    await page.locator('#bossdetail .radcard.sel', { hasText: 'ส่งต่อให้ กรย.' }).count() === 1);

  // ---- ไม่อนุมัติ: modal ต้องกรอกเหตุผล ----
  await page.locator('#bossdetail .incident-actions .btn-td').click();
  await page.waitForSelector('#boss-reject-modal:not(.hidden)');
  ok('modal ไม่อนุมัติ: ปุ่มยืนยัน disabled จนกรอกเหตุผล', await page.locator('#boss-reject-ok').isDisabled());
  await page.fill('#boss-reason', 'ทดสอบ');
  ok('กรอกแล้วปุ่มยืนยัน enabled', !(await page.locator('#boss-reject-ok').isDisabled()));
  await page.locator('#boss-reject-modal .btn-s', { hasText: 'ปิด' }).click();   // ไม่ตีกลับจริง

  // ---- อนุมัติ: modal ยืนยัน → ใบหายจากรายการ ----
  await page.locator('#bossdetail .incident-actions .btn-p', { hasText: 'อนุมัติ' }).click();
  await page.waitForSelector('#boss-approve-modal:not(.hidden)');
  ok('modal ยืนยันการอนุมัติขึ้น', /ยืนยันการอนุมัติ/.test(await page.locator('#boss-approve-modal').textContent()));
  await page.locator('#boss-approve-modal .btn-s', { hasText: 'ไม่ใช่ตอนนี้' }).click();
  ok('กด "ไม่ใช่ตอนนี้" แล้ว modal ปิด ใบยังอยู่', !(await page.locator('#boss-approve-modal').isVisible()));
  await page.locator('#bossdetail .incident-actions .btn-p', { hasText: 'อนุมัติ' }).click();
  await page.locator('#boss-approve-modal .btn-p', { hasText: 'อนุมัติคำขอ' }).click();
  await page.waitForSelector('#bosslist:not(.hidden)');
  ok('อนุมัติแล้วกลับหน้ารายการ + toast', await page.locator('#toast.show').count() === 1);
  eq('ใบที่อนุมัติแล้วหายจากรายการอนุมัติ',
    await page.locator('#bosslist tbody tr', { hasText: docno }).count(), 0);
  // ยังเห็นรายละเอียดได้จากเมนูจัดการงานซ่อม (สถานะเดินตามช่องทางที่หัวหน้าเปลี่ยน)
  await page.locator('#nav-my').click();
  await page.waitForSelector('#mylist table.tbl tbody tr');
  ok('ใบเดิมยังเห็นในจัดการงานซ่อม สถานะเดินต่อ (รอ กรย. พิจารณา)',
    await page.locator('#mylist tbody tr', { hasText: docno }).locator('.badge', { hasText: 'รอ กรย. พิจารณา' }).count() === 1);

  console.log('\n══════ C. ค่าดีไซน์เทียบไลบรารี (Component) VMS Plus ══════');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#mylist table.tbl tbody tr');
  await page.locator('.lt-actions .btn-p', { hasText: 'แจ้งซ่อม' }).click();
  await page.waitForSelector('#repair-modal:not(.hidden)');

  const cs = (sel, prop, pseudo = null) => page.evaluate(([s, p, ps]) => {
    const el = document.querySelector(s); if (!el) return null;
    return getComputedStyle(el, ps)[p];
  }, [sel, prop, pseudo]);

  eq('ปุ่ม .btn สูง 40', px(await cs('#next', 'height')), 40);
  eq('ปุ่ม .btn radius 8', px(await cs('#next', 'borderRadius')), 8);
  eq('ปุ่ม .btn-p พื้นสีแบรนด์', rgb(await cs('#next', 'backgroundColor')), HEX.brand600);
  eq('dropdown ยานพาหนะ สูง 40', px(await cs('#v-select', 'height')), 40);
  eq('dropdown ยานพาหนะ radius 8', px(await cs('#v-select', 'borderRadius')), 8);
  eq('dropdown ยานพาหนะ ขอบ gray-300', rgb(await cs('#v-select', 'borderTopColor')), HEX.gray300);
  eq('ปุ่มเมนูข้าง 40px', px(await cs('.side .nv', 'width')), 40);

  // checkbox จุดที่แจ้ง — ไลบรารี Checkbox: 20×20 · r4 · เส้น 2px · อยู่แถวเดียวกับข้อความ
  await page.selectOption('#v-select', '1');
  await page.waitForSelector('#target-chks label');
  eq('กล่องติ๊กจุดที่แจ้ง 20px', px(await cs('#target-chks .cbox', 'width')), 20);
  eq('กล่องติ๊กจุดที่แจ้ง radius 4', px(await cs('#target-chks .cbox', 'borderRadius')), 4);
  eq('กล่องติ๊กจุดที่แจ้ง เส้น 2px', px(await cs('#target-chks .cbox', 'borderTopWidth')), 2);
  // label ใน flex container ถูก blockify: inline-flex → computed 'flex' — สิ่งที่ต้องกันคือ 'block' (.f label ทับ)
  ok('label ติ๊กอยู่แถวเดียว (ไม่โดน .f label ทับเป็น block)', /flex/.test(await cs('#target-chks label', 'display')));

  console.log('\n══════ D. มือถือ (390px) + ไม่มี error ══════');
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#mylist table.tbl tbody tr');
  await page.locator('.lt-actions .btn-p', { hasText: 'แจ้งซ่อม' }).click();
  await page.waitForSelector('#repair-modal:not(.hidden)');
  ok('มือถือ: modal เปิดได้', await page.locator('#repair-modal .modal').isVisible());
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  eq('มือถือ: ไม่ล้นแนวนอน', ov, 0);

  ok('ไม่มี pageerror / console error', errors.length === 0, errors.slice(0, 5).join(' | '));
  if (errors.length) { console.log('  รายละเอียดทั้งหมด:'); errors.forEach(e => console.log('    · ' + e)); }

  await browser.close();
  console.log(`\n${fail === 0 ? '✓ ผ่าน' : '✗ ไม่ผ่าน'} — ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
  process.exit(fail === 0 ? 0 : 1);

})();
