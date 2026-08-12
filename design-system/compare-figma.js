#!/usr/bin/env node
/* ============================================================
   เทียบ components.css / tokens.css กับไลบรารี Figma EXT_PEA_VMS
   ------------------------------------------------------------
   อ่านจาก .figma-extract/ (สกัดไว้แล้ว ไม่ต้องต่อ Figma — token revoke แล้ว)
   ใช้ตอบคำสั่งเจ้าของงาน 12 ส.ค. 2569: "ยึดตาม design ห้ามกำหนดเอง
   เช็คทั้งโปรเจ็คว่ามีตรงไหนไม่ตรง"

   ขอบเขตที่เทียบ = base component ที่ไลบรารีนิยามไว้ชัด
   (input/select/textarea/badge/tag/table/checkbox/radio/breadcrumb)
   ส่วนโครงหน้า (.shell/.side/.wsteps/.sect/.page-title) มาจาก
   screenshot หน้าจริง VMS Plus — ไลบรารีไม่มีของเทียบ ไม่อยู่ในรายงานนี้

   รัน:  node design-system/compare-figma.js          รายงานทุกตัว
         node design-system/compare-figma.js input    เฉพาะหัวข้อที่ชื่อมีคำนี้
   ============================================================ */

const fs = require('fs');
const path = require('path');

const EX = path.join(__dirname, '.figma-extract');
if (!fs.existsSync(EX)) {
  console.error('ไม่พบ .figma-extract/ — ข้อมูลอยู่นอก git ต้องใช้เครื่องที่สกัดไว้ (ดู SOURCES.md)');
  process.exit(1);
}

const load = (f) => JSON.parse(fs.readFileSync(path.join(EX, f + '.json'), 'utf8'));

function findSet(doc, name) {
  return doc.sets.find(s => s.name === name);
}
function pickVariant(set, re) {
  return (set.kids || []).find(k => re.test(k.name));
}
function descend(node, names) {
  let cur = node;
  for (const re of names) {
    if (!cur) return null;
    cur = (cur.kids || []).find(k => re.test(k.name));
  }
  return cur;
}

/* พิมพ์ node แบบย่อ — เอาเฉพาะค่าที่ใช้ตัดสิน */
function fmt(n) {
  if (!n) return '(ไม่พบ node)';
  const p = [];
  if (n.w != null) p.push('w' + n.w);
  if (n.h != null) p.push('h' + n.h);
  const pad = ['pt', 'pr', 'pb', 'pl'].map(k => n[k]).filter(v => v != null);
  if (pad.length) p.push('pad ' + [n.pt, n.pr, n.pb, n.pl].map(v => v == null ? 0 : v).join('/'));
  if (n.gap != null) p.push('gap ' + n.gap);
  if (n.r != null) p.push('r' + n.r);
  if (n.fill && n.fill.length) p.push('fill ' + n.fill.join(','));
  if (n.stroke && n.stroke.length) p.push('stroke ' + n.stroke.join(','));
  if (n.shadow && n.shadow.length) p.push('shadow ' + n.shadow.map(s => `${s.x} ${s.y} ${s.blur} ${s.c}@${s.o}`).join(';'));
  if (n.font) p.push(`font ${n.font.size}/${n.font.w} lh${n.font.lh}`);
  if (n.text) p.push('"' + String(n.text).slice(0, 22) + '"');
  return p.join(' · ');
}
function tree(n, depth, max) {
  if (!n || depth > max) return;
  console.log('   ' + '  '.repeat(depth) + '- ' + n.name.slice(0, 44).padEnd(46) + fmt(n));
  for (const k of n.kids || []) tree(k, depth + 1, max);
}

