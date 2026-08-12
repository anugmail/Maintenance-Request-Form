#!/usr/bin/env node
/* ============================================================
   ไล่กดโฟลว์ "สร้างแผน / ออกเลขงาน" จริงในเบราว์เซอร์ แล้ว capture ทุกหน้าจอย่อย
   ------------------------------------------------------------
   ต่างจาก figjam-capture.js ที่ถ่ายแค่สถานะเริ่มต้นของแต่ละไฟล์ —
   ตัวนี้เดิน wizard ทีละขั้นเหมือนผู้ใช้จริง (กรอกชื่อ เลือกTรถ กดถัดไป
   ยืนยัน dialog) เพื่อให้เห็นว่าโฟลว์สร้างแผนมี "หน้า" อะไรบ้าง

   เริ่มจากล้าง localStorage ให้เป็นค่า default เสมอ — ผลซ้ำได้ทุกรอบ

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/flow-plan-capture.js
   ผลลัพธ์: out/figjam/flow-plan/NN-<ชื่อ>.png + manifest.json
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out', 'figjam', 'flow-plan');
const WIDTH = 1440;

const shots = [];
const errors = [];

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

async function capture(page, slug, name, note) {
  await settle(page);
  const file = String(shots.length + 1).padStart(2, '0') + '-' + slug + '.png';
  // ขยาย viewport เท่าหน้าจริงแทน fullPage — ไม่งั้น element ที่ fixed
  // (โลโก้/sidebar) จะโดนวาดซ้ำกลางหน้าตอน playwright เลื่อนต่อภาพ
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize({ width: WIDTH, height: 1000 });
  shots.push({ file, slug, name, note, w: WIDTH, h });
  console.log('✓ ' + file.padEnd(34) + name);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());

  // เริ่มจากสภาพ default — ล้าง state เดิมทั้งหมดก่อน
  await page.goto(BASE + '/maintainance-yearly/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const c = document.querySelector('.content');
    return !c || c.children.length > 0;
  });
  await capture(page, 'รายการแผน', 'รายการแผนบำรุงรักษา (จุดเริ่ม)',
    'ปุ่ม "สร้างแผน / ออกเลขงาน" อยู่หน้านี้');

  // กดปุ่มสร้างแผน → เข้า wizard ขั้น 1
  await Promise.all([
    page.waitForEvent('load'),
    page.click('a:has-text("สร้างแผน / ออกเลขงาน")')
  ]);
  await page.waitForFunction(() => {
    const b = document.querySelector('#planNewBody');
    return b && b.children.length > 0;
  });
  await capture(page, 'ขั้น1-เริ่มต้น', 'ขั้นที่ 1 — ชื่อแผน + เลือกรถ (สถานะเริ่มต้น)',
    'ยังไม่กรอกอะไร ปุ่ม "ถัดไป" ยัง disabled');

  // กรอกชื่อแผน + กางเขต + เลือกรถ
  await page.fill('#fPlanName', 'แผนบำรุงรักษาประจำปี 2569');
  await page.click('.rzone[data-region="1"] .rzone-head');          // กางเขต 1 ให้เห็นตารางรถ
  await page.waitForSelector('.rzone[data-region="1"] .rzone-body');
  await page.check('.regionAllChk[data-region="1"]');               // เลือกทั้งเขต 1
  await page.check('.regionAllChk[data-region="2"]');               // เลือกทั้งเขต 2
  await page.waitForTimeout(250);
  await capture(page, 'ขั้น1-เลือกรถแล้ว', 'ขั้นที่ 1 — กรอกชื่อ + กางเขต + เลือกรถแล้ว',
    'เห็นตารางรถรายคันของเขตที่กาง · ตัวนับ "เลือกแล้ว N คัน" อัปเดต · ปุ่มถัดไปติด');

  // → ขั้น 2 รายการอะไหล่
  await page.click('#btnPrimarySub');
  await page.waitForSelector('#grpMode');
  await capture(page, 'ขั้น2-รายการอะไหล่', 'ขั้นที่ 2 — รายการอะไหล่/น้ำมัน/ไส้กรอง',
    'ยอดคำนวณจากรถที่เลือก ปรับจำนวน/ตัด/เพิ่มรายการได้');

  // สลับมุมมองจัดกลุ่มเป็น "ตามภาค" — ฟีเจอร์เด่นของขั้นนี้
  await page.selectOption('#grpMode', 'zone');
  await page.waitForTimeout(250);
  await capture(page, 'ขั้น2-จัดกลุ่มตามภาค', 'ขั้นที่ 2 — สลับจัดกลุ่มตามภาค',
    'dropdown เดียวกันมี ตามชนิด/ตามภาค/ตามเขต/ตามยี่ห้อ');

  // → ขั้น 3 สรุปแผนทั้งปี
  await page.click('#btnPrimarySub');
  await page.waitForFunction(() => /ขั้นที่ 3/.test(document.querySelector('#subBody')?.textContent || ''));
  await capture(page, 'ขั้น3-สรุปแผน', 'ขั้นที่ 3 — สรุปแผนทั้งปี',
    'ทวนสอบรถ/อะไหล่ แยกตามภาคและยี่ห้อ ก่อนออกเลขงาน');

  // กด "ออกเลขงาน" (มี native confirm → ตอบรับอัตโนมัติ) → หน้าเสร็จสิ้น
  await page.click('#btnPrimarySub');
  await page.waitForFunction(() => /ออกเลขงานเรียบร้อย/.test(document.body.textContent));
  await capture(page, 'ออกเลขงานเรียบร้อย', 'ออกเลขงานเรียบร้อย',
    'ได้เลขงาน + timeline "ออกเลข → ส่งเอกสารแจ้งฝ่ายพัสดุ" + ทางไปเฟสต่อ');

  // กลับหน้ารายการแผน — แผนใหม่ต้องโผล่พร้อมเลขงาน
  await page.goto(BASE + '/maintainance-yearly/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const c = document.querySelector('.content');
    return !c || c.children.length > 0;
  });
  await capture(page, 'รายการแผน-มีแผนใหม่', 'กลับหน้ารายการแผน — แผนใหม่ขึ้นพร้อมเลขงาน',
    'จบโฟลว์สร้างแผน: แผนไปต่อเฟสถัดไปจากหน้านี้');

  await browser.close();

  if (errors.length) {
    console.log('\n⚠ pageerror ' + errors.length + ' รายการ:');
    errors.forEach(e => console.log('  ' + e));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), width: WIDTH, flow: 'สร้างแผน / ออกเลขงาน', shots, errors
  }, null, 2));
  console.log('\nรวม ' + shots.length + ' หน้าจอ → ' + path.relative(process.cwd(), OUT));
  if (errors.length) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
