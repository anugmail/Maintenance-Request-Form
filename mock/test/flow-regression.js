#!/usr/bin/env node
/* ============================================================================
   Regression test ของโฟลว์แจ้งซ่อม — ขับ Chrome จริงด้วย playwright-core
   ----------------------------------------------------------------------------
   ทำไมต้องมี: 1–2 ก.ย. 2569 แก้ UI ติดกัน 6 เวอร์ชัน (ds41→ds46) แล้วจับผิดด้วยตาล้วน
   จน stepper ผิด 3 รอบติด ⇒ ต้องมีของรันก่อนส่งงานทุกครั้ง

   ตรวจ 2 ชั้น
     A. โฟลว์  — เดินฟอร์มตั้งแต่เลือกรถจนส่งเรื่อง แล้วเช็กว่าใบงานเข้าลิสต์จริง
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

  console.log('\n══════ A. โฟลว์แจ้งซ่อม ══════');
  // ---- ขั้น 1 เลือกรถ ----
  await page.waitForSelector('#vlist .radcard');
  const cards = await page.locator('#vlist .radcard').count();
  ok('ขั้น 1 แสดงการ์ดเลือกรถ (radcard)', cards >= 4, `เจอ ${cards} ใบ`);
  await page.locator('#vlist .radcard').nth(2).click();          // 83-1122 (มีเครน)
  await page.waitForSelector('.vehicle-detail-card');
  ok('เลือกรถแล้วขึ้นการ์ดรายละเอียดรถ', await page.locator('.vehicle-detail-card').isVisible());
  const targets = await page.locator('.vehicle-target .radcard').count();
  ok('จุดที่พบปัญหาเป็น radcard', targets === 2, `เจอ ${targets}`);
  await page.locator('.vehicle-target .radcard').nth(1).click();  // อุปกรณ์ติดตั้ง
  await page.locator('#next').click();

  // ---- ขั้น 2 อาการเสีย ----
  await page.waitForSelector('#symcats .chks label');
  const syms = await page.locator('#symcats .chks label').count();
  ok('ขั้น 2 แสดง checkbox อาการเสีย', syms > 0, `เจอ ${syms}`);
  await page.locator('#symcats .chks label').first().click();
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
  // แถวอะไหล่ที่เลือก = แถวเดียว ราคา → จำนวน → ถังขยะ (ถังขยะหลังสุด) · การ์ดต้องไม่สูงเกิน 88
  const picked = await page.evaluate(() => {
    const row = document.querySelector('.parts-picked-item');
    const act = row.querySelector('.parts-picked-actions');
    return { h: Math.round(row.getBoundingClientRect().height),
             last: act.lastElementChild.querySelector('.ms')?.textContent.trim(),
             order: [...act.children].map(e => e.className.split(' ')[0]).join(',') };
  });
  eq('อะไหล่ที่เลือก: ถังขยะอยู่หลังสุด', picked.last, 'delete');
  eq('อะไหล่ที่เลือก: เรียง ราคา → จำนวน → ปุ่มลบ', picked.order, 'parts-price,qty,btn');
  ok('อะไหล่ที่เลือก: การ์ดกะทัดรัด (≤88px)', picked.h <= 88, `สูง ${picked.h}px`);
  const sumAll = await page.locator('#p-sum-all').textContent();
  ok('ยอดรวมค่าอะไหล่คำนวณแล้ว', /[1-9]/.test(sumAll), `ได้ "${sumAll}"`);
  await page.locator('#next').click();

  // ---- ขั้น 5 สรุป + ผู้อนุมัติ ----
  await page.waitForSelector('#aplist .apitem');
  await page.locator('#aplist .apitem').first().click();
  await page.locator('#next').click();
  await page.waitForSelector('#sdone:not(.hidden)');
  const docno = (await page.locator('#docno').textContent()).trim();
  ok('ส่งเรื่องสำเร็จ ได้เลขใบแจ้งซ่อม', /^MTD-/.test(docno), `ได้ "${docno}"`);

  // ---- ใบงานต้องโผล่ในลิสต์ "จัดการงานซ่อม" ----
  await page.locator('.side .nv[title="เรื่องแจ้งซ่อมของฉัน"], #nav-my').first().click();
  await page.waitForSelector('#mylist table.tbl tbody tr');
  const inList = await page.locator('#mylist tbody tr', { hasText: docno }).count();
  ok('ใบที่เพิ่งสร้างอยู่ในตารางจัดการงานซ่อม', inList === 1);

  // ---- ชุดคอลัมน์ตาราง "จัดการงานซ่อม" ต้องตรงกับ Figma (9 คอลัมน์) ----
  const th = (await page.locator('#mylist thead th').allInnerTexts()).map(t => t.split('\n')[0].trim());
  eq('ตารางมี 9 คอลัมน์', th.length, 9);
  eq('ชื่อคอลัมน์ตรงตาม Figma',
    th.slice(0, 8).join(' | '),
    'หมายเลขเหตุการณ์ | วันที่สร้าง | ยานพาหนะ | ประเภทยานพาหนะ | สถานะรถ | สถานะเหตุการณ์ | วันที่อัพเดตสถานะฯ | ผู้ดำเนินการ');
  eq('7 คอลัมน์แรกเรียงลำดับได้ (มีลูกศร)', await page.locator('#mylist thead th.sortable').count(), 7);
  ok('ช่องยานพาหนะแยกทะเบียน/จังหวัด 2 บรรทัด',
    await page.locator('#mylist tbody tr').first().locator('td').nth(2).locator('.cell-sub').count() === 1);

  // ---- หัวหน้าอนุมัติ ----
  await page.locator('#nav-boss').click();
  await page.waitForSelector('#bosslist table.tbl tbody tr');
  ok('หน้าอนุมัติเป็นตาราง (ไม่ใช่การ์ดเดิม)', await page.locator('#bosslist table.tbl').count() === 1);
  ok('ใบใหม่รออนุมัติอยู่ในหน้าหัวหน้า', await page.locator('#bosslist tbody tr', { hasText: docno }).count() === 1);

  console.log('\n══════ B. ค่าดีไซน์เทียบไลบรารี (Component) VMS Plus ══════');
  // เริ่มหน้าใหม่ก่อนวัดค่า — หลังส่งเรื่องแล้วฟอร์มจะอยู่ที่หน้า "ส่งสำเร็จ" ฟิลด์ขั้น 1 จะถูกซ่อน
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#vlist .radcard', { state: 'attached' });

  const cs = (sel, prop, pseudo = null) => page.evaluate(([s, p, ps]) => {
    const el = document.querySelector(s); if (!el) return null;
    return getComputedStyle(el, ps)[p];
  }, [sel, prop, pseudo]);

  // ปุ่ม Primary — ไลบรารี: h40 · r8 · pad ซ้ายขวา 12 · gap 4 · พื้น #A80689
  eq('ปุ่ม .btn สูง 40', px(await cs('#next', 'height')), 40);
  eq('ปุ่ม .btn radius 8', px(await cs('#next', 'borderRadius')), 8);
  // ปุ่มท้ายฟอร์มเป็น variant ของเราเอง (.actions .btn = min-width 170 · pad 24 · 16px) ยกมาจากหน้าจริงตอนแรก
  // ⇒ วัด padding จาก "ปุ่มปกติ" แทน (ไลบรารี Primary/Secondary button md = pad ซ้ายขวา 12)
  eq('ปุ่มปกติ pad ซ้ายขวา 12', px(await cs('#my-filter-btn', 'paddingLeft')), 12);
  eq('ปุ่มท้ายฟอร์ม (variant ของเรา) กว้างขั้นต่ำ 170', px(await cs('#next', 'minWidth')), 170);
  eq('ปุ่ม .btn-p พื้นสีแบรนด์', rgb(await cs('#next', 'backgroundColor')), HEX.brand600);

  // ช่องกรอก — ไลบรารี Text input Container md: h40 · r8 · ขอบ #D0D5DD
  eq('ช่องค้นหารถ สูง 40', px(await cs('#vq', 'height')), 40);
  eq('ช่องค้นหารถ radius 8', px(await cs('#vq', 'borderRadius')), 8);
  eq('ช่องค้นหารถ ขอบ gray-300', rgb(await cs('#vq', 'borderTopColor')), HEX.gray300);

  // Radio card — ไลบรารี Radio text card: r8 · ขอบ 1px #D0D5DD · เลือกแล้ว 2px แบรนด์
  eq('radcard radius 8', px(await cs('#vlist .radcard', 'borderRadius')), 8);
  eq('radcard ขอบ 1px', px(await cs('#vlist .radcard', 'borderTopWidth')), 1);
  eq('radcard ขอบ gray-300', rgb(await cs('#vlist .radcard', 'borderTopColor')), HEX.gray300);
  // จุดวิทยุ — ไลบรารี Radio button: 20×20 · เส้น 2px
  eq('จุดวิทยุ 20px', px(await cs('#vlist .radcard .rdot', 'width')), 20);
  eq('จุดวิทยุ เส้น 2px', px(await cs('#vlist .radcard .rdot', 'borderTopWidth')), 2);

  // Stepper — หน้าจอจริง Create vehicle (Step 1): กล่อง r8 ขอบ #D0D5DD · วงกลม 40
  eq('stepper กล่อง radius 8', px(await cs('.wsteps', 'borderRadius')), 8);
  eq('stepper กล่องมีขอบ 1px', px(await cs('.wsteps', 'borderTopWidth')), 1);
  eq('stepper วงกลม 40px', px(await cs('.wstep .num', 'width')), 40);
  ok('stepper มีตัวคั่น chevron (2 เส้นเอียง)',
    /rotate\(-?29deg\)|matrix/.test(await cs('.wstep:not(:last-child)', 'transform', '::before') || ''),
    'ไม่พบ transform บน ::before');

  // Sidebar nav — ไลบรารี Nav button 40×40 · r8
  eq('ปุ่มเมนูข้าง 40px', px(await cs('.side .nv', 'width')), 40);

  // checkbox อาการเสีย — ไลบรารี Checkbox: 20×20 · r4 · เส้น 2px
  await page.locator('#vlist .radcard').nth(2).click();
  await page.locator('.vehicle-target .radcard').nth(1).click();
  await page.locator('#next').click();
  await page.waitForSelector('#symcats .chks .cbox');
  eq('กล่องติ๊ก 20px', px(await cs('#symcats .chks .cbox', 'width')), 20);
  eq('กล่องติ๊ก radius 4', px(await cs('#symcats .chks .cbox', 'borderRadius')), 4);
  eq('กล่องติ๊ก เส้น 2px', px(await cs('#symcats .chks .cbox', 'borderTopWidth')), 2);

  console.log('\n══════ C. มือถือ (390px) ══════');
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.wsm-head');
  ok('มือถือ: ซ่อน stepper แนวนอน', !(await page.locator('.wsteps').first().isVisible()));
  ok('มือถือ: ใช้ Mobile progress steps แทน', await page.locator('.wsteps-m').isVisible());
  const ringTxt = (await page.locator('.wsm-ring').textContent()).replace(/\s/g, '');
  ok('มือถือ: วงแหวนบอก "ขั้นที่/ทั้งหมด"', /^\d+\/\d+$/.test(ringTxt), `ได้ "${ringTxt}"`);
  ok('มือถือ: มีบรรทัด "ถัดไป:"', (await page.locator('.wsm-next').count()) === 1);
  await page.locator('.wsm-head').click();
  ok('มือถือ: กดแล้วกางเป็นรายการแนวตั้ง', await page.locator('.wsteps-m.open + .wsteps').isVisible());
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  eq('มือถือ: ไม่ล้นแนวนอน', ov, 0);
  await page.setViewportSize({ width: 1440, height: 1000 });

  console.log('\n══════ D. ไม่มี error บนหน้า ══════');
  ok('ไม่มี pageerror / console error', errors.length === 0, errors.slice(0, 5).join(' | '));
  if (errors.length) { console.log('  รายละเอียดทั้งหมด:'); errors.forEach(e => console.log('    · ' + e)); }

  await browser.close();
  console.log(`\n${fail === 0 ? '✓ ผ่าน' : '✗ ไม่ผ่าน'} — ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
  process.exit(fail === 0 ? 0 : 1);

})();
