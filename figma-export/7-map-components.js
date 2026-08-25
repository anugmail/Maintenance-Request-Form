#!/usr/bin/env node
/* ============================================================================
   DOM ที่ extract มา → spec v3 ที่อ้าง "component จริง" ของ VMS Plus
   ============================================================================
   ต่างจาก 2-map.js (ท่อ B) ตรงที่ผลลัพธ์ไม่ใช่ "วาดกล่องสี่เหลี่ยมสีนี้ขนาดนี้"
   แต่เป็น "สร้าง instance ของ component X แล้วตั้ง property Y"
   ⇒ ดีไซเนอร์เปิดใน Figma แล้วกดสลับ property ได้ เพราะผูกกับ design system จริง

   อ่านกติกาจาก design-system/figma-map.json (เขียนมือ ตรวจด้วย 6-validate-map.js)
   และเช็คทุก property กับ design-system/figma-components.json ก่อนเขียนไฟล์
   — ถ้าอ้างของที่ไม่มีจริง จะไม่เขียนไฟล์ ไม่ปล่อยให้ไปพังตอนกดปลั๊กอิน

   รัน:  node figma-export/7-map-components.js
   ============================================================================ */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const DS = path.join(__dirname, '..', 'design-system');
const map = JSON.parse(fs.readFileSync(path.join(DS, 'figma-map.json'), 'utf8')).map;
const cat = JSON.parse(fs.readFileSync(path.join(DS, 'figma-components.json'), 'utf8'));
const byName = new Map(cat.components.map((c) => [c.name, c]));

const STATES = (process.argv[2] ? [process.argv[2]] : ['repair-trip-01', 'repair-trip-02', 'repair-trip-03']);

/* ---------- แปลงคีย์แมปเป็น selector ที่เทียบได้ ----------
   ".btn.btn-p"    → [{ classes:['btn','btn-p'] }]                 (node เดียว 2 คลาส)
   ".f .in input"  → [{classes:['f']},{classes:['in']},{tag:'input'}]  (ต้องเป็นลูกหลานตามลำดับ) */
