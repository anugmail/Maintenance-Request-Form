#!/usr/bin/env node
/* ============================================================================
   Regression test ของโฟลว์แจ้งซ่อม — ขับ Chrome จริงด้วย playwright-core
   ----------------------------------------------------------------------------
   ทำไมต้องมี: 1–2 ก.ย. 2569 แก้ UI ติดกัน 6 เวอร์ชัน (ds41→ds46) แล้วจับผิดด้วยตาล้วน
   จน stepper ผิด 3 รอบติด ⇒ ต้องมีของรันก่อนส่งงานทุกครั้ง

   4 ก.ย. 2569: ปรับตามโฟลว์ใหม่ที่เจ้าของงานเคาะ — แจ้งซ่อมเป็น modal
   (เข้าจากปุ่ม "แจ้งซ่อมใหม่" หรือไอคอนท้ายแถว) · เลือกรถเป็น dropdown ·
   จุดที่พบปัญหาติ๊กได้หลายจุด · อาการแยกกลุ่มตามจุด

   ตรวจ 2 ชั้น
     A. โฟลว์  — เปิด modal เดินฟอร์มจนส่งเรื่อง แล้วเช็กว่าใบงานเข้าลิสต์จริง
     B. ดีไซน์ — วัดค่าคอมโพเนนต์หลักเทียบ "ค่าจริงจากไลบรารี" (Component) VMS Plus

   ต้องมี
     node figma-export/serve.js  หรือ  python3 -m http.server 8123   (เสิร์ฟที่ราก repo)
     npm i playwright-core  (ไว้ที่ scratchpad แล้วส่ง NODE_PATH เข้ามา)

   รัน
     NODE_PATH=<ที่ติดตั้ง>/node_modules node mock/test/flow-regression.js
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

  console.log('\n══════ A. โฟลว์แจ้งซ่อม (modal) ══════');
  // ---- หน้าแรก = ตารางจัดการงานซ่อม (ไม่ใช่ฟอร์มเต็มหน้าแล้ว) ----
  await page.waitForSelector('#mylist table.tbl tbody tr');
  ok('หน้าแรกเปิดที่ตารางจัดการงานซ่อม', await page.locator('#view-my').isVisible());
  ok('modal แจ้งซ่อมยังไม่เปิดเอง', !(await page.locator('#repair-modal').isVisible()));

  // ---- ปุ่ม "แจ้งซ่อมใหม่" → เปิด modal (dropdown ว่าง) ----
  await page.locator('.lt-actions .btn-p', { hasText: 'แจ้งซ่อมใหม่' }).click();
  await page.waitForSelector('#repair-modal:not(.hidden)');
  ok('กดแจ้งซ่อมใหม่แล้ว modal เปิด', await page.locator('#repair-modal .modal').isVisible());
  ok('ขั้น 1 มี dropdown ยานพาหนะ', await page.locator('#v-select').isVisible());
  ok('หัวขั้นแบบข้อความ "ขั้นที่ 1"', /^ขั้นที่ 1/.test((await page.locator('#rm-step').textContent()).trim()));
  eq('ยังไม่เลือกรถ → ไม่มีการ์ดรายละเอียด', await page.locator('.vehicle-detail-card').count(), 0);

  // ---- เลือกรถจาก dropdown (83-1122 มีเครน) ----
  await page.selectOption('#v-select', '3');
  await page.waitForSelector('.vehicle-detail-card');
  ok('เลือกรถแล้วขึ้นการ์ดรายละเอียดรถ', await page.locator('.vehicle-detail-card').isVisible());
  ok('หัว modal ขึ้นทะเบียนรถ', /83-1122/.test(await page.locator('#rm-title').textContent()));
  const targets = await page.locator('.vehicle-target .radcard.ckcard').count();
  ok('จุดที่พบปัญหาเป็นการ์ด checkbox', targets === 2, `เจอ ${targets}`);
  // ติ๊กทั้ง 2 จุด (ตัวรถ + เครน) — โฟลว์ใหม่เลือกได้มากกว่า 1
  await page.locator('.vehicle-target .radcard').nth(0).click();
  await page.locator('.vehicle-target .radcard').nth(1).click();
  eq('ติ๊กแล้วการ์ดติด sel ทั้งคู่', await page.locator('.vehicle-target .radcard.sel').count(), 2);
  await page.locator('#next').click();

  // ---- ขั้น 2 อาการเสีย — แยกกลุ่มตามจุด ----
  await page.waitForSelector('#symcats .chks label');
  eq('เลือก 2 จุด → มีหัวกลุ่ม 2 กลุ่ม', await page.locator('#symcats .symgroup-head').count(), 2);
  // ติ๊กอาการกลุ่มละ 1 (กลุ่มแรก = ตัวรถ · กลุ่มหลัง = เครน — เลี่ยง "อื่นๆ" ที่บังคับกรอกข้อความ)
  await page.locator('#symcats .chks label').first().click();
  await page.locator('#symcats .chks label', { hasText: 'กระบอกไฮดรอลิกรั่ว' }).click();
  const cnt = (await page.locator('#symcats .symgroup-head .badge').allInnerTexts()).join(' | ');
  ok('ตัวนับอาการต่อกลุ่มขยับ', /1 อาการ/.test(cnt), `ได้ "${cnt}"`);
  await page.locator('#i-usable .sg').first().click();            // ใช้งานได้
  await page.locator('#next').click();

  // ---- ขั้น 3 ข้อมูลติดต่อ · สถานที่ · งบ ----
  await page.waitForSelector('#i-costtypes .radcard');
  await page.selectOption('#i-prov', { index: 1 });
  await page.fill('#i-owntel', '043-221-100');
  const budgets = await page.locator('#i-costtypes .radcard').count();
  ok('งบที่จะตัดเป็น radcard', budgets === 4, `เจอ ${budgets}`);
  await page.locator('#i-costtypes .radcard').first().click();
  await page.fill('#i-costfields input', 'B0002211');
  await page.locator('#next').click();

  // ---- ขั้น 4 ตัดสินใจ + อะไหล่ ----
  await page.waitForSelector('#dcrads .radcard');
  ok('การตัดสินใจเป็น radcard', await page.locator('#dcrads .radcard').count() === 2);
  await page.locator('#dc-self').click();
  ok('เลือกซ่อมเองแล้วการ์ดติดสถานะ sel', await page.locator('#dc-self.sel').count() === 1);
  await page.waitForSelector('#parts-stock .parts-stock-item');
  await page.locator('#parts-stock .parts-stock-item button').first().click();
  ok('กด + แล้วอะไหล่เข้ารายการขวา', await page.locator('#parts-picked .parts-picked-item').count() >= 1);
  const sumAll = await page.locator('#p-sum-all').textContent();
  ok('ยอดรวมค่าอะไหล่คำนวณแล้ว', /[1-9]/.test(sumAll), `ได้ "${sumAll}"`);
  await page.locator('#next').click();

  // ---- ขั้น 5 สรุป + ผู้อนุมัติ ----
  await page.waitForSelector('#aplist .apitem');
  // สรุปต้องแสดงจุดหลายจุด + อาการแยกบรรทัดตามจุด
  const sumTxt = await page.locator('#summary').textContent();
  ok('สรุปแสดงจุดที่มีปัญหาทั้ง 2 จุด', /ตัวรถ/.test(sumTxt) && /เครน|กระเช้า|Unic/.test(sumTxt));
  await page.locator('#aplist .apitem').first().click();
  await page.locator('#next').click();
  await page.waitForSelector('#sdone:not(.hidden)');
  const docno = (await page.locator('#docno').textContent()).trim();
  ok('ส่งเรื่องสำเร็จ ได้เลขใบแจ้งซ่อม', /^MTD-/.test(docno), `ได้ "${docno}"`);

  // ---- ปิด modal → ใบงานต้องโผล่ในตาราง "จัดการงานซ่อม" ----
  await page.locator('#sdone .btn-p', { hasText: 'ดูสถานะเรื่องของฉัน' }).click();
  ok('modal ปิดแล้ว', !(await page.locator('#repair-modal').isVisible()));
  await page.waitForSelector('#mylist table.tbl tbody tr');
  const inList = await page.locator('#mylist tbody tr', { hasText: docno }).count();
  ok('ใบที่เพิ่งสร้างอยู่ในตารางจัดการงานซ่อม', inList === 1);

  // ---- ไอคอน "แจ้งซ่อมคันนี้" ท้ายแถว → modal เติมรถให้ ----
  const repBtns = await page.locator('#mylist .dt-action button[title="แจ้งซ่อมคันนี้"]').count();
  ok('ทุกแถวมีไอคอนแจ้งซ่อมคันนี้', repBtns >= 1, `เจอ ${repBtns}`);
  ok('ไอคอนมีป้ายจำนวนเรื่องค้าง', await page.locator('#mylist .dt-action .cnt').count() >= 1);
  await page.locator('#mylist .dt-action button[title="แจ้งซ่อมคันนี้"]').first().click();
  await page.waitForSelector('#repair-modal:not(.hidden)');
  const preSel = await page.locator('#v-select').inputValue();
  ok('เปิดจากแถวแล้ว dropdown เติมรถให้', preSel !== '', `value="${preSel}"`);
  await page.locator('#back').click();   // ขั้น 1 ปุ่มซ้าย = ปิด
  ok('ปุ่ม "ปิด" ที่ขั้น 1 ปิด modal ได้', !(await page.locator('#repair-modal').isVisible()));

  // ---- ชุดคอลัมน์ตาราง "จัดการงานซ่อม" ต้องตรงกับ Figma (9 คอลัมน์) ----
  const th = (await page.locator('#mylist thead th').allInnerTexts()).map(t => t.split('\n')[0].trim());
  eq('ตารางมี 9 คอลัมน์', th.length, 9);
  eq('ชื่อคอลัมน์ตรงตาม Figma',
    th.slice(0, 8).join(' | '),
    'หมายเลขเหตุการณ์ | วันที่สร้าง | ยานพาหนะ | ประเภทยานพาหนะ | สถานะรถ | สถานะเหตุการณ์ | วันที่อัพเดตสถานะฯ | ผู้ดำเนินการ');
  eq('7 คอลัมน์แรกเรียงลำดับได้ (มีลูกศร)', await page.locator('#mylist thead th.sortable').count(), 7);
  ok('ช่องยานพาหนะแยกทะเบียน/จังหวัด 2 บรรทัด',
    await page.locator('#mylist tbody tr').first().locator('td').nth(2).locator('.cell-sub').count() === 1);

  // ---- คิวงาน กบค. ต้องใช้ชุดคอลัมน์เดียวกัน (ไม่เหลือตารางชุดเดิม) ----
  await page.locator('#nav-kbk').click();
  await page.waitForSelector('#kbklist table.tbl tbody tr');
  const thKbk = (await page.locator('#kbklist thead th').allInnerTexts()).map(t => t.split('\n')[0].trim());
  eq('คิวงาน กบค. ใช้ชุดคอลัมน์เดียวกับหน้าอื่น', thKbk.slice(0, 8).join(' | '), th.slice(0, 8).join(' | '));
  eq('ไม่มีหัวคอลัมน์ชุดเดิมหลงเหลือ', await page.locator('th', { hasText: 'สังกัดยานพาหนะ' }).count(), 0);

  // ---- หัวหน้าอนุมัติ ----
  await page.locator('#nav-boss').click();
  await page.waitForSelector('#bosslist table.tbl tbody tr');
  ok('หน้าอนุมัติเป็นตาราง (ไม่ใช่การ์ดเดิม)', await page.locator('#bosslist table.tbl').count() === 1);
  ok('ใบใหม่รออนุมัติอยู่ในหน้าหัวหน้า', await page.locator('#bosslist tbody tr', { hasText: docno }).count() === 1);

  console.log('\n══════ B. ค่าดีไซน์เทียบไลบรารี (Component) VMS Plus ══════');
  // เริ่มหน้าใหม่ + เปิด modal ก่อนวัด (องค์ประกอบฟอร์มอยู่ใน modal — ตอนปิดวัดค่าไม่ได้)
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#mylist table.tbl tbody tr');
  await page.locator('.lt-actions .btn-p', { hasText: 'แจ้งซ่อมใหม่' }).click();
  await page.waitForSelector('#repair-modal:not(.hidden)');

  const cs = (sel, prop, pseudo = null) => page.evaluate(([s, p, ps]) => {
    const el = document.querySelector(s); if (!el) return null;
    return getComputedStyle(el, ps)[p];
  }, [sel, prop, pseudo]);

  // ปุ่ม Primary — ไลบรารี: h40 · r8 · pad ซ้ายขวา 12 · พื้น #A80689
  eq('ปุ่ม .btn สูง 40', px(await cs('#next', 'height')), 40);
  eq('ปุ่ม .btn radius 8', px(await cs('#next', 'borderRadius')), 8);
  eq('ปุ่มปกติ pad ซ้ายขวา 12', px(await cs('#my-filter-btn', 'paddingLeft')), 12);
  eq('ปุ่มท้ายฟอร์ม pad ซ้ายขวา 12', px(await cs('#next', 'paddingLeft')), 12);
  eq('ปุ่ม .btn-p พื้นสีแบรนด์', rgb(await cs('#next', 'backgroundColor')), HEX.brand600);

  // dropdown ยานพาหนะ — ไลบรารี Input dropdown/Text input md: h40 · r8 · ขอบ #D0D5DD
  eq('dropdown ยานพาหนะ สูง 40', px(await cs('#v-select', 'height')), 40);
  eq('dropdown ยานพาหนะ radius 8', px(await cs('#v-select', 'borderRadius')), 8);
  eq('dropdown ยานพาหนะ ขอบ gray-300', rgb(await cs('#v-select', 'borderTopColor')), HEX.gray300);

  // การ์ดจุดที่พบปัญหา — Radio text card + กล่อง Checkbox (20×20 · r4 · เส้น 2)
  await page.selectOption('#v-select', '3');
  await page.waitForSelector('.vehicle-target .radcard.ckcard');
  eq('การ์ดจุด radius 8', px(await cs('.vehicle-target .radcard', 'borderRadius')), 8);
  eq('การ์ดจุด ขอบ 1px', px(await cs('.vehicle-target .radcard', 'borderTopWidth')), 1);
  eq('การ์ดจุด ขอบ gray-300', rgb(await cs('.vehicle-target .radcard', 'borderTopColor')), HEX.gray300);
  eq('กล่องติ๊กของการ์ดจุด 20px', px(await cs('.vehicle-target .cbox', 'width')), 20);
  eq('กล่องติ๊กของการ์ดจุด radius 4', px(await cs('.vehicle-target .cbox', 'borderRadius')), 4);
  eq('กล่องติ๊กของการ์ดจุด เส้น 2px', px(await cs('.vehicle-target .cbox', 'borderTopWidth')), 2);

  // Sidebar nav — ไลบรารี Nav button 40×40 · r8
  eq('ปุ่มเมนูข้าง 40px', px(await cs('.side .nv', 'width')), 40);

  // checkbox อาการเสีย — ไลบรารี Checkbox: 20×20 · r4 · เส้น 2px
  await page.locator('.vehicle-target .radcard').nth(0).click();
  await page.locator('.vehicle-target .radcard').nth(1).click();
  await page.locator('#next').click();
  await page.waitForSelector('#symcats .chks .cbox');
  eq('กล่องติ๊ก 20px', px(await cs('#symcats .chks .cbox', 'width')), 20);
  eq('กล่องติ๊ก radius 4', px(await cs('#symcats .chks .cbox', 'borderRadius')), 4);
  eq('กล่องติ๊ก เส้น 2px', px(await cs('#symcats .chks .cbox', 'borderTopWidth')), 2);
  // หัวกลุ่มอาการ (List header item) — 16/SemiBold + เส้นคั่นล่าง
  eq('หัวกลุ่มอาการตัวอักษร 16', px(await cs('#symcats .symgroup-head', 'fontSize')), 16);
  eq('หัวกลุ่มอาการมีเส้นคั่นล่าง 1px', px(await cs('#symcats .symgroup-head', 'borderBottomWidth')), 1);

  console.log('\n══════ C. มือถือ (390px) ══════');
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#mylist table.tbl tbody tr');
  await page.locator('.lt-actions .btn-p', { hasText: 'แจ้งซ่อมใหม่' }).click();
  await page.waitForSelector('#repair-modal:not(.hidden)');
  ok('มือถือ: modal เปิดได้', await page.locator('#repair-modal .modal').isVisible());
  ok('มือถือ: เห็นหัวขั้น', await page.locator('#rm-step').isVisible());
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  eq('มือถือ: ไม่ล้นแนวนอน', ov, 0);
  await page.setViewportSize({ width: 1440, height: 1000 });

  // ---- เครื่องที่เคยบันทึก variant 'grid' ไว้ ต้องไม่พังโฟลว์ใหม่ ----
  await page.evaluate(() => {
    const k = 'maintaind.admin.v1', j = JSON.parse(localStorage.getItem(k) || '{}');
    j.variants = Object.assign({}, j.variants, { vehicleCard: 'grid' });
    localStorage.setItem(k, JSON.stringify(j));
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#mylist table.tbl tbody tr');
  eq('ค่าเก่า grid ใน localStorage ไม่ทำให้การ์ดใหญ่กลับมา', await page.locator('.veh').count(), 0);
  await page.evaluate(() => localStorage.clear());

  console.log('\n══════ D. ไม่มี error บนหน้า ══════');
  ok('ไม่มี pageerror / console error', errors.length === 0, errors.slice(0, 5).join(' | '));
  if (errors.length) { console.log('  รายละเอียดทั้งหมด:'); errors.forEach(e => console.log('    · ' + e)); }

  await browser.close();
  console.log(`\n${fail === 0 ? '✓ ผ่าน' : '✗ ไม่ผ่าน'} — ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
  process.exit(fail === 0 ? 0 : 1);

})();
