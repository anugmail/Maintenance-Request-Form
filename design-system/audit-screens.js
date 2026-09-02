#!/usr/bin/env node
/* ============================================================================
   ไล่ตรวจ "ทีละหน้าจอ" ว่าใช้ค่าตามไลบรารี (Component) VMS Plus หรือยัง
   ----------------------------------------------------------------------------
   ต่างจากเพื่อนบ้าน 2 ตัว
     · audit-usage.js  = อ่านซอร์ส หา inline style / การใช้ผิดกติกา
     · compare-figma.js = เทียบค่าใน components.css กับ node ในไฟล์ Figma
     · ไฟล์นี้         = เปิดหน้าจริงในเบราว์เซอร์ แล้ววัด computed style ของ
                        คอมโพเนนต์ที่โผล่ "บนหน้านั้น ๆ" — จับเคสที่ CSS ถูก
                        แต่หน้าใช้ผิดตัว/ถูก override

   ค่าอ้างอิงทั้งหมดมาจากไลบรารีที่ดัมป์ไว้ (design-system/.figma-extract/component)
   ดูที่มาแต่ละตัวได้ใน design-system/README.md ตารางคอมโพเนนต์

   รัน:  node design-system/audit-screens.js
         BASE=http://127.0.0.1:8123 CHROME="/path/to/Chrome"
   ============================================================================ */
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const URL = `${BASE}/mock/Maintenance-Request-Form.html`;

/* ---- ค่าจริงจากไลบรารี ----------------------------------------------------
   [selector, ชื่อที่มนุษย์อ่าน, {prop: ค่าที่ต้องได้}]
   prop รองรับ: h w r bw pl pt fs fw bg bc color                             */
const HEX = { brand: 'rgb(168, 6, 137)', gray300: 'rgb(208, 213, 221)', gray600: 'rgb(71, 84, 84)' };
const RULES = [
  ['.btn:not(.btn-lg):not(.btn-sm):not(.pg):not(.modal-x):not(.btn-icon):not(.dt-action .btn)', 'ปุ่ม (Button md)', { h: 40, r: 8, pl: 12 }],
  ['.dt-action .btn,.btn-icon,.modal-x', 'ปุ่มไอคอน (Tertiary button 40×40)', { w: 40, h: 40, r: 8 }],
  ['.btn-lg', 'ปุ่มใหญ่ (Button lg)', { h: 48, r: 8 }],
  ['input[type=text],input[type=search],input[type=number],input[type=tel]', 'ช่องกรอก (Text input md)', { h: 40, r: 8, bw: 1 }, ':not(.search *):not(.in *)'],
  ['select', 'ดรอปดาวน์ (Dropdown md)', { h: 40, r: 8 }],
  ['.cbox', 'กล่องติ๊ก (Checkbox)', { w: 20, h: 20, r: 4, bw: 2 }],
  ['.rdot', 'จุดวิทยุ (Radio button)', { w: 20, h: 20, bw: 2 }],
  ['.radcard:not(.sel)', 'การ์ดวิทยุ (Radio text card)', { r: 8, bw: 1 }],
  ['.radcard.sel', 'การ์ดวิทยุ (เลือกแล้ว)', { r: 8, bw: 2 }],
  ['.tbl tbody td', 'ช่องตาราง (Table cell)', { pl: 16, pt: 8 }],
  ['.tbl thead th:not(.sortable)', 'หัวตาราง (Table header cell)', { pl: 16 }],
  ['.tbl thead th.sortable button', 'หัวตาราง (แบบเรียงได้ — padding อยู่ที่ปุ่ม)', { pl: 16 }],
  ['.crumbs', 'เส้นทาง (Breadcrumbs)', { fs: 12 }],
  ['.pg:not(.on)', 'เลขหน้า (Pagination)', { w: 40, h: 40, r: 4 }],   // ไลบรารี: ปกติ r4 · hover/หน้าปัจจุบัน r8
  ['.side .nv', 'ปุ่มเมนูข้าง (Nav button)', { w: 40, h: 40 }],
  ['.sect', 'หัวข้อส่วน (Section header)', { fs: 20, fw: 600 }],
  ['.tab-btn', 'แท็บ (Tab item)', { h: 48 }],
  ['.wsteps', 'แถบขั้นตอน (Progress steps)', { r: 8, bw: 1 }],
  ['.wstep .num', 'วงกลมเลขขั้น', { w: 40, h: 40 }],
  ['.modal', 'โมดัล (Modal)', { r: 12 }],
  ['.qty', 'ตัวปรับจำนวน', { r: 8 }],
];

/* หน้าที่ต้องไล่ — [ชื่อหน้า, ฟังก์ชันพาไปหน้านั้น]
   ขอบเขต: เจ้าของงานเคาะ 2 ก.ย. 2569 ให้ตรวจเฉพาะ 10 หน้าของ "ใบแจ้งซ่อม"
   (คิวงาน กบค. · ขั้นตอนงานซ่อม · อนุมัติปิดงาน · คลังอะไหล่ อยู่นอกขอบเขต) */
