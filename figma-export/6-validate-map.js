#!/usr/bin/env node
/* ============================================================================
   ตรวจว่า design-system/figma-map.json อ้างของที่ "มีจริง" ในไฟล์ Figma
   ============================================================================
   ทำไมต้องมี: แมปเขียนด้วยมือ ถ้าพิมพ์ชื่อ component หรือชื่อ property ผิด
   จะไปพังตอนกดปลั๊กอินในไฟล์จริง ซึ่งหาสาเหตุยากกว่ามาก
   ⇒ ตรวจกับ design-system/figma-components.json (ที่ดูดมาจากไฟล์จริง) ตั้งแต่ตอนนี้

   รัน:  node figma-export/6-validate-map.js
   ============================================================================ */

const fs = require('fs');
const path = require('path');

const DS = path.join(__dirname, '..', 'design-system');
const cat = JSON.parse(fs.readFileSync(path.join(DS, 'figma-components.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(DS, 'figma-map.json'), 'utf8'));

const byName = new Map(cat.components.map((c) => [c.name, c]));

let errs = 0, warns = 0, okCount = 0;
const bad = (m) => { errs++; console.log('  ✗ ' + m); };
const warn = (m) => { warns++; console.log('  ⚠ ' + m); };

// ชื่อ property ที่แมปอ้าง ต้องมีอยู่จริงใน component นั้น
function checkProps(cls, comp, obj, label) {
  if (!obj) return;
  const known = new Set(comp.properties.map((p) => p.name));
  for (const k of Object.keys(obj)) {
    if (k.startsWith('_')) continue;            // คีย์ภายในของเราเอง (_textProp ฯลฯ)
    if (!known.has(k)) { bad(`${cls} → ${label} "${k}" ไม่มีใน "${comp.name}"`); continue; }
    const def = comp.properties.find((p) => p.name === k);
    const v = obj[k];
    if (def.type === 'VARIANT' && def.options && !def.options.includes(String(v))) {
      bad(`${cls} → ${comp.name}.${k} = "${v}" ไม่อยู่ในตัวเลือก [${def.options.join(' · ')}]`);
    }
    if (def.type === 'BOOLEAN' && typeof v !== 'boolean') {
      bad(`${cls} → ${comp.name}.${k} ต้องเป็น boolean (ได้ ${JSON.stringify(v)})`);
    }
  }
}

function checkTextProp(cls, comp, propName, label) {
  if (!propName) return;
  const def = comp.properties.find((p) => p.name === propName);
  if (!def) return bad(`${cls} → ${label} "${propName}" ไม่มีใน "${comp.name}"`);
  if (def.type !== 'TEXT') bad(`${cls} → ${label} "${propName}" ไม่ใช่ TEXT (เป็น ${def.type})`);
}

console.log('ตรวจ figma-map.json เทียบไฟล์ Figma จริง (' + cat.componentCount + ' component)\n');

for (const [cls, m] of Object.entries(map.map)) {
  if (m.kind === 'layout' || m.kind === 'own') { okCount++; continue; }

  if (m.kind !== 'component') { bad(`${cls} — kind "${m.kind}" ไม่รู้จัก`); continue; }
  if (!m.component) { bad(`${cls} — kind=component แต่ไม่ได้ระบุชื่อ component`); continue; }

  const comp = byName.get(m.component);
  if (!comp) { bad(`${cls} → ไม่มี component ชื่อ "${m.component}" ในไฟล์ Figma`); continue; }

  checkTextProp(cls, comp, m.text, 'text');
  checkTextProp(cls, comp, m.labelProp, 'labelProp');
  checkTextProp(cls, comp, m.numberProp, 'numberProp');
  checkProps(cls, comp, m.props, 'props');

  for (const [cond, obj] of Object.entries(m.when || {})) {
    checkProps(cls, comp, obj, `when.${cond}`);
    for (const k of Object.keys(obj)) {
      if (k.startsWith('_')) checkTextProp(cls, comp, obj[k], `when.${cond}.${k}`);
    }
  }

  if (m.variantFromClass) {
    const vp = m.variantFromClass.prop;
    const def = comp.properties.find((p) => p.name === vp);
    if (!def) bad(`${cls} → variantFromClass.prop "${vp}" ไม่มีใน "${comp.name}"`);
    else for (const [k, v] of Object.entries(m.variantFromClass.map)) {
      if (def.options && !def.options.includes(v)) {
        bad(`${cls} → .${k} → ${vp}="${v}" ไม่อยู่ในตัวเลือก [${def.options.join(' · ')}]`);
      }
    }
  }
  // ต้องมี component ตัวจริงสักตัวที่มี property **ครบทุกตัว**ที่แมปอ้าง
  // ไม่ใช่แค่ "มีอยู่ในชุดรวม" ซึ่งเป็นการรวมข้าม component คนละตัว
  if (comp.propertySets && comp.propertySets.length > 1) {
    const wanted = new Set();
    Object.keys(m.props || {}).forEach((k) => wanted.add(k));
    Object.values(m.when || {}).forEach((o) => Object.keys(o).forEach((k) => { if (!k.startsWith('_')) wanted.add(k); }));
    if (m.text) wanted.add(m.text);
    if (m.labelProp) wanted.add(m.labelProp);
    if (wanted.size) {
      const fits = comp.propertySets.some((set) => [...wanted].every((w) => set.includes(w)));
      if (!fits) {
        bad(`${cls} → "${comp.name}" มี ${comp.propertySets.length} ตัวในไฟล์ (ชื่อซ้ำ) ` +
            `แต่ไม่มีตัวไหนมี property ครบชุดนี้: ${[...wanted].join(' · ')}`);
      }
    }
  }
  okCount++;
}

// คลาสของ components.css ที่ยังไม่ได้แมปเลย — เตือนไว้ ไม่ถือว่าพัง
const css = fs.readFileSync(path.join(DS, 'components.css'), 'utf8');
const defined = new Set();
for (const sel of css.match(/^[^@{}/\s][^{]*\{/gm) || []) {
  for (const part of sel.replace('{', '').split(',')) {
    const m = part.trim().match(/^\.([a-zA-Z][\w-]*)/);
    if (m) defined.add(m[1]);
  }
}
// คีย์แมปเป็น selector ได้ (เช่น ".tabs .tab-btn") ⇒ ต้องเก็บ **ทุก** คลาสในคีย์
// ไม่ใช่แค่ตัวแรก ไม่งั้นจะรายงานว่า .tab-btn ยังไม่แมปทั้งที่แมปแล้ว
const mapped = new Set();
for (const k of Object.keys(map.map)) {
  for (const m of k.matchAll(/\.([a-zA-Z][\w-]*)/g)) mapped.add(m[1]);
}
const MOD = /^(b-|btn-|note-|tile-|cal-|rzone-|modal-|filter-|gcard|gframe|sp\d|mb-|ml-|my-|kry-|kbk-|tblfoot|cell-)/;
const unmapped = [...defined].filter((c) => !mapped.has(c) && !MOD.test(c)).sort();

console.log(`\nสรุป: ตรวจ ${okCount} รายการ · ผิด ${errs} · เตือน ${warns}`);
if (unmapped.length) {
  console.log(`\nคลาสที่ยังไม่ได้แมป ${unmapped.length} ตัว (modifier/utility ไม่นับ):`);
  console.log('  ' + unmapped.join(' · '));
}

/* ---------- เขียนเอกสารให้คนอ่าน จากแมปที่ตรวจผ่านแล้วเท่านั้น ---------- */
if (!errs) {
  const rows = [];
  const kinds = { component: [], layout: [], own: [] };
  for (const [cls, m] of Object.entries(map.map)) kinds[m.kind].push([cls, m]);

  for (const [cls, m] of kinds.component) {
    const c = byName.get(m.component);
    const vf = m.variantFromClass
      ? Object.entries(m.variantFromClass.map).map(([k, v]) => `\`.${k}\`→${v}`).join(' · ')
      : (m.when ? Object.keys(m.when).map((k) => `\`${k}\``).join(' · ') : '—');
    rows.push(`| \`${cls}\` | **${c.name}** | ${c.instanceCount.toLocaleString()} | ${c.properties.length} | ${vf} |`);
  }

  const md = `# 🧩 แมป components.css ↔ component จริงของ VMS Plus

> **สร้างอัตโนมัติจาก [\`figma-map.json\`](figma-map.json) — อย่าแก้ไฟล์นี้ด้วยมือ**
> รันใหม่: \`node figma-export/6-validate-map.js\` (ตรวจว่าอ้างของที่มีจริงก่อนเขียน)
> บัญชี component ทั้งหมด ${cat.componentCount} ตัวอยู่ที่ [\`figma-components.json\`](figma-components.json)
> ที่มา: ไฟล์ Figma \`${cat.sourceFile}\` · ${cat.totalInstances.toLocaleString()} instance
>
> 🔴 **ก่อนออกแบบหน้าจอใหม่ทุกครั้งต้องอ่านไฟล์นี้** (เจ้าของงานสั่ง 25 ส.ค. 2569) —
> ดูขั้นที่ 3 ของ "ขั้นตอนบังคับ" ใน [README.md](README.md)

## 1. คลาสที่มี component จริงให้ใช้ (${kinds.component.length})

สร้าง instance แล้ว \`setProperties\` ตามคอลัมน์สุดท้าย

| คลาสของเรา | component จริง | instance | property | เงื่อนไข → ค่า |
|---|---|---|---|---|
${rows.join('\n')}

## 2. คลาสที่เป็นโครง/utility — ไม่ใช่ component (${kinds.layout.length})

ใน Figma ทำเป็น **frame + auto-layout** ไม่ต้องหา component

${kinds.layout.map(([c, m]) => `- \`${c}\`${m.comment ? ' — ' + m.comment : ''}`).join('\n')}

## 3. ของเราเอง — ไลบรารีไม่มีให้เทียบ (${kinds.own.length})

วาดเองตาม \`components.css\` · ถ้าจะเปลี่ยนต้องแจ้งเจ้าของงานก่อน

${kinds.own.map(([c, m]) => `- \`${c}\`${m.comment ? ' — ' + m.comment : ''}`).join('\n')}
`;
  fs.writeFileSync(path.join(DS, 'FIGMA-COMPONENTS.md'), md);
  console.log('\n✓ เขียน design-system/FIGMA-COMPONENTS.md แล้ว');
}

process.exit(errs ? 1 : 0);
