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
  await page.locator('label', { hasText: 'ส่งเรื่องให้ กรย.' }).first().click();
  eq('เส้น กรย. ไม่มีช่องแนบไฟล์', await page.locator('#self-doc-wrap:not(.hidden)').count(), 0);
  await page.locator('label', { hasText: 'ดำเนินการซ่อมเอง' }).first().click();
  // ---- แนบไฟล์เฉพาะเส้น "ซ่อมเอง" — รูป JPG/PNG หรือ PDF (8 ก.ย. 2569) ----
  eq('เลือกซ่อมเอง → มีช่องแนบไฟล์', await page.locator('#self-doc-wrap:not(.hidden)').count(), 1);
  await page.setInputFiles('#self-doc-file', [
    { name: 'ใบเสนอราคา.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') },
    { name: 'รูปหน้างาน.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0, 0]) },
  ]);
  await page.waitForTimeout(250);
  eq('แนบ PDF + JPG ได้ 2 ไฟล์', await page.locator('#self-docs .file-chip').count(), 2);
  ok('ไอคอนแยกชนิดไฟล์ (pdf/รูป)',
    (await page.locator('#self-docs .file-chip > .ms').allTextContents()).join('|') === 'picture_as_pdf|image');
  await page.setInputFiles('#self-doc-file', [{ name: 'ห้าม.txt', mimeType: 'text/plain', buffer: Buffer.from('x') }]);
  await page.waitForTimeout(250);
  eq('ชนิดอื่นแนบไม่ได้ (ยังเหลือ 2 ไฟล์)', await page.locator('#self-docs .file-chip').count(), 2);
  await page.locator('#self-docs .file-chip-rm').first().click();
  await page.waitForTimeout(200);
  eq('ลบไฟล์แนบทีละอันได้', await page.locator('#self-docs .file-chip').count(), 1);
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

  // ---- ขั้น 2: อาการเสีย + รายละเอียดเหตุการณ์ อยู่ขั้นเดียวกัน (รวม 8 ก.ย. 2569) ----
  await page.waitForSelector('#s2:not(.hidden)');
  ok('หัวขั้น 2 = อาการเสียและรายละเอียดเหตุการณ์',
    /ขั้นที่ 2: อาการเสียและรายละเอียดเหตุการณ์ \(2\/3\)/.test(await page.locator('#rm-step').textContent()));
  ok('อาการเสียกับรายละเอียดเหตุการณ์แสดงพร้อมกันในขั้นเดียว',
    await page.locator('#s2:not(.hidden)').count() === 1 && await page.locator('#sinfo:not(.hidden)').count() === 1);
  eq('แบ่งเป็น 2 บล็อกด้วยหัวข้อของ design system', await page.locator('#s2 .incident-section-title, #sinfo .incident-section-title').count(), 2);
  ok('อาการเสียมาก่อนรายละเอียดเหตุการณ์',
    await page.evaluate(() => document.getElementById('s2').compareDocumentPosition(document.getElementById('sinfo')) === 4));
  ok('มีช่องเลขไมล์ + ชั่วโมงเครื่องจักร', await page.locator('#i-odo').isVisible() && await page.locator('#i-crane').isVisible());
  eq('ไม่มีช่องจังหวัด/ผู้ติดต่อแล้ว', await page.locator('#i-prov, #i-owntel').count(), 0);
  eq('เลือก 2 จุด → หัวกลุ่มอาการ 2 กลุ่ม', await page.locator('#symcats .symgroup-head').count(), 2);
  await page.locator('#symcats .chks label').first().click();
  await page.locator('#symcats .chks label', { hasText: 'กระบอกไฮดรอลิกรั่ว' }).click();
  await page.fill('#i-odo', '84120');
  await page.locator('.addph', { hasText: 'รูปตัวอย่าง' }).click();
  await page.locator('#next').click();

  // ---- ขั้น 3 (สุดท้าย): อะไหล่ที่แนะนำ → ส่งอนุมัติ ----
  await page.waitForSelector('#parts-rec .parts-rec-item');
  ok('มีรายการอะไหล่แนะนำจากอาการ', await page.locator('#parts-rec .parts-rec-item').count() >= 2);
  ok('ทุกรายการติดป้าย "แนะนำ"',
    await page.locator('#parts-rec .parts-rec-item .badge').count() === await page.locator('#parts-rec .parts-rec-item').count());
  await page.locator('#parts-rec .parts-rec-item .qty button').nth(1).click();   // + รายการแรก
  const sumAll = await page.locator('#p-sum-all').textContent();
  ok('ยอดรวมค่าอะไหล่ขยับ', /[1-9]/.test(sumAll), `ได้ "${sumAll}"`);
  const nRec = await page.locator('#parts-rec .parts-rec-item').count();
  await page.locator('#parts-rec .parts-rec-item .pr-del').last().click();
  eq('ถังขยะเอารายการออกจากลิสต์ได้', await page.locator('#parts-rec .parts-rec-item').count(), nRec - 1);
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
  eq('หน้าอนุมัติเห็นไฟล์แนบจากผู้แจ้ง', await page.locator('#bossdetail .file-chip').count(), 1);
  ok('ปุ่ม ไม่อนุมัติ/อนุมัติ อยู่ด้านบน',
    await page.locator('#bossdetail .incident-actions .btn-td').isVisible()
    && await page.locator('#bossdetail .incident-actions .btn-p').isVisible());
  ok('อาการแสดงผูกจุด (ตัวรถ — … · เครน — …)',
    /ตัวรถ —/.test(await page.locator('#bossdetail').textContent()));
  eq('ช่องทางการซ่อมเลือกได้ 2 ทาง (ซ่อมเอง/ส่งต่อ กรย.)',
    await page.locator('#bossdetail .radcard').count(), 2);
  // 7 ก.ย. 2569 (คำสั่งล่าสุด): อะไหล่ที่เลือกไว้เป็นตาราง + สรุปเบิกคลัง (ดีไซน์ตารางตามภาพ) — อ่านอย่างเดียว
  eq('ไม่มี section อะไหล่ที่แนะนำ', await page.locator('#bossdetail .incident-section-title', { hasText: 'อะไหล่ที่แนะนำ' }).count(), 0);
  ok('อะไหล่ที่เลือกไว้: หัวมีป้าย "แนะนำ" + แถวแบน + แถวรวมทั้งหมด',
    /แนะนำ/.test(await page.locator('#bossdetail .incident-section-title', { hasText: 'อะไหล่ที่ผู้แจ้งเลือกไว้' }).textContent())
    && await page.locator('#bossdetail .parts-flat .pf-row').count() >= 2
    && /รวมทั้งหมด/.test(await page.locator('#bossdetail .parts-flat').textContent()));
  eq('ฝั่งผู้อนุมัติไม่มีตัวปรับจำนวน/ถังขยะ', await page.locator('#bossdetail .qty, #bossdetail .pr-del').count(), 0);
  // ---- แท็บประวัติการดำเนินการ = ตารางประวัติการซ่อม (สเปกภาพ 7 ก.ย. 2569) ----
  await page.locator('#bossdetail .tab-btn', { hasText: 'ประวัติการดำเนินการ' }).click();
  eq('ตารางประวัติการซ่อม 5 แถวตามสเปกภาพ', await page.locator('#bosshist tbody tr').count(), 5);
  ok('มีหัวเรียงได้ + แถบท้าย แสดง 1 ถึง 5', await page.locator('#bosshist th.sortable').count() === 1
    && /แสดง 1 ถึง 5 จาก 5 รายการ/.test(await page.locator('#bosshist').textContent()));
  await page.locator('#bosshist th.sortable button').click();
  ok('กดหัวคอลัมน์แล้วสลับทิศเรียง', /VMS001234/.test(await page.locator('#bosshist tbody tr').first().textContent()));
  await page.locator('#bossdetail .tab-btn', { hasText: 'ข้อมูลการซ่อม' }).click();
  // ---- แก้ไขงบที่ตัด (7 ก.ย. 2569) ----
  await page.locator('#bossdetail button', { hasText: 'แก้ไข' }).click();
  await page.waitForSelector('#boss-budget-modal:not(.hidden)');
  await page.selectOption('#bb-costsel', '1');
  await page.fill('#bb-costfields input', 'B0007777');
  await page.locator('#boss-budget-modal .btn-p', { hasText: 'บันทึก' }).click();
  await page.waitForSelector('#boss-budget-modal.hidden', { state: 'attached' });
  ok('หัวหน้าแก้งบที่ตัดได้ (ค่าอัปเดต + ลงประวัติ)',
    /งบประจำหน่วยงาน.*B0007777/.test(await page.locator('#bossdetail .incident-field', { hasText: 'งบที่ตัด' }).textContent()));

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

  console.log('\n────── หน้า กรย. — โครงเดียวกับหน้าอนุมัติ (8 ก.ย. 2569) ──────');
  await page.locator('#nav-kry').click();
  await page.waitForSelector('#krylist table.tbl tbody tr');
  await page.locator('#krylist tbody tr', { hasText: docno }).locator('.dt-action .btn').click();
  await page.waitForSelector('#krydetail .incident-head');
  eq('หัวข้อ + ป้ายสถานะ + ปุ่มบนขวา (โครงเดียวกับหน้าอนุมัติ)',
    (await page.locator('#krydetail .incident-actions .btn').allTextContents()).map(t => t.trim()).join('|'),
    'ตีกลับ|ยืนยันคัดแยก');
  eq('มีแท็บ 2 แท็บ', await page.locator('#krydetail .tab-btn').count(), 2);
  eq('คอลัมน์ซ้ายเริ่มที่บล็อกคัดแยกช่องทาง',
    (await page.locator('#ktab0 .incident-layout > div:first-child .incident-section-title').first().textContent()).trim(),
    'คัดแยกช่องทางซ่อม — กรย.');
  eq('คอลัมน์ขวามี 3 บล็อก (ยานพาหนะ/ผู้แจ้งเหตุ/ติดต่อ)',
    await page.locator('#ktab0 .incident-layout > div:last-child .incident-section').count(), 3);
  ok('ยังไม่เลือกช่องทาง → ปุ่มยืนยันคัดแยกปิดอยู่',
    await page.locator('#krydetail .incident-actions .btn-p').isDisabled());
  await page.locator('#krydetail .radcard', { hasText: 'ซ่อมที่อู่' }).click();
  await page.waitForTimeout(300);
  ok('เลือกช่องทางแล้วปุ่มยืนยันเปิด', !(await page.locator('#krydetail .incident-actions .btn-p').isDisabled()));
  ok('เส้นซ่อมที่อู่มีช่องบันทึก + รายการอู่แนะนำ',
    await page.locator('#krynote').count() === 1 && await page.locator('.garage').count() > 0);
  await page.locator('#krydetail .tab-btn').nth(1).click();
  await page.waitForTimeout(200);
  ok('แท็บประวัติมี timeline', await page.locator('#ktab1 .tl li').count() > 0);
  await page.locator('#krydetail .tab-btn').nth(0).click();
  await page.waitForTimeout(200);

  console.log('\n────── กรย. ตีกลับ (บังคับกรอกเหตุผล) ──────');
  await page.locator('#krydetail .btn-td').click();
  await page.waitForSelector('#kry-return-modal:not(.hidden)');
  ok('ยังไม่กรอกเหตุผล → ปุ่มยืนยันปิด', await page.locator('#kry-return-ok').isDisabled());
  await page.fill('#kry-reason', 'ข้อมูลไม่พอ ขอรายละเอียดเพิ่ม');
  await page.waitForTimeout(150);
  await page.locator('#kry-return-ok').click();
  await page.waitForTimeout(500);
  ok('ตีกลับแล้วกลับมาที่ลิสต์ กรย.', await page.locator('#view-kry:not(.hidden)').count() === 1);
  await page.locator('#nav-my').click();
  await page.waitForSelector('#mylist table.tbl tbody tr');
  ok('ใบกลับไปอยู่ที่ผู้แจ้ง ป้ายบอกว่า "กรย. ตีกลับ" (ไม่ใช่ "ไม่อนุมัติ" ของหัวหน้า)',
    await page.locator('#mylist tbody tr', { hasText: docno }).locator('.badge', { hasText: 'กรย. ตีกลับ' }).count() === 1);

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
