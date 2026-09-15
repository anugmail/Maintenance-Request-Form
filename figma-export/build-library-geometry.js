#!/usr/bin/env node
/* ============================================================
   สร้าง library-geometry.json — "ค่าจริงของไลบรารี" ที่ท่อ export ใช้อ้างอิง
   ------------------------------------------------------------
   ทำไมต้องมีไฟล์นี้ (เจ้าของงานถาม 14 ก.ย. 2569):
     ท่อ export เดิมยึด "ค่าที่วัดจากหน้าเว็บที่เรนเดอร์แล้ว" ซึ่งคลาดจากสเปกไลบรารี
     เล็กน้อยเสมอ (กล่องข้อความของเบราว์เซอร์ไม่ได้อยู่กึ่งกลางเป๊ะ → padding ออกมา
     2/9/3/9 แทน 4/8/4/8 · ความกว้างที่วัดได้กลายเป็น FIXED ทั้งที่ของจริงเป็น Hug)
     ⇒ ต้องมี "ความจริงจากไลบรารี" มาทับค่าที่วัดได้ ตรงจุดที่ไลบรารีระบุไว้ชัดแล้ว

   ทำไมไม่อ่าน Figma ทุกครั้ง:
     แหล่งข้อมูลคือ `design-system/.figma-extract/` ซึ่งเป็น**ไฟล์ในเครื่อง**
     (dump มาจากไฟล์ Figma จริงด้วย `figma-export/dump-plugin/` ครั้งเดียว — ไม่กิน
     โควตา MCP ไม่โดน rate limit ของ REST) ⇒ รันสคริปต์นี้ซ้ำได้ไม่จำกัด ออฟไลน์ได้
     **อ่าน Figma ใหม่เฉพาะตอนไลบรารีเปลี่ยน** แล้วรันสคริปต์นี้ใหม่รอบเดียว

   🔑 อ่านจาก **ตัวนิยาม COMPONENT_SET** ไม่ใช่จาก instance ที่กระจายอยู่ตามหน้า
   (14 ก.ย. 2569 — เจ้าของงานทักว่า "ในไฟล์ Component มีครบ ทำไมของที่เก็บมาไม่มี")
   ตัวนิยามคือความจริงตัวจริง: ให้ทั้ง geometry และ **สีรายvariant** (พื้น/ขอบ/ตัวอักษร)
   ส่วน instance เป็นแค่จุดใช้งานที่อาจถูกยืด/บีบ/override มาแล้ว

   รัน:  node figma-export/build-library-geometry.js
        → figma-export/library-geometry.json  (2-map.js อ่านไฟล์นี้ตอนแปลง)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const EXTRACT = path.join(__dirname, '..', 'design-system', '.figma-extract', 'component');
const OUT = path.join(__dirname, 'library-geometry.json');

/* ---------- ชื่อที่ mapping.js ตั้ง → component set จริงในไลบรารี ----------
   `variantOf` แปลง suffix ของชื่อ layer (badge / brand) เป็นชื่อ variant ของไลบรารี
   เพิ่มบรรทัดที่นี่เมื่อจะให้ component ตัวใหม่ยึดค่าไลบรารีแทนค่าที่วัดจากหน้าเว็บ
   ⚠ ใส่เฉพาะตัวที่ไลบรารีระบุค่าไว้ชัด — ตัวที่ความสูงขึ้นกับเนื้อหา (เซลล์ตาราง)
   อย่าบังคับ ปล่อยใช้ค่าที่วัดได้ตามเดิม */
const FAMILY_MAP = {
  badge: {
    set: 'Pill outline',
    variantOf: (status) => 'Color=' + ({
      success: 'Success', warning: 'Warning', error: 'Error',
      brand: 'Brand', neutral: 'Gray', info: 'Info'
    }[status] || 'Gray')
  }
};

/* ตระกูลที่อยากให้ขึ้นบัญชีไว้ดูว่าไลบรารีมีอะไรให้ใช้บ้าง (ไม่ได้บังคับค่า แค่รายงาน) */
const CATALOG_PREFIX = ['Pill', 'Badge', 'Indicator'];

function eachNode(fn) {
  for (const f of fs.readdirSync(EXTRACT).filter(n => n.endsWith('.json'))) {
    let doc;
    try { doc = JSON.parse(fs.readFileSync(path.join(EXTRACT, f), 'utf8')); }
    catch (e) { continue; }
    const walk = (n) => {
      if (!n || typeof n !== 'object') return;
      fn(n, doc, f);
      (n.kids || []).forEach(walk);
    };
    (doc.sets || []).forEach(walk);
  }
}

