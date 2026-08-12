#!/usr/bin/env node
/* ============================================================
   ท่อนที่ 1 — เปิดหน้าจริงด้วยเบราว์เซอร์แล้วเก็บ DOM + computed style
   ------------------------------------------------------------
   ทำไมต้องเปิดเบราว์เซอร์: 6 หน้านี้เนื้อหามาจาก JS ทั้งหมด
   (`<div id="planNewBody"></div>` แล้ว plan-new.js เติม) parse HTML ดิบได้ศูนย์

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<scratchpad>/node_modules node figma-export/1-extract.js

   ผลลัพธ์: out/dom-<slug>.json + out/shot-<slug>.png (ไว้เทียบด้วยตาทีหลัง)
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out');
const WIDTH = 1440;

const PAGES = [
  { slug: 'index',         path: '/maintainance-yearly/index.html',         name: 'รายการแผนบำรุงรักษา' },
  { slug: 'plan-new',      path: '/maintainance-yearly/plan-new.html',      name: 'ออกเลขงาน' },
  { slug: 'supplies',      path: '/maintainance-yearly/supplies.html',      name: 'ฝ่ายพัสดุ' },
  { slug: 'confirm',       path: '/maintainance-yearly/confirm.html',       name: 'ยืนยันรถเข้าร่วมแผน' },
  { slug: 'plan-skeleton', path: '/maintainance-yearly/plan-skeleton.html', name: 'โครงหน้าจอทั้งโฟลว์' }
  // admin.html ตัดออก — 3,770 node · JSON 5.6MB · ส่งผ่าน postMessage แล้ว Figma อืด
  // ถ้าจะเอากลับ ต้องตัดแถวตารางให้เหลือตัวอย่างไม่กี่แถวก่อน

];

/* walkDom แยกไปอยู่ dom-walk.js — แชร์กับ flow-report-extract.js */
const { walkDom } = require('./dom-walk');

/* ------------------------------------------------------------ */
async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: 1000 },
    deviceScaleFactor: 2
  });

  const errors = [];
  const summary = [];

  for (const p of PAGES) {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(p.slug + ': ' + e.message));

    const url = BASE + p.path;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // หน้าพวกนี้เติมเนื้อหาด้วย JS หลัง load — รอจนกล่องเนื้อหามีลูกจริง
    await page.waitForFunction(() => {
      const c = document.querySelector('.content');
      return !c || c.children.length > 0;
    }, null, { timeout: 5000 }).catch(() => errors.push(p.slug + ': .content ยังว่างหลังรอ 5 วิ'));
    await page.waitForTimeout(400);

    // ขยาย viewport ให้สูงเท่าหน้าจริง เพื่อไม่ต้องเลื่อน — rect จะได้เป็นพิกัดหน้าตรงๆ
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
    await page.waitForTimeout(200);

    const data = await page.evaluate(walkDom);
    await page.screenshot({ path: path.join(OUT, 'shot-' + p.slug + '.png'), fullPage: true });

    const payload = {
      version: 1,
      slug: p.slug,
      name: p.name,
      source: p.path,
      viewport: { width: WIDTH, height: data.docHeight },
      extractedAt: new Date().toISOString(),
      root: data.root
    };
    fs.writeFileSync(path.join(OUT, 'dom-' + p.slug + '.json'), JSON.stringify(payload));

    const kb = Math.round(fs.statSync(path.join(OUT, 'dom-' + p.slug + '.json')).size / 1024);
    summary.push({ slug: p.slug, nodes: data.counted, height: data.docHeight, kb });
    console.log('✓ ' + p.slug.padEnd(14) + data.counted + ' node · สูง ' + data.docHeight + 'px · ' + kb + 'KB');

    await page.close();
  }

  await browser.close();

  if (errors.length) {
    console.log('\n⚠ เจอปัญหา ' + errors.length + ' รายการ:');
    errors.forEach(e => console.log('  ' + e));
  }
  fs.writeFileSync(path.join(OUT, 'extract-summary.json'), JSON.stringify({ summary, errors }, null, 2));
  console.log('\nเขียนลง ' + path.relative(process.cwd(), OUT) + '/ แล้ว');
  if (errors.length) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