/* ---------- รายการเทียบ ---------- */
const CASES = [
  {
    id: 'input', title: 'ช่องกรอก — Input field (md, Default)',
    file: '1-1380', set: 'Input field',
    variant: /Size=md, Type=Default, Destructive=False, State=Placeholder/,
    ours: '.f .in input — h44 · r8 · pad 0/14/0/42 · stroke gray-300 · shadow-xs · font 16(inherit) — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'input-error', title: 'ช่องกรอก state error — Input field (md, Destructive=True)',
    file: '1-1380', set: 'Input field',
    variant: /Size=md, Type=Default, Destructive=True, State=Placeholder/,
    ours: '.f.err .in input — border error-300 · .help 14px error-600 — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'input-disabled', title: 'ช่องกรอก state disabled (เทียบ .f.ro readonly)',
    file: '1-1380', set: 'Input field',
    variant: /Size=md, Type=Default, Destructive=False, State=Disabled/,
    ours: '.f.ro .in input — ขอบทึบ gray-300 · พื้น gray-50 (= Disabled ไลบรารี) — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'textarea', title: 'Textarea (md, Default)',
    file: '1-1380', set: 'Textarea input field',
    variant: /Type=Default, Destructive=False, State=Placeholder/,
    ours: '.f textarea — r8 · pad 12/14 · shadow-xs — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'select', title: 'Select (ตัวปิด) — เทียบ <select> ใน .in',
    file: '1-1379', set: 'Select',
    variant: /Size=md, Type=Default, State=Placeholder(?!.*[Oo]pen)/,
    ours: 'select ใน .f .in — h44 · r8 · เหมือน input — จูนแล้ว 12 ส.ค.',
    depth: 4
  },
  {
    id: 'badge', title: 'Badge (Pill · sm/md · Success เป็นตัวแทน)',
    file: '1-1377', set: 'Badge',
    variant: /Size=sm, Type=Pill color, Icon=False, Color=Success/,
    ours: '.badge — r-pill · pad 2/10 · 14/500 lh20 · ขอบโทน 200 · ตัวโทน 700 (แบรนด์=500) = md ไลบรารี — จูนแล้ว 12 ส.ค.',
    depth: 2
  },
  {
    id: 'badge-md', title: 'Badge (Pill · md · Success)',
    file: '1-1377', set: 'Badge',
    variant: /Size=md, Type=Pill color, Icon=False, Color=Success/,
    ours: '(ดูข้อบน)',
    depth: 2
  },
  {
    id: 'tag', title: 'Tag (md) — เทียบ .chip (เลือกหลายอัน)',
    file: '1-1378', set: 'Tag',
    variant: /Size=md.*(Checkbox=False|Count=False)/,
    ours: '.chip — r6 · pad 4/10 · 14/500 gray-700 · เส้น 1px gray-300 = Tag lg — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'table-header', title: 'Table header cell',
    file: '3-20', set: 'Table header cell',
    variant: /.*/,
    ours: '.tbl th — pad 12/24 · bg ขาว · 12/600 gray-500 (h44) — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'table-cell', title: 'Table cell',
    file: '3-20', set: 'Table cell',
    variant: /Type=Text, Size=sm, State=Default/,
    ours: '.tbl td — pad 16/20 · 14 gray-600 · เส้นล่าง gray-200 (= Size sm) — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'checkbox', title: 'Checkbox (md, Checked)',
    file: '1-1383', set: 'Checkbox',
    variant: /Size=md.*(State=Default|Checked=True)/,
    ours: 'input[type=checkbox] — 20×20 native accent primary-600 · ข้อความ 16/500 — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'radio', title: 'Radio button (md)',
    file: '589-206913', set: 'Radio button',
    variant: /Size=md.*/,
    ours: 'input[type=radio] — 20×20 native accent primary-600 · ข้อความ 16/500 — จูนแล้ว 12 ส.ค.',
    depth: 3
  },
  {
    id: 'breadcrumb', title: 'Breadcrumbs',
    file: '3-21', set: 'Breadcrumbs',
    variant: /.*/,
    ours: '.crumbs — 14/600 gray-500 · ตัวคั่น gray-400 · ปัจจุบัน brand-600 — จูนแล้ว 12 ส.ค.',
    depth: 4
  },
  {
    id: 'datepicker-cell', title: 'Calendar cell (Date picker)',
    file: '3-23', set: '_Calendar cell',
    variant: /Selected=True|Type=Active/,
    ours: '.cal-day — 40px กลม r-pill · 14/500 · เลือก = พื้น primary-600 — จูนแล้ว 12 ส.ค.',
    depth: 2
  }
];

/* ---------- สรุป radius + typography ทั้งไฟล์ ---------- */
function summary() {
  const s = load('00-summary-colors-radii-fonts');
  console.log('\n================ radius ที่ใช้ทั้งไลบรารี (ยอดใช้ ≥ 100) ================');
  Object.entries(s.radii).map(([r, n]) => [parseFloat(r), n]).sort((a, b) => b[1] - a[1])
    .filter(([, n]) => n >= 100)
    .forEach(([r, n]) => console.log('   r' + String(r).padEnd(7) + ' x' + n));
  console.log('   ของเราใน tokens: 6 (rounded-sm) · 8 (rounded-md/r-sm) · 12 (r-md) · 16 (r-lg) · 99 (r-pill)');
  console.log('\n================ ชุดฟอนต์ Google Sans ที่ใช้มากสุด (ยอดใช้ ≥ 200) ================');
  Object.entries(s.fonts).filter(([k]) => k.startsWith('Google Sans'))
    .map(([k, n]) => [k, n]).sort((a, b) => b[1] - a[1]).filter(([, n]) => n >= 200)
    .forEach(([k, n]) => console.log('   ' + k.padEnd(30) + ' x' + n));
  console.log('   ของเรา (จูนแล้ว 12 ส.ค.): body 16/lh1.5 · sm 14 · xs 12 · text-sm 14/20 · text-md 16/24');
}

/* ---------- main ---------- */
const filter = process.argv[2];
for (const c of CASES) {
  if (filter && !c.id.includes(filter)) continue;
  console.log('\n================ ' + c.title + ' ================');
  console.log('   ของเรา: ' + c.ours);
  let doc;
  try { doc = load(c.file); } catch (e) { console.log('   โหลด ' + c.file + ' ไม่ได้'); continue; }
  const set = findSet(doc, c.set);
  if (!set) { console.log('   ไม่พบ set "' + c.set + '" ใน ' + c.file); continue; }
  const v = pickVariant(set, c.variant);
  if (!v) {
    console.log('   ไม่พบ variant ' + c.variant + ' — ตัวอย่างชื่อที่มี:');
    (set.kids || []).slice(0, 6).forEach(k => console.log('     · ' + k.name));
    continue;
  }
  console.log('   ไลบรารี: ' + v.name);
  tree(v, 0, c.depth);
}
if (!filter) summary();