function findSet(name) {
  let hit = null;
  eachNode((n) => {
    if (hit) return;
    if (n.name === name && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT')) hit = n;
  });
  return hit;
}

/* สีตัวอักษรของ variant — เอาจาก text node ตัวแรกที่มี fill */
function textOf(node) {
  let found = null;
  const walk = (n) => {
    if (found || !n || typeof n !== 'object') return;
    if (n.type === 'TEXT' && (n.fill || []).length) found = n;
    (n.kids || []).forEach(walk);
  };
  (node.kids || []).forEach(walk);
  if (!found) return null;
  const f = found.font || {};
  return {
    color: (found.fill || [])[0],
    size: f.size,
    family: f.fam,
    style: f.style
  };
}

function shapeOf(node) {
  const t = textOf(node);
  return {
    h: node.h,
    padding: [node.pt || 0, node.pr || 0, node.pb || 0, node.pl || 0],
    mode: node.dir === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL',
    cross: node.align === 'CENTER' ? 'CENTER' : 'MIN',
    gap: node.gap || 0,
    radius: node.r,
    wMode: 'HUG',
    fill: (node.fill || [])[0],
    stroke: (node.stroke || [])[0],
    strokeWeight: node.sw,
    text: t
  };
}

const out = {
  generatedAt: new Date().toISOString(),
  source: 'design-system/.figma-extract/component (ตัวนิยาม COMPONENT_SET)',
  families: {},
  catalog: {}
};
const report = [];

for (const [ourName, def] of Object.entries(FAMILY_MAP)) {
  const set = findSet(def.set);
  if (!set) { report.push(`⚠ ${ourName}: หา "${def.set}" ในไฟล์ extract ไม่เจอ — ข้าม`); continue; }

  const variants = {};
  for (const k of (set.kids || [])) {
    if (k.type !== 'COMPONENT') continue;
    variants[k.name] = shapeOf(k);
  }
  const base = Object.values(variants)[0] || shapeOf(set);

  out.families[ourName] = {
    libraryComponent: def.set,
    // ค่าโครงร่วมของทุก variant — 2-map.js ใช้ตัวนี้ทับค่าที่วัดได้
    h: base.h,
    padding: base.padding,
    mode: base.mode,
    cross: base.cross,
    gap: base.gap,
    radius: base.radius,
    wMode: base.wMode,
    variants
  };

  const names = Object.keys(variants);
  const uniform = names.every(n => JSON.stringify(variants[n].padding) === JSON.stringify(base.padding)
    && variants[n].h === base.h);
  report.push(`✓ ${ourName} ← ${def.set}  h=${base.h} padding=${base.padding.join('/')} r=${base.radius}`
    + `  · variant ${names.length} ตัว (${names.join(', ')})`
    + (uniform ? '' : '  ⚠ variant มีโครงไม่เท่ากัน — ตรวจก่อนบังคับค่าเดียว'));
}

/* บัญชีของที่ไลบรารีมีให้ใช้ — ไว้ตอบว่า "ของอยู่ครบไหม" ได้โดยไม่ต้องเปิด Figma */
eachNode((n) => {
  if (n.type !== 'COMPONENT_SET' && n.type !== 'COMPONENT') return;
  const nm = n.name || '';
  if (!CATALOG_PREFIX.some(p => nm.startsWith(p))) return;
  if (nm.startsWith('Specs')) return;
  if (out.catalog[nm]) return;
  out.catalog[nm] = {
    type: n.type,
    variants: (n.kids || []).filter(k => k.type === 'COMPONENT').map(k => k.name)
  };
});

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
report.forEach(l => console.log(l));

const used = new Set(Object.values(FAMILY_MAP).map(d => d.set));
const unused = Object.keys(out.catalog).filter(n => !used.has(n));
console.log(`\nไลบรารีมีตระกูล badge/pill ทั้งหมด ${Object.keys(out.catalog).length} ชุด — ท่อ export ใช้อยู่ ${used.size} ชุด`);
if (unused.length) console.log('ยังไม่ได้ใช้: ' + unused.join(' · '));
console.log(`\nเขียน ${path.relative(path.join(__dirname, '..'), OUT)}`);