const SCREENS = [
  ['1. สร้างใบแจ้งซ่อม — ขั้น 1 เลือกรถ', async p => { await go(p, ''); }],
  ['2. สร้างใบแจ้งซ่อม — ขั้น 2 อาการเสีย', async p => { await go(p, ''); await step1(p); }],
  ['3. สร้างใบแจ้งซ่อม — ขั้น 3 ข้อมูลติดต่อ/สถานที่/งบ', async p => { await go(p, ''); await step1(p); await step2(p); }],
  ['4. สร้างใบแจ้งซ่อม — ขั้น 4 ตัดสินใจ + อะไหล่', async p => { await go(p, ''); await step1(p); await step2(p); await step3(p); }],
  ['5. สร้างใบแจ้งซ่อม — ขั้น 5 สรุป + ผู้อนุมัติ', async p => { await go(p, ''); await step1(p); await step2(p); await step3(p); await step4(p); }],
  ['6. สร้างใบแจ้งซ่อม — หน้าส่งสำเร็จ', async p => { await go(p, ''); await step1(p); await step2(p); await step3(p); await step4(p); await step5(p); }],
  ['7. จัดการงานซ่อม (ลิสต์ผู้แจ้ง)', async p => { await go(p, '#my'); await p.waitForSelector('#mylist .tbl'); }],
  ['8. รายละเอียดเรื่องของฉัน', async p => { await go(p, '#my'); await p.locator('#mylist tbody tr .btn').first().click(); await p.waitForSelector('#view-mydet:not(.hidden)'); }],
  ['9. อนุมัติใบแจ้งซ่อม (หัวหน้า)', async p => { await go(p, '#boss'); }],
  ['10. งานคัดแยก กรย.', async p => { await go(p, '#kry'); }],
];

const go = async (p, hash) => { await p.goto(URL + hash, { waitUntil: 'networkidle' }); await p.waitForTimeout(250); };
const step1 = async p => {
  await p.waitForSelector('#vlist .radcard');
  await p.locator('#vlist .radcard').nth(2).click();
  await p.locator('.vehicle-target .radcard').nth(1).click();
  await p.locator('#next').click(); await p.waitForSelector('#symcats .chks label');
};
const step2 = async p => {
  await p.locator('#symcats .chks label').first().click();
  await p.locator('#i-usable .sg').first().click();
  await p.locator('#next').click(); await p.waitForSelector('#i-costtypes .radcard');
};
const step3 = async p => {
  await p.selectOption('#i-prov', { index: 1 });
  await p.fill('#i-owntel', '043-221-100');
  await p.locator('#i-costtypes .radcard').first().click();
  await p.fill('#i-costfields input', 'B0002211');
  await p.locator('#next').click(); await p.waitForSelector('#dcrads .radcard');
};
const step4 = async p => {
  await p.locator('#dc-self').click();
  await p.locator('#parts-stock .parts-stock-item button').first().click();
  await p.locator('#next').click(); await p.waitForSelector('#aplist .apitem');
};
const step5 = async p => {
  await p.locator('#aplist .apitem').first().click();
  await p.locator('#next').click(); await p.waitForSelector('#sdone:not(.hidden)');
};

(async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 1000 } });
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());

  let totalBad = 0;
  const summary = [];
  for (const [name, nav] of SCREENS) {
    // เลื่อนเมาส์ออกก่อนวัด กัน :hover หลอก
    try { await nav(page); await page.mouse.move(2, 2); } catch (e) { console.log(`\n■ ${name}\n  ✗ เปิดหน้าไม่สำเร็จ — ${String(e).split('\n')[0]}`); totalBad++; continue }
    const res = await page.evaluate(rules => {
      const px = v => Math.round(parseFloat(v));
      const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 };
      const read = (s, el) => ({
        h: px(s.height), w: px(s.width), r: px(s.borderTopLeftRadius), bw: px(s.borderTopWidth),
        pl: px(s.paddingLeft), pt: px(s.paddingTop), fs: px(s.fontSize), fw: +s.fontWeight,
      });
      const out = [];
      for (const [sel, label, want, notSel] of rules) {
        let els = [...document.querySelectorAll(sel)].filter(vis);
        if (notSel) els = els.filter(el => !el.closest('.search') && !el.closest('.in'));
        if (!els.length) continue;
        const bad = [];
        for (const el of els) {
          const got = read(getComputedStyle(el), el);
          for (const k of Object.keys(want)) {
            if (got[k] !== want[k]) bad.push({ k, got: got[k], want: want[k], txt: (el.innerText || el.value || '').trim().slice(0, 18) });
          }
        }
        // ยุบซ้ำ: รายงานทีละ property พร้อมจำนวนที่พลาด
        const byProp = {};
        bad.forEach(b => { (byProp[b.k] = byProp[b.k] || { ...b, n: 0 }).n++ });
        out.push({ label, sel, total: els.length, bad: Object.values(byProp) });
      }
      return out;
    }, RULES);

    const bad = res.filter(r => r.bad.length);
    console.log(`\n■ ${name}`);
    console.log(`  คอมโพเนนต์ที่ตรวจเจอบนหน้านี้: ${res.length} ชนิด (${res.reduce((a, r) => a + r.total, 0)} ชิ้น)`);
    if (!bad.length) console.log('  ✅ ทุกชิ้นตรงค่าไลบรารี');
    bad.forEach(r => r.bad.forEach(b =>
      console.log(`  ⚠ ${r.label} — ${b.k} ได้ ${b.got} ควรเป็น ${b.want} (${b.n}/${r.total} ชิ้น${b.txt ? ` เช่น “${b.txt}”` : ''})`)));
    totalBad += bad.reduce((a, r) => a + r.bad.length, 0);
    summary.push([name, res.length, bad.reduce((a, r) => a + r.bad.length, 0)]);
  }

  console.log('\n══════ สรุป ══════');
  summary.forEach(([n, c, b]) => console.log(`  ${b ? '⚠' : '✅'} ${n} — ${c} ชนิด · ${b} จุดที่ต่าง`));
  console.log(`\n${totalBad ? '⚠' : '✅'} รวมจุดที่ต่างจากไลบรารี ${totalBad} จุด`);
  if (jsErrors.length) console.log(`✗ JS error ${jsErrors.length}: ${jsErrors.slice(0, 3).join(' | ')}`);
  await browser.close();
})();
