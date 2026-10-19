#!/usr/bin/env node
/* ============================================================
   Overhaul v2 — capture หน้าจอ HTML ครบ 14 scenario สำหรับบอร์ด FigJam
   ------------------------------------------------------------
   ลำดับและชื่อจอตรงกับปลั๊กอิน Figma (overhaul2-plugin/code.js SCENARIOS) — บอร์ด FigJam ใช้รีวิว flow
   ส่วนไฟล์ Figma design ใช้ component จริง (เจ้าของงานสั่ง 19 ต.ค. 2569 "ทำ figjam ให้ด้วย")
   ไล่กดจริงบน design-mock/overhaul-v2-0*.html · เริ่มจาก localStorage ว่างเสมอ

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/flow-overhaul2-capture.js
     node figma-export/3-figjam-board.js --overhaul2 --only --out=board-overhaul2.json
   ผลลัพธ์: out/figjam/flow-overhaul2/NN-<slug>.png + manifest.json (มี scenario ของแต่ละจอ)
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = (process.env.BASE || 'http://127.0.0.1:8123') + '/design-mock/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out', 'figjam', 'flow-overhaul2');
const WIDTH = 1440;
const MAX_H = 4000;   // FigJam รับรูปไม่เกิน 4096 px ต่อด้าน

const shots = [];
const errors = [];
let scenario = '';

async function capture(page, name, { keepNotif = false } = {}) {
  await page.evaluate(() => document.fonts.ready);
  if (!keepNotif) await page.evaluate(() => { const n = document.getElementById('notif'); if (n) n.classList.remove('show'); });
  await page.waitForTimeout(350);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 1024), MAX_H) });
  await page.waitForTimeout(250);
  const sc = scenario.split(' · ')[0];
  const file = String(shots.length + 1).padStart(2, '0') + '-' + (/^S\d+$/.test(sc) ? sc : 'list') + '.png';   // ชื่อไฟล์ ASCII ล้วน — โหลดผ่าน serve.js ได้แน่นอน
  await page.screenshot({ path: path.join(OUT, file) });
  const hh = Math.min(Math.max(h, 1024), MAX_H);
  await page.setViewportSize({ width: WIDTH, height: 1024 });
  shots.push({ file, slug: file.replace(/\.png$/, ''), name, scenario, note: '', w: WIDTH, h: hh });
  console.log('✓ ' + file.padEnd(16) + scenario.split(' · ')[0] + ' — ' + name);
}
const go = async (page, url) => { await page.goto(BASE + url, { waitUntil: 'networkidle' }); await page.waitForTimeout(600); };
const iso = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const pdf = (name, kb) => ({ name, mimeType: 'application/pdf', buffer: Buffer.alloc((kb || 200) * 1024) });

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await (await browser.newContext({ viewport: { width: WIDTH, height: 1024 }, deviceScaleFactor: 1, locale: 'th-TH', timezoneId: 'Asia/Bangkok' })).newPage();   // ช่องวันที่/เวลาแสดงแบบไทย
  page.on('pageerror', (e) => errors.push(e.message));
  const reset = async () => { await go(page, 'overhaul-v2-01-plans.html'); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(500); };
  const row = (id) => page.locator('tbody tr', { hasText: id });

  /* ---- หน้ารายการแผน ---- */
  scenario = 'หน้ารายการแผน — ค้นหา · ตัวกรอง · ค้นไม่เจอ · ยังไม่มีแผน';
  await reset();
  await capture(page, 'รายการแผน');
  await page.click('#fbtn'); await page.click('#f-car-in'); await page.fill('#f-car-in', 'สงขลา'); await page.waitForTimeout(200);
  await capture(page, 'ตัวกรอง');
  await page.click('#f-car .combo-opt'); await page.click('#fapply');
  await capture(page, 'ผลกรองด้วยรถ');
  await page.click('#fbtn'); await page.click('#fclear'); await page.click('#fapply'); await page.fill('#q', 'ไม่มีแผนนี้');
  await capture(page, 'ค้นไม่เจอ');
  await page.click('#clear'); await page.click('#wipe');
  await capture(page, 'ยังไม่มีแผน');

  /* ---- S1 สร้างแผน ---- */
  scenario = 'S1 · กบค. สร้างแผน Overhaul';
  await reset(); await go(page, 'overhaul-v2-02-plan-form.html');
  await capture(page, 'ฟอร์มสร้างแผน (ว่าง)');
  await page.click('#save');
  await capture(page, 'กดบันทึกโดยยังไม่ครบ');
  await page.fill('#name', 'Overhaul ประจำปีงบ 2570 — รถเจาะหลุม'); await page.fill('#budget', '5500000'); await page.click('#wbs');
  await page.fill('#wbs', 'C-70-OH-0003'); await page.fill('#net', '60002103'); await page.fill('#act', '0010');
  await page.setInputFiles('[data-files=approve] input[type=file]', [pdf('อนุมัติหลักการ.pdf', 293)]);
  await page.setInputFiles('[data-files=budget] input[type=file]', [{ name: 'อนุมัติงบ.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(117 * 1024) }, { name: 'สรุป.docx', mimeType: 'application/msword', buffer: Buffer.alloc(1000) }]);
  await capture(page, 'กรอกครบ');
  await page.click('#back');
  await capture(page, 'ย้อนกลับ — ยืนยันการออก');
  await page.click('#m-leave [data-close]'); await page.check('#simfail'); await page.click('#save');
  await capture(page, 'บันทึกไม่สำเร็จ', { keepNotif: true });
  await page.uncheck('#simfail'); await page.click('#save'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
  await capture(page, 'บันทึกสำเร็จ', { keepNotif: true });
  await go(page, 'overhaul-v2-03-plan-detail.html?id=123461');
  await capture(page, 'ดูรายละเอียดแผน');

  /* ---- S2 แก้ไขแผน ---- */
  scenario = 'S2 · กบค. แก้ไขแผน';
  await reset(); await row('123456').locator('summary').click(); await page.waitForTimeout(200);
  await capture(page, 'เมนู "…" → แก้ไข');
  await go(page, 'overhaul-v2-02-plan-form.html?id=123456&from=detail');
  await capture(page, 'ฟอร์มแก้ไข (เติมค่าเดิม)');
  await page.fill('#budget', '11,000,000'); await page.click('#save');
  await capture(page, 'ยืนยันการแก้ไขแผน');
  await page.click('#m-edit-ok'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
  await capture(page, 'บันทึกสำเร็จ', { keepNotif: true });

  /* ---- S3 ลบแผน ---- */
  scenario = 'S3 · กบค. ลบแผน';
  await reset(); await row('123460').locator('summary').click(); await page.waitForTimeout(200);
  await capture(page, 'เมนู "…" → ลบ');
  await row('123460').locator('[data-del]').click();
  await capture(page, 'ยืนยันการลบแผน');
  await page.click('#m-del-ok');
  await capture(page, 'ลบสำเร็จ', { keepNotif: true });

  /* ---- S4 สร้าง PO ---- */
  scenario = 'S4 · กบค. สร้าง Purchase order';
  await reset(); await go(page, 'overhaul-v2-03-plan-detail.html?id=123458');
  await capture(page, 'รายละเอียดแผน (ยังไม่มี PO)');
  await page.click('#add-po'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
  await capture(page, 'ฟอร์ม PO (ว่าง)');
  await page.click('#save');
  await capture(page, 'กดบันทึกโดยยังไม่ครบ');
  await page.fill('#name', 'ซ่อมระบบเครื่องยนต์และเจาะหลุม'); await page.click('#vendor-in'); await page.fill('#vendor-in', 'ตรีเพชร'); await page.waitForTimeout(200);
  await capture(page, 'เลือกอู่ (พิมพ์ค้น)');
  await page.click('#vendor .combo-opt'); await page.fill('#car-q', 'เจาะหลุม'); await page.check('#all-l');
  await capture(page, 'ติ๊กรถแล้วกดเพิ่ม');
  await page.click('#to-r'); await page.fill('#car-q', '');
  await page.setInputFiles('[data-files=order] input[type=file]', [pdf('ใบสั่งจ้าง.pdf', 195)]);
  await capture(page, 'กรอกครบ');
  await page.click('#save'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
  await capture(page, 'บันทึกสำเร็จ', { keepNotif: true });
  await go(page, 'overhaul-v2-05-po-detail.html?plan=123456&po=PO-690101');
  await capture(page, 'รายละเอียด PO');

  /* ---- S5 แก้ไข PO ---- */
  scenario = 'S5 · กบค. แก้ไข Purchase order';
  await reset(); await go(page, 'overhaul-v2-03-plan-detail.html?id=123456');
  await page.locator('#po-body tr').first().locator('summary').click(); await page.waitForTimeout(200);
  await capture(page, 'เมนู "…" ของ PO → แก้ไข');
  await go(page, 'overhaul-v2-04-po-form.html?plan=123456&po=PO-690101&from=po');
  await capture(page, 'ฟอร์มแก้ไข PO');
  await page.fill('#name', 'ซ่อมระบบเครื่องยนต์และเกียร์'); await page.click('#save');
  await capture(page, 'ยืนยันการแก้ไข PO');
  await page.click('#m-edit-ok'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
  await capture(page, 'บันทึกสำเร็จ', { keepNotif: true });

  /* ---- S6 ลบ PO ---- */
  scenario = 'S6 · กบค. ลบ purchase order';
  await reset(); await go(page, 'overhaul-v2-03-plan-detail.html?id=123456');
  await page.locator('#po-body tr').first().locator('summary').click(); await page.locator('#po-body tr').first().locator('[data-delpo]').click();
  await capture(page, 'ยืนยันการลบ PO');
  await page.click('#m-del-ok');
  await capture(page, 'ลบสำเร็จ', { keepNotif: true });

  /* ---- S7–S14 หน้างานรายคัน (เดินคันเดียวตั้งแต่ V1 จนปิดงาน) ---- */
  await reset(); await go(page, 'overhaul-v2-06-job.html?plan=123460&car=c8&po=PO-700201');
  const act = (a) => page.click(`[data-act=${a}]`);
  scenario = 'S7 · กบค. นัดหมายหน่วยงาน นำรถเข้า overhaul';
  await capture(page, 'ฟอร์มนัด (ว่าง)');
  await act('send-appt');
  await capture(page, 'กดยืนยันโดยยังไม่ครบ');
  await page.fill('#ap-from', iso(3)); await page.fill('#ap-to', iso(5)); await page.click('#ap-coord-in'); await page.waitForTimeout(200);
  await capture(page, 'เลือกผู้ประสานงาน');
  await page.click('#ap-coord .combo-opt'); await page.check('#simfail'); await act('send-appt');
  await capture(page, 'สร้างนัดไม่สำเร็จ', { keepNotif: true });
  await page.uncheck('#simfail'); await act('send-appt'); await page.waitForTimeout(300);
  await capture(page, 'รอหน่วยงานตอบรับ', { keepNotif: true });
  await page.fill('#rej-remark', 'รถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป'); await act('reply-no'); await page.waitForTimeout(300);
  await capture(page, 'หน่วยงานปฏิเสธ');
  await act('edit-appt'); await page.fill('#ap-from', iso(10)); await page.fill('#ap-to', iso(12));
  await capture(page, 'แก้ไขนัดหมาย');
  await act('send-appt'); await page.waitForTimeout(300); await act('reply-ok'); await page.waitForTimeout(300);

  scenario = 'S8 · กบค. ตรวจรับรถก่อน Overhaul';
  await capture(page, 'รายการตรวจสอบ');
  for (const c of await page.$$('[data-ck]')) await c.check();
  await page.selectOption('#sg-kbk', { index: 1 }); await page.click('[data-act=sign][data-side=kbk]');
  await page.selectOption('#sg-unit', { index: 1 }); await page.click('[data-act=sign][data-side=unit]');
  await capture(page, 'ตรวจครบ + ลงนาม 2 ฝ่าย');
  await act('checkin'); await page.waitForTimeout(300);

  scenario = 'S9 · กบค. เพิ่มการติดตามผลการดำเนินการ overhaul';
  await capture(page, 'ยังไม่มีความคืบหน้า');
  await act('log-add'); await page.fill('#log-note', 'รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน');
  await capture(page, 'เพิ่มความคืบหน้า');
  await page.click('#m-log-ok'); await act('log-add'); await page.fill('#log-note', 'เปลี่ยนชุดลูกสูบและแหวน ประกอบกลับ'); await page.click('#m-log-ok');
  await capture(page, 'มีความคืบหน้า 2 รายการ');

  scenario = 'S10 · กบค. แก้ไข การติดตามผลการดำเนินการ overhaul';
  await page.click('[data-act=log-edit][data-i="0"]');
  await capture(page, 'แก้ไขความคืบหน้า');
  await page.click('#m-log [data-close]');

  scenario = 'S11 · กบค. ลบ การติดตามผลการดำเนินการ overhaul';
  await page.click('[data-act=log-del][data-i="1"]');
  await capture(page, 'ยืนยันการลบความคืบหน้า');
  await page.click('#m-del-ok');
  await capture(page, 'เหลือ 1 รายการ (ลบไม่ได้แล้ว)');
  await act('repaired'); await page.waitForTimeout(300);

  scenario = 'S12 · กบค. upload เอกสารด้านความปลอดภัย';
  await capture(page, 'ยังไม่มีเอกสาร');
  await page.setInputFiles('#sf input[type=file]', [pdf('Safety-Inspection.pdf', 293)]);
  await capture(page, 'อัปโหลดแล้ว');
  await act('safety'); await page.waitForTimeout(300);

  scenario = 'S13 · กบค. นัดหมายหน่วยงานส่งคืนรถ';
  await capture(page, 'ฟอร์มนัดรับรถ (ค่าอู่ตั้งต้น)');
  await page.fill('#ap-from', iso(20)); await page.fill('#ap-to', iso(21)); await page.click('#ap-coord-in'); await page.click('#ap-coord .combo-opt'); await act('send-appt'); await page.waitForTimeout(300);
  await capture(page, 'รอหน่วยงานตอบรับ');
  await act('reply-no'); await page.waitForTimeout(300);
  await capture(page, 'หน่วยงานปฏิเสธ');
  await act('edit-appt'); await act('send-appt'); await page.waitForTimeout(300); await act('reply-ok'); await page.waitForTimeout(300);

  scenario = 'S14 · กบค. ปิดงาน';
  await capture(page, 'ยังไม่ได้ระบุอะไหล่');
  await page.fill('#pt-name', 'ชุดลูกสูบพร้อมแหวน'); await page.fill('#pt-qty', '6'); await page.selectOption('#pt-unit', 'ชุด'); await act('part-add');
  await page.setInputFiles('#part-file', [{ name: 'อะไหล่.xlsx', mimeType: 'application/vnd.ms-excel', buffer: Buffer.alloc(1000) }]);
  await capture(page, 'ระบุอะไหล่แล้ว');
  await act('close'); await page.waitForTimeout(300);
  await capture(page, 'ปิดงานแล้ว', { keepNotif: true });

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), width: WIDTH, flow: 'Overhaul v2 — 14 scenario', shots, errors }, null, 2));
  console.log('\nรวม ' + shots.length + ' จอ → ' + path.relative(process.cwd(), OUT) + (errors.length ? ' · ⚠ pageerror ' + errors.length + ': ' + errors.join(' / ') : ''));
  if (errors.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