function parseKey(key) {
  return key.trim().split(/\s+/).map((part) => {
    const classes = [...part.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
    const tag = part.startsWith('.') ? null : part.split('.')[0].toLowerCase();
    return { classes, tag };
  });
}
const RULES = Object.entries(map)
  .map(([key, m]) => ({ key, m, parts: parseKey(key) }))
  // เทียบตัวที่เจาะจงกว่าก่อน (.btn.btn-p ต้องชนะ .btn)
  .sort((a, b) => (b.parts.length + b.parts.reduce((n, p) => n + p.classes.length, 0))
                - (a.parts.length + a.parts.reduce((n, p) => n + p.classes.length, 0)));

function partMatches(part, node) {
  if (part.tag && node.tag !== part.tag) return false;
  const cls = node.classes || [];
  return part.classes.every((c) => cls.includes(c));
}

// stack = บรรพบุรุษจากรากลงมา (ไม่รวม node เอง)
function findRule(node, stack) {
  for (const r of RULES) {
    const last = r.parts[r.parts.length - 1];
    if (!partMatches(last, node)) continue;
    let si = stack.length - 1, ok = true;
    for (let i = r.parts.length - 2; i >= 0; i--) {
      while (si >= 0 && !partMatches(r.parts[i], stack[si])) si--;
      if (si < 0) { ok = false; break; }
      si--;
    }
    if (ok) return r;
  }
  return null;
}

/* ---------- ตัวช่วยอ่านค่าจาก node ---------- */
// ข้อความหลักของ node — ไม่รวมไอคอน และ **ไม่รวมบรรทัดรอง** (.cell-sub/.sub)
// เพราะบรรทัดรองเป็น property แยกของ component (Supporting text) ไม่ใช่ข้อความเดียวกัน
const SKIP_TEXT = ['ms', 'cell-sub', 'sub'];
const textOf = (n, skip = SKIP_TEXT) => {
  // ช่องกรอก/ดรอปดาวน์ ข้อความอยู่ที่ attribute ไม่ใช่ textContent
  if (n.tag === 'input' || n.tag === 'textarea') {
    const a = n.attrs || {};
    return String(a.value || a.placeholder || '').trim();
  }
  let out = '';
  (function w(x) {
    if (x.tag === '#text') { out += x.chars || ''; return; }
    if ((x.classes || []).some((c) => skip.includes(c))) return;
    (x.children || []).forEach(w);
  })(n);
  return out.replace(/\s+/g, ' ').trim();
};
// ข้อความของบรรทัดรอง — ใช้กับ _textProp
const subTextOf = (n) => {
  let found = '';
  (function w(x) {
    if (found) return;
    if ((x.classes || []).some((c) => c === 'cell-sub' || c === 'sub')) { found = textOf(x, ['ms']); return; }
    (x.children || []).forEach(w);
  })(n);
  return found;
};
const hasClass = (n, c) => {
  let f = false;
  (function w(x) { if (f) return; if ((x.classes || []).includes(c)) { f = true; return; } (x.children || []).forEach(w); })(n);
  return f;
};
const hasTag = (n, t) => {
  let f = false;
  (function w(x) { if (f) return; if (x.tag === t) { f = true; return; } (x.children || []).forEach(w); })(n);
  return f;
};

/* เงื่อนไขใน when — ทำเท่าที่จำเป็นกับหน้านำร่อง
   ⚠️ hasSub/hasButton ตรวจแบบ "มีลูกหลานที่เป็นคลาสนั้น" ซึ่งหยาบกว่าของจริงเล็กน้อย
      (ของจริง .sub เป็นพี่น้องของ .sect ไม่ใช่ลูก) — พอสำหรับนำร่อง จดไว้ว่ายังไม่เป๊ะ */
function condTrue(cond, node) {
  if (cond.startsWith('.')) return (node.classes || []).includes(cond.slice(1));
  if (cond === 'disabled') return !!(node.attrs && node.attrs.disabled !== undefined);
  if (cond === 'checked') return !!(node.attrs && node.attrs.checked !== undefined);
  if (cond === 'hasCellSub') return hasClass(node, 'cell-sub');
  if (cond === 'hasIcon') return hasClass(node, 'ms');
  if (cond === 'hasSub') return hasClass(node, 'sub');
  if (cond === 'hasButton') return hasClass(node, 'btn');
  if (cond === 'hasBadge') return hasClass(node, 'badge');
  if (cond === 'hasButtons') return hasTag(node, 'button');
  return false;
}

const px = (v) => Math.round(parseFloat(v) || 0);
function layoutOf(st) {
  if (!st) return null;
  if (st.display !== 'flex' && st.display !== 'inline-flex') return null;
  return {
    dir: (st.flexDirection || 'row').startsWith('column') ? 'vertical' : 'horizontal',
    gap: px(st.gap || st.rowGap || 0),
    padding: [px(st.paddingTop), px(st.paddingRight), px(st.paddingBottom), px(st.paddingLeft)],
    align: st.alignItems || 'stretch',
    justify: st.justifyContent || 'flex-start',
  };
}

/* ---------- แปลงต้นไม้ ---------- */
const stats = { instance: 0, frame: 0, text: 0, vector: 0 };
const swallowed = new Map();

// node นี้มีลูกหลานที่แมปเป็น component ได้ไหม
function containsComponent(node, stack) {
  for (const c of node.children || []) {
    if (c.tag === '#text' || c.tag === '#br') continue;
    const r = findRule(c, stack);
    if (r && r.m.kind === 'component') return true;
    if (containsComponent(c, stack.concat([c]))) return true;
  }
  return false;
}
const unmapped = new Map();
const problems = [];

function convert(node, stack) {
  if (node.tag === '#text') {
    const t = (node.chars || '').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    stats.text++;
    return { kind: 'text', characters: t, rect: node.rect };
  }
  if (node.tag === '#br') return null;
  // ไอคอน Material Symbols — เนื้อในเป็น "ชื่อ ligature" (location_on/account_circle)
  // ถ้าปล่อยผ่านจะกลายเป็น text node ที่โชว์ชื่อไอคอนดิบๆ บนหน้า Figma
  // component จริงมีไอคอนของตัวเองอยู่แล้ว ⇒ ข้ามทิ้ง
  if ((node.classes || []).includes('ms')) return null;

  const rule = findRule(node, stack);

  /* กติกา "ตัวในสุดชนะ" — ถ้า node นี้แมปเป็น component ได้ แต่ข้างในยังมี component อื่นอยู่อีก
     ให้ถือว่า node นี้เป็นแค่โครง (frame) แล้วปล่อยตัวข้างในเป็น instance แทน
     ไม่งั้น .card จะกลืน .badge/.tbl/ช่องกรอกทั้งหมดที่อยู่ข้างใน เหลือ instance แค่ก้อนเดียว */
  if (rule && rule.m.kind === 'component' && !rule.m.absorbs && containsComponent(node, stack.concat([node]))) {
    swallowed.set(rule.key, (swallowed.get(rule.key) || 0) + 1);
  } else if (rule && rule.m.kind === 'component') {
    const comp = byName.get(rule.m.component);
    const props = Object.assign({}, rule.m.props || {});

    for (const [cond, obj] of Object.entries(rule.m.when || {})) {
      if (!condTrue(cond, node)) continue;
      for (const [k, v] of Object.entries(obj)) {
        if (k === '_textProp') { const t = subTextOf(node); if (t) props[v] = t; continue; }
        if (!k.startsWith('_')) props[k] = v;
      }
    }
    if (rule.m.variantFromClass) {
      const vf = rule.m.variantFromClass;
      for (const c of node.classes || []) if (vf.map[c]) props[vf.prop] = vf.map[c];
    }
    if (rule.m.text) {
      const t = textOf(node);
      if (t) props[rule.m.text] = t;
    }

    // ตรวจกับของจริง — ห้ามปล่อยผ่าน
    const known = new Map(comp.properties.map((p) => [p.name, p]));
    for (const [k, v] of Object.entries(props)) {
      const def = known.get(k);
      if (!def) { problems.push(`${rule.key} → "${k}" ไม่มีใน ${comp.name}`); delete props[k]; continue; }
      if (def.type === 'VARIANT' && def.options && !def.options.includes(String(v))) {
        problems.push(`${rule.key} → ${comp.name}.${k}="${v}" ไม่อยู่ในตัวเลือก`); delete props[k];
      }
    }

    stats.instance++;
    return { kind: 'instance', component: comp.name, properties: props, from: rule.key, rect: node.rect };
  }

  const kids = (node.children || []).map((c) => convert(c, stack.concat([node]))).filter(Boolean);

  if (rule && rule.m.kind === 'own') {
    stats.vector++;
    return { kind: 'vector', from: rule.key, rect: node.rect, style: node.style, children: kids };
  }

  if (!rule && (node.classes || []).length) {
    for (const c of node.classes) unmapped.set(c, (unmapped.get(c) || 0) + 1);
  }

  stats.frame++;
  return {
    kind: 'frame',
    from: rule ? rule.key : null,
    rect: node.rect,
    layout: layoutOf(node.style),
    children: kids,
  };
}

/* ---------- main ---------- */
const screens = [];
for (const slug of STATES) {
  const f = path.join(OUT, 'dom-' + slug + '.json');
  if (!fs.existsSync(f)) { console.error('ไม่พบ ' + path.relative(process.cwd(), f)); process.exit(1); }
  const dom = JSON.parse(fs.readFileSync(f, 'utf8'));
  screens.push({ slug, name: dom.name, source: dom.source, viewport: dom.viewport, root: convert(dom.root, []) });
}

console.log('แปลง ' + screens.length + ' หน้าจอ');
console.log('  instance ' + stats.instance + ' · frame ' + stats.frame + ' · text ' + stats.text + ' · vector ' + stats.vector);

if (swallowed.size) {
  console.log('\nแมปได้แต่ยกให้ตัวข้างในแทน (ตัวในสุดชนะ):');
  [...swallowed.entries()].sort((a, b) => b[1] - a[1])
    .forEach(([k, n]) => console.log('  ' + k + '  ' + n + ' จุด'));
}

if (unmapped.size) {
  console.log('\nคลาสที่ไม่ตรงกฎไหนเลย (กลายเป็น frame เปล่า):');
  [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([c, n]) => console.log('  .' + c + '  ' + n + ' จุด'));
}

if (problems.length) {
  console.log('\n✗ อ้างของที่ไม่มีจริง ' + problems.length + ' จุด — ไม่เขียนไฟล์:');
  [...new Set(problems)].slice(0, 10).forEach((p) => console.log('  ' + p));
  process.exit(1);
}

const spec = { version: 3, generatedAt: new Date().toISOString(), sourceFile: cat.sourceFile, screens };
const dest = path.join(OUT, 'spec-components.json');
fs.writeFileSync(dest, JSON.stringify(spec, null, 2));
console.log('\n✓ ' + path.relative(process.cwd(), dest) + '  ' + (fs.statSync(dest).size / 1024).toFixed(0) + ' KB');
