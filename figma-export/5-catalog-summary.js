#!/usr/bin/env node
/* ============================================================================
   กลั่น out/figma-catalog.json (ดัมป์ดิบจากไฟล์ Figma) → ไฟล์ที่ commit ได้
   ============================================================================
   ทำไมต้องกลั่น 2 เหตุผล:
   1. out/ อยู่ใน .gitignore ⇒ ดัมป์ดิบไม่ติดไปกับ repo เซสชันใหม่จะไม่มีอะไรให้อ่าน
   2. ดัมป์ดิบมี **ค่าข้อความจริงจากไฟล์งาน** (เลขเคส VMS005678 / RAM123456 / ชื่อคน)
      ซึ่ง .gitignore ของโปรเจกต์ห้าม push ⇒ ต้องถอดค่า TEXT ทิ้งให้หมด

   ผลลัพธ์ (ทั้งคู่ commit ได้):
     design-system/figma-components.json  เครื่องอ่าน — ชื่อ · key · property · ตัวเลือก
     design-system/FIGMA-COMPONENTS.md    คนอ่าน — ตารางแมป components.css ↔ ของจริง

   รัน:  node figma-export/5-catalog-summary.js
   ============================================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(__dirname, 'out', 'figma-catalog.json');
const OUT_JSON = path.join(ROOT, 'design-system', 'figma-components.json');

if (!fs.existsSync(SRC)) {
  console.error('ไม่พบ ' + path.relative(process.cwd(), SRC));
  console.error('→ รัน catalog-plugin ในไฟล์ Figma ก่อน (ดู HOWTO.md §3.5)');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));

/* ---- รวมยอดตามชื่อ — ดัมป์ดิบมีชื่อซ้ำ (component คนละตัวชื่อเดียวกัน) ---- */
const byName = new Map();
for (const x of raw.components) {
  if (!byName.has(x.name)) {
    byName.set(x.name, {
      name: x.name,
      fromLibrary: x.fromLibrary,
      keys: [],
      instanceCount: 0,
      variants: null,
      properties: [],
    });
  }
  const a = byName.get(x.name);
  a.instanceCount += x.instanceCount;
  a.fromLibrary = a.fromLibrary && x.fromLibrary;
  if (x.key && !a.keys.includes(x.key)) a.keys.push(x.key);
  if (x.variants && (!a.variants || x.variants.length > a.variants.length)) a.variants = x.variants;

  for (const p of x.properties) {
    if (a.properties.some((q) => q.name === p.name)) continue;
    a.properties.push({
      name: p.name,
      type: p.type,
      // ⛔ ค่า TEXT ที่มาจากไฟล์งานจริงถูกถอดทิ้ง — เก็บเฉพาะ BOOLEAN/VARIANT ที่เป็นค่าของ design system
      defaultValue: (p.type === 'TEXT' || p.type === 'INSTANCE_SWAP') ? null : p.defaultValue,
      options: p.options || null,
    });
  }
}

const list = [...byName.values()]
  .sort((a, b) => b.instanceCount - a.instanceCount || a.name.localeCompare(b.name));

const out = {
  note: 'กลั่นจากไฟล์ Figma จริงด้วย figma-export/5-catalog-summary.js — ค่าข้อความ (TEXT) ถูกถอดทิ้งเพราะเป็นข้อมูลจากไฟล์งาน',
  sourceFile: raw.fileName,
  generatedAt: raw.generatedAt,
  totalInstances: raw.totalInstances,
  componentCount: list.length,
  components: list,
};
fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n');

console.log('  (ตารางแมป components.css ↔ ของจริง สร้างโดย 6-validate-map.js)');

console.log('✓ design-system/figma-components.json  ' + (fs.statSync(OUT_JSON).size / 1024).toFixed(0) + ' KB');
console.log('  ' + list.length + ' component · ถอดค่า TEXT ออกแล้ว');
