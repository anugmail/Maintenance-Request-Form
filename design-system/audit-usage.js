#!/usr/bin/env node
/* ============================================================
   ไล่ตรวจว่าแต่ละหน้า "หยิบของใน design system ไปใช้ถูกไหม"
   ------------------------------------------------------------
   ต่างจาก compare-figma.js (ที่เทียบ "ค่า" กับไลบรารี Figma)
   ไฟล์นี้ตรวจ "วิธีใช้" ตามกฎข้อ 0 ของ design-system/README.md:
     · ห้ามนิยาม component ซ้ำใน <style> ของหน้า
     · ปุ่มต้องใช้ .btn · ตารางต้องใช้ .tbl
     · ไอคอนต้องเป็น Material Symbols (.ms) ห้ามตัวอักษรสัญลักษณ์/emoji
     · สี/ขนาด/รัศมี ต้องมาจาก token ไม่ใช่ค่าดิบใน inline style
     · .search ต้องอยู่ใน .stack เมื่อวางเหนือลิสต์

   ผลลัพธ์เป็น "จุดที่ต้องเอาตาดู" ไม่ใช่คำตัดสิน — บางเคสมีเหตุผลชอบธรรม
   (ยกเว้นที่ประกาศไว้ใน SKIP/ALLOW ด้านล่าง)

   รัน:  node design-system/audit-usage.js            ทุกเฟส
         node design-system/audit-usage.js 1          เฉพาะเฟส 1
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* แบ่งเฟสตามที่เจ้าของงานสั่ง 12 ส.ค. 2569 ("ไล่แบ่งเฟส ค่อยๆ เช็ค ค่อยๆ รายงาน") */
const PHASES = [
  { n: 1, name: 'โฟลว์แจ้งซ่อม (หน้าหลัก)', files: ['mock/Maintenance-Request-Form.html'] },
  { n: 2, name: 'โฟลว์ กบค. + component กลาง', files: ['mock/Maintenance-Request-Form-flow2.html', 'ui-components.js', 'config.js'] },
  { n: 3, name: 'โฟลว์บำรุงรักษาประจำปี', files: ['maintainance-yearly/index.html', 'maintainance-yearly/plan-new.html', 'maintainance-yearly/supplies.html', 'maintainance-yearly/confirm.html', 'maintainance-yearly/plan-skeleton.html', 'maintainance-yearly/app.js'] },
  { n: 4, name: 'หน้าวิเคราะห์/รายงาน', files: ['outcome-dashboard.html', 'parts-insights.html', 'executive-insights.html', 'repair-history.html'] },
  { n: 5, name: 'daily-record + นัดหมาย + design-mock', files: ['daily-record/index.html', 'daily-record/app.js', 'flow-นัดหมายรับรถ-prototype.html', 'design-mock/index.html', 'design-mock/kbk-self-repair-parts.html', 'design-mock/kbk-self-repair-appointment.html'] },
  { n: 6, name: 'ฮับ + เอกสาร + style guide', files: ['index.html', 'more.html', '05-review-milestones.html', '06-hierarchy-scope.html', '07-dept-size-bridge.html', 'design-system/index.html', 'design-system/buttons.html'] }
];

/* คลาส component กลางที่ "ห้ามนิยามซ้ำ" ในหน้า (ยกของกลางไปใช้แทน) */
const CORE = ['btn', 'card', 'badge', 'chip', 'chips', 'seg', 'tbl', 'tblwrap', 'wstep', 'wsteps',
  'job', 'veh', 'vlist', 'rzone', 'stack', 'sect', 'crumbs', 'page-title', 'fgrid', 'numfld',
  'toast', 'draft', 'tile', 'tl', 'chk', 'qty', 'daterange', 'cal', 'gallery', 'empty', 'search',
  'shell', 'side', 'work', 'topbar', 'content', 'actions', 'footer'];

/* ข้อยกเว้นที่ประกาศไว้แล้ว — ไม่ต้องรายงาน */
const ALLOW_HEX = /#fff\b|#ffffff\b|#000\b|theme-color|admin-config|rainbow|design-system\//i;

