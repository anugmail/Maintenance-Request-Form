/* ============================================================
   tokens.css → Figma Variables (3 collection ตามชั้นในไฟล์จริง)
   ------------------------------------------------------------
   อ่าน design-system/tokens.css แล้วแปลงเป็นรายการ variable
   สำหรับ spec.json — ปลั๊กอินเป็นคนสร้างของจริงใน Figma

   ชั้นอ่านจากหัวข้อคอมเมนต์ในไฟล์ ("ชั้น 1 · PRIMITIVE" ฯลฯ)
   ไม่เดาจากชื่อตัวแปร เพราะไฟล์คือเจ้าของความจริงเรื่องชั้นอยู่แล้ว

   ชื่อ variable = ชื่อ CSS var ตรงๆ เปลี่ยน '-' เป็น '/' (กลุ่มใน Figma)
     --brand-600            → brand/600
     --color-text-secondary → color/text/secondary
   กติกาเดียวกับชื่อ layer: ต้อง map กลับไปหาโค้ดได้เสมอ

   ข้าม: ชั้น "alias เดิม" (--primary-* ซ้ำกับ brand) · Effects
   (เงา/gradient — Figma variable ไม่มีชนิดนี้) · ฟอนต์ (string
   ที่ไม่มีที่ให้ผูก) — บันทึกไว้ใน skipped ให้ตรวจได้ว่าไม่ตกหล่น
   ============================================================ */

const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, '..', 'design-system', 'tokens.css');

/* หัวข้อในไฟล์ → collection (เรียงตามที่ปรากฏ) */
const LAYER_MARKS = [
  ['ชั้น 1 · PRIMITIVE', 'primitive'],
  ['ชั้น 2 · SEMANTIC', 'semantic'],
  ['ชั้น 3 · COMPONENT', 'component'],
  // ต้อง match ทั้งวลี — "alias เดิมของโปรเจกต์" (fs-body ฯลฯ ใน Typography)
  // เป็นคนละอันและต้องเก็บ เพราะค่าพวกนั้นไม่มีชื่ออื่นถือแทน
  ['alias เดิม — ห้ามลบ', null], // --primary-* ชี้ไป brand อยู่แล้ว ไม่สร้างซ้ำ
  ['Effects', null]
];

const varName = (cssName) => cssName.replace(/^--/, '').replace(/-/g, '/');

function parseValue(raw) {
  const v = raw.trim();
  let m;
  if ((m = v.match(/^#([0-9a-fA-F]{6})$/))) return { type: 'COLOR', hex: '#' + m[1].toUpperCase() };
  if ((m = v.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\.?[\d.]+)\s*\)$/))) {
    const hex = '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
    return { type: 'COLOR', hex, alpha: parseFloat(m[4]) };
  }
  if ((m = v.match(/^var\((--[a-z0-9-_]+)\)$/i))) return { type: 'ALIAS', target: varName(m[1]) };
  if ((m = v.match(/^(-?[\d.]+)px$/))) return { type: 'FLOAT', value: parseFloat(m[1]) };
  if ((m = v.match(/^(-?[\d.]+)$/))) return { type: 'FLOAT', value: parseFloat(m[1]) };
  return null;
}

function parseTokens(file) {
  const css = fs.readFileSync(file || TOKENS_FILE, 'utf8');
  const lines = css.split('\n');

  let layer = null;
  const collections = { primitive: [], semantic: [], component: [] };
  const skipped = [];
  const byName = new Map();   // varName → { collection, ...def } ไว้เช็ค alias

  for (const line of lines) {
    for (const [mark, name] of LAYER_MARKS) if (line.includes(mark)) layer = name;

    const decl = line.match(/^\s*(--[a-z0-9-_]+)\s*:\s*([^;]+);(?:\s*\/\*\s*(.*?)\s*\*\/)?/i);
    if (!decl || !layer) continue;

    const [, cssName, rawValue, comment] = decl;
    const parsed = parseValue(rawValue);
    if (!parsed) { skipped.push(cssName + ' (' + rawValue.trim().slice(0, 40) + ')'); continue; }

    const def = {
      name: varName(cssName),
      css: cssName,
      description: cssName + (comment ? ' — ' + comment : ''),
      ...parsed
    };
    collections[layer].push(def);
    byName.set(def.name, { collection: layer, def });
  }

  /* alias ต้องชี้ไป variable ที่มีจริง — ตัวที่ชี้พลาดให้ล้มตั้งแต่ตอน map
     ไม่ปล่อยไปตายเงียบๆ ในปลั๊กอิน */
  for (const [layer, vars] of Object.entries(collections)) {
    for (const v of vars) {
      if (v.type !== 'ALIAS') continue;
      const t = byName.get(v.target);
      if (!t) throw new Error('alias ' + v.css + ' ชี้ไป ' + v.target + ' ซึ่งไม่มีในไฟล์');
      v.targetCollection = t.collection;
      v.resolvedType = t.def.type === 'ALIAS' ? 'COLOR' : t.def.type; // ในไฟล์นี้ alias ซ้อน alias ไม่มี
    }
  }

  /* ดัชนีย้อนกลับ hex → primitive variable (ตัวแรกในไฟล์ชนะ —
     brand มาก่อน chart จึงไม่โดน chart-5 แย่งชื่อ #A80689)
     ใช้ให้ปลั๊กอินผูก fill ของหน้าจอเข้ากับ variable แทนสีดิบ */
  const colorIndex = {};
  for (const v of collections.primitive) {
    if (v.type === 'COLOR' && !(v.hex in colorIndex)) colorIndex[v.hex] = v.name;
  }

  /* ดัชนี radius → variable (เฉพาะค่ารัศมีในชั้น primitive)
     8px มีสองชื่อ (rounded-md ✔ กับ r-sm alias เดิม) — เอาตัวแรกคือ rounded-md */
  const radiusIndex = {};
  for (const v of collections.primitive) {
    if (v.type === 'FLOAT' && /^(rounded|r)\//.test(v.name) && !(v.value in radiusIndex)) {
      radiusIndex[v.value] = v.name;
    }
  }

  return { collections, colorIndex, radiusIndex, skipped };
}

module.exports = { parseTokens };
