#!/usr/bin/env node
/* ============================================================
   โฟลว์ต่อจาก "ออกเลขงาน": พัสดุรับทราบ → ส่งคำขอยืนยันรถ → หน่วยงานตอบ
   ------------------------------------------------------------
   เดินเรื่องต่อจาก flow-plan-capture.js — สร้างแผนใหม่แบบเร็ว (ไม่ capture)
   แล้วไล่เก็บหน้าจอฝั่ง กบค. (เฟส 1) / ฝ่ายพัสดุ / หน่วยงานเจ้าของรถ

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/flow-after-issue-capture.js
   ผลลัพธ์: out/figjam/flow-after-issue/NN-<ชื่อ>.png + manifest.json
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out', 'figjam', 'flow-after-issue');
const WIDTH = 1440;

const shots = [];
const errors = [];

async function capture(page, slug, name, note) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  const file = String(shots.length + 1).padStart(2, '0') + '-' + slug + '.png';
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize({ width: WIDTH, height: 1000 });
  shots.push({ file, slug, name, note, w: WIDTH, h });
  console.log('✓ ' + file.padEnd(38) + name);
}

const waitContent = (page, sel) => page.waitForFunction((s) => {
  const c = document.querySelector(s);
  return c && c.children.length > 0;
}, sel);

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());

  // ---- setup เร็ว: สร้างแผน + ออกเลขงาน (ซ้ำโฟลว์ที่ capture ไปแล้ว ไม่เก็บภาพ) ----
  await page.goto(BASE + '/maintainance-yearly/plan-new.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await waitContent(page, '#planNewBody');
  await page.fill('#fPlanName', 'แผนบำรุงรักษาประจำปี 2569');
  await page.check('.regionAllChk[data-region="1"]');
  await page.check('.regionAllChk[data-region="2"]');
  await page.click('#btnPrimarySub');                       // → ขั้น 2
  await page.waitForSelector('#grpMode');
  await page.click('#btnPrimarySub');                       // → ขั้น 3
  await page.waitForFunction(() => /ขั้นที่ 3/.test(document.querySelector('#subBody')?.textContent || ''));
  await page.click('#btnPrimarySub');                       // ออกเลขงาน (dialog ตอบรับอัตโนมัติ)
  await page.waitForFunction(() => /ออกเลขงานเรียบร้อย/.test(document.body.textContent));

  // ---- ฝั่ง กบค.: เปิดแผนทำเฟสต่อ — ขั้นยืนยันรถ ----
  await Promise.all([
    page.waitForEvent('load'),
    page.click('a:has-text("เปิดแผนนี้เพื่อทำเฟสต่อไป")')
  ]);
  await waitContent(page, '.content');
  await capture(page, 'เปิดแผน-ขั้นยืนยันรถ', 'กบค. เปิดแผน — ขั้นที่ 1 ยืนยันรถเข้าร่วมแผน',
    'สรุปหน่วยงาน/จำนวนคันที่จะส่งคำขอ + ปุ่ม "ส่งคำขอยืนยัน"');

  await page.click('#btnSendConfirm');
  await page.waitForTimeout(400);
  await capture(page, 'ส่งคำขอยืนยันแล้ว', 'กบค. ส่งคำขอยืนยันแล้ว — ตารางติดตามรายหน่วยงาน',
    'สถานะรอคำตอบรายคัน/รายหน่วยงาน + ปุ่มทวงเตือน');

  // ---- ฝั่งฝ่ายพัสดุ: เอกสารแจ้งเตรียม/สั่งอะไหล่ ----
  await page.goto(BASE + '/maintainance-yearly/supplies.html', { waitUntil: 'networkidle' });
  await waitContent(page, '#supBody');
  await capture(page, 'พัสดุ-รายการเอกสาร', 'ฝ่ายพัสดุ — รายการเอกสารจาก กบค.',
    'ใบใหม่ขึ้นสถานะ "รอรับทราบ"');

  await page.click('#supBody a.btn:has-text("เปิดเอกสาร")');
  await page.waitForSelector('#btnAck');
  await capture(page, 'พัสดุ-เปิดเอกสาร', 'ฝ่ายพัสดุ — เอกสารแจ้งเตรียม/สั่งอะไหล่',
    'รายละเอียดรถ/อะไหล่ทั้งแผน + ปุ่ม "รับทราบ" (ไม่ใช่การอนุมัติ)');

  await page.click('#btnAck');
  await page.waitForTimeout(400);
  await capture(page, 'พัสดุ-รับทราบแล้ว', 'ฝ่ายพัสดุ — รับทราบแล้ว',
    'badge เปลี่ยนเป็น "รับทราบแล้ว" + ลง timeline ของแผน');

  // ---- ฝั่งหน่วยงานเจ้าของรถ: ตอบคำขอยืนยัน ----
  await page.goto(BASE + '/maintainance-yearly/confirm.html', { waitUntil: 'networkidle' });
  await waitContent(page, '#cfBody');
  await capture(page, 'หน่วยงาน-รายการคำขอ', 'หน่วยงานเจ้าของรถ — รายการคำขอยืนยัน',
    'คำขอแตกเป็นราย (แผน × หน่วยงาน)');

  // เจาะคำขอของแผนที่เพิ่งสร้าง — แถวแรกอาจเป็นแผน seed ที่ปิดรับคำตอบแล้ว
  await page.click('#cfBody tr:has-text("MT-2569-Q4-001") a.btn >> nth=0');
  await page.waitForSelector('#btnAnswer');
  await capture(page, 'หน่วยงาน-ตอบรายคัน', 'หน่วยงานเจ้าของรถ — ตอบยืนยันรายคัน',
    'ตอบ พร้อม/ไม่พร้อม + เหตุผล + จุดนัดรับ แล้วส่งคำตอบกลับ กบค.');

  await browser.close();

  if (errors.length) {
    console.log('\n⚠ pageerror ' + errors.length + ' รายการ:');
    errors.forEach(e => console.log('  ' + e));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), width: WIDTH, flow: 'หลังออกเลขงาน (พัสดุ + ยืนยันรถ)', shots, errors
  }, null, 2));
  console.log('\nรวม ' + shots.length + ' หน้าจอ → ' + path.relative(process.cwd(), OUT));
  if (errors.length) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