/* หน้าเอกสาร/style guide — ตั้งใจโชว์ค่า hex กับเครื่องหมาย ✔ และประกอบตัวอย่างเอง
   README ข้อ 0 ระบุเป็นข้อยกเว้นไว้แล้ว ⇒ ตรวจเฉพาะขนาดฟอนต์ */
const DOC_PAGES = /^(design-system\/|0[567]-|more\.html)/;

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lineOf = (txt, idx) => txt.slice(0, idx).split('\n').length;

function styleBlocks(txt) {
  const out = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(txt))) out.push({ body: m[1], at: m.index });
  return out;
}

function checkFile(f) {
  const txt = read(f);
  const hits = [];
  const isDoc = DOC_PAGES.test(f);
  const add = (kind, line, detail) => hits.push({ kind, line, detail: detail.slice(0, 110).replace(/\s+/g, ' ') });

  // 1) นิยาม component กลางซ้ำใน <style> ของหน้า
  for (const blk of (isDoc ? [] : styleBlocks(txt))) {
    for (const cls of CORE) {
      // ต้องเป็น "ตัวขึ้นต้น selector" เท่านั้น — `.card .sect{}` คือการปรับบริบท ไม่ใช่นิยามซ้ำ
      const re = new RegExp('(^|,)\\s*\\.' + cls.replace(/[-]/g, '\\-') + '(?![-\\w])[^{,]*\\{', 'gm');
      let m;
      while ((m = re.exec(blk.body))) {
        add('นิยาม component ซ้ำในหน้า', lineOf(txt, blk.at + m.index), '.' + cls + ' … ' + m[0]);
      }
    }
  }

  // 2) <button> ที่ไม่ได้ใช้คลาส .btn
  let m;
  const btnRe = isDoc ? /(?!)/g : /<button\b[^>]*>/gi;
  while ((m = btnRe.exec(txt))) {
    const tag = m[0];
    // ปุ่มที่เป็นส่วนหนึ่งของ component ที่มีชื่อ (.qty button · .page-back · .cal-nav · .pf-*)
    // ถือว่าถูกแล้ว — ที่ผิดคือปุ่มเปล่าไม่มีคลาสเลย หรือปุ่มที่จัดสไตล์เองด้วย inline style
    const hasClass = /class\s*=\s*["'][^"']+["']/.test(tag);
    const isBtn = /class\s*=\s*["'][^"']*\bbtn\b/.test(tag);
    const inlineStyled = /style\s*=\s*["'][^"']*(background|border|padding|font)/.test(tag);
    // ปุ่มที่อยู่ในกล่องของ component ที่มีสไตล์ปุ่มในตัว (.qty · .numfld · .cal · .pf-*)
    const inComponent = /class\s*=\s*["'][^"']*\b(qty|numfld|cal|cal-\w+|pf-\w+|seg)\b/.test(txt.slice(Math.max(0, m.index - 200), m.index));
    if (!isBtn && !inComponent && (!hasClass || inlineStyled)) add('ปุ่มไม่ได้ใช้ .btn', lineOf(txt, m.index), tag);
  }

  // 3) <table> ที่ไม่ได้ใช้ .tbl
  const tblRe = isDoc ? /(?!)/g : /<table\b[^>]*>/gi;
  while ((m = tblRe.exec(txt))) {
    if (!/class\s*=\s*["'][^"']*\btbl\b/.test(m[0])) add('ตารางไม่ได้ใช้ .tbl', lineOf(txt, m.index), m[0]);
  }

  // 4) ตัวอักษรสัญลักษณ์ที่ "ทำหน้าที่ไอคอน" — คือเป็นเนื้อหาทั้งหมดของ element
  //    (× → • ในประโยคเป็นเครื่องหมายวรรคตอนปกติ ไม่นับ)
  if (!isDoc) {
    const glyphRe = />\s*([✓✔✕✗▲▼◀▶★☆])\s*</g;
    while ((m = glyphRe.exec(txt))) {
      add('ใช้ตัวอักษรแทนไอคอน', lineOf(txt, m.index), m[1] + ' เป็นเนื้อหาทั้งหมดของ element');
    }
    const glyphJs = /['"`]\s*([✓✔✕✗▲▼◀▶★☆])\s*['"`]/g;   // เช่น cond ? '✓' : n
    while ((m = glyphJs.exec(txt))) {
      add('ใช้ตัวอักษรแทนไอคอน', lineOf(txt, m.index), m[1] + ' เป็นค่าสตริงเดี่ยวใน JS');
    }
  }

  // 5) inline style ที่ใส่ค่าดิบแทน token
  const inlineRe = isDoc ? /(?!)/g : /style\s*=\s*"([^"]*)"/gi;
  while ((m = inlineRe.exec(txt))) {
    const s = m[1];
    const bad = [];
    if (/(^|;)\s*(color|background(-color)?|border-color)\s*:\s*#/i.test(s) && !ALLOW_HEX.test(s)) bad.push('สีดิบ');
    if (/border-radius\s*:\s*\d/.test(s)) bad.push('radius ดิบ');
    const fs_ = s.match(/font-size\s*:\s*([\d.]+)px/);
    if (fs_ && !['12', '14', '16', '18', '20', '22', '24', '26', '28', '32', '34'].includes(fs_[1])) bad.push('font-size ' + fs_[1] + 'px นอกสเกล');
    if (bad.length) add('inline style ค่าดิบ (' + bad.join(', ') + ')', lineOf(txt, m.index), s);
  }

  // 6) ขนาดฟอนต์นอกสเกลใน CSS ของหน้า
  const fsRe = /font-size\s*:\s*([\d.]+)px/g;
  while ((m = fsRe.exec(txt))) {
    const v = m[1];
    // ขนาดไอคอน (.ms) ไม่ได้อยู่ในสเกลตัวอักษร — ไลบรารีใช้ 16/20/24 ตามบริบท
    const around = txt.slice(Math.max(0, m.index - 160), m.index);
    if (/\.ms\b[^{]*\{[^}]*$/.test(around)) continue;
    if (!['12', '14', '16', '18', '20', '22', '24', '26', '28', '32', '34', '11', '10'].includes(v)) {
      add('font-size นอกสเกล', lineOf(txt, m.index), m[0]);
    } else if (['11', '10'].includes(v)) {
      add('font-size เล็กกว่าสเกลไลบรารี (12 คือเล็กสุด)', lineOf(txt, m.index), m[0]);
    }
  }

  // 7) .search ที่ไม่ได้อยู่ใน .stack (บทเรียน 10 ส.ค. — ระยะหายไป 0px)
  const searchRe = isDoc ? /(?!)/g : /class\s*=\s*["'][^"']*\bsearch\b[^"']*["']/g;
  while ((m = searchRe.exec(txt))) {
    const before = txt.slice(Math.max(0, m.index - 400), m.index);
    if (!/class\s*=\s*["'][^"']*\bstack\b/.test(before)) add('.search อาจไม่ได้ห่อ .stack', lineOf(txt, m.index), m[0]);
  }

  return hits;
}

function main() {
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  let grand = 0;
  for (const ph of PHASES) {
    if (only && ph.n !== only) continue;
    console.log('\n══════ เฟส ' + ph.n + ' — ' + ph.name + ' ══════');
    for (const f of ph.files) {
      if (!fs.existsSync(path.join(ROOT, f))) { console.log('  (ไม่พบไฟล์ ' + f + ')'); continue; }
      const hits = checkFile(f);
      grand += hits.length;
      if (!hits.length) { console.log('  ✓ ' + f + ' — ไม่พบจุดน่าสงสัย'); continue; }
      const byKind = hits.reduce((a, h) => { (a[h.kind] = a[h.kind] || []).push(h); return a; }, {});
      console.log('  • ' + f + ' — ' + hits.length + ' จุด');
      for (const [kind, list] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
        console.log('      [' + list.length + '] ' + kind);
        list.slice(0, 4).forEach(h => console.log('           บรรทัด ' + h.line + '  ' + h.detail));
        if (list.length > 4) console.log('           … อีก ' + (list.length - 4));
      }
    }
  }
  console.log('\nรวมจุดที่ต้องเอาตาดู ' + grand);
}

main();
