#!/usr/bin/env node
/* ============================================================
   capture ทุกหน้า prototype เป็น PNG สำหรับบอร์ด FigJam
   ------------------------------------------------------------
   ต่างจาก 1-extract.js: ไม่เดิน DOM — เอาแค่ภาพ จึงครอบทุกหน้าได้
   รวม admin/plan-skeleton ที่ท่อ Figma design ทำไม่ได้/พักไว้

   ทำไม scale 1 (ไม่ใช่ 2): Figma จำกัดรูปด้านละ 4096px —
   ที่ 2x หน้ากว้าง 1440 จะกลายเป็น 2880 และหน้าสูง 2048+ เกินลิมิตหมด

   หน้าสูงเกิน SLICE_H จะถูกหั่นเป็นท่อนแนวตั้ง <slug>-1.png, -2.png …
   วิธีหั่น: ขยาย viewport ให้สูงเท่าหน้าจริงก่อน (fixed element วาดครั้งเดียว
   ไม่โผล่ซ้ำทุกท่อน) แล้ว clip ทีละช่วง

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/figjam-capture.js
   ผลลัพธ์: out/figjam/*.png + out/figjam/manifest.json (กลุ่ม/ชื่อ/ลำดับ flow)
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out', 'figjam');
const WIDTH = 1440;
const SLICE_H = 4000;       // เพดานความสูงต่อรูป (ลิมิต Figma 4096 เผื่อขอบ)
const VIEW_MAX = 8000;      // เพดาน viewport ของ Chromium ที่ยังนิ่ง

/* กลุ่มตามที่จะวางบนบอร์ด — ลำดับในไฟล์นี้ = ลำดับบนบอร์ด */
const GROUPS = [
  { group: 'โฟลว์บำรุงรักษาประจำปี', pages: [
    { slug: 'my-index',         path: '/maintainance-yearly/index.html',         name: 'รายการแผนบำรุงรักษา' },
    { slug: 'my-plan-new',      path: '/maintainance-yearly/plan-new.html',      name: 'ออกเลขงาน' },
    { slug: 'my-supplies',      path: '/maintainance-yearly/supplies.html',      name: 'ฝ่ายพัสดุ' },
    { slug: 'my-confirm',       path: '/maintainance-yearly/confirm.html',       name: 'ยืนยันรถเข้าร่วมแผน' },
    { slug: 'my-plan-skeleton', path: '/maintainance-yearly/plan-skeleton.html', name: 'โครงหน้าจอทั้งโฟลว์' },
    { slug: 'my-admin',         path: '/maintainance-yearly/admin.html',         name: 'ตั้งค่าโฟลว์ (admin)' }
  ] },
  { group: 'Insight / Outcome', pages: [
    { slug: 'executive-insights', path: '/executive-insights.html', name: 'มุมผู้บริหาร' },
    { slug: 'outcome-dashboard',  path: '/outcome-dashboard.html',  name: 'Outcome dashboard' },
    { slug: 'repair-history',     path: '/repair-history.html',     name: 'ประวัติงานซ่อม' },
    { slug: 'parts-insights',     path: '/parts-insights.html',     name: 'มุมมองอะไหล่' }
  ] },
  { group: 'โฟลว์นัดหมายรับรถ', pages: [
    { slug: 'flow-appointment', path: '/flow-นัดหมายรับรถ-prototype.html', name: 'นัดหมายรับรถ (กบค. ช่วง 4)' }
  ] },
  { group: 'Admin / โครงสร้าง', pages: [
    { slug: 'admin-config',         path: '/admin-config.html',         name: 'ตั้งค่าระบบ' },
    { slug: '05-review-milestones', path: '/05-review-milestones.html', name: 'Review milestones' },
    { slug: '06-hierarchy-scope',   path: '/06-hierarchy-scope.html',   name: 'โครงสร้างหน้างาน' },
    { slug: '07-dept-size-bridge',  path: '/07-dept-size-bridge.html',  name: 'สะพานขนาดหน่วยงาน' },
    { slug: 'more',                 path: '/more.html',                 name: 'เพิ่มเติม' }
  ] },
  { group: 'ฟอร์มแจ้งซ่อม (mock)', pages: [
    { slug: 'mock-form',        path: '/mock/Maintenance-Request-Form.html',       name: 'ฟอร์มแจ้งซ่อม' },
    { slug: 'mock-form-flow2',  path: '/mock/Maintenance-Request-Form-flow2.html', name: 'ฟอร์มแจ้งซ่อม flow2' },
    { slug: 'design-mock',      path: '/design-mock/index.html',                   name: 'Design mock' },
    { slug: 'kbk-appointment',  path: '/design-mock/kbk-self-repair-appointment.html', name: 'กบค. นัดซ่อมเอง' },
    { slug: 'kbk-parts',        path: '/design-mock/kbk-self-repair-parts.html',   name: 'กบค. อะไหล่ซ่อมเอง' },
    { slug: 'daily-record',     path: '/daily-record/index.html',                  name: 'บันทึกประจำวัน' }
  ] },
  { group: 'ฮับ + Design system', pages: [
    { slug: 'hub',        path: '/index.html',               name: 'ฮับรวมลิงก์' },
    { slug: 'ds-index',   path: '/design-system/index.html', name: 'Design system' },
    { slug: 'ds-buttons', path: '/design-system/buttons.html', name: 'Design system — ปุ่ม' }
  ] }
];

