#!/usr/bin/env node
/* ============================================================
   โฟลว์ "แจ้งซ่อม" ฝั่งผู้แจ้ง — capture เส้นหลัก 8 หน้าจอ
   ------------------------------------------------------------
   เส้นเรื่อง: ผู้แจ้งเปิดฟอร์มสร้างใบแจ้งซ่อม (wizard 5 ขั้นตาม config)
   เลือกรถ → อาการเสีย → ข้อมูลติดต่อ/งบ → อะไหล่ที่แนะนำ → ตัดสินใจ+สรุป
   → ส่งเรื่อง ได้เลขที่ใบ → เห็นสถานะ "รอหัวหน้าอนุมัติ" ในเรื่องของฉัน

   สโคปตามเจ้าของงานเคาะ 12 ส.ค. 2569: แค่ฝั่งผู้แจ้ง จบที่รอหัวหน้าอนุมัติ
   (สายอนุมัติ หัวหน้า → กรย. → กบค. ไม่อยู่ในโฟลว์นี้)

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/flow-report-capture.js
   ผลลัพธ์: out/figjam/flow-report/NN-<ชื่อ>.png + manifest.json
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out', 'figjam', 'flow-report');
const WIDTH = 1440;
const PLATE = '81-2345';   // Hino FM8J + เครน Tadano — จังหวัดบนป้ายอยู่ในผัง AREAS ทำให้ระบบ prefill ให้เห็นจริง

const shots = [];
const errors = [];

async function capture(page, slug, name, note) {
  await page.evaluate(() => document.fonts.ready);
  // toast auto-hide 2.6s — รอให้หายก่อน ไม่ให้ติดในภาพ
  await page.waitForFunction(() => !document.getElementById('toast').classList.contains('show'),
    null, { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(350);
  const file = String(shots.length + 1).padStart(2, '0') + '-' + slug + '.png';
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize({ width: WIDTH, height: 1000 });
  shots.push({ file, slug, name, note, w: WIDTH, h });
  console.log('✓ ' + file.padEnd(40) + name);
}

const visible = (id) => '#' + id + ':not(.hidden)';

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));

  // ---- ตั้งต้น: ล้าง state → ค่าเริ่มต้นทุกอย่าง (wizard 5 ขั้นตาม config seed) ----
  await page.goto(BASE + '/mock/Maintenance-Request-Form.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#vlist .radcard');

  const worder = await page.evaluate(() => WORDER.join(','));
  if (worder !== 'vehicle,symptom,info,parts,decision') {
    throw new Error('ลำดับขั้น wizard ไม่ตรงที่คาด: ' + worder);
  }

  // ---- ขั้น 1: เลือกรถ ----
  await capture(page, 'ขั้น1-เลือกรถ', 'ขั้นที่ 1 เลือกรถ — ยังไม่เลือก',
    'ค้นหาทะเบียน หรือเลือกจากการ์ดรถของฉัน/รถในทีม');

  await page.locator('#vlist .radcard', { hasText: PLATE }).click();
  await page.waitForSelector(visible('vinfo'));
  await page.locator('#vauto label.vehicle-target-option')
    .filter({ has: page.locator('input[value="vehicle"]') }).click();
  await page.waitForTimeout(250);
  await capture(page, 'ขั้น1-เลือกแล้ว', 'เลือกรถแล้ว — รายละเอียด + จุดที่พบปัญหา',
    'ข้อมูลรถจากทะเบียน VMS+ · ระบุจุดที่พบปัญหา (ตัวรถ/อุปกรณ์เสริม) ก่อนไปต่อ');

  // ---- ขั้น 2: อาการเสีย ----
  await page.locator('#next').click();
  await page.waitForSelector(visible('s2'));
  // เลือกเฉพาะอาการที่มีอะไหล่แนะนำ — ขั้นอะไหล่จะได้ไม่ว่าง
  const symNames = await page.evaluate(() => {
    const scope = ['vehicle', 'both'];
    const cats = CATS.filter(c => scope.includes(c.for)).map(c => c.key);
    return SYMPTOMS.filter(s => cats.includes(s.cat) && PARTS.some(p => p.sym === s.id))
      .slice(0, 2).map(s => s.name);
  });
  if (!symNames.length) throw new Error('ไม่พบอาการที่มีอะไหล่แนะนำ');
  for (const n of symNames) {
    await page.locator('#symcats .chip').filter({ hasText: n }).first().click();
    await page.waitForTimeout(150);
  }
  await page.locator('#i-usable .sg').first().click();
  await page.locator('#desc').fill('เสียงดังผิดปกติตอนสตาร์ต และมีน้ำมันซึมใต้ท้องรถ');
  await page.locator('.addph', { hasText: 'รูปตัวอย่าง' }).click();
  await page.locator('.addph', { hasText: 'รูปตัวอย่าง' }).click();
  await page.waitForTimeout(200);
  await capture(page, 'ขั้น2-อาการเสีย', 'ขั้นที่ 2 อาการเสีย — เลือกอาการ + สถานะรถ',
    'อาการมาตรฐานกรองตามจุดที่เลือก · สถานะรถ (จำเป็น) · คำอธิบาย + รูปแนบ');

  // ---- ขั้น 3: ข้อมูลติดต่อ · สถานที่ · งบ ----
  await page.locator('#next').click();
  await page.waitForSelector(visible('sinfo'));
  if (!await page.locator('#i-prov').inputValue()) {
    await page.locator('#i-prov').selectOption({ index: 1 });
    await page.waitForTimeout(200);
  }
  const amp = page.locator('#i-amp');
  if (!await amp.inputValue() && await amp.locator('option').count() > 1) {
    await amp.selectOption({ index: 1 });
  }
  await page.locator('#i-odo').fill('84120');
  await page.locator('#i-crane').fill('3210');
  await page.locator('#i-owntel').fill('044-221-100');
  await page.locator('#i-tech').fill('อดิศักดิ์ แก้วใส');
  await page.locator('#i-techtel').fill('081-234-5678');
  await page.locator('#i-costtypes .radcard').first().click();
  await page.waitForTimeout(200);
  // ช่องงบที่ sample ไม่ได้เติมให้ — เติมเองให้ผ่านเงื่อนไข "จำเป็น"
  const nCost = await page.locator('#i-costfields input').count();
  for (let i = 0; i < nCost; i++) {
    const el = page.locator('#i-costfields input').nth(i);
    if (!await el.inputValue()) await el.fill('อ้างอิงตัวอย่าง 2569/104');
  }
  await capture(page, 'ขั้น3-ติดต่อ-งบ', 'ขั้นที่ 3 ข้อมูลติดต่อ · สถานที่ · งบ',
    'ระบบเติมจังหวัด/หน่วยงานให้จากทะเบียนรถ แก้ได้ · เบอร์ติดต่ออย่างน้อย 1 · เลือกงบที่จะตัด');

  // ---- ขั้น 4: อะไหล่ที่แนะนำ ----
  await page.locator('#next').click();
  await page.waitForSelector(visible('s3'));
  for (let i = 0; i < 2; i++) {
    const btn = page.locator('#parts button', { hasText: 'เลือกอะไหล่' });
    if (!await btn.count()) break;
    await btn.first().click();          // คลิกแล้ว #parts re-render — คว้า locator ใหม่ทุกรอบ
    await page.waitForTimeout(250);
  }
  await capture(page, 'ขั้น4-อะไหล่', 'ขั้นที่ 4 อะไหล่ที่ระบบแนะนำ — เลือกไว้ล่วงหน้า',
    'แนะนำจากอาการที่เลือก เห็นของคงเหลือ · ยังไม่ตัดสต็อก กบค. ยืนยันอีกครั้งตอนรับเรื่อง');

  // ---- ขั้น 5: ตัดสินใจ + สรุป ----
  await page.locator('#next').click();
  await page.waitForSelector(visible('s4'));
  await page.locator('#dckry').click();
  await page.locator('#kryreason').fill('ต้องใช้เครื่องมือพิเศษถอดชุดไฮดรอลิก ซ่อมเองที่หน่วยงานไม่ได้');
  await page.locator('#aplist .apitem').first().click();
  await page.waitForTimeout(250);
  await capture(page, 'ขั้น5-ตัดสินใจ-สรุป', 'ขั้นที่ 5 ตัดสินใจ + เลือกผู้อนุมัติ + สรุป',
    'ซ่อมเอง/ส่งเรื่องให้ กรย. · เลือกผู้อนุมัติ (HR/แอดมินหน่วยงานรถ) · สรุปก่อนส่ง');

  // ---- ส่งเรื่อง ----
  await page.locator('#next').click();
  await page.waitForSelector(visible('sdone'));
  const docno = await page.locator('#docno').textContent();
  if (!docno || !docno.trim()) errors.push('ส่งเรื่องแล้วแต่ไม่มีเลขที่ใบแจ้งซ่อม');
  await capture(page, 'ส่งเรื่องสำเร็จ', 'ส่งเรื่องเรียบร้อย — ได้เลขที่ใบแจ้งซ่อม',
    'สถานะ "ส่งขออนุมัติแล้ว — รอหัวหน้าอนุมัติ" · ใบยังไม่เดินต่อจนกว่าจะอนุมัติ');

  // ---- เรื่องของฉัน: ใบใหม่สถานะรอหัวหน้าอนุมัติ ----
  await page.locator('#sdone button', { hasText: 'ดูสถานะเรื่องของฉัน' }).click();
  await page.waitForSelector(visible('view-my'));
  const hasWait = await page.locator('#view-my', { hasText: docno.trim() }).count();
  if (!hasWait) errors.push('ไม่พบใบ ' + docno + ' ในเรื่องของฉัน');
  await capture(page, 'เรื่องของฉัน-รออนุมัติ', 'เรื่องของฉัน — ใบใหม่รอหัวหน้าอนุมัติ',
    'ใบที่เพิ่งส่งขึ้นบนสุด สถานะ "รอ … อนุมัติ" — จบโฟลว์ฝั่งผู้แจ้ง');

  await browser.close();

  if (errors.length) {
    console.log('\n⚠ ปัญหา ' + errors.length + ' รายการ:');
    errors.forEach(e => console.log('  ' + e));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), width: WIDTH, flow: 'แจ้งซ่อม (ฝั่งผู้แจ้ง)', shots, errors
  }, null, 2));
  console.log('\nรวม ' + shots.length + ' หน้าจอ → ' + path.relative(process.cwd(), OUT));
  if (errors.length) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