/* ลำดับลูกศรบนบอร์ด — เฉพาะโฟลว์บำรุงรักษา (ตาม Diagram/) */
const FLOW = ['my-index', 'my-plan-new', 'my-supplies', 'my-confirm'];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: 1000 },
    deviceScaleFactor: 1
  });

  const errors = [];
  const manifest = { generatedAt: new Date().toISOString(), width: WIDTH, flow: FLOW, groups: [] };

  for (const g of GROUPS) {
    const mg = { group: g.group, pages: [] };
    for (const p of g.pages) {
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(p.slug + ': ' + e.message));

      await page.goto(BASE + encodeURI(p.path), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // หน้า JS-rendered ต้องรอกล่องเนื้อหามีลูกจริง — หน้าไม่มี .content ผ่านทันที
      await page.waitForFunction(() => {
        const c = document.querySelector('.content');
        return !c || c.children.length > 0;
      }, null, { timeout: 5000 }).catch(() => errors.push(p.slug + ': .content ยังว่างหลังรอ 5 วิ'));
      await page.waitForTimeout(400);

      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      const viewH = Math.min(Math.max(h, 900), VIEW_MAX);
      await page.setViewportSize({ width: WIDTH, height: viewH });
      await page.waitForTimeout(200);
      if (h > VIEW_MAX) errors.push(p.slug + ': สูง ' + h + 'px เกินเพดาน viewport ' + VIEW_MAX + ' — ภาพขาดท้าย');

      const title = (await page.title()) || p.name;
      const slices = [];
      if (viewH <= SLICE_H) {
        const file = p.slug + '.png';
        await page.screenshot({ path: path.join(OUT, file), clip: { x: 0, y: 0, width: WIDTH, height: viewH } });
        slices.push({ file, w: WIDTH, h: viewH });
      } else {
        let i = 0;
        for (let y = 0; y < viewH; y += SLICE_H) {
          const sh = Math.min(SLICE_H, viewH - y);
          const file = p.slug + '-' + (++i) + '.png';
          await page.screenshot({ path: path.join(OUT, file), clip: { x: 0, y, width: WIDTH, height: sh } });
          slices.push({ file, w: WIDTH, h: sh });
        }
      }

      mg.pages.push({ slug: p.slug, name: p.name, path: p.path, title, pageHeight: h, slices });
      console.log('✓ ' + p.slug.padEnd(22) + 'สูง ' + String(h).padStart(5) + 'px · ' + slices.length + ' รูป');
      await page.close();
    }
    manifest.groups.push(mg);
  }

  await browser.close();

  if (errors.length) {
    console.log('\n⚠ ปัญหา ' + errors.length + ' รายการ:');
    errors.forEach(e => console.log('  ' + e));
  }
  manifest.errors = errors;
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const total = manifest.groups.reduce((a, g) => a + g.pages.reduce((b, p) => b + p.slices.length, 0), 0);
  console.log('\nรวม ' + total + ' รูปจาก ' + manifest.groups.reduce((a, g) => a + g.pages.length, 0) + ' หน้า → ' + path.relative(process.cwd(), OUT));
}

main().catch(e => { console.error(e); process.exit(1); });
